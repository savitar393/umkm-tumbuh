import { type FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin12345");
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
      } else       if (result.user.role === "UMKM") {
        navigate("/umkm/trainings");
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

        <p>
          Belum punya akun? <Link to="/register">Daftar di sini</Link>
        </p>
      </section>
    </main>
  );
}