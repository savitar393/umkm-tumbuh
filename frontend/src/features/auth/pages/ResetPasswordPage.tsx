import { type FormEvent, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { HelpCircle, KeyRound } from "lucide-react";
import { resetPassword } from "../api";
import { isStrongEnoughPassword, isValidEmail } from "../../../shared/validation/forms";

type ResetPasswordLocationState = {
  email?: string;
  devCode?: string;
};

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const state = (location.state ?? {}) as ResetPasswordLocationState;

  const initialEmail = state.email || searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(state.devCode ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      setError("Format email tidak valid.");
      return;
    }

    if (!code.trim()) {
      setError("Kode reset password wajib diisi.");
      return;
    }

    if (!isStrongEnoughPassword(newPassword)) {
      setError("Password minimal 8 karakter dan disarankan memakai kombinasi huruf dan angka.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword(normalizedEmail, code.trim(), newPassword);
      setMessage(response.message || "Password berhasil direset.");

      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            message: "Password berhasil direset. Silakan login dengan password baru.",
          },
        });
      }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mereset password.");
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
            <KeyRound size={48} color="#166534" />
            <h1>Reset Password</h1>
            <p>Masukkan kode reset dan password baru Anda.</p>
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

            <label>
              Kode reset
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
                placeholder="Masukkan 6 digit kode"
                required
              />
            </label>

            <label>
              Password baru
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Minimal 8 karakter"
                required
              />
            </label>

            <label>
              Konfirmasi password baru
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Ulangi password baru"
                required
              />
            </label>

            {message ? <div className="success-message">{message}</div> : null}
            {error ? <div className="error-message">{error}</div> : null}

            <button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Reset Password"}
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