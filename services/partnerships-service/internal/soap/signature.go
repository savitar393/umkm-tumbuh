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
	"strings"
	"time"

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

const (
	DefaultWSSEMaxClockSkew    = 30 * time.Second
	DefaultWSSEMaxTimestampTTL = 5 * time.Minute
)

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
func verifySignedBody(raw []byte, trusted *x509.Certificate, now time.Time, clockSkew, maxTTL time.Duration) ([]byte, error) {
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
	bodyID, err := signedElementID(body)
	if err != nil {
		return nil, fmt.Errorf("SOAP Body: %w", err)
	}
	security := headers[0].FindElements("./Security")
	if len(security) != 1 || security[0].NamespaceURI() != wsseNamespace || len(root.FindElements(".//Security")) != 1 {
		return nil, errors.New("missing WS-Security header")
	}
	timestamps := security[0].FindElements("./Timestamp")
	if len(timestamps) != 1 || timestamps[0].NamespaceURI() != wsuNamespace || len(root.FindElements(".//Timestamp")) != 1 {
		return nil, errors.New("expected one WS-Security Timestamp")
	}
	timestamp := timestamps[0]
	timestampID, err := signedElementID(timestamp)
	if err != nil || timestampID == bodyID {
		return nil, errors.New("invalid Timestamp ID")
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
	if len(references) != 2 {
		return nil, errors.New("expected Body and Timestamp references")
	}
	targets := map[string]*etree.Element{"#" + bodyID: body, "#" + timestampID: timestamp}
	seen := make(map[string]bool, 2)
	for _, reference := range references {
		uri := reference.SelectAttrValue("URI", "")
		if reference.NamespaceURI() != dsigNamespace || targets[uri] == nil || seen[uri] ||
			!signatureMethod(reference, "DigestMethod", digestSHA256) {
			return nil, errors.New("invalid signed reference")
		}
		seen[uri] = true
		transforms := reference.FindElements("./Transforms")
		if len(transforms) != 1 || transforms[0].NamespaceURI() != dsigNamespace ||
			len(transforms[0].ChildElements()) != 1 ||
			!signatureMethod(transforms[0], "Transform", exclusiveC14N) {
			return nil, errors.New("unsupported reference transform")
		}
	}
	idCounts := map[string]int{bodyID: 0, timestampID: 0}
	var visit func(*etree.Element)
	visit = func(el *etree.Element) {
		for _, attr := range el.Attr {
			// signedxml resolves an Id by local name, so reject every duplicate.
			if attr.Key == "Id" {
				if _, ok := idCounts[attr.Value]; ok {
					idCounts[attr.Value]++
				}
			}
		}
		for _, child := range el.ChildElements() {
			visit(child)
		}
	}
	visit(root)
	if idCounts[bodyID] != 1 || idCounts[timestampID] != 1 {
		return nil, errors.New("ambiguous signed reference")
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
	if len(verified) != 2 {
		return nil, errors.New("expected two verified references")
	}
	for i, reference := range references {
		actual, err := serializeElement(targets[reference.SelectAttrValue("URI", "")])
		if err != nil {
			return nil, err
		}
		if verified[i] != string(actual) {
			return nil, errors.New("verified reference differs from SOAP element")
		}
	}
	if err := validateSignedTimestamp(timestamp, now.UTC(), clockSkew, maxTTL); err != nil {
		return nil, err
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

func signedElementID(element *etree.Element) (string, error) {
	var id string
	found := false
	for i := range element.Attr {
		attr := &element.Attr[i]
		if attr.Key == "Id" && attr.NamespaceURI() == wsuNamespace {
			if found {
				return "", errors.New("duplicate wsu:Id")
			}
			found = true
			id = attr.Value
		}
	}
	if !signatureID.MatchString(id) {
		return "", errors.New("missing or invalid wsu:Id")
	}
	return id, nil
}

func validateSignedTimestamp(timestamp *etree.Element, now time.Time, clockSkew, maxTTL time.Duration) error {
	children := timestamp.ChildElements()
	if len(children) != 2 || children[0].Tag != "Created" || children[1].Tag != "Expires" ||
		children[0].NamespaceURI() != wsuNamespace || children[1].NamespaceURI() != wsuNamespace ||
		len(children[0].ChildElements()) != 0 || len(children[1].ChildElements()) != 0 {
		return errors.New("invalid Timestamp structure")
	}
	parseUTC := func(value string) (time.Time, error) {
		if !strings.HasSuffix(value, "Z") || strings.ContainsAny(value, " ,\t\r\n") {
			return time.Time{}, errors.New("Timestamp must use UTC")
		}
		parsed, err := time.Parse(time.RFC3339Nano, value)
		if err != nil {
			return time.Time{}, err
		}
		return parsed.UTC(), nil
	}
	created, err := parseUTC(children[0].Text())
	if err != nil {
		return err
	}
	expires, err := parseUTC(children[1].Text())
	if err != nil {
		return err
	}
	if created.After(now.Add(clockSkew)) || expires.Before(now.Add(-clockSkew)) ||
		!expires.After(created) || expires.Sub(created) > maxTTL {
		return errors.New("Timestamp is outside the allowed validity window")
	}
	return nil
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
