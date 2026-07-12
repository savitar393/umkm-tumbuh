import { type FormEvent, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, HelpCircle, Mail } from "lucide-react";
import { confirmEmailVerification, requestEmailVerification } from "../api";
import { getCurrentUser } from "../../../shared/auth/currentUser";

type VerifyLocationState = {
  email?: string;
  role?: "UMKM" | "MITRA";
  devCode?: string;
};

export default function RegisterVerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentUser = getCurrentUser();

  const state = (location.state ?? {}) as VerifyLocationState;

  const emailFromUrl = searchParams.get("email") ?? "";
  const roleFromUrl = searchParams.get("role")?.toUpperCase();

  const email = state.email || emailFromUrl || currentUser?.email || "";
  const role =
    state.role ||
    (roleFromUrl === "MITRA" ? "MITRA" : roleFromUrl === "UMKM" ? "UMKM" : currentUser?.role);

  const nextPath = useMemo(() => {
    return role === "MITRA" ? "/register/mitra/details" : "/register/umkm/details";
  }, [role]);

  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState(state.devCode ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  if (!email || !role || role === "ADMIN") {
    return <Navigate to="/register" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!code.trim()) {
      setError("Kode verifikasi wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const response = await confirmEmailVerification(email, code.trim());
      setMessage(response.message || "Email berhasil diverifikasi.");

      navigate(nextPath, {
        replace: true,
        state: {
          message: "Email berhasil diverifikasi. Silakan lengkapi data profil.",
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verifikasi email gagal.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    setMessage("");
    setError("");
    setResending(true);

    try {
      const response = await requestEmailVerification(email);
      setDevCode(response.dev_code ?? "");
      setMessage(response.message || "Kode verifikasi baru berhasil dikirim.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim ulang kode.");
    } finally {
      setResending(false);
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
        <div className="register-account-panel">
          <div className="register-stepper">
            {["Pilih Peran", "Akun", "Verifikasi", "Detail", "Review"].map((label, index) => {
              const stepNumber = index + 1;
              const isActive = stepNumber === 3;
              const isDone = stepNumber < 3;

              return (
                <div className="register-step" key={label}>
                  <span className={isActive ? "active" : isDone ? "done" : ""}>
                    {isDone ? <CheckCircle size={16} /> : stepNumber}
                  </span>
                  <strong className={isActive ? "active" : ""}>{label}</strong>
                  {index < 4 ? <i /> : null}
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Mail size={48} color="#166534" />
            <h1>Verifikasi Email</h1>
            <p>
              Masukkan kode verifikasi yang dikirim ke <strong>{email}</strong>.
            </p>
          </div>

          {devCode ? (
            <div className="form-alert success" style={{ marginBottom: 18 }}>
              Dev mode code: <strong>{devCode}</strong>
            </div>
          ) : null}

          <form className="register-account-form" onSubmit={handleSubmit}>
            <label>
              Kode verifikasi
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
                placeholder="Masukkan 6 digit kode"
                required
              />
            </label>

            {message ? <div className="success-message">{message}</div> : null}
            {error ? <div className="error-message">{error}</div> : null}

            <button type="submit" disabled={loading}>
              {loading ? "Memverifikasi..." : "Verifikasi Email"}
            </button>

            <button
              type="button"
              className="register-back-button"
              disabled={resending}
              onClick={handleResendCode}
            >
              {resending ? "Mengirim ulang..." : "Kirim Ulang Kode"}
            </button>
          </form>

          <footer>© 2026 UMKM TUMBUH — INDONESIA MAJU MELALUI DIGITALISASI</footer>
        </div>
      </section>
    </main>
  );
}
