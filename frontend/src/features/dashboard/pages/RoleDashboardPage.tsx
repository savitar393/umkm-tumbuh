import { Link, Navigate } from "react-router-dom";
import UmkmLayout from "../../umkm/components/UmkmLayout";
import { getCurrentUser } from "../../../shared/auth/currentUser";

type RoleDashboardPageProps = {
  title: string;
};

export default function RoleDashboardPage({ title }: RoleDashboardPageProps) {
  const user = getCurrentUser();

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "UMKM") {
    return (
      <UmkmLayout
        title={title}
        subtitle="Pantau profil, pelatihan, dan pengajuan kemitraan UMKM Anda."
      >
        <div className="umkm-dashboard-grid">
          <section className="umkm-panel">
            <h2>Selamat datang, {user.full_name}</h2>
            <p>Lengkapi dan perbarui informasi UMKM agar profil lebih dipercaya oleh mitra.</p>
            <Link className="umkm-primary-link" to="/umkm/profile">
              Kelola Profil UMKM
            </Link>
          </section>

          <section className="umkm-panel">
            <h2>Status Akun</h2>
            <p>Role: {user.role}</p>
            <p>Status: {user.status}</p>
          </section>
        </div>
      </UmkmLayout>
    );
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-card">
        <h1>{title}</h1>
        <p>Login sebagai: {user.full_name}</p>
        <p>Role: {user.role}</p>
        <p>Status: {user.status}</p>
      </section>
    </main>
  );
}
