package soap

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
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
	dsig "github.com/russellhaering/goxmldsig"
	contracts "github.com/savitar393/umkm-tumbuh/services/partnerships-service/internal/soap/contracts"
)

const testWSSE = "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
const testWSU = "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"

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

func signedSummaryXML(t *testing.T, key *rsa.PrivateKey, cert *x509.Certificate, other bool) string {
	t.Helper()
	doc := etree.NewDocument()
	if err := doc.ReadFromString(summaryXML()); err != nil {
		t.Fatal(err)
	}
	target := doc.Root().FindElement("./Body")
	if other {
		target = doc.Root().FindElement("./Header/Security/Other")
	}
	signer, err := dsig.NewSigningContext(key, [][]byte{cert.Raw})
	if err != nil {
		t.Fatal(err)
	}
	signer.IdAttribute = "wsu:Id"
	signer.Canonicalizer = dsig.MakeC14N10ExclusiveCanonicalizerWithPrefixList("")
	sig, err := signer.ConstructSignature(target, false)
	if err != nil {
		t.Fatal(err)
	}
	doc.Root().FindElement("./Header/Security").AddChild(sig)
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

func TestSOAPXMLSignatureProfile(t *testing.T) {
	trustedKey, trustedCert := testSigningIdentity(t)
	otherKey, otherCert := testSigningIdentity(t)
	valid := signedSummaryXML(t, trustedKey, trustedCert, false)
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
		{"valid signed Body", valid, true, token, 200, 1},
		{"missing signature", summaryXML(), true, token, 400, 0},
		{"tampered Body", strings.Replace(valid, "AKUN-001</userId>", "AKUN-002</userId>", 1), true, token, 400, 0},
		{"wrong key", signedSummaryXML(t, otherKey, otherCert, false), true, token, 400, 0},
		{"JWT still mandatory", valid, true, "", 401, 0},
		{"wrong reference", signedSummaryXML(t, trustedKey, trustedCert, true), true, token, 400, 0},
		{"duplicate reference ID", strings.Replace(valid, `<soap:Header>`, `<soap:Header><x:Duplicate xmlns:x="urn:other" xmlns:wsu="`+testWSU+`" wsu:Id="body-1"/>`, 1), true, token, 400, 0},
		{"SHA1 downgrade", strings.Replace(valid, rsaSHA256, "http://www.w3.org/2000/09/xmldsig#rsa-sha1", 1), true, token, 400, 0},
	} {
		t.Run(tc.name, func(t *testing.T) {
			svc := &signedSummaryService{}
			handler := NewHandlerWithConfig(svc, "", HandlerConfig{
				JWTSecret: testJWTSecret, RequireXMLSignature: tc.require, TrustedSignatureCert: trustedCert,
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

func TestSOAPXMLSignatureRequiresTrustedCertificate(t *testing.T) {
	key, cert := testSigningIdentity(t)
	token := signedTestJWT(t, map[string]any{
		"sub": "AKUN-001", "role": "UMKM", "exp": time.Now().Add(time.Hour).Unix(),
	}, testJWTSecret, "HS256")
	svc := &signedSummaryService{}
	handler := NewHandlerWithConfig(svc, "", HandlerConfig{JWTSecret: testJWTSecret, RequireXMLSignature: true})
	req := httptest.NewRequest(http.MethodPost, "/partnership", strings.NewReader(signedSummaryXML(t, key, cert, false)))
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
