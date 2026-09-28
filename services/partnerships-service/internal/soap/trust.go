package soap

import (
	"crypto/x509"
	"encoding/pem"
	"errors"
	"os"
	"time"
)

// CertificateTrustVerifier validates a certificate against a configured trust model.
type CertificateTrustVerifier interface {
	Verify(leaf *x509.Certificate, now time.Time) error
}

type pinnedCertificateVerifier struct {
	pinned *x509.Certificate
}

func (p *pinnedCertificateVerifier) Verify(leaf *x509.Certificate, now time.Time) error {
	if !leaf.Equal(p.pinned) {
		return errors.New("certificate does not exactly match the pinned trusted certificate")
	}
	return nil
}

type caCertificateVerifier struct {
	roots         *x509.CertPool
	intermediates *x509.CertPool
}

func (c *caCertificateVerifier) Verify(leaf *x509.Certificate, now time.Time) error {
	opts := x509.VerifyOptions{
		Roots:         c.roots,
		Intermediates: c.intermediates,
		CurrentTime:   now,
		KeyUsages:     []x509.ExtKeyUsage{x509.ExtKeyUsageAny},
	}
	// Note: We leave DNSName empty as this is for XML message signing, not TLS.

	_, err := leaf.Verify(opts)
	if err != nil {
		return err
	}

	// The leaf signing certificate must contain an RSA public key since the XMLDSig profile is RSA-SHA256.
	if leaf.PublicKeyAlgorithm != x509.RSA {
		return errors.New("leaf certificate does not contain an RSA public key")
	}

	return nil
}

// LoadCertificateTrustVerifier loads the appropriate trust verifier based on mode.
func LoadCertificateTrustVerifier(mode, pinnedFile, caFile, intermediatesFile string) (CertificateTrustVerifier, error) {
	if mode == "pin" {
		if pinnedFile == "" {
			return nil, errors.New("pinned trust mode requires a certificate file")
		}
		cert, err := LoadTrustedSignatureCertificate(pinnedFile)
		if err != nil {
			return nil, err
		}
		return &pinnedCertificateVerifier{pinned: cert}, nil
	}

	if mode == "ca" {
		if caFile == "" {
			return nil, errors.New("ca trust mode requires a root CA file")
		}
		roots, err := loadCertPool(caFile)
		if err != nil {
			return nil, err
		}

		var intermediates *x509.CertPool
		if intermediatesFile != "" {
			intermediates, err = loadCertPool(intermediatesFile)
			if err != nil {
				return nil, err
			}
		} else {
			intermediates = x509.NewCertPool()
		}

		return &caCertificateVerifier{
			roots:         roots,
			intermediates: intermediates,
		}, nil
	}

	return nil, errors.New("unrecognized trust mode: " + mode)
}

func loadCertPool(path string) (*x509.CertPool, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	pool := x509.NewCertPool()
	added := false
	for len(data) > 0 {
		var block *pem.Block
		block, data = pem.Decode(data)
		if block == nil {
			break
		}
		if block.Type != "CERTIFICATE" {
			continue
		}
		cert, err := x509.ParseCertificate(block.Bytes)
		if err != nil {
			return nil, err
		}
		pool.AddCert(cert)
		added = true
	}
	if !added {
		return nil, errors.New("no valid CERTIFICATE blocks found in " + path)
	}
	return pool, nil
}
