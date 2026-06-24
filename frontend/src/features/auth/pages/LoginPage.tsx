import { type FormEvent, useState } from "react";
import { ArrowRight, Eye, Lock, Mail } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api";
import { isValidEmail } from "../../../shared/validation/forms";
import {
  clearRefreshToken,
  getPostLoginRoute,
  setAccessToken,
  setCurrentUser,
  setRefreshToken,
} from "../../../shared/auth/currentUser";


const QUICK_LOGIN = {
  admin: {
    email: "admin@example.com",
    password: "admin12345",
    label: "Admin",
  },
  umkm: {
    email: "rizqi.saputra57@mail.com",
    password: "password123",
    label: "UMKM",
  },
  mitra: {
    email: "bahlilmeidiyana255@gmail.com",
    password: "password123",
    label: "Mitra",
  },
} as const;

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function validateLoginForm() {
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

    return "";
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const validationError = validateLoginForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const result = await login({
        email: email.trim().toLowerCase(),
        password,
        remember_me: rememberMe,
      });

      setAccessToken(result.access_token);
      setCurrentUser(result.user);

      if (rememberMe && result.refresh_token) {
        setRefreshToken(result.refresh_token);
        localStorage.setItem("remember_me", "true");
      } else {
        clearRefreshToken();
        localStorage.removeItem("remember_me");
      }

      navigate(getPostLoginRoute(result.user), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  async function quickLogin(account: "admin" | "umkm" | "mitra") {
    setError("");
    setLoading(true);

    try {
      const creds = QUICK_LOGIN[account];
      setEmail(creds.email);
      setPassword(creds.password);

      const result = await login({
        email: creds.email,
        password: creds.password,
      });

      setAccessToken(result.access_token);
      setCurrentUser(result.user);
      clearRefreshToken();
      localStorage.removeItem("remember_me");

      navigate(getPostLoginRoute(result.user), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login cepat gagal");
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
            <p>Platform Pengembangan untuk Pertumbuhan UMKM Indonesia</p>
          </div>

          <form className="auth-glass-card" onSubmit={handleSubmit}>
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
              <span className="auth-label-row">
                Kata Sandi
                <Link to="/forgot-password">Lupa Sandi?</Link>
              </span>

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
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>Ingat saya</span>
            </label>

            {error ? (
              <div className="error-message">
                {error}
                {error.toLowerCase().includes("tidak aktif") && (
                  <div style={{ marginTop: 8 }}>
                    <Link to="/reactivate" style={{ fontSize: 13 }}>
                      Aktifkan kembali akun Anda
                    </Link>
                  </div>
                )}
              </div>
            ) : null}

            <button type="submit" disabled={loading}>
              {loading ? "Memproses..." : "Masuk ke Dashboard"}
              <ArrowRight size={20} />
            </button>
          </form>

          <p className="auth-bottom-link">
            Belum memiliki akun? <Link to="/register">Daftar Sekarang</Link>
          </p>

          <div className="quick-login">
            <p className="quick-login-label">Login Cepat (Development)</p>
            <div className="quick-login-buttons">
              <button
                type="button"
                className="button secondary"
                onClick={() => quickLogin("umkm")}
                disabled={loading}
              >
                Login sebagai UMKM
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => quickLogin("mitra")}
                disabled={loading}
              >
                Login sebagai Mitra
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => quickLogin("admin")}
                disabled={loading}
              >
                Login sebagai Admin
              </button>
            </div>
          </div>

          <footer className="auth-footer-links">
            <span>Bantuan</span>
            <span>•</span>
            <span>Privasi</span>
            <span>•</span>
            <span>Bahasa Indonesia</span>
          </footer>
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
