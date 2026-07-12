import { CheckCircle2, ClipboardList, Handshake, Home, Send } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import UmkmLayout from "../../umkm/components/UmkmLayout";
import { getCurrentUser } from "../../../shared/auth/currentUser";

export default function PartnershipSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const user = getCurrentUser();

  const basePath = user?.role === "MITRA" ? "/mitra/partnerships" : "/umkm/partnerships";
  const dashboardPath = user?.role === "MITRA" ? "/mitra" : "/umkm";

  const state = location.state as { pengajuanID?: string } | null;
  const pengajuanID = state?.pengajuanID || searchParams.get("id") || "";

  return (
    <UmkmLayout
      title="Pengajuan Kemitraan"
      subtitle="Pengajuan berhasil dikirim dan sedang menunggu proses review."
    >
      <main className="partnership-success-page">
        <section className="partnership-success-card">
          <div className="partnership-success-icon">
            <CheckCircle2 size={46} />
          </div>

          <span className="partnership-eyebrow">
            <Send size={16} />
            Pengajuan Terkirim
          </span>

          <h1>Pengajuan Berhasil Dikirim</h1>

          <p>
            Pengajuan kemitraan Anda sudah masuk ke sistem dan akan ditinjau oleh pihak tujuan.
            Anda dapat memantau progresnya melalui halaman status pengajuan.
          </p>

          {pengajuanID ? (
            <div className="partnership-success-reference">
              <span>ID Pengajuan</span>
              <strong>{pengajuanID}</strong>
            </div>
          ) : null}

          <div className="partnership-success-steps">
            <article className="done">
              <CheckCircle2 size={18} />
              <div>
                <strong>Pengajuan dikirim</strong>
                <span>Formulir dan dokumen berhasil diterima.</span>
              </div>
            </article>

            <article>
              <ClipboardList size={18} />
              <div>
                <strong>Menunggu review</strong>
                <span>Pihak tujuan akan memeriksa detail pengajuan.</span>
              </div>
            </article>

            <article>
              <Handshake size={18} />
              <div>
                <strong>Keputusan kemitraan</strong>
                <span>Pengajuan akan diterima, ditolak, atau diminta revisi.</span>
              </div>
            </article>
          </div>

          <div className="partnership-success-actions">
            <button type="button" onClick={() => navigate(`${basePath}/status`)}>
              <ClipboardList size={17} />
              Lihat Status Pengajuan
            </button>

            <button className="umkm-secondary-btn" type="button" onClick={() => navigate(dashboardPath)}>
              <Home size={17} />
              Kembali ke Dashboard
            </button>
          </div>
        </section>
      </main>
    </UmkmLayout>
  );
}
