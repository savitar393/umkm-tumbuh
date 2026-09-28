package soap

import (
	"context"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/base64"
	"encoding/pem"
	"math/big"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/beevik/etree"
	"github.com/moov-io/signedxml"
	dsig "github.com/russellhaering/goxmldsig"
	"github.com/russellhaering/goxmldsig/etreeutils"
	contracts "github.com/savitar393/umkm-tumbuh/services/partnerships-service/internal/soap/contracts"
)

const testWSSE = "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
const testWSU = "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"
const testWSA = "http://www.w3.org/2005/08/addressing"

type signedSummaryService struct {
	partnershipService
	calls int
}

func (s *signedSummaryService) GetPartnershipSummary(_ context.Context, _ *contracts.GetPartnershipSummaryRequest) (map[string]int, error) {
	s.calls++
	return map[string]int{"DIAJUKAN": 1}, nil
}

func testSigningIdentity(t *testing.T) (*rsa.PrivateKey, *x509.Certificate) {
	t.Helper()
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	now := time.Now()
	template := &x509.Certificate{
		SerialNumber: big.NewInt(1), Subject: pkix.Name{CommonName: "ephemeral test signer"},
		NotBefore: now.Add(-time.Hour), NotAfter: now.Add(time.Hour),
	}
	der, err := x509.CreateCertificate(rand.Reader, template, template, &key.PublicKey, key)
	if err != nil {
		t.Fatal(err)
	}
	cert, err := x509.ParseCertificate(der)
	if err != nil {
		t.Fatal(err)
	}
	return key, cert
}

func summaryXML() string {
	return `<soap:Envelope xmlns:soap="` + NSEnvelope + `" xmlns:wsse="` + testWSSE + `" xmlns:wsu="` + testWSU + `" xmlns:p="` + NSPartner + `"><soap:Header><wsse:Security><x:Other xmlns:x="urn:other" xmlns:wsu="` + testWSU + `" wsu:Id="other-1">unrelated</x:Other></wsse:Security></soap:Header><soap:Body xmlns:soap="` + NSEnvelope + `" xmlns:wsu="` + testWSU + `" xmlns:p="` + NSPartner + `" wsu:Id="body-1"><p:GetPartnershipSummary><userId>AKUN-001</userId><userRole>UMKM</userRole></p:GetPartnershipSummary></soap:Body></soap:Envelope>`
}

func summaryXMLWithTimestamp(created, expires string) string {
	timestamp := `<wsu:Timestamp xmlns:wsu="` + testWSU + `" wsu:Id="timestamp-1"><wsu:Created>` + created + `</wsu:Created><wsu:Expires>` + expires + `</wsu:Expires></wsu:Timestamp>`
	return strings.Replace(summaryXML(), "<wsse:Security>", "<wsse:Security>"+timestamp, 1)
}

func signedSummaryXML(t *testing.T, key *rsa.PrivateKey, cert *x509.Certificate, created, expires string, references ...string) string {
	t.Helper()
	if len(references) == 0 {
		references = []string{"body", "timestamp"}
	}
	return signSummaryXML(t, key, cert, summaryXMLWithTimestamp(created, expires), references...)
}

func signedReplaySummaryXML(t *testing.T, key *rsa.PrivateKey, cert *x509.Certificate, created, expires, messageID string, references ...string) string {
	t.Helper()
	if len(references) == 0 {
		references = []string{"body", "timestamp", "messageID"}
	}
	return signSummaryXML(t, key, cert, replaySummaryXML(created, expires, messageID), references...)
}

func replaySummaryXML(created, expires, messageID string) string {
	raw := summaryXMLWithTimestamp(created, expires)
	header := `<soap:Header><wsa:MessageID xmlns:wsa="` + testWSA + `" xmlns:wsu="` + testWSU + `" wsu:Id="message-id-1">` + messageID + `</wsa:MessageID>`
	return strings.Replace(raw, "<soap:Header>", header, 1)
}

func signSummaryXML(t *testing.T, key *rsa.PrivateKey, cert *x509.Certificate, raw string, references ...string) string {
	t.Helper()
	doc := etree.NewDocument()
	if err := doc.ReadFromString(raw); err != nil {
		t.Fatal(err)
	}
	security := doc.Root().FindElement("./Header/Security")
	signer, err := dsig.NewSigningContext(key, [][]byte{cert.Raw})
	if err != nil {
		t.Fatal(err)
	}
	signer.IdAttribute = "wsu:Id"
	signer.Canonicalizer = dsig.MakeC14N10ExclusiveCanonicalizerWithPrefixList("")
	var sig *etree.Element
	for _, reference := range references {
		var target *etree.Element
		switch reference {
		case "body":
			target = doc.Root().FindElement("./Body")
		case "timestamp":
			target = security.FindElement("./Timestamp")
		case "other":
			target = security.FindElement("./Other")
		case "messageID":
			target = doc.Root().FindElement("./Header/MessageID")
		case "bst":
			target = security.FindElement("./BinarySecurityToken")
		default:
			t.Fatalf("unknown test reference %q", reference)
		}
		next, signErr := signer.ConstructSignature(target, false)
		if signErr != nil {
			t.Fatal(signErr)
		}
		if sig == nil {
			sig = next
		} else {
			sig.FindElement("./SignedInfo").AddChild(next.FindElement("./SignedInfo/Reference").Copy())
		}
	}
	security.AddChild(sig)
	if security.FindElement("./BinarySecurityToken") != nil {
		keyInfo := sig.FindElement("./KeyInfo")
		for _, child := range keyInfo.ChildElements() {
			keyInfo.RemoveChild(child)
		}
		str := keyInfo.CreateElement("wsse:SecurityTokenReference")
		str.CreateAttr("xmlns:wsse", testWSSE)
		reference := str.CreateElement("wsse:Reference")
		reference.CreateAttr("URI", "#x509-1")
		reference.CreateAttr("ValueType", testX509v3ValueType)
	}
	signedInfo := sig.FindElement("./SignedInfo")
	nsContext, err := etreeutils.NSBuildParentContext(signedInfo)
	if err != nil {
		t.Fatal(err)
	}
	detached, err := etreeutils.NSDetatch(nsContext, signedInfo)
	if err != nil {
		t.Fatal(err)
	}
	canonical, err := signer.Canonicalizer.Canonicalize(detached)
	if err != nil {
		t.Fatal(err)
	}
	digest := sha256.Sum256(canonical)
	value, err := key.Sign(rand.Reader, digest[:], crypto.SHA256)
	if err != nil {
		t.Fatal(err)
	}
	sig.FindElement("./SignatureValue").SetText(base64.StdEncoding.EncodeToString(value))
	xmlText, err := doc.WriteToString()
	if err != nil {
		t.Fatal(err)
	}
	// Exercise inherited SOAP, WSU, and operation namespace declarations.
	xmlText = strings.Replace(xmlText,
		`<soap:Body xmlns:soap="`+NSEnvelope+`" xmlns:wsu="`+testWSU+`" xmlns:p="`+NSPartner+`" wsu:Id=`,
		`<soap:Body wsu:Id=`, 1)
	return xmlText
}

func TestSOAPReplayProtectionFirstAndRepeat(t *testing.T) {
	now := time.Date(2026, 9, 28, 14, 30, 0, 0, time.UTC)
	key, cert := testSigningIdentity(t)
	token := signedTestJWT(t, map[string]any{
		"sub": "AKUN-001", "role": "UMKM", "exp": time.Now().Add(time.Hour).Unix(),
	}, testJWTSecret, "HS256")
	xmlText := signedReplaySummaryXML(t, key, cert, "2026-09-28T14:29:00Z", "2026-09-28T14:33:00Z", "urn:uuid:550e8400-e29b-41d4-a716-446655440000")
	svc := &signedSummaryService{}
	handler := NewHandlerWithConfig(svc, "", HandlerConfig{
		JWTSecret: testJWTSecret, RequireXMLSignature: true, TrustedSignatureCert: cert,
		ReplayProtection: true, Now: func() time.Time { return now },
	})
	for i, want := range []int{200, 400} {
		req := httptest.NewRequest(http.MethodPost, "/partnership", strings.NewReader(xmlText))
		req.Header.Set("Authorization", "Bearer "+token)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)
		if rr.Code != want {
			t.Fatalf("attempt %d: status=%d, want %d; body=%s", i+1, rr.Code, want, rr.Body.String())
		}
	}
	otherToken := signedTestJWT(t, map[string]any{
		"sub": "AKUN-002", "role": "UMKM", "exp": time.Now().Add(time.Hour).Unix(),
	}, testJWTSecret, "HS256")
	if rr := sendSignedSummary(handler, otherToken, xmlText); rr.Code != 400 {
		t.Fatalf("same MessageID under another JWT: status=%d", rr.Code)
	}
	if svc.calls != 1 {
		t.Fatalf("business calls=%d, want 1", svc.calls)
	}
}

func TestSOAPReplaySecurityProfile(t *testing.T) {
	now := time.Date(2026, 9, 28, 14, 30, 0, 0, time.UTC)
	created, expires := "2026-09-28T14:29:00Z", "2026-09-28T14:33:00Z"
	firstID := "urn:uuid:550e8400-e29b-41d4-a716-446655440000"
	secondID := "urn:uuid:550e8400-e29b-41d4-a716-446655440001"
	key, cert := testSigningIdentity(t)
	valid := signedReplaySummaryXML(t, key, cert, created, expires, firstID)
	token := signedTestJWT(t, map[string]any{
		"sub": "AKUN-001", "role": "UMKM", "exp": time.Now().Add(time.Hour).Unix(),
	}, testJWTSecret, "HS256")
	for _, tc := range []struct {
		name string
		xml  string
	}{
		{"changed signed MessageID", strings.Replace(valid, firstID, secondID, 1)},
		{"unsigned MessageID", signedReplaySummaryXML(t, key, cert, created, expires, firstID, "body", "timestamp")},
		{"duplicate MessageID element", strings.Replace(valid, "<wsse:Security>", `<wsa:MessageID xmlns:wsa="`+testWSA+`" xmlns:wsu="`+testWSU+`" wsu:Id="message-id-2">`+secondID+`</wsa:MessageID><wsse:Security>`, 1)},
		{"duplicate MessageID ID", strings.Replace(valid, "<wsse:Security>", `<x:Other xmlns:x="urn:other" xmlns:wsu="`+testWSU+`" wsu:Id="message-id-1"/><wsse:Security>`, 1)},
		{"MessageID shares Body ID", strings.Replace(valid, `wsu:Id="message-id-1"`, `wsu:Id="body-1"`, 1)},
		{"MessageID shares Timestamp ID", strings.Replace(valid, `wsu:Id="message-id-1"`, `wsu:Id="timestamp-1"`, 1)},
		{"unrelated fourth reference", signedReplaySummaryXML(t, key, cert, created, expires, firstID, "body", "timestamp", "messageID", "other")},
		{"two MessageID references", signedReplaySummaryXML(t, key, cert, created, expires, firstID, "body", "messageID", "messageID")},
		{"unsigned Body", signedReplaySummaryXML(t, key, cert, created, expires, firstID, "timestamp", "messageID", "other")},
		{"unsigned Timestamp", signedReplaySummaryXML(t, key, cert, created, expires, firstID, "body", "messageID", "other")},
		{"malformed MessageID", signedReplaySummaryXML(t, key, cert, created, expires, "not-a-uri")},
		{"empty MessageID", signedReplaySummaryXML(t, key, cert, created, expires, " ")},
		{"expired signed Timestamp", signedReplaySummaryXML(t, key, cert, "2026-09-28T14:20:00Z", "2026-09-28T14:24:00Z", firstID)},
	} {
		t.Run(tc.name, func(t *testing.T) {
			svc := &signedSummaryService{}
			handler := NewHandlerWithConfig(svc, "", HandlerConfig{
				JWTSecret: testJWTSecret, RequireXMLSignature: true, TrustedSignatureCert: cert,
				ReplayProtection: true, Now: func() time.Time { return now },
			})
			rr := sendSignedSummary(handler, token, tc.xml)
			if rr.Code != 400 || svc.calls != 0 || !strings.Contains(rr.Body.String(), "SOAP message signature is invalid") {
				t.Fatalf("status=%d calls=%d body=%s", rr.Code, svc.calls, rr.Body.String())
			}
		})
	}

	svc := &signedSummaryService{}
	handler := NewHandlerWithConfig(svc, "", HandlerConfig{
		JWTSecret: testJWTSecret, RequireXMLSignature: true, TrustedSignatureCert: cert,
		ReplayProtection: true, Now: func() time.Time { return now },
	})
	if rr := sendSignedSummary(handler, "", valid); rr.Code != 401 {
		t.Fatalf("missing JWT: status=%d", rr.Code)
	}
	if rr := sendSignedSummary(handler, token, valid); rr.Code != 200 {
		t.Fatalf("JWT failure consumed MessageID: status=%d body=%s", rr.Code, rr.Body.String())
	}
	newID := signedReplaySummaryXML(t, key, cert, created, expires, secondID)
	if rr := sendSignedSummary(handler, token, newID); rr.Code != 200 || svc.calls != 2 {
		t.Fatalf("new signed MessageID: status=%d calls=%d body=%s", rr.Code, svc.calls, rr.Body.String())
	}

	previouslyExpired := signedReplaySummaryXML(t, key, cert, "2026-09-28T14:20:00Z", "2026-09-28T14:24:00Z", "urn:uuid:550e8400-e29b-41d4-a716-446655440002")
	freshSameID := signedReplaySummaryXML(t, key, cert, created, expires, "urn:uuid:550e8400-e29b-41d4-a716-446655440002")
	if rr := sendSignedSummary(handler, token, previouslyExpired); rr.Code != 400 {
		t.Fatalf("expired request: status=%d", rr.Code)
	}
	if rr := sendSignedSummary(handler, token, freshSameID); rr.Code != 200 || svc.calls != 3 {
		t.Fatalf("expired request consumed MessageID: status=%d calls=%d", rr.Code, svc.calls)
	}
}

func sendSignedSummary(handler *Handler, token, xmlText string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodPost, "/partnership", strings.NewReader(xmlText))
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	return rr
}

func TestSOAPXMLSignatureProfile(t *testing.T) {
	now := time.Date(2026, 9, 28, 14, 30, 0, 0, time.UTC)
	created, expires := "2026-09-28T14:29:00Z", "2026-09-28T14:33:00Z"
	trustedKey, trustedCert := testSigningIdentity(t)
	otherKey, otherCert := testSigningIdentity(t)
	valid := signedSummaryXML(t, trustedKey, trustedCert, created, expires)
	expired := signedSummaryXML(t, trustedKey, trustedCert, "2026-09-28T14:20:00Z", "2026-09-28T14:24:00Z")
	validator, err := signedxml.NewValidator(expired)
	if err != nil {
		t.Fatal(err)
	}
	validator.SetReferenceIDAttribute("Id")
	validator.Certificates = []x509.Certificate{*trustedCert}
	if verified, err := validator.ValidateReferences(); err != nil || len(verified) != 2 {
		t.Fatalf("expired fixture must have two valid signed references: count=%d err=%v", len(verified), err)
	}
	token := signedTestJWT(t, map[string]any{
		"sub": "AKUN-001", "role": "UMKM", "exp": time.Now().Add(time.Hour).Unix(),
	}, testJWTSecret, "HS256")
	for _, tc := range []struct {
		name    string
		xml     string
		require bool
		token   string
		want    int
		calls   int
	}{
		{"compatibility unsigned", summaryXML(), false, token, 200, 1},
		{"valid signed Body and Timestamp", valid, true, token, 200, 1},
		{"missing signature", summaryXMLWithTimestamp(created, expires), true, token, 400, 0},
		{"tampered Body", strings.Replace(valid, "AKUN-001</userId>", "AKUN-002</userId>", 1), true, token, 400, 0},
		{"tampered Timestamp", strings.Replace(valid, expires, "2026-09-28T14:34:00Z", 1), true, token, 400, 0},
		{"Timestamp unsigned", signedSummaryXML(t, trustedKey, trustedCert, created, expires, "body"), true, token, 400, 0},
		{"Body unsigned", signedSummaryXML(t, trustedKey, trustedCert, created, expires, "timestamp", "other"), true, token, 400, 0},
		{"two Body references", signedSummaryXML(t, trustedKey, trustedCert, created, expires, "body", "body"), true, token, 400, 0},
		{"expired signed Timestamp", expired, true, token, 400, 0},
		{"future Timestamp", signedSummaryXML(t, trustedKey, trustedCert, "2026-09-28T14:31:00Z", "2026-09-28T14:34:00Z"), true, token, 400, 0},
		{"small clock skew", signedSummaryXML(t, trustedKey, trustedCert, "2026-09-28T14:30:20Z", "2026-09-28T14:34:20Z"), true, token, 200, 1},
		{"excessive TTL", signedSummaryXML(t, trustedKey, trustedCert, "2026-09-28T14:30:00Z", "2026-09-28T15:30:00Z"), true, token, 400, 0},
		{"malformed UTC time", signedSummaryXML(t, trustedKey, trustedCert, "2026-09-28T14:29:00+00:00", expires), true, token, 400, 0},
		{"Expires not after Created", signedSummaryXML(t, trustedKey, trustedCert, created, created), true, token, 400, 0},
		{"wrong key", signedSummaryXML(t, otherKey, otherCert, created, expires), true, token, 400, 0},
		{"JWT still mandatory", valid, true, "", 401, 0},
		{"wrong reference", signedSummaryXML(t, trustedKey, trustedCert, created, expires, "other", "timestamp"), true, token, 400, 0},
		{"duplicate reference ID", strings.Replace(valid, `<soap:Header>`, `<soap:Header><x:Duplicate xmlns:x="urn:other" xmlns:wsu="`+testWSU+`" wsu:Id="body-1"/>`, 1), true, token, 400, 0},
		{"duplicate Timestamp ID", strings.Replace(valid, `<ds:Signature`, `<x:Duplicate xmlns:x="urn:other" xmlns:wsu="`+testWSU+`" wsu:Id="timestamp-1"/><ds:Signature`, 1), true, token, 400, 0},
		{"duplicate Timestamp element", strings.Replace(valid, `<ds:Signature`, `<wsu:Timestamp wsu:Id="timestamp-2"><wsu:Created>`+created+`</wsu:Created><wsu:Expires>`+expires+`</wsu:Expires></wsu:Timestamp><ds:Signature`, 1), true, token, 400, 0},
		{"shared Body and Timestamp ID", strings.Replace(valid, `wsu:Id="timestamp-1"`, `wsu:Id="body-1"`, 1), true, token, 400, 0},
		{"extra third reference", signedSummaryXML(t, trustedKey, trustedCert, created, expires, "body", "timestamp", "other"), true, token, 400, 0},
		{"SHA1 downgrade", strings.Replace(valid, rsaSHA256, "http://www.w3.org/2000/09/xmldsig#rsa-sha1", 1), true, token, 400, 0},
	} {
		t.Run(tc.name, func(t *testing.T) {
			svc := &signedSummaryService{}
			handler := NewHandlerWithConfig(svc, "", HandlerConfig{
				JWTSecret: testJWTSecret, RequireXMLSignature: tc.require, TrustedSignatureCert: trustedCert,
				Now: func() time.Time { return now },
			})
			req := httptest.NewRequest(http.MethodPost, "/partnership", strings.NewReader(tc.xml))
			if tc.token != "" {
				req.Header.Set("Authorization", "Bearer "+tc.token)
			}
			rr := httptest.NewRecorder()
			handler.ServeHTTP(rr, req)
			if rr.Code != tc.want || svc.calls != tc.calls {
				t.Fatalf("status=%d calls=%d body=%s", rr.Code, svc.calls, rr.Body.String())
			}
			if tc.want == 400 && (!strings.Contains(rr.Body.String(), "SOAP message signature is invalid") || strings.Contains(rr.Body.String(), "signedxml")) {
				t.Fatalf("unsafe signature fault: %s", rr.Body.String())
			}
		})
	}
}

func TestSignedElementIDRejectsDuplicateWSUAttributes(t *testing.T) {
	element := etree.NewElement("Body")
	element.CreateAttr("xmlns:wsu", testWSU)
	element.CreateAttr("xmlns:alias", testWSU)
	element.CreateAttr("wsu:Id", "")
	element.CreateAttr("alias:Id", "body-1")
	if _, err := signedElementID(element); err == nil {
		t.Fatal("two wsu:Id attributes were accepted")
	}
}

func TestSOAPXMLSignatureRequiresTrustedCertificate(t *testing.T) {
	key, cert := testSigningIdentity(t)
	token := signedTestJWT(t, map[string]any{
		"sub": "AKUN-001", "role": "UMKM", "exp": time.Now().Add(time.Hour).Unix(),
	}, testJWTSecret, "HS256")
	svc := &signedSummaryService{}
	handler := NewHandlerWithConfig(svc, "", HandlerConfig{JWTSecret: testJWTSecret, RequireXMLSignature: true})
	req := httptest.NewRequest(http.MethodPost, "/partnership", strings.NewReader(signedSummaryXML(t, key, cert, "2026-09-28T14:29:00Z", "2026-09-28T14:33:00Z")))
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	if rr.Code != http.StatusInternalServerError || svc.calls != 0 || strings.Contains(rr.Body.String(), "certificate") {
		t.Fatalf("configuration did not fail closed: status=%d calls=%d body=%s", rr.Code, svc.calls, rr.Body.String())
	}
}

func TestTrustedSignatureCertificateFile(t *testing.T) {
	_, cert := testSigningIdentity(t)
	path := filepath.Join(t.TempDir(), "trusted.pem")
	if err := os.WriteFile(path, pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: cert.Raw}), 0600); err != nil {
		t.Fatal(err)
	}
	loaded, err := LoadTrustedSignatureCertificate(path)
	if err != nil || !loaded.Equal(cert) {
		t.Fatalf("trusted certificate not loaded: %v", err)
	}
	if err := os.WriteFile(path, []byte("not a certificate"), 0600); err != nil {
		t.Fatal(err)
	}
	if _, err := LoadTrustedSignatureCertificate(path); err == nil {
		t.Fatal("invalid trusted certificate accepted")
	}
}
