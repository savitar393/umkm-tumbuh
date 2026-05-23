import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { register } from "../api";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nik, setNik] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"UMKM" | "MITRA">("UMKM");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const result = await register({
        full_name: fullName,
        email,
        phone_number: phoneNumber,
        nik,
        password,
        role,
      });

      setMessage(result.message);
      setFullName("");
      setEmail("");
      setPhoneNumber("");
      setNik("");
      setPassword("");
      setRole("UMKM");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Registrasi Akun</h1>
        <p>Akun baru akan berstatus pending sampai disetujui admin.</p>

        <form onSubmit={handleSubmit}>
          <label>Nama Lengkap</label>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />

          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label>Nomor HP</label>
          <input
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
          />

          <label>NIK</label>
          <input value={nik} onChange={(event) => setNik(event.target.value)} />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <label>Role</label>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as "UMKM" | "MITRA")}
          >
            <option value="UMKM">UMKM</option>
            <option value="MITRA">Mitra</option>
          </select>

          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Memproses..." : "Daftar"}
          </button>
        </form>

        <p>
          Sudah punya akun? <Link to="/login">Login di sini</Link>
        </p>
      </section>
    </main>
  );
}