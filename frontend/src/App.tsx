import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import "./App.css";

function getCurrentUser() {
  const rawUser = localStorage.getItem("current_user");
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

function HomePage() {
  return (
    <main className="home-page">
      <section className="hero-card">
        <h1>UMKM Tumbuh</h1>
        <p>Platform pengembangan UMKM berbasis pelatihan, kemitraan, dan monitoring usaha.</p>

        <div className="button-row">
          <Link className="button" to="/login">Login</Link>
          <Link className="button secondary" to="/register">Daftar</Link>
        </div>
      </section>
    </main>
  );
}

function DashboardPage({ title }: { title: string }) {
  const navigate = useNavigate();
  const user = getCurrentUser();

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("current_user");
    navigate("/login");
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-card">
        <h1>{title}</h1>
        <p>Login sebagai: {user.full_name}</p>
        <p>Role: {user.role}</p>
        <p>Status: {user.status}</p>

        <button onClick={logout}>Logout</button>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin" element={<DashboardPage title="Dashboard Admin" />} />
      <Route path="/umkm" element={<DashboardPage title="Dashboard UMKM" />} />
      <Route path="/mitra" element={<DashboardPage title="Dashboard Mitra" />} />
    </Routes>
  );
}