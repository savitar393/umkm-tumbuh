package soap

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/base64"
	"math/big"
	"strings"
	"testing"
	"time"

	"github.com/beevik/etree"
	"github.com/moov-io/signedxml"
)

const testBSTEncodingType = "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary"
const testX509v3ValueType = "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3"

func x509SummaryXML(created, expires, messageID, tokenText string) string {
	raw := replaySummaryXML(created, expires, messageID)
	token := `<wsse:BinarySecurityToken xmlns:wsse="` + testWSSE + `" xmlns:wsu="` + testWSU + `" wsu:Id="x509-1" EncodingType="` + testBSTEncodingType + `" ValueType="` + testX509v3ValueType + `">` + tokenText + `</wsse:BinarySecurityToken>`
	return strings.Replace(raw, "<wsu:Timestamp", token+"<wsu:Timestamp", 1)
}

func signedX509SummaryXML(t *testing.T, key *rsa.PrivateKey, signerCert, embeddedCert *x509.Certificate, created, expires, messageID string, references ...string) string {
	t.Helper()
	if len(references) == 0 {
		references = []string{"body", "timestamp", "messageID", "bst"}
	}
	raw := x509SummaryXML(created, expires, messageID, base64.StdEncoding.EncodeToString(embeddedCert.Raw))
	return signSummaryXML(t, key, signerCert, raw, references...)
}

func x509TestHandler(t *testing.T, cert *x509.Certificate, now time.Time) (*Handler, string, *signedSummaryService) {
	t.Helper()
	token := signedTestJWT(t, map[string]any{
		"sub": "AKUN-001", "role": "UMKM", "exp": time.Now().Add(time.Hour).Unix(),
	}, testJWTSecret, "HS256")
	svc := &signedSummaryService{}
	handler := NewHandlerWithConfig(svc, "", HandlerConfig{
		JWTSecret: testJWTSecret, RequireXMLSignature: true, ReplayProtection: true,
		X509TokenProfile: true, TrustedSignatureCert: cert, Now: func() time.Time { return now },
	})
	return handler, token, svc
}

func TestSOAPX509TokenValidAndReplay(t *testing.T) {
	now := time.Date(2026, 9, 28, 14, 30, 0, 0, time.UTC)
	key, cert := testSigningIdentity(t)
	xmlText := signedX509SummaryXML(t, key, cert, cert, "2026-09-28T14:29:00Z", "2026-09-28T14:33:00Z", "urn:uuid:550e8400-e29b-41d4-a716-446655440000")
	handler, token, svc := x509TestHandler(t, cert, now)
	if rr := sendSignedSummary(handler, token, xmlText); rr.Code != 200 {
		t.Fatalf("valid X.509 request: status=%d body=%s", rr.Code, rr.Body.String())
	}
	if rr := sendSignedSummary(handler, token, xmlText); rr.Code != 400 || svc.calls != 1 {
		t.Fatalf("replayed X.509 request: status=%d calls=%d", rr.Code, svc.calls)
	}
}

func mutateX509XML(t *testing.T, xmlText string, change func(*etree.Element)) string {
	t.Helper()
	doc := etree.NewDocument()
	if err := doc.ReadFromString(xmlText); err != nil {
		t.Fatal(err)
	}
	change(doc.Root())
	result, err := doc.WriteToString()
	if err != nil {
		t.Fatal(err)
	}
	return result
}

func assertFourReferencesValid(t *testing.T, xmlText string, cert *x509.Certificate) {
	t.Helper()
	validator, err := signedxml.NewValidator(xmlText)
	if err != nil {
		t.Fatal(err)
	}
	validator.SetReferenceIDAttribute("Id")
	validator.Certificates = []x509.Certificate{*cert}
	references, err := validator.ValidateReferences()
	if err != nil || len(references) != 4 {
		t.Fatalf("fixture must have four cryptographically valid references: count=%d err=%v", len(references), err)
	}
}

func TestSOAPX509TokenRejectsInvalidProfiles(t *testing.T) {
	now := time.Date(2026, 9, 28, 14, 30, 0, 0, time.UTC)
	created, expires := "2026-09-28T14:29:00Z", "2026-09-28T14:33:00Z"
	messageID := "urn:uuid:550e8400-e29b-41d4-a716-446655440000"
	key, cert := testSigningIdentity(t)
	attackerKey, attackerCert := testSigningIdentity(t)
	valid := signedX509SummaryXML(t, key, cert, cert, created, expires, messageID)
	attacker := signedX509SummaryXML(t, attackerKey, attackerCert, attackerCert, created, expires, messageID)
	wrongToken := signedX509SummaryXML(t, key, cert, attackerCert, created, expires, messageID)
	assertFourReferencesValid(t, attacker, attackerCert)
	assertFourReferencesValid(t, wrongToken, cert)
	signRaw := func(raw string) string {
		return signSummaryXML(t, key, cert, raw, "body", "timestamp", "messageID", "bst")
	}
	raw := x509SummaryXML(created, expires, messageID, base64.StdEncoding.EncodeToString(cert.Raw))
	tokenText := base64.StdEncoding.EncodeToString(cert.Raw)
	for _, tc := range []struct {
		name string
		xml  string
	}{
		{"token whitespace changed after signing", strings.Replace(valid, tokenText, "\n"+tokenText, 1)},
		{"attacker key and certificate", attacker},
		{"trusted key but wrong embedded certificate", wrongToken},
		{"missing BinarySecurityToken", signedReplaySummaryXML(t, key, cert, created, expires, messageID)},
		{"duplicate BinarySecurityToken", mutateX509XML(t, valid, func(root *etree.Element) {
			security := root.FindElement("./Header/Security")
			security.AddChild(security.FindElement("./BinarySecurityToken").Copy())
		})},
		{"duplicate token ID on another element", mutateX509XML(t, valid, func(root *etree.Element) {
			security := root.FindElement("./Header/Security")
			other := security.CreateElement("x:Other")
			other.CreateAttr("xmlns:x", "urn:other")
			other.CreateAttr("xmlns:wsu", testWSU)
			other.CreateAttr("wsu:Id", "x509-1")
		})},
		{"token ID shares Body ID", strings.Replace(valid, `wsu:Id="x509-1"`, `wsu:Id="body-1"`, 1)},
		{"token ID shares Timestamp ID", strings.Replace(valid, `wsu:Id="x509-1"`, `wsu:Id="timestamp-1"`, 1)},
		{"token ID shares MessageID ID", strings.Replace(valid, `wsu:Id="x509-1"`, `wsu:Id="message-id-1"`, 1)},
		{"invalid Base64 in valid signature", signRaw(x509SummaryXML(created, expires, messageID, "%%%"))},
		{"invalid DER in valid signature", signRaw(x509SummaryXML(created, expires, messageID, base64.StdEncoding.EncodeToString([]byte("not DER"))))},
		{"multiple DER certificates in valid signature", signRaw(x509SummaryXML(created, expires, messageID, base64.StdEncoding.EncodeToString(append(append([]byte{}, cert.Raw...), attackerCert.Raw...))))},
		{"empty token in valid signature", signRaw(x509SummaryXML(created, expires, messageID, "  "))},
		{"wrong EncodingType in valid signature", signRaw(strings.Replace(raw, testBSTEncodingType, "urn:unsupported", 1))},
		{"wrong ValueType in valid signature", signRaw(strings.Replace(raw, testX509v3ValueType, "urn:unsupported", 1))},
		{"missing KeyInfo", mutateX509XML(t, valid, func(root *etree.Element) {
			signature := root.FindElement("./Header/Security/Signature")
			signature.RemoveChild(signature.FindElement("./KeyInfo"))
		})},
		{"multiple KeyInfo", mutateX509XML(t, valid, func(root *etree.Element) {
			signature := root.FindElement("./Header/Security/Signature")
			signature.AddChild(signature.FindElement("./KeyInfo").Copy())
		})},
		{"missing SecurityTokenReference", mutateX509XML(t, valid, func(root *etree.Element) {
			keyInfo := root.FindElement("./Header/Security/Signature/KeyInfo")
			keyInfo.RemoveChild(keyInfo.FindElement("./SecurityTokenReference"))
		})},
		{"multiple SecurityTokenReferences", mutateX509XML(t, valid, func(root *etree.Element) {
			keyInfo := root.FindElement("./Header/Security/Signature/KeyInfo")
			keyInfo.AddChild(keyInfo.FindElement("./SecurityTokenReference").Copy())
		})},
		{"missing WS-Security Reference", mutateX509XML(t, valid, func(root *etree.Element) {
			str := root.FindElement("./Header/Security/Signature/KeyInfo/SecurityTokenReference")
			str.RemoveChild(str.FindElement("./Reference"))
		})},
		{"multiple WS-Security References", mutateX509XML(t, valid, func(root *etree.Element) {
			str := root.FindElement("./Header/Security/Signature/KeyInfo/SecurityTokenReference")
			str.AddChild(str.FindElement("./Reference").Copy())
		})},
		{"SecurityTokenReference points to Body", mutateX509XML(t, valid, func(root *etree.Element) {
			root.FindElement("./Header/Security/Signature/KeyInfo/SecurityTokenReference/Reference").SelectAttr("URI").Value = "#body-1"
		})},
		{"external SecurityTokenReference URI", mutateX509XML(t, valid, func(root *etree.Element) {
			root.FindElement("./Header/Security/Signature/KeyInfo/SecurityTokenReference/Reference").SelectAttr("URI").Value = "https://example.invalid/token"
		})},
		{"wrong SecurityTokenReference ValueType", mutateX509XML(t, valid, func(root *etree.Element) {
			root.FindElement("./Header/Security/Signature/KeyInfo/SecurityTokenReference/Reference").SelectAttr("ValueType").Value = "urn:unsupported"
		})},
		{"KeyIdentifier fallback", mutateX509XML(t, valid, func(root *etree.Element) {
			str := root.FindElement("./Header/Security/Signature/KeyInfo/SecurityTokenReference")
			str.RemoveChild(str.FindElement("./Reference"))
			str.CreateElement("wsse:KeyIdentifier").SetText("fallback")
		})},
		{"X509Data fallback", mutateX509XML(t, valid, func(root *etree.Element) {
			keyInfo := root.FindElement("./Header/Security/Signature/KeyInfo")
			keyInfo.RemoveChild(keyInfo.FindElement("./SecurityTokenReference"))
			keyInfo.CreateElement("X509Data")
		})},
		{"KeyValue fallback", mutateX509XML(t, valid, func(root *etree.Element) {
			keyInfo := root.FindElement("./Header/Security/Signature/KeyInfo")
			keyInfo.RemoveChild(keyInfo.FindElement("./SecurityTokenReference"))
			keyInfo.CreateElement("KeyValue")
		})},
		{"unsigned BinarySecurityToken", signedX509SummaryXML(t, key, cert, cert, created, expires, messageID, "body", "timestamp", "messageID")},
		{"duplicate token signature reference", signedX509SummaryXML(t, key, cert, cert, created, expires, messageID, "body", "timestamp", "bst", "bst")},
		{"reference to another element", signedX509SummaryXML(t, key, cert, cert, created, expires, messageID, "body", "timestamp", "messageID", "other")},
		{"extra fifth signature reference", signedX509SummaryXML(t, key, cert, cert, created, expires, messageID, "body", "timestamp", "messageID", "bst", "other")},
		{"external XMLDSig reference", mutateX509XML(t, valid, func(root *etree.Element) {
			root.FindElement("./Header/Security/Signature/SignedInfo/Reference").SelectAttr("URI").Value = "https://example.invalid/body"
		})},
	} {
		t.Run(tc.name, func(t *testing.T) {
			handler, token, svc := x509TestHandler(t, cert, now)
			rr := sendSignedSummary(handler, token, tc.xml)
			if rr.Code != 400 || svc.calls != 0 || !strings.Contains(rr.Body.String(), "SOAP message signature is invalid") || strings.Contains(rr.Body.String(), "signedxml") {
				t.Fatalf("status=%d calls=%d body=%s", rr.Code, svc.calls, rr.Body.String())
			}
		})
	}
}

func TestSOAPX509TokenFreshnessJWTAndCompatibility(t *testing.T) {
	now := time.Date(2026, 9, 28, 14, 30, 0, 0, time.UTC)
	key, cert := testSigningIdentity(t)
	created, expires := "2026-09-28T14:29:00Z", "2026-09-28T14:33:00Z"
	firstID := "urn:uuid:550e8400-e29b-41d4-a716-446655440000"
	secondID := "urn:uuid:550e8400-e29b-41d4-a716-446655440001"
	valid := signedX509SummaryXML(t, key, cert, cert, created, expires, firstID)
	handler, token, svc := x509TestHandler(t, cert, now)
	if rr := sendSignedSummary(handler, "", valid); rr.Code != 401 {
		t.Fatalf("missing JWT: status=%d", rr.Code)
	}
	if rr := sendSignedSummary(handler, token, valid); rr.Code != 200 || svc.calls != 1 {
		t.Fatalf("JWT failure consumed MessageID: status=%d calls=%d", rr.Code, svc.calls)
	}
	newID := signedX509SummaryXML(t, key, cert, cert, created, expires, secondID)
	if rr := sendSignedSummary(handler, token, newID); rr.Code != 200 || svc.calls != 2 {
		t.Fatalf("new signed MessageID: status=%d calls=%d", rr.Code, svc.calls)
	}
	expiredID := "urn:uuid:550e8400-e29b-41d4-a716-446655440002"
	expired := signedX509SummaryXML(t, key, cert, cert, "2026-09-28T14:20:00Z", "2026-09-28T14:24:00Z", expiredID)
	assertFourReferencesValid(t, expired, cert)
	if rr := sendSignedSummary(handler, token, expired); rr.Code != 400 || svc.calls != 2 {
		t.Fatalf("expired signed request: status=%d calls=%d", rr.Code, svc.calls)
	}
	freshSameID := signedX509SummaryXML(t, key, cert, cert, created, expires, expiredID)
	if rr := sendSignedSummary(handler, token, freshSameID); rr.Code != 200 || svc.calls != 3 {
		t.Fatalf("expired request consumed MessageID: status=%d calls=%d", rr.Code, svc.calls)
	}

	legacy := signedReplaySummaryXML(t, key, cert, created, expires, firstID)
	legacySvc := &signedSummaryService{}
	legacyHandler := NewHandlerWithConfig(legacySvc, "", HandlerConfig{
		JWTSecret: testJWTSecret, RequireXMLSignature: true, ReplayProtection: true,
		TrustedSignatureCert: cert, Now: func() time.Time { return now },
	})
	if rr := sendSignedSummary(legacyHandler, token, legacy); rr.Code != 200 || legacySvc.calls != 1 {
		t.Fatalf("three-reference compatibility: status=%d calls=%d", rr.Code, legacySvc.calls)
	}
}

func TestSOAPX509TokenAcceptsWrappedBase64(t *testing.T) {
	now := time.Date(2026, 9, 28, 14, 30, 0, 0, time.UTC)
	key, cert := testSigningIdentity(t)
	encoded := base64.StdEncoding.EncodeToString(cert.Raw)
	wrapped := "\n  " + encoded[:60] + "\n  " + encoded[60:] + "\n"
	raw := x509SummaryXML("2026-09-28T14:29:00Z", "2026-09-28T14:33:00Z", "urn:uuid:550e8400-e29b-41d4-a716-446655440000", wrapped)
	xmlText := signSummaryXML(t, key, cert, raw, "body", "timestamp", "messageID", "bst")
	handler, token, svc := x509TestHandler(t, cert, now)
	if rr := sendSignedSummary(handler, token, xmlText); rr.Code != 200 || svc.calls != 1 {
		t.Fatalf("line-wrapped Base64: status=%d calls=%d", rr.Code, svc.calls)
	}
}

func TestSOAPX509TokenRejectsNonRSACertificate(t *testing.T) {
	key, trusted := testSigningIdentity(t)
	ecdsaKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	now := time.Now()
	template := &x509.Certificate{
		SerialNumber: big.NewInt(2), Subject: pkix.Name{CommonName: "ephemeral ECDSA token"},
		NotBefore: now.Add(-time.Hour), NotAfter: now.Add(time.Hour),
	}
	der, err := x509.CreateCertificate(rand.Reader, template, template, &ecdsaKey.PublicKey, ecdsaKey)
	if err != nil {
		t.Fatal(err)
	}
	raw := x509SummaryXML("2026-09-28T14:29:00Z", "2026-09-28T14:33:00Z", "urn:uuid:550e8400-e29b-41d4-a716-446655440000", base64.StdEncoding.EncodeToString(der))
	xmlText := signSummaryXML(t, key, trusted, raw, "body", "timestamp", "messageID", "bst")
	handler, token, svc := x509TestHandler(t, trusted, time.Date(2026, 9, 28, 14, 30, 0, 0, time.UTC))
	if rr := sendSignedSummary(handler, token, xmlText); rr.Code != 400 || svc.calls != 0 {
		t.Fatalf("non-RSA token: status=%d calls=%d", rr.Code, svc.calls)
	}
}
