import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HelpCircle, Mail } from "lucide-react";
import { requestPasswordReset } from "../api";
import { isValidEmail } from "../../../shared/validation/forms";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [devCode, setDevCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    setDevCode("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      setError("Format email tidak valid.");
      return;
    }

    setLoading(true);

    try {
      const response = await requestPasswordReset(normalizedEmail);
      setMessage(response.message || "Jika email terdaftar, instruksi reset password telah dikirim.");
      setDevCode(response.dev_code ?? "");

      navigate(`/reset-password?email=${encodeURIComponent(normalizedEmail)}`, {
        state: {
          email: normalizedEmail,
          devCode: response.dev_code ?? "",
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal meminta reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="register-page">
      <header className="register-navbar">
        <Link to="/" className="register-brand">
          <img src="/tumbuh.png" alt="UMKM Tumbuh" />
          <span>UMKM Tumbuh</span>
        </Link>

        <nav>
          <a href="#">Tentang Kami</a>
          <a href="#">Program</a>
          <HelpCircle size={24} />
        </nav>
      </header>

      <section className="register-stage register-stage--account">
        <div className="register-account-panel" style={{ maxWidth: 560 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Mail size={48} color="#166534" />
            <h1>Lupa Password</h1>
            <p>Masukkan email akun Anda untuk menerima kode reset password.</p>
          </div>

          <form className="register-account-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@email.com"
                required
              />
            </label>

            {devCode ? (
              <div className="form-alert success">
                Dev mode code: <strong>{devCode}</strong>
              </div>
            ) : null}

            {message ? <div className="success-message">{message}</div> : null}
            {error ? <div className="error-message">{error}</div> : null}

            <button type="submit" disabled={loading}>
              {loading ? "Mengirim..." : "Kirim Kode Reset"}
            </button>

            <Link to="/login" className="register-back-button">
              Kembali ke Login
            </Link>
          </form>

          <footer>© 2026 UMKM TUMBUH — INDONESIA MAJU MELALUI DIGITALISASI</footer>
        </div>
      </section>
    </main>
  );
}