package certificates

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/jung-kurt/gofpdf"
)

func (s *Service) GenerateCertificatePDF(cert *CertificateResponse) (string, error) {
	if err := os.MkdirAll(s.certDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create cert dir: %w", err)
	}

	pdf := gofpdf.New("L", "mm", "A4", "")
	pdf.SetMargins(20, 20, 20)
	pdf.AddPage()

	w := 257.0

	// Outer border
	pdf.SetDrawColor(25, 35, 110)
	pdf.SetLineWidth(2)
	pdf.Rect(12, 12, 273, 186, "D")

	// Inner border
	pdf.SetDrawColor(200, 170, 110)
	pdf.SetLineWidth(0.5)
	pdf.Rect(16, 16, 265, 178, "D")

	// Top accent line
	pdf.SetDrawColor(200, 170, 110)
	pdf.SetLineWidth(0.3)
	pdf.Line(40, 35, 257, 35)

	// Title
	pdf.SetY(46)
	pdf.SetFont("Arial", "B", 22)
	pdf.SetTextColor(25, 35, 110)
	pdf.CellFormat(w, 12, "SERTIFIKAT KELULUSAN", "", 1, "C", false, 0, "")

	// Subtitle
	pdf.SetFont("Arial", "", 10)
	pdf.SetTextColor(100, 100, 100)
	pdf.CellFormat(w, 6, "Program Pengembangan Kapasitas UMKM", "", 1, "C", false, 0, "")

	// Award text
	pdf.SetY(72)
	pdf.SetFont("Arial", "", 11)
	pdf.SetTextColor(60, 60, 60)
	pdf.CellFormat(w, 7, "Diberikan kepada:", "", 1, "C", false, 0, "")

	// User name
	pdf.SetFont("Arial", "B", 18)
	pdf.SetTextColor(0, 0, 0)
	pdf.CellFormat(w, 12, cert.PelakuNama, "", 1, "C", false, 0, "")

	// Completion text
	pdf.SetFont("Arial", "", 11)
	pdf.SetTextColor(60, 60, 60)
	pdf.CellFormat(w, 7, "Telah menyelesaikan program pelatihan:", "", 1, "C", false, 0, "")

	// Training name
	pdf.SetFont("Arial", "B", 13)
	pdf.SetTextColor(25, 35, 110)
	pdf.CellFormat(w, 10, cert.JudulPelatihan, "", 1, "C", false, 0, "")

	// Details
	pdf.SetY(122)
	pdf.SetFont("Arial", "", 9)
	pdf.SetTextColor(80, 80, 80)
	if cert.NomorSertifikat != nil {
		pdf.CellFormat(w, 6, "Nomor Sertifikat: "+*cert.NomorSertifikat, "", 1, "C", false, 0, "")
	}
	dateStr := ""
	if cert.TanggalTerbit != nil {
		dateStr = cert.TanggalTerbit.Format("2 January 2006")
	}
	pdf.CellFormat(w, 6, "Tanggal Terbit: "+dateStr, "", 1, "C", false, 0, "")

	// Bottom accent line above signatures
	pdf.SetDrawColor(200, 170, 110)
	pdf.SetLineWidth(0.3)
	pdf.Line(40, 139, 257, 139)

	// Signatures at bottom
	leftSigX := 55.0
	rightSigX := 177.0
	sigWidth := 70.0
	sigY := 145.0

	// Left signature line
	pdf.SetDrawColor(50, 50, 50)
	pdf.SetLineWidth(0.5)
	pdf.Line(leftSigX, sigY, leftSigX+sigWidth, sigY)

	// Left signature label
	pdf.SetFont("Arial", "", 10)
	pdf.SetTextColor(50, 50, 50)
	pdf.SetXY(leftSigX, sigY+2)
	pdf.CellFormat(sigWidth, 6, cert.MentorNama, "", 0, "C", false, 0, "")

	pdf.SetFont("Arial", "", 8)
	pdf.SetTextColor(120, 120, 120)
	pdf.SetXY(leftSigX, sigY+8)
	pdf.CellFormat(sigWidth, 5, "Mentor", "", 0, "C", false, 0, "")

	// Right signature line
	pdf.SetDrawColor(50, 50, 50)
	pdf.SetLineWidth(0.5)
	pdf.Line(rightSigX, sigY, rightSigX+sigWidth, sigY)

	// Right signature label
	pdf.SetFont("Arial", "", 10)
	pdf.SetTextColor(50, 50, 50)
	pdf.SetXY(rightSigX, sigY+2)
	pdf.CellFormat(sigWidth, 6, "Rambat Ungu Aryati", "", 0, "C", false, 0, "")

	pdf.SetFont("Arial", "", 8)
	pdf.SetTextColor(120, 120, 120)
	pdf.SetXY(rightSigX, sigY+8)
	pdf.CellFormat(sigWidth, 5, "Direktur UMKM Tumbuh", "", 0, "C", false, 0, "")

	// Generate filename with training name and user name
	safeTitle := sanitizeFilename(cert.JudulPelatihan)
	safeName := sanitizeFilename(cert.PelakuNama)
	fileName := fmt.Sprintf("sertifikat_%s_%s.pdf", safeTitle, safeName)
	filePath := filepath.Join(s.certDir, fileName)

	if err := pdf.OutputFileAndClose(filePath); err != nil {
		return "", fmt.Errorf("failed to save certificate PDF: %w", err)
	}

	return filePath, nil
}

func sanitizeFilename(s string) string {
	s = strings.TrimSpace(s)
	s = strings.ReplaceAll(s, " ", "_")
	s = strings.ReplaceAll(s, "/", "_")
	s = strings.ReplaceAll(s, "\\", "_")
	s = strings.ReplaceAll(s, ":", "_")
	s = strings.ReplaceAll(s, ".", "_")
	s = strings.ReplaceAll(s, ",", "_")
	s = strings.ReplaceAll(s, "\"", "")
	s = strings.ReplaceAll(s, "'", "")
	s = strings.ReplaceAll(s, "?", "")
	s = strings.ReplaceAll(s, "*", "")
	s = strings.ReplaceAll(s, "<", "")
	s = strings.ReplaceAll(s, ">", "")
	s = strings.ReplaceAll(s, "|", "")
	if len(s) > 80 {
		s = s[:80]
	}
	return s
}
