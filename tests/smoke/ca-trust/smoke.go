package main

import (
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/beevik/etree"
	"github.com/golang-jwt/jwt/v5"
	dsig "github.com/russellhaering/goxmldsig"
	"github.com/russellhaering/goxmldsig/etreeutils"
)

func parseKeyAndCert(name string) (*rsa.PrivateKey, *x509.Certificate) {
	keyBytes, err := os.ReadFile("../../tests/smoke/ca-trust/certs/" + name + ".key")
	if err != nil { panic(err) }
	certBytes, err := os.ReadFile("../../tests/smoke/ca-trust/certs/" + name + ".crt")
	if err != nil { panic(err) }

	keyBlock, _ := pem.Decode(keyBytes)
	key, _ := x509.ParsePKCS8PrivateKey(keyBlock.Bytes)

	certBlock, _ := pem.Decode(certBytes)
	cert, _ := x509.ParseCertificate(certBlock.Bytes)

	return key.(*rsa.PrivateKey), cert
}

func generateUUID() string {
	b := make([]byte, 16)
	rand.Read(b)
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("urn:uuid:%08x-%04x-%04x-%04x-%012x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

func signSummaryXML(key *rsa.PrivateKey, cert *x509.Certificate, raw string) string {
	doc := etree.NewDocument()
	doc.ReadFromString(raw)
	security := doc.Root().FindElement(".//Security")
	signer, _ := dsig.NewSigningContext(key, [][]byte{cert.Raw})
	signer.IdAttribute = "wsu:Id"
	signer.Canonicalizer = dsig.MakeC14N10ExclusiveCanonicalizerWithPrefixList("")
	var sig *etree.Element
	references := []string{"body", "timestamp", "messageID", "bst"}
	for _, reference := range references {
		var target *etree.Element
		switch reference {
		case "body": target = doc.Root().FindElement("./Body")
		case "timestamp": target = security.FindElement("./Timestamp")
		case "messageID": target = doc.Root().FindElement("./Header/MessageID")
		case "bst": target = security.FindElement("./BinarySecurityToken")
		}
		next, err := signer.ConstructSignature(target, false)
		if err != nil {
			panic(fmt.Sprintf("ConstructSignature failed for %s: %v", reference, err))
		}
		if sig == nil {
			sig = next
		} else {
			ref := next.FindElement(".//Reference")
			sig.FindElement(".//SignedInfo").AddChild(ref.Copy())
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
	xmlText, _ := doc.WriteToString()
	return xmlText
}

func testRequest(key *rsa.PrivateKey, cert *x509.Certificate, name string) {
	now := time.Now().UTC()
	created := now.Format(time.RFC3339)
	expires := now.Add(5 * time.Minute).Format(time.RFC3339)
	msgID := generateUUID()
	certBase64 := base64.StdEncoding.EncodeToString(cert.Raw)

	rawXML := fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Header>
        <wsa:MessageID xmlns:wsa="http://www.w3.org/2005/08/addressing" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" wsu:Id="msgid-1">%s</wsa:MessageID>
        <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
            <wsu:Timestamp xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" wsu:Id="ts-1">
                <wsu:Created>%s</wsu:Created>
                <wsu:Expires>%s</wsu:Expires>
            </wsu:Timestamp>
            <wsse:BinarySecurityToken xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" wsu:Id="bst-1" EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3">%s</wsse:BinarySecurityToken>
        </wsse:Security>
    </soap:Header>
    <soap:Body xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" wsu:Id="body-1">
        <par:GetPartnershipSummary xmlns:par="http://umkm-tumbuh.example.com/partnerships"><userId>TEST_UMKM_A</userId><userRole>UMKM</userRole></par:GetPartnershipSummary>
    </soap:Body>
</soap:Envelope>`, msgID, created, expires, certBase64)

	body := signSummaryXML(key, cert, rawXML)

	t := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": "TEST_UMKM_A", "role": "UMKM", "exp": time.Now().Add(time.Hour).Unix(),
	})
	tokenStr, _ := t.SignedString([]byte("change-this-local-secret"))

	req, _ := http.NewRequest("POST", "http://localhost:9091/partnership", strings.NewReader(body))
	req.Header.Set("Content-Type", "text/xml; charset=utf-8")
	req.Header.Set("Authorization", "Bearer "+tokenStr)

	client := &http.Client{Timeout: 5 * time.Second}
	res, err := client.Do(req)
	if err != nil {
		fmt.Printf("[%s] Request failed: %v\n", name, err)
		os.Exit(1)
	}
	defer res.Body.Close()
	
	resBody, _ := io.ReadAll(res.Body)
	if name == "attacker" {
		if res.StatusCode == 200 {
			fmt.Printf("[%s] FAILED (expected rejection, got 200)\n", name)
			os.Exit(1)
		} else {
			fmt.Printf("[%s] PASSED (rejected with %d)\n", name, res.StatusCode)
		}
	} else {
		if res.StatusCode != 200 {
			fmt.Printf("[%s] FAILED (expected 200, got %d): %s\n", name, res.StatusCode, string(resBody))
			os.Exit(1)
		} else {
			fmt.Printf("[%s] PASSED (200 OK)\n", name)
		}
	}
}

func main() {
	keyA, certA := parseKeyAndCert("leaf-a")
	testRequest(keyA, certA, "leaf-a")
	keyB, certB := parseKeyAndCert("leaf-b")
	testRequest(keyB, certB, "leaf-b")
	keyAtt, certAtt := parseKeyAndCert("attacker")
	testRequest(keyAtt, certAtt, "attacker")
	fmt.Println("All CA trust smoke tests passed.")
}
