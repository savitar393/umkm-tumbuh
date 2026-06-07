import { Link, Navigate, useNavigate } from "react-router-dom";
import { clearAuthStorage, getCurrentUser } from "../../../shared/auth/currentUser";

type RoleDashboardPageProps = {
  title: string;
};

export default function RoleDashboardPage({ title }: RoleDashboardPageProps) {
  const navigate = useNavigate();
  const user = getCurrentUser();

  function logout() {
    clearAuthStorage();
    navigate("/login");
  }

  if (!user) return <Navigate to="/login" replace />;

  const profilePath = user.role === "UMKM" ? "/umkm/profile" : "/mitra/profile";

  return (
    <main className="dashboard-page">
      <section className="dashboard-card">
        <h1>{title}</h1>
        <p>Login sebagai: {user.full_name}</p>
        <p>Role: {user.role}</p>
        <p>Status: {user.status}</p>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link to={profilePath}>Kelola Profil</Link>
          <button onClick={logout}>Logout</button>
        </div>
      </section>
    </main>
  );
}
