package main

import (
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"fmt"
	"testing"
	"time"
	"strings"

	"github.com/beevik/etree"
	dsig "github.com/russellhaering/goxmldsig"
	"github.com/russellhaering/goxmldsig/etreeutils"
	"github.com/stretchr/testify/assert"
)

func signResponseXMLForTest(key *rsa.PrivateKey, cert *x509.Certificate, bodyInnerXML string, relatesTo string) (string, error) {
	created := time.Now().UTC().Format(time.RFC3339)
	expires := time.Now().Add(5 * time.Minute).UTC().Format(time.RFC3339)
	certBase64 := base64.StdEncoding.EncodeToString(cert.Raw)

	rawXML := fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Header>
        <wsa:RelatesTo xmlns:wsa="http://www.w3.org/2005/08/addressing" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" wsu:Id="relatesTo-1">%s</wsa:RelatesTo>
        <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" soap:mustUnderstand="1">
            <wsu:Timestamp xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" wsu:Id="ts-1">
                <wsu:Created>%s</wsu:Created>
                <wsu:Expires>%s</wsu:Expires>
            </wsu:Timestamp>
            <wsse:BinarySecurityToken xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" wsu:Id="bst-1" EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3">%s</wsse:BinarySecurityToken>
        </wsse:Security>
    </soap:Header>
    <soap:Body xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" wsu:Id="body-1">
%s
    </soap:Body>
</soap:Envelope>`, relatesTo, created, expires, certBase64, bodyInnerXML)

	doc := etree.NewDocument()
	if err := doc.ReadFromString(rawXML); err != nil {
		return "", err
	}
	security := doc.Root().FindElement(".//Security")
	signer, _ := dsig.NewSigningContext(key, [][]byte{cert.Raw})
	signer.IdAttribute = "wsu:Id"
	signer.Canonicalizer = dsig.MakeC14N10ExclusiveCanonicalizerWithPrefixList("")
	var sig *etree.Element
	references := []string{"body", "timestamp", "relatesTo", "bst"}
	for _, reference := range references {
		var target *etree.Element
		switch reference {
		case "body": target = doc.Root().FindElement("./Body")
		case "timestamp": target = security.FindElement("./Timestamp")
		case "relatesTo": target = doc.Root().FindElement("./Header/RelatesTo")
		case "bst": target = security.FindElement("./BinarySecurityToken")
		}
		if target == nil {
			return "", fmt.Errorf("could not find target element for reference %s", reference)
		}
		next, err := signer.ConstructSignature(target, false)
		if err != nil {
			return "", fmt.Errorf("ConstructSignature failed for %s: %v", reference, err)
		}
		if sig == nil {
			sig = next
		} else {
			for _, ref := range next.FindElements(".//Reference") {
				sig.FindElement(".//SignedInfo").AddChild(ref.Copy())
			}
		}
	}

	security.AddChild(sig)
	keyInfo := sig.FindElement(".//KeyInfo")
	for _, child := range keyInfo.ChildElements() {
		keyInfo.RemoveChild(child)
	}
	str := keyInfo.CreateElement("wsse:SecurityTokenReference")
	str.CreateAttr("xmlns:wsse", "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd")
	reference := str.CreateElement("wsse:Reference")
	reference.CreateAttr("URI", "#bst-1")
	reference.CreateAttr("ValueType", "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3")

	signedInfo := sig.FindElement(".//SignedInfo")
	nsContext, _ := etreeutils.NSBuildParentContext(signedInfo)
	detached, _ := etreeutils.NSDetatch(nsContext, signedInfo)
	canonical, _ := signer.Canonicalizer.Canonicalize(detached)
	digest := sha256.Sum256(canonical)
	value, _ := key.Sign(rand.Reader, digest[:], crypto.SHA256)
	sig.FindElement(".//SignatureValue").SetText(base64.StdEncoding.EncodeToString(value))
	return doc.WriteToString()
}

func TestVerifyResponseXML(t *testing.T) {
	key, cert, err := parseKeyAndCert("../../tests/smoke/ca-trust/certs/server.key", "../../tests/smoke/ca-trust/certs/server.crt")
	assert.NoError(t, err)

	caCertPool, err := parseCACertPool("../../tests/smoke/ca-trust/certs/server-ca.crt")
	assert.NoError(t, err)

	opts := x509.VerifyOptions{
		Roots: caCertPool,
		KeyUsages: []x509.ExtKeyUsage{x509.ExtKeyUsageAny},
	}

	msgID := "msg-123"
	bodyInnerXML := "<test>valid</test>"
	signed, _ := signResponseXMLForTest(key, cert, bodyInnerXML, msgID)

	err = verifyResponseXML([]byte(signed), opts, msgID)
	assert.NoError(t, err)

	tamperedBody := strings.Replace(signed, "valid", "invalid", 1)
	err = verifyResponseXML([]byte(tamperedBody), opts, msgID)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "signature validation failed")

	tamperedRelatesTo := strings.Replace(signed, msgID, "msg-456", 1)
	err = verifyResponseXML([]byte(tamperedRelatesTo), opts, msgID)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "RelatesTo mismatch")

	err = verifyResponseXML([]byte(tamperedRelatesTo), opts, "msg-456")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "signature validation failed")

	missingSig := strings.Split(signed, "<ds:Signature")[0] + "</wsse:Security></soap:Header><soap:Body xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:wsu=\"http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd\" wsu:Id=\"body-1\"><test>valid</test></soap:Body></soap:Envelope>"
	err = verifyResponseXML([]byte(missingSig), opts, msgID)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "missing Signature")

	untrustedKey, untrustedCert, _ := parseKeyAndCert("../../tests/smoke/ca-trust/certs/attacker.key", "../../tests/smoke/ca-trust/certs/attacker.crt")
	untrustedSigned, _ := signResponseXMLForTest(untrustedKey, untrustedCert, bodyInnerXML, msgID)
	err = verifyResponseXML([]byte(untrustedSigned), opts, msgID)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid server certificate chain")
}
