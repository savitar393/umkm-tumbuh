package soap

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"math/big"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func generateTestCert(t *testing.T, commonName string, isCA bool, parent *x509.Certificate, parentKey interface{}) (*x509.Certificate, interface{}, []byte) {
	t.Helper()
	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	now := time.Now().UTC().Truncate(time.Second)

	template := &x509.Certificate{
		SerialNumber: big.NewInt(1),
		Subject:      pkix.Name{CommonName: commonName},
		NotBefore:    now.Add(-time.Hour),
		NotAfter:     now.Add(time.Hour),
		KeyUsage:     x509.KeyUsageDigitalSignature,
	}

	if isCA {
		template.IsCA = true
		template.KeyUsage |= x509.KeyUsageCertSign
		template.BasicConstraintsValid = true
	}

	if parent == nil {
		parent = template
		parentKey = priv
	}

	der, err := x509.CreateCertificate(rand.Reader, template, parent, &priv.PublicKey, parentKey)
	if err != nil {
		t.Fatal(err)
	}

	cert, err := x509.ParseCertificate(der)
	if err != nil {
		t.Fatal(err)
	}

	return cert, priv, der
}

func writeTempCert(t *testing.T, der []byte) string {
	t.Helper()
	path := filepath.Join(t.TempDir(), "cert.pem")
	b := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der})
	if err := os.WriteFile(path, b, 0600); err != nil {
		t.Fatal(err)
	}
	return path
}

func writeTempCerts(t *testing.T, ders ...[]byte) string {
	t.Helper()
	path := filepath.Join(t.TempDir(), "certs.pem")
	f, err := os.Create(path)
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	for _, der := range ders {
		if err := pem.Encode(f, &pem.Block{Type: "CERTIFICATE", Bytes: der}); err != nil {
			t.Fatal(err)
		}
	}
	return path
}

func TestPinnedTrust(t *testing.T) {
	certA, _, derA := generateTestCert(t, "A", false, nil, nil)
	certB, _, _ := generateTestCert(t, "B", false, nil, nil)
	pathA := writeTempCert(t, derA)

	verifier, err := LoadCertificateTrustVerifier("pin", pathA, "", "")
	if err != nil {
		t.Fatal(err)
	}

	if err := verifier.Verify(certA, time.Now()); err != nil {
		t.Fatalf("pinned cert failed: %v", err)
	}
	if err := verifier.Verify(certB, time.Now()); err == nil {
		t.Fatal("pinned cert accepted different cert")
	}
}

func TestCATrust(t *testing.T) {
	rootCert, rootKey, rootDer := generateTestCert(t, "Root", true, nil, nil)
	interCert, interKey, interDer := generateTestCert(t, "Inter", true, rootCert, rootKey)
	leafACert, _, _ := generateTestCert(t, "LeafA", false, interCert, interKey)
	leafBCert, _, _ := generateTestCert(t, "LeafB", false, interCert, interKey)
	unrelatedCert, _, _ := generateTestCert(t, "Unrelated", false, nil, nil)

	rootPath := writeTempCert(t, rootDer)
	interPath := writeTempCert(t, interDer)

	verifier, err := LoadCertificateTrustVerifier("ca", "", rootPath, interPath)
	if err != nil {
		t.Fatal(err)
	}

	now := time.Now()
	if err := verifier.Verify(leafACert, now); err != nil {
		t.Fatalf("CA trust rejected valid leaf A: %v", err)
	}
	if err := verifier.Verify(leafBCert, now); err != nil {
		t.Fatalf("CA trust rejected valid leaf B: %v", err)
	}
	if err := verifier.Verify(unrelatedCert, now); err == nil {
		t.Fatal("CA trust accepted unrelated cert")
	}

	// Missing intermediate
	verifierNoInter, err := LoadCertificateTrustVerifier("ca", "", rootPath, "")
	if err != nil {
		t.Fatal(err)
	}
	if err := verifierNoInter.Verify(leafACert, now); err == nil {
		t.Fatal("CA trust accepted leaf without providing intermediate")
	}

	// Direct root (no intermediate)
	directLeafCert, _, _ := generateTestCert(t, "DirectLeaf", false, rootCert, rootKey)
	if err := verifierNoInter.Verify(directLeafCert, now); err != nil {
		t.Fatalf("CA trust rejected direct root leaf: %v", err)
	}
}
