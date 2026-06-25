package email

import (
	"fmt"
	"log"
	"net/smtp"
	"strings"
)

type Sender struct {
	Host     string
	Port     string
	User     string
	Password string
	From     string
	Enabled  bool
}

func NewSender(host, port, user, password, from string) *Sender {
	enabled := host != "" && port != "" && from != ""

	return &Sender{
		Host:     host,
		Port:     port,
		User:     user,
		Password: password,
		From:     from,
		Enabled:  enabled,
	}
}

func (s *Sender) smtpAuth() smtp.Auth {
	if s.User == "" || s.Password == "" {
		return nil
	}

	return smtp.PlainAuth("", s.User, s.Password, s.Host)
}

type NotificationData struct {
	To              string
	FullName        string
	Subject         string
	Status          string // APPROVED or REJECTED
	RejectionReason string
}

type CodeEmailData struct {
	To       string
	FullName string
	Subject  string
	Code     string
	Purpose  string
}

func (s *Sender) SendRegistrationNotification(data NotificationData) error {
	if !s.Enabled {
		log.Printf("[EMAIL][SKIPPED] SMTP not configured. Would send to %s about %s", data.To, data.Status)
		return nil
	}

	var body string
	switch data.Status {
	case "APPROVED":
		body = s.buildApprovedBody(data.FullName)
	case "REJECTED":
		body = s.buildRejectedBody(data.FullName, data.RejectionReason)
	default:
		body = s.buildApprovedBody(data.FullName)
	}

	msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=\"UTF-8\"\r\n\r\n%s",
		s.From, data.To, data.Subject, body)

	addr := fmt.Sprintf("%s:%s", s.Host, s.Port)

	return smtp.SendMail(addr, s.smtpAuth(), s.From, []string{data.To}, []byte(msg))
}

func (s *Sender) SendCodeEmail(data CodeEmailData) error {
	if !s.Enabled {
		log.Printf("[EMAIL][SKIPPED] SMTP not configured. Would send %s code to %s: %s", data.Purpose, data.To, data.Code)
		return nil
	}

	body := s.buildCodeBody(data.FullName, data.Code, data.Purpose)

	msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=\"UTF-8\"\r\n\r\n%s",
		s.From, data.To, data.Subject, body)

	addr := fmt.Sprintf("%s:%s", s.Host, s.Port)

	return smtp.SendMail(addr, s.smtpAuth(), s.From, []string{data.To}, []byte(msg))
}

func (s *Sender) buildApprovedBody(name string) string {
	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
	<h2>Selamat, Pendaftaran Anda Disetujui!</h2>
	<p>Halo <strong>%s</strong>,</p>
	<p>Pendaftaran akun Anda di platform <strong>UMKM Tumbuh</strong> telah disetujui oleh Pemerintah/Admin.</p>
	<p>Anda sekarang dapat masuk ke akun Anda dan mulai menggunakan platform.</p>
	<br>
	<p>Salam,<br>Tim UMKM Tumbuh</p>
</body>
</html>
`, name)
}

func (s *Sender) buildRejectedBody(name, reason string) string {
	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
	<h2>Pendaftaran Belum Disetujui</h2>
	<p>Halo <strong>%s</strong>,</p>
	<p>Pendaftaran akun Anda di platform <strong>UMKM Tumbuh</strong> belum dapat disetujui.</p>
	<p><strong>Alasan:</strong> %s</p>
	<p>Silakan perbaiki data dan daftar kembali.</p>
	<br>
	<p>Salam,<br>Tim UMKM Tumbuh</p>
</body>
</html>
`, name, strings.ReplaceAll(reason, "\n", "<br>"))
}

func (s *Sender) buildCodeBody(name, code, purpose string) string {
	title := "Kode Verifikasi UMKM Tumbuh"
	description := "Gunakan kode berikut untuk memverifikasi email Anda."

	if purpose == "PASSWORD_RESET" {
		title = "Kode Reset Password UMKM Tumbuh"
		description = "Gunakan kode berikut untuk mereset password akun Anda."
	}

	if strings.TrimSpace(name) == "" {
		name = "Pengguna"
	}

	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px; color: #0f172a;">
	<h2>%s</h2>
	<p>Halo <strong>%s</strong>,</p>
	<p>%s</p>
	<div style="font-size: 28px; font-weight: 700; letter-spacing: 8px; margin: 24px 0; padding: 16px; background: #f1f5f9; border-radius: 12px; text-align: center;">
		%s
	</div>
	<p>Kode ini berlaku selama 15 menit. Abaikan email ini jika Anda tidak meminta kode tersebut.</p>
	<br>
	<p>Salam,<br>Tim UMKM Tumbuh</p>
</body>
</html>
`, title, name, description, code)
}
