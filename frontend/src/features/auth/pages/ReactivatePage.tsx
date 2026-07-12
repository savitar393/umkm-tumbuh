import { type FormEvent, useState } from "react";
import { ArrowRight, Eye, Lock, Mail, Check } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { reactivate } from "../api";
import { isValidEmail } from "../../../shared/validation/forms";

export default function ReactivatePage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function validateReactivateForm() {
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      return "Email wajib diisi.";
    }

    if (!isValidEmail(cleanEmail)) {
      return "Format email tidak valid.";
    }

    if (!password) {
      return "Kata sandi wajib diisi.";
    }

    if (!verified) {
      return "Harap centang verifikasi untuk melanjutkan.";
    }

    return "";
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const validationError = validateReactivateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const result = await reactivate({
        email: email.trim().toLowerCase(),
        password,
      });

      localStorage.setItem("access_token", result.access_token);
      localStorage.setItem("current_user", JSON.stringify(result.user));

      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reaktivasi gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-split-page">
      <section className="auth-split-left">
        <div className="auth-login-wrap">
          <div className="auth-logo-stack">
            <img src="/tumbuh.png" alt="UMKM Tumbuh" />
            <h1>UMKM Tumbuh</h1>
            <p>Aktifkan Kembali Akun Anda</p>
          </div>

          <form className="auth-glass-card" onSubmit={handleSubmit}>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16, textAlign: "center" }}>
              Akun Anda saat ini tidak aktif. Masukkan email dan password untuk mengaktifkan kembali.
            </p>

            <label>
              Alamat Email
              <div className="auth-input-shell">
                <Mail size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nama@usaha.com"
                  required
                />
              </div>
            </label>

            <label>
              Kata Sandi
              <div className="auth-input-shell">
                <Lock size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="auth-icon-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label="Tampilkan kata sandi"
                >
                  <Eye size={20} />
                </button>
              </div>
            </label>

            <label className="auth-checkbox-row">
              <input
                type="checkbox"
                checked={verified}
                onChange={(event) => setVerified(event.target.checked)}
              />
              <span>Saya menyadari bahwa akun saya akan diaktifkan kembali</span>
              <Check size={16} style={{ opacity: verified ? 1 : 0, marginLeft: "auto", color: "#16a34a" }} />
            </label>

            {error ? <div className="error-message">{error}</div> : null}

            <button type="submit" disabled={loading}>
              {loading ? "Memproses..." : "Aktifkan Kembali Akun"}
              <ArrowRight size={20} />
            </button>
          </form>

          <p className="auth-bottom-link">
            <Link to="/login">Kembali ke Login</Link>
          </p>
        </div>
      </section>

      <section className="auth-split-right">
        <div className="auth-quote">
          <div className="auth-quote-line" />
          <blockquote>
            "UMKM Tumbuh telah membantu toko kerajinan kami beralih ke digital
            dengan kemudahan yang luar biasa."
          </blockquote>
          <p>— Siti Rahma, Pemilik Galeri Karsa</p>
        </div>
      </section>
    </main>
  );
}
