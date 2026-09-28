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
	wsaNamespace  = "http://www.w3.org/2005/08/addressing"
	dsigNamespace = "http://www.w3.org/2000/09/xmldsig#"
	exclusiveC14N = "http://www.w3.org/2001/10/xml-exc-c14n#"
	rsaSHA256     = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"
	digestSHA256  = "http://www.w3.org/2001/04/xmlenc#sha256"
)

var signatureID = regexp.MustCompile(`^[A-Za-z_][A-Za-z0-9_.-]{0,127}$`)
var messageUUID = regexp.MustCompile(`(?i)^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)

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

type verifiedSignedRequest struct {
	operation       []byte
	messageID       string
	replayExpiresAt time.Time
}

// verifySignedBody returns only content proven by XMLDSig, including the
// MessageID and its acceptance deadline when replay protection is enabled.
func verifySignedBody(raw []byte, trusted *x509.Certificate, now time.Time, clockSkew, maxTTL time.Duration, requireMessageID bool) (verifiedSignedRequest, error) {
	var result verifiedSignedRequest
	if trusted == nil {
		return result, errors.New("trusted signing certificate is not configured")
	}
	doc := etree.NewDocument()
	if err := doc.ReadFromBytes(raw); err != nil {
		return result, err
	}
	root := doc.Root()
	if root == nil || root.Tag != "Envelope" || root.NamespaceURI() != NSEnvelope {
		return result, errors.New("invalid SOAP Envelope")
	}
	bodies, headers := root.FindElements("./Body"), root.FindElements("./Header")
	if len(bodies) != 1 || len(headers) != 1 || bodies[0].NamespaceURI() != NSEnvelope || headers[0].NamespaceURI() != NSEnvelope {
		return result, errors.New("expected one SOAP Header and Body")
	}
	body := bodies[0]
	bodyID, err := signedElementID(body)
	if err != nil {
		return result, fmt.Errorf("SOAP Body: %w", err)
	}
	security := headers[0].FindElements("./Security")
	if len(security) != 1 || security[0].NamespaceURI() != wsseNamespace || len(root.FindElements(".//Security")) != 1 {
		return result, errors.New("missing WS-Security header")
	}
	timestamps := security[0].FindElements("./Timestamp")
	if len(timestamps) != 1 || timestamps[0].NamespaceURI() != wsuNamespace || len(root.FindElements(".//Timestamp")) != 1 {
		return result, errors.New("expected one WS-Security Timestamp")
	}
	timestamp := timestamps[0]
	timestampID, err := signedElementID(timestamp)
	if err != nil || timestampID == bodyID {
		return result, errors.New("invalid Timestamp ID")
	}
	var messageIDElement *etree.Element
	var messageElementID string
	if requireMessageID {
		messages := headers[0].FindElements("./MessageID")
		if len(messages) != 1 || messages[0].NamespaceURI() != wsaNamespace || len(root.FindElements(".//MessageID")) != 1 {
			return result, errors.New("expected one WS-Addressing MessageID")
		}
		messageIDElement = messages[0]
		messageElementID, err = signedElementID(messageIDElement)
		if err != nil || messageElementID == bodyID || messageElementID == timestampID {
			return result, errors.New("invalid MessageID reference ID")
		}
	}
	signatures := security[0].FindElements("./Signature")
	if len(signatures) != 1 || signatures[0].NamespaceURI() != dsigNamespace ||
		len(root.FindElements(".//Signature")) != 1 {
		return result, errors.New("expected one XMLDSig signature in WS-Security header")
	}
	signedInfo := signatures[0].FindElements("./SignedInfo")
	if len(signedInfo) != 1 || signedInfo[0].NamespaceURI() != dsigNamespace ||
		!signatureMethod(signedInfo[0], "CanonicalizationMethod", exclusiveC14N) ||
		!signatureMethod(signedInfo[0], "SignatureMethod", rsaSHA256) {
		return result, errors.New("unsupported signature profile")
	}
	references := signedInfo[0].FindElements("./Reference")
	wantReferences := 2
	if requireMessageID {
		wantReferences = 3
	}
	if len(references) != wantReferences {
		return result, errors.New("unexpected number of signed references")
	}
	targets := map[string]*etree.Element{"#" + bodyID: body, "#" + timestampID: timestamp}
	idCounts := map[string]int{bodyID: 0, timestampID: 0}
	if requireMessageID {
		targets["#"+messageElementID] = messageIDElement
		idCounts[messageElementID] = 0
	}
	seen := make(map[string]bool, wantReferences)
	for _, reference := range references {
		uri := reference.SelectAttrValue("URI", "")
		if reference.NamespaceURI() != dsigNamespace || targets[uri] == nil || seen[uri] ||
			!signatureMethod(reference, "DigestMethod", digestSHA256) {
			return result, errors.New("invalid signed reference")
		}
		seen[uri] = true
		transforms := reference.FindElements("./Transforms")
		if len(transforms) != 1 || transforms[0].NamespaceURI() != dsigNamespace ||
			len(transforms[0].ChildElements()) != 1 ||
			!signatureMethod(transforms[0], "Transform", exclusiveC14N) {
			return result, errors.New("unsupported reference transform")
		}
	}
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
	for _, count := range idCounts {
		if count != 1 {
			return result, errors.New("ambiguous signed reference")
		}
	}

	validator, err := signedxml.NewValidator(string(raw))
	if err != nil {
		return result, err
	}
	validator.SetReferenceIDAttribute("Id")
	validator.Certificates = []x509.Certificate{*trusted} // never trust KeyInfo from the request
	verified, err := validator.ValidateReferences()
	if err != nil {
		return result, err
	}
	if len(verified) != wantReferences {
		return result, errors.New("unexpected verified reference count")
	}
	for i, reference := range references {
		actual, err := serializeElement(targets[reference.SelectAttrValue("URI", "")])
		if err != nil {
			return result, err
		}
		if verified[i] != string(actual) {
			return result, errors.New("verified reference differs from SOAP element")
		}
	}
	expires, err := validateSignedTimestamp(timestamp, now.UTC(), clockSkew, maxTTL)
	if err != nil {
		return result, err
	}
	if requireMessageID {
		if len(messageIDElement.ChildElements()) != 0 {
			return result, errors.New("invalid MessageID content")
		}
		messageID := strings.TrimSpace(messageIDElement.Text())
		if len(messageID) > 45 || !messageUUID.MatchString(messageID) {
			return result, errors.New("malformed WS-Addressing MessageID")
		}
		result.messageID = strings.ToLower(messageID)
		result.replayExpiresAt = expires.Add(clockSkew)
	}
	// Restore the original in-scope namespaces on the verified operation for
	// the existing XML dispatcher. No request XML outside this Body is used.
	operations := body.ChildElements()
	if len(operations) != 1 || operations[0].NamespaceURI() != NSPartner {
		return result, errors.New("invalid signed SOAP operation")
	}
	ctx, err := etreeutils.NSBuildParentContext(operations[0])
	if err != nil {
		return result, err
	}
	detached, err := etreeutils.NSDetatch(ctx, operations[0])
	if err != nil {
		return result, err
	}
	result.operation, err = serializeElement(detached)
	return result, err
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

func validateSignedTimestamp(timestamp *etree.Element, now time.Time, clockSkew, maxTTL time.Duration) (time.Time, error) {
	children := timestamp.ChildElements()
	if len(children) != 2 || children[0].Tag != "Created" || children[1].Tag != "Expires" ||
		children[0].NamespaceURI() != wsuNamespace || children[1].NamespaceURI() != wsuNamespace ||
		len(children[0].ChildElements()) != 0 || len(children[1].ChildElements()) != 0 {
		return time.Time{}, errors.New("invalid Timestamp structure")
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
		return time.Time{}, err
	}
	expires, err := parseUTC(children[1].Text())
	if err != nil {
		return time.Time{}, err
	}
	if created.After(now.Add(clockSkew)) || expires.Before(now.Add(-clockSkew)) ||
		!expires.After(created) || expires.Sub(created) > maxTTL {
		return time.Time{}, errors.New("Timestamp is outside the allowed validity window")
	}
	return expires, nil
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
