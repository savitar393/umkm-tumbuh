import { type FormEvent, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { login, requestReactivation } from "../api";
import { ApiError } from "../../../shared/api/http";

const QUICK_LOGIN = {
  admin: { email: "admin@example.com", password: "admin12345", label: "Admin" },
  mitra: { email: "mitra@example.com", password: "mitra12345", label: "Mitra" },
} as const;

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReactivation, setShowReactivation] = useState(false);
  const [reactivationMsg, setReactivationMsg] = useState("");
  const [reactivationLoading, setReactivationLoading] = useState(false);

  function redirectAfterLogin(role: string) {
    if (returnUrl && !returnUrl.startsWith("/login")) {
      navigate(returnUrl, { replace: true });
      return;
    }
    if (role === "ADMIN") navigate("/admin");
    else if (role === "UMKM") navigate("/umkm");
    else if (role === "MITRA") navigate("/mitra");
    else navigate("/");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login({ email, password });

      localStorage.setItem("access_token", result.access_token);
      localStorage.setItem("current_user", JSON.stringify(result.user));

      redirectAfterLogin(result.user.role);
    } catch (err: unknown) {
      const code = err instanceof ApiError ? err.code : "";
      const msg = err instanceof Error ? err.message : "Login gagal";
      if (code === "ERR-AUTH-03" && msg.toLowerCase().includes("tidak aktif")) {
        setShowReactivation(true);
      }
      setError(msg + (code ? ` (${code})` : ""));
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestReactivation() {
    setReactivationMsg("");
    setReactivationLoading(true);
    try {
      const res = await requestReactivation({ email, password });
      setReactivationMsg(res.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengajukan aktivasi";
      setReactivationMsg(msg);
    } finally {
      setReactivationLoading(false);
    }
  }

  async function quickLogin(account: "admin" | "mitra") {
    const creds = QUICK_LOGIN[account];
    setEmail(creds.email);
    setPassword(creds.password);
    await new Promise((r) => setTimeout(r, 50));
    const result = await login(creds);

    localStorage.setItem("access_token", result.access_token);
    localStorage.setItem("current_user", JSON.stringify(result.user));

    redirectAfterLogin(result.user.role);
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Login UMKM Tumbuh</h1>
        <p>Masuk menggunakan akun yang sudah disetujui admin.</p>

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error && <p className="error-message">{error}</p>}

          {showReactivation && (
            <div className="reactivation-box">
              <p>Akun Anda telah dinonaktifkan. Ajukan aktivasi kembali untuk dapat login.</p>
              {reactivationMsg ? (
                <p className={reactivationMsg.includes("berhasil") ? "success-message" : "error-message"}>
                  {reactivationMsg}
                </p>
              ) : (
                <button
                  type="button"
                  className="button reactivation-btn"
                  onClick={handleRequestReactivation}
                  disabled={reactivationLoading}
                >
                  {reactivationLoading ? "Memproses..." : "Ajukan Aktivasi Kembali"}
                </button>
              )}
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>

        <div className="quick-login">
          <p className="quick-login-label">Login Cepat</p>
          <div className="quick-login-buttons">
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

        <p>
          Belum punya akun? <Link to="/register">Daftar di sini</Link>
        </p>
      </section>
    </main>
  );
}