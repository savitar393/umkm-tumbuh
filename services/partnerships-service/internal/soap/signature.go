package soap

import (
	"bytes"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"fmt"
	"os"
	"regexp"

	"github.com/beevik/etree"
	"github.com/moov-io/signedxml"
	"github.com/russellhaering/goxmldsig/etreeutils"
)

const (
	wsseNamespace = "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
	wsuNamespace  = "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"
	dsigNamespace = "http://www.w3.org/2000/09/xmldsig#"
	exclusiveC14N = "http://www.w3.org/2001/10/xml-exc-c14n#"
	rsaSHA256     = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"
	digestSHA256  = "http://www.w3.org/2001/04/xmlenc#sha256"
)

var signatureID = regexp.MustCompile(`^[A-Za-z_][A-Za-z0-9_.-]{0,127}$`)

// LoadTrustedSignatureCertificate pins one RSA public certificate at startup.
// It does not build or validate a certificate chain.
func LoadTrustedSignatureCertificate(path string) (*x509.Certificate, error) {
	if path == "" {
		return nil, errors.New("SOAP_XML_SIGNATURE_CERT_FILE is required")
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	block, rest := pem.Decode(data)
	if block == nil || block.Type != "CERTIFICATE" || len(bytes.TrimSpace(rest)) != 0 {
		return nil, errors.New("expected one PEM certificate")
	}
	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return nil, err
	}
	if _, ok := cert.PublicKey.(*rsa.PublicKey); !ok {
		return nil, errors.New("trusted signing certificate must have an RSA public key")
	}
	return cert, nil
}

// verifySignedBody returns only the SOAP Body content proven by XMLDSig.
// Its narrow profile avoids ambiguous references and signature wrapping.
func verifySignedBody(raw []byte, trusted *x509.Certificate) ([]byte, error) {
	if trusted == nil {
		return nil, errors.New("trusted signing certificate is not configured")
	}
	doc := etree.NewDocument()
	if err := doc.ReadFromBytes(raw); err != nil {
		return nil, err
	}
	root := doc.Root()
	if root == nil || root.Tag != "Envelope" || root.NamespaceURI() != NSEnvelope {
		return nil, errors.New("invalid SOAP Envelope")
	}
	bodies, headers := root.FindElements("./Body"), root.FindElements("./Header")
	if len(bodies) != 1 || len(headers) != 1 || bodies[0].NamespaceURI() != NSEnvelope || headers[0].NamespaceURI() != NSEnvelope {
		return nil, errors.New("expected one SOAP Header and Body")
	}
	body := bodies[0]
	var bodyID string
	for i := range body.Attr {
		attr := &body.Attr[i]
		if attr.Key == "Id" && attr.NamespaceURI() == wsuNamespace {
			if bodyID != "" {
				return nil, errors.New("duplicate Body ID")
			}
			bodyID = attr.Value
		}
	}
	if !signatureID.MatchString(bodyID) {
		return nil, errors.New("invalid Body ID")
	}
	security := headers[0].FindElements("./Security")
	if len(security) != 1 || security[0].NamespaceURI() != wsseNamespace {
		return nil, errors.New("missing WS-Security header")
	}
	signatures := security[0].FindElements("./Signature")
	if len(signatures) != 1 || signatures[0].NamespaceURI() != dsigNamespace ||
		len(root.FindElements(".//Signature")) != 1 {
		return nil, errors.New("expected one XMLDSig signature in WS-Security header")
	}
	signedInfo := signatures[0].FindElements("./SignedInfo")
	if len(signedInfo) != 1 || signedInfo[0].NamespaceURI() != dsigNamespace ||
		!signatureMethod(signedInfo[0], "CanonicalizationMethod", exclusiveC14N) ||
		!signatureMethod(signedInfo[0], "SignatureMethod", rsaSHA256) {
		return nil, errors.New("unsupported signature profile")
	}
	references := signedInfo[0].FindElements("./Reference")
	if len(references) != 1 || references[0].NamespaceURI() != dsigNamespace ||
		references[0].SelectAttrValue("URI", "") != "#"+bodyID ||
		!signatureMethod(references[0], "DigestMethod", digestSHA256) {
		return nil, errors.New("signature does not reference SOAP Body")
	}
	transforms := references[0].FindElements("./Transforms")
	if len(transforms) != 1 || transforms[0].NamespaceURI() != dsigNamespace ||
		len(transforms[0].ChildElements()) != 1 ||
		!signatureMethod(transforms[0], "Transform", exclusiveC14N) {
		return nil, errors.New("unsupported Body transform")
	}
	var idCount int
	var visit func(*etree.Element)
	visit = func(el *etree.Element) {
		for _, attr := range el.Attr {
			// signedxml resolves an Id by local name, so reject every duplicate.
			if attr.Key == "Id" && attr.Value == bodyID {
				idCount++
			}
		}
		for _, child := range el.ChildElements() {
			visit(child)
		}
	}
	visit(root)
	if idCount != 1 {
		return nil, errors.New("ambiguous Body reference")
	}

	validator, err := signedxml.NewValidator(string(raw))
	if err != nil {
		return nil, err
	}
	validator.SetReferenceIDAttribute("Id")
	validator.Certificates = []x509.Certificate{*trusted} // never trust KeyInfo from the request
	verified, err := validator.ValidateReferences()
	if err != nil {
		return nil, err
	}
	actualBody, err := serializeElement(body)
	if err != nil {
		return nil, err
	}
	if len(verified) != 1 || verified[0] != string(actualBody) {
		return nil, errors.New("verified reference differs from actual SOAP Body")
	}
	// Restore the original in-scope namespaces on the verified operation for
	// the existing XML dispatcher. No request XML outside this Body is used.
	operations := body.ChildElements()
	if len(operations) != 1 || operations[0].NamespaceURI() != NSPartner {
		return nil, errors.New("invalid signed SOAP operation")
	}
	ctx, err := etreeutils.NSBuildParentContext(operations[0])
	if err != nil {
		return nil, err
	}
	detached, err := etreeutils.NSDetatch(ctx, operations[0])
	if err != nil {
		return nil, err
	}
	return serializeElement(detached)
}

func signatureMethod(parent *etree.Element, name, algorithm string) bool {
	elements := parent.FindElements("./" + name)
	return len(elements) == 1 && elements[0].NamespaceURI() == dsigNamespace &&
		elements[0].SelectAttrValue("Algorithm", "") == algorithm
}

func serializeElement(el *etree.Element) ([]byte, error) {
	doc := etree.NewDocument()
	doc.SetRoot(el.Copy())
	data, err := doc.WriteToBytes()
	if err != nil {
		return nil, fmt.Errorf("serialize verified XML: %w", err)
	}
	return data, nil
}
