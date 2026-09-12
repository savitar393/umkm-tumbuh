package certificates

import (
	"bytes"
	"os"
	"testing"
)

func TestCertificatesWithIdenticalNamesDoNotOverwriteEachOther(t *testing.T) {
	s := &Service{certDir: t.TempDir()}
	first := &CertificateResponse{SertifikatID: 11, PelakuNama: "Nama Sama", JudulPelatihan: "Pelatihan Sama"}
	second := &CertificateResponse{SertifikatID: 12, PelakuNama: first.PelakuNama, JudulPelatihan: first.JudulPelatihan}
	firstPath, err := s.GenerateCertificatePDF(first)
	if err != nil {
		t.Fatal(err)
	}
	before, err := os.ReadFile(firstPath)
	if err != nil {
		t.Fatal(err)
	}
	secondPath, err := s.GenerateCertificatePDF(second)
	if err != nil {
		t.Fatal(err)
	}
	if firstPath == secondPath {
		t.Fatal("different certificates share a file")
	}
	after, err := os.ReadFile(firstPath)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(before, after) {
		t.Fatal("creating another certificate changed the first file")
	}
}
