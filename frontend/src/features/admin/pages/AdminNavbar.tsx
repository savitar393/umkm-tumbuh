import { Link, useNavigate } from "react-router-dom";
import logo from "../../../assets/logo-umkm-tumbuh.png";

type CurrentUser = {
  full_name: string;
  role: string;
};

function getUser(): CurrentUser | null {
  try {
    return JSON.parse(localStorage.getItem("current_user") ?? "null");
  } catch {
    return null;
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function AdminNavbar({ active }: { active?: string }) {
  const navigate = useNavigate();
  const user = getUser();

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("current_user");
    navigate("/login");
  }

  return (
    <nav className="admin-nav">
      <div className="admin-nav-inner">
        {/* Logo */}
        <Link to="/admin" className="nav-logo">
          <img src={logo} alt="UMKM Tumbuh" className="nav-logo-img" />
          <span className="nav-logo-text">UMKM Tumbuh</span>
        </Link>

        {/* Links */}
        <div className="nav-links">
          <Link to="/admin" className={`nav-link${active === "dashboard" ? " active" : ""}`}>
            <span className="nav-link-icon">⊞</span>
            Dashboard Nasional
          </Link>
          <Link to="/admin/pelatihan" className={`nav-link${active === "pelatihan" ? " active" : ""}`}>
            <span className="nav-link-icon">🎓</span>
            Pelatihan
          </Link>
          <Link to="/admin/registrations" className={`nav-link nav-link-pill${active === "registrations" ? " active" : ""}`}>
            <span className="nav-link-icon">👤</span>
            User Management
          </Link>
        </div>

        {/* User */}
        <div className="nav-user" onClick={logout} title="Klik untuk logout">
          <div className="nav-user-info">
            <span className="nav-user-greeting">Halo Admin</span>
            <span className="nav-user-role">Pemerintah</span>
          </div>
          <div className="nav-avatar">
            {getInitials(user?.full_name ?? "Admin")}
          </div>
        </div>
      </div>
    </nav>
  );
}
