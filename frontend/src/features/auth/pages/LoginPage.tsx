import { type FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api";

const QUICK_LOGIN = {
  admin: { email: "admin@example.com", password: "admin12345", label: "Admin" },
  mitra: { email: "mitra@example.com", password: "mitra12345", label: "Mitra" },
} as const;

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login({ email, password });

      localStorage.setItem("access_token", result.access_token);
      localStorage.setItem("current_user", JSON.stringify(result.user));

      if (result.user.role === "ADMIN") {
        navigate("/admin");
      } else if (result.user.role === "UMKM") {
        navigate("/umkm");
      } else if (result.user.role === "MITRA") {
        navigate("/mitra");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
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

    if (result.user.role === "ADMIN") navigate("/admin");
    else if (result.user.role === "MITRA") navigate("/mitra");
    else navigate("/");
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