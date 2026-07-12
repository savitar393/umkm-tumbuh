import AdminLayout from "../components/AdminLayout";
import "./admin.css";

export default function AdminUsersPage() {
  return (
    <AdminLayout>
      <div className="adm-page">
        <div className="adm-body">
          <div className="adm-hero">
            <div>
              <h1 className="adm-hero-title">
                Manajemen <span className="accent">Akun</span>
              </h1>
              <p className="adm-hero-sub">
                Kelola akun pengguna yang sudah terdaftar, termasuk status aktif, nonaktif, dan suspend.
              </p>
            </div>
          </div>

          <div className="table-card">
            <div className="table-card-head">
              <div>
                <h2 className="table-card-title">Daftar Akun Pengguna</h2>
                <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 14 }}>
                  Halaman ini akan dipakai untuk deactivate/reactivate akun existing. Validasi pendaftaran sudah dipindahkan ke menu Validasi Pendaftaran.
                </p>
              </div>
            </div>

            <div style={{ padding: "40px 24px", color: "#94a3b8", fontWeight: 700 }}>
              🚧 Manajemen akun existing akan dipoles setelah flow validasi pendaftaran stabil.
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
