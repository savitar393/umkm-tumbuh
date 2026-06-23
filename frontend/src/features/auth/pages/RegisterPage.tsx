import { type FormEvent, useState } from "react";
import { ArrowRight, Check, Handshake, HelpCircle, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { register } from "../api";

type RegisterStep = "role" | "account";
type RegisterRole = "UMKM" | "MITRA";

export default function RegisterPage() {
  const [step, setStep] = useState<RegisterStep>("role");
  const [role, setRole] = useState<RegisterRole>("UMKM");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nik, setNik] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function chooseRole(nextRole: RegisterRole) {
    setRole(nextRole);
    setStep("account");
    setError("");
    setMessage("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (password !== passwordConfirmation) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    if (!acceptedTerms) {
      setError("Anda harus menyetujui Syarat & Ketentuan dan Kebijakan Privasi.");
      return;
    }

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
      setPasswordConfirmation("");
      setAcceptedTerms(false);
      setRole("UMKM");
      setStep("role");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registrasi gagal");
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

      <section className={`register-stage register-stage--${step}`}>
        {step === "role" ? (
          <div className="register-role-panel">
            <div className="register-heading-row">
              <img src="/tumbuh.png" alt="UMKM Tumbuh" />
              <div>
                <h1>UMKM Tumbuh</h1>
                <p>Pilih jenis akun untuk memulai perjalanan Anda</p>
              </div>
            </div>

            <StepIndicator activeStep={1} />

            <div className="role-card-grid">
              <button
                type="button"
                className="role-card role-card--active"
                onClick={() => chooseRole("UMKM")}
              >
                <span className="role-icon">
                  <Store size={28} />
                </span>
                <h2>Pelaku UMKM</h2>
                <ul>
                  <li><Check size={16} /> Akses katalog produk digital</li>
                  <li><Check size={16} /> Analisis pertumbuhan bisnis</li>
                  <li><Check size={16} /> Verifikasi profil prioritas</li>
                </ul>
                <strong>
                  Pilih UMKM <ArrowRight size={16} />
                </strong>
              </button>

              <button
                type="button"
                className="role-card"
                onClick={() => chooseRole("MITRA")}
              >
                <span className="role-icon">
                  <Handshake size={28} />
                </span>
                <h2>Mitra</h2>
                <ul>
                  <li><Check size={16} /> Hubungkan pendanaan UMKM</li>
                  <li><Check size={16} /> Kelola kemitraan strategis</li>
                  <li><Check size={16} /> Akses data pasar eksklusif</li>
                </ul>
                <strong>
                  Pilih Mitra <ArrowRight size={16} />
                </strong>
              </button>
            </div>

            <p className="register-bottom-link">
              Sudah memiliki akun? <Link to="/login">Masuk</Link>
            </p>
          </div>
        ) : (
          <div className="register-account-panel">
            <StepIndicator activeStep={2} />

            <h1>Buat Akun</h1>
            <p>Masukkan informasi dasar Anda untuk memulai perjalanan digital UMKM.</p>

            <form className="register-account-form" onSubmit={handleSubmit}>
              <label>
                Nama lengkap
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Masukkan nama sesuai KTP"
                  required
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="contoh@bisnis.com"
                  required
                />
              </label>

              <label>
                Nomor WhatsApp
                <div className="phone-field">
                  <span>+62</span>
                  <input
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    placeholder="812xxxx"
                  />
                </div>
              </label>

              {role === "UMKM" ? (
                <label>
                  NIK
                  <input
                    value={nik}
                    onChange={(event) => setNik(event.target.value)}
                    placeholder="Nomor Induk Kependudukan"
                  />
                </label>
              ) : null}

              <div className="register-two-column">
                <label>
                  Password
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </label>

                <label>
                  Konfirmasi password
                  <input
                    type="password"
                    value={passwordConfirmation}
                    onChange={(event) => setPasswordConfirmation(event.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </label>
              </div>

              <label className="auth-checkbox-row register-terms">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                />
                <span>
                  Saya menyetujui <a href="#">Syarat & Ketentuan</a> serta{" "}
                  <a href="#">Kebijakan Privasi</a> UMKM Tumbuh.
                </span>
              </label>

              {message ? <div className="success-message">{message}</div> : null}
              {error ? <div className="error-message">{error}</div> : null}

              <button type="submit" disabled={loading}>
                {loading ? "Memproses..." : "Lanjutkan"}
              </button>

              <button
                type="button"
                className="register-back-button"
                onClick={() => setStep("role")}
              >
                Kembali
              </button>
            </form>

            <footer>© 2026 UMKM TUMBUH — INDONESIA MAJU MELALUI DIGITALISASI</footer>
          </div>
        )}
      </section>
    </main>
  );
}

function StepIndicator({ activeStep }: { activeStep: number }) {
  const steps = ["Pilih Peran", "Akun", "Detail", "Review"];

  return (
    <div className="register-stepper">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isDone = stepNumber < activeStep;
        const isActive = stepNumber === activeStep;

        return (
          <div className="register-step" key={label}>
            <span className={isActive ? "active" : isDone ? "done" : ""}>
              {isDone ? <Check size={16} /> : stepNumber}
            </span>
            <strong className={isActive ? "active" : ""}>{label}</strong>
            {index < steps.length - 1 ? <i /> : null}
          </div>
        );
      })}
    </div>
  );
}
