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
	enabled := host != "" && user != "" && password != "" && from != ""
	return &Sender{
		Host:     host,
		Port:     port,
		User:     user,
		Password: password,
		From:     from,
		Enabled:  enabled,
	}
}

type NotificationData struct {
	To             string
	FullName       string
	Subject        string
	Status         string // APPROVED or REJECTED
	RejectionReason string
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
	auth := smtp.PlainAuth("", s.User, s.Password, s.Host)

	return smtp.SendMail(addr, auth, s.From, []string{data.To}, []byte(msg))
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
