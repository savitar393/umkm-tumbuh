package soap

import (
	"bytes"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/base64"
	"encoding/pem"
	"errors"
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
)

const responseMessageID = "urn:uuid:550e8400-e29b-41d4-a716-446655440000"
const testResponseXML = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><response>ok</response></soap:Body></soap:Envelope>`

func testResponseIdentity(t *testing.T) (*ResponseSigningIdentity, string, string) {
	t.Helper()
	key, cert := testSigningIdentity(t)
	dir := t.TempDir()
	certPath, keyPath := filepath.Join(dir, "cert.pem"), filepath.Join(dir, "key.pem")
	if err := os.WriteFile(certPath, pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: cert.Raw}), 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(keyPath, pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(key)}), 0600); err != nil {
		t.Fatal(err)
	}
	identity, err := LoadResponseSigningIdentity(certPath, keyPath)
	if err != nil {
		t.Fatal(err)
	}
	return identity, certPath, keyPath
}

// This verifier is deliberately test-only: the server presents a certificate,
// while a client must independently pin and verify the expected server identity.
func verifyTestSignedResponse(raw []byte, expected *x509.Certificate, requestMessageID string) error {
	doc := etree.NewDocument()
	if err := doc.ReadFromBytes(raw); err != nil {
		return err
	}
	root := doc.Root()
	if root == nil || root.Tag != "Envelope" || root.NamespaceURI() != NSEnvelope {
		return errors.New("invalid envelope")
	}
	bodies, headers := root.FindElements("./Body"), root.FindElements("./Header")
	if len(bodies) != 1 || len(headers) != 1 || bodies[0].NamespaceURI() != NSEnvelope || headers[0].NamespaceURI() != NSEnvelope {
		return errors.New("ambiguous response")
	}
	relates := headers[0].FindElements("./RelatesTo")
	security := headers[0].FindElements("./Security")
	if len(relates) != 1 || len(security) != 1 || relates[0].NamespaceURI() != wsaNamespace || security[0].NamespaceURI() != wsseNamespace {
		return errors.New("missing security header")
	}
	timestamps, tokens, signatures := security[0].FindElements("./Timestamp"), security[0].FindElements("./BinarySecurityToken"), security[0].FindElements("./Signature")
	if len(timestamps) != 1 || len(tokens) != 1 || len(signatures) != 1 {
		return errors.New("missing signed element")
	}
	if relates[0].Text() != requestMessageID || len(relates[0].ChildElements()) != 0 {
		return errors.New("wrong RelatesTo")
	}
	token, err := resolveTrustedX509Token(root, security[0], signatures[0], expected)
	if err != nil {
		return err
	}
	targets := []*etree.Element{bodies[0], timestamps[0], relates[0], token.element}
	ids := make(map[string]*etree.Element)
	for _, target := range targets {
		id, err := signedElementID(target)
		if err != nil || ids[id] != nil {
			return errors.New("invalid response ID")
		}
		ids[id] = target
	}
	counts := make(map[string]int)
	var visit func(*etree.Element)
	visit = func(el *etree.Element) {
		for _, attr := range el.Attr {
			if attr.Key == "Id" && ids[attr.Value] != nil {
				counts[attr.Value]++
			}
		}
		for _, child := range el.ChildElements() {
			visit(child)
		}
	}
	visit(root)
	for id := range ids {
		if counts[id] != 1 {
			return errors.New("duplicate response ID")
		}
	}
	info := signatures[0].FindElements("./SignedInfo")
	if len(info) != 1 || !signatureMethod(info[0], "CanonicalizationMethod", exclusiveC14N) || !signatureMethod(info[0], "SignatureMethod", rsaSHA256) {
		return errors.New("wrong signature algorithm")
	}
	references := info[0].FindElements("./Reference")
	if len(references) != 4 {
		return errors.New("wrong reference count")
	}
	seen := make(map[string]bool)
	for _, ref := range references {
		uri := ref.SelectAttrValue("URI", "")
		if !strings.HasPrefix(uri, "#") || ids[strings.TrimPrefix(uri, "#")] == nil || seen[uri] || !signatureMethod(ref, "DigestMethod", digestSHA256) {
			return errors.New("wrong reference")
		}
		seen[uri] = true
		transforms := ref.FindElements("./Transforms")
		if len(transforms) != 1 || len(transforms[0].ChildElements()) != 1 || !signatureMethod(transforms[0], "Transform", exclusiveC14N) {
			return errors.New("wrong transform")
		}
	}
	validator, err := signedxml.NewValidator(string(raw))
	if err != nil {
		return err
	}
	validator.SetReferenceIDAttribute("Id")
	validator.Certificates = []x509.Certificate{*token.certificate}
	verified, err := validator.ValidateReferences()
	if err != nil {
		return err
	}
	if len(verified) != 4 {
		return errors.New("wrong verified reference count")
	}
	for i, ref := range references {
		actual, err := serializeElement(ids[strings.TrimPrefix(ref.SelectAttrValue("URI", ""), "#")])
		if err != nil || verified[i] != string(actual) {
			return errors.New("verified element mismatch")
		}
	}
	if _, err := validateSignedTimestamp(timestamps[0], time.Date(2026, 9, 28, 14, 30, 0, 0, time.UTC), DefaultWSSEMaxClockSkew, DefaultWSSEMaxTimestampTTL); err != nil {
		return err
	}
	return nil
}

func TestResponseSigningFourReferencesAndTampering(t *testing.T) {
	identity, _, _ := testResponseIdentity(t)
	now := time.Date(2026, 9, 28, 14, 30, 0, 0, time.UTC)
	signed, err := signSOAPResponse([]byte(testResponseXML), identity, responseMessageID, now, 5*time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	if err := verifyTestSignedResponse(signed, identity.certificate, responseMessageID); err != nil {
		t.Fatal(err)
	}
	for _, tc := range []struct{ name, old, replacement string }{
		{"Body", ">ok</response>", ">no</response>"},
		{"Timestamp", "2026-09-28T14:35:00Z", "2026-09-28T14:36:00Z"},
		{"RelatesTo", responseMessageID, "urn:uuid:650e8400-e29b-41d4-a716-446655440000"},
		{"BinarySecurityToken", base64.StdEncoding.EncodeToString(identity.certificate.Raw)[:24], "AAAAAAAAAAAAAAAAAAAAAAAA"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			altered := bytes.Replace(signed, []byte(tc.old), []byte(tc.replacement), 1)
			if bytes.Equal(altered, signed) || verifyTestSignedResponse(altered, identity.certificate, responseMessageID) == nil {
				t.Fatal("tampered response accepted")
			}
		})
	}
	_, wrong := testSigningIdentity(t)
	if err := verifyTestSignedResponse(signed, wrong, responseMessageID); err == nil {
		t.Fatal("wrong server certificate accepted")
	}
	stripped := bytes.Replace(signed, []byte("#response-cert-"), []byte("#response-body-"), 1)
	if verifyTestSignedResponse(stripped, identity.certificate, responseMessageID) == nil {
		t.Fatal("wrong SecurityTokenReference accepted")
	}
	for _, tc := range []struct{ name, old, replacement string }{
		{"SHA-1 digest", digestSHA256, "http://www.w3.org/2000/09/xmldsig#sha1"},
		{"SHA-1 signature", rsaSHA256, "http://www.w3.org/2000/09/xmldsig#rsa-sha1"},
		{"wrong canonicalization", exclusiveC14N, "http://www.w3.org/TR/2001/REC-xml-c14n-20010315"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			changed := bytes.Replace(signed, []byte(tc.old), []byte(tc.replacement), 1)
			if verifyTestSignedResponse(changed, identity.certificate, responseMessageID) == nil {
				t.Fatal("unsupported algorithm accepted")
			}
		})
	}
}

func TestResponseSigningRejectsMissingOrWrongKey(t *testing.T) {
	_, certPath, keyPath := testResponseIdentity(t)
	if _, err := LoadResponseSigningIdentity(certPath, filepath.Join(t.TempDir(), "missing.pem")); err == nil {
		t.Fatal("missing key accepted")
	}
	if err := os.WriteFile(keyPath, []byte("invalid"), 0600); err != nil {
		t.Fatal(err)
	}
	if _, err := LoadResponseSigningIdentity(certPath, keyPath); err == nil {
		t.Fatal("invalid key accepted")
	}
	_, _, anotherKey := testResponseIdentity(t)
	keyData, err := os.ReadFile(anotherKey)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(keyPath, keyData, 0600); err != nil {
		t.Fatal(err)
	}
	if _, err := LoadResponseSigningIdentity(certPath, keyPath); err == nil {
		t.Fatal("mismatched key accepted")
	}
	ecKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	template := &x509.Certificate{SerialNumber: big.NewInt(2), Subject: pkix.Name{CommonName: "EC test"}, NotBefore: time.Now().Add(-time.Hour), NotAfter: time.Now().Add(time.Hour)}
	ecDER, err := x509.CreateCertificate(rand.Reader, template, template, &ecKey.PublicKey, ecKey)
	if err != nil {
		t.Fatal(err)
	}
	ecKeyDER, err := x509.MarshalECPrivateKey(ecKey)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(certPath, pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: ecDER}), 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(keyPath, pem.EncodeToMemory(&pem.Block{Type: "EC PRIVATE KEY", Bytes: ecKeyDER}), 0600); err != nil {
		t.Fatal(err)
	}
	if _, err := LoadResponseSigningIdentity(certPath, keyPath); err == nil {
		t.Fatal("non-RSA response identity accepted")
	}
}

func TestSignedResponseTransport(t *testing.T) {
	now := time.Date(2026, 9, 28, 14, 30, 0, 0, time.UTC)
	clientKey, clientCert := testSigningIdentity(t)
	serverIdentity, _, _ := testResponseIdentity(t)
	jwt := signedTestJWT(t, map[string]any{
		"sub": "AKUN-001", "role": "UMKM", "exp": time.Now().Add(time.Hour).Unix(),
	}, testJWTSecret, "HS256")
	request := signedX509SummaryXML(t, clientKey, clientCert, clientCert,
		"2026-09-28T14:29:00Z", "2026-09-28T14:33:00Z", responseMessageID)
	svc := &signedSummaryService{}
	handler := NewHandlerWithConfig(svc, "", HandlerConfig{
		JWTSecret: testJWTSecret, RequireXMLSignature: true, ReplayProtection: true,
		X509TokenProfile: true, TrustedSignatureCert: clientCert,
		SignResponses: true, ResponseSigningIdentity: serverIdentity,
		Now: func() time.Time { return now },
	})
	rr := sendSignedSummary(handler, jwt, request)
	if rr.Code != http.StatusOK || svc.calls != 1 {
		t.Fatalf("signed response status=%d calls=%d body=%s", rr.Code, svc.calls, rr.Body.String())
	}
	if err := verifyTestSignedResponse(rr.Body.Bytes(), serverIdentity.certificate, responseMessageID); err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(rr.Body.String(), "GetPartnershipSummaryResponse") {
		t.Fatal("business payload missing")
	}
	if replay := sendSignedSummary(handler, jwt, request); replay.Code != http.StatusBadRequest || svc.calls != 1 {
		t.Fatalf("replay status=%d calls=%d", replay.Code, svc.calls)
	}
	tamperedRequest := strings.Replace(request, "<userId>AKUN-001</userId>", "<userId>OTHER-001</userId>", 1)
	if tamperedRequest == request {
		t.Fatal("test did not modify request Body")
	}
	if invalid := sendSignedSummary(handler, jwt, tamperedRequest); invalid.Code != http.StatusBadRequest || strings.Contains(invalid.Body.String(), "BinarySecurityToken") {
		t.Fatalf("invalid request signature changed pre-security failure: status=%d", invalid.Code)
	}
	if missingJWT := sendSignedSummary(handler, "", request); missingJWT.Code != http.StatusUnauthorized {
		t.Fatalf("missing JWT status=%d", missingJWT.Code)
	}
	if untrusted := signedX509SummaryXML(t, clientKey, clientCert, serverIdentity.certificate,
		"2026-09-28T14:29:00Z", "2026-09-28T14:33:00Z", "urn:uuid:550e8400-e29b-41d4-a716-446655440001"); sendSignedSummary(handler, jwt, untrusted).Code != http.StatusBadRequest {
		t.Fatal("untrusted request certificate accepted")
	}

	request2 := signedX509SummaryXML(t, clientKey, clientCert, clientCert,
		"2026-09-28T14:29:00Z", "2026-09-28T14:33:00Z", "urn:uuid:550e8400-e29b-41d4-a716-446655440002")
	rr2 := sendSignedSummary(handler, jwt, request2)
	if rr2.Code != http.StatusOK || verifyTestSignedResponse(rr2.Body.Bytes(), serverIdentity.certificate,
		"urn:uuid:550e8400-e29b-41d4-a716-446655440002") != nil {
		t.Fatalf("second response failed: status=%d", rr2.Code)
	}
	firstDoc, secondDoc := etree.NewDocument(), etree.NewDocument()
	if err := firstDoc.ReadFromBytes(rr.Body.Bytes()); err != nil {
		t.Fatal(err)
	}
	if err := secondDoc.ReadFromBytes(rr2.Body.Bytes()); err != nil {
		t.Fatal(err)
	}
	if firstDoc.Root().FindElement("./Body").SelectAttrValue("wsu:Id", "") == secondDoc.Root().FindElement("./Body").SelectAttrValue("wsu:Id", "") {
		t.Fatal("response IDs reused")
	}
	mixedCaseMessageID := "urn:uuid:550E8400-e29b-41d4-a716-446655440003"
	mixedCaseRequest := signedX509SummaryXML(t, clientKey, clientCert, clientCert,
		"2026-09-28T14:29:00Z", "2026-09-28T14:33:00Z", mixedCaseMessageID)
	mixedCaseResponse := sendSignedSummary(handler, jwt, mixedCaseRequest)
	if mixedCaseResponse.Code != http.StatusOK || verifyTestSignedResponse(mixedCaseResponse.Body.Bytes(), serverIdentity.certificate, mixedCaseMessageID) != nil {
		t.Fatalf("RelatesTo did not preserve the verified MessageID: status=%d", mixedCaseResponse.Code)
	}
}

func TestSignedResponseBufferPreservesStatusAndHeaders(t *testing.T) {
	identity, _, _ := testResponseIdentity(t)
	h := NewHandlerWithConfig(nil, "", HandlerConfig{
		Now:                     func() time.Time { return time.Date(2026, 9, 28, 14, 30, 0, 0, time.UTC) },
		ResponseSigningIdentity: identity,
	})
	buffer := newBufferedSOAPResponse()
	buffer.Header().Set("Content-Type", "text/xml; charset=utf-8")
	buffer.Header().Set("X-Response-Test", "retained")
	buffer.Header().Set("Content-Length", "1")
	buffer.WriteHeader(http.StatusConflict)
	if _, err := buffer.Write([]byte(testResponseXML)); err != nil {
		t.Fatal(err)
	}
	w := httptest.NewRecorder()
	if err := h.writeSignedResponse(w, buffer, responseMessageID); err != nil {
		t.Fatal(err)
	}
	if w.Code != http.StatusConflict || w.Header().Get("Content-Type") != "text/xml; charset=utf-8" || w.Header().Get("X-Response-Test") != "retained" || w.Header().Get("Content-Length") != "" {
		t.Fatalf("buffered response metadata changed: code=%d headers=%v", w.Code, w.Header())
	}
	if err := verifyTestSignedResponse(w.Body.Bytes(), identity.certificate, responseMessageID); err != nil {
		t.Fatal(err)
	}
	if _, err := signSOAPResponse([]byte("not XML"), identity, responseMessageID, h.now(), h.wsseMaxTimestampTTL); err == nil {
		t.Fatal("malformed response was returned unsigned")
	}
}

func TestSignedResponseBusinessFaultAndCompatibility(t *testing.T) {
	now := time.Date(2026, 9, 28, 14, 30, 0, 0, time.UTC)
	clientKey, clientCert := testSigningIdentity(t)
	serverIdentity, _, _ := testResponseIdentity(t)
	jwt := signedTestJWT(t, map[string]any{
		"sub": "AKUN-001", "role": "UMKM", "exp": time.Now().Add(time.Hour).Unix(),
	}, testJWTSecret, "HS256")
	request := signedX509SummaryXML(t, clientKey, clientCert, clientCert,
		"2026-09-28T14:29:00Z", "2026-09-28T14:33:00Z", responseMessageID)
	base := HandlerConfig{JWTSecret: testJWTSecret, RequireXMLSignature: true,
		ReplayProtection: true, X509TokenProfile: true, TrustedSignatureCert: clientCert,
		Now: func() time.Time { return now }}
	compatible := NewHandlerWithConfig(&signedSummaryService{}, "", base)
	plain := sendSignedSummary(compatible, jwt, request)
	if plain.Code != http.StatusOK || strings.Contains(plain.Body.String(), "BinarySecurityToken") {
		t.Fatalf("compatibility response changed: %d %s", plain.Code, plain.Body.String())
	}
	base.SignResponses = true
	base.ResponseSigningIdentity = serverIdentity
	failing := NewHandlerWithConfig(&failingSummaryService{}, "", base)
	fault := sendSignedSummary(failing, jwt, request)
	if fault.Code != http.StatusInternalServerError || verifyTestSignedResponse(fault.Body.Bytes(), serverIdentity.certificate, responseMessageID) != nil || !strings.Contains(fault.Body.String(), "Fault") || strings.Contains(fault.Body.String(), "downstream unavailable") {
		t.Fatalf("application fault not safely signed: status=%d body=%s", fault.Code, fault.Body.String())
	}
	unauthorized := sendSignedSummary(failing, "", request)
	if unauthorized.Code != http.StatusUnauthorized || strings.Contains(unauthorized.Body.String(), "BinarySecurityToken") {
		t.Fatal("pre-security fault changed")
	}
}
