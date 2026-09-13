import {
  CheckCircle2,
  ClipboardList,
  Handshake,
  Home,
  Inbox,
  ShieldCheck,
} from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import UmkmLayout from "../../umkm/components/UmkmLayout";
import { getCurrentUser } from "../../../shared/auth/currentUser";

export default function PartnershipApprovalSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const user = getCurrentUser();

  const isMitra = location.pathname.includes("/mitra/") || user?.role === "MITRA";
  const partnershipBasePath = isMitra ? "/mitra/partnerships" : "/umkm/partnerships";
  const dashboardPath = isMitra ? "/mitra" : "/umkm";
  const inboxPath = isMitra ? `${partnershipBasePath}/inbox` : `${partnershipBasePath}/incoming`;

  const state = location.state as { pengajuanID?: string } | null;
  const pengajuanID = state?.pengajuanID || searchParams.get("id") || "";

  return (
    <UmkmLayout
      title="Kemitraan Disetujui"
      subtitle="Pengajuan telah disetujui dan status kemitraan telah diperbarui."
    >
      <main className="partnership-approval-success-page">
        <section className="partnership-approval-success-card">
          <div className="partnership-approval-success-icon">
            <CheckCircle2 size={48} />
          </div>

          <span className="partnership-eyebrow">
            <ShieldCheck size={16} />
            Persetujuan Selesai
          </span>

          <h1>Kemitraan Berhasil Disetujui</h1>

          <p>
            Pengajuan kemitraan telah disetujui. Status kerja sama kini aktif.
            Buka detail pengajuan untuk melihat informasi kemitraan dan kontrak yang tersedia.
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
                <strong>Review selesai</strong>
                <span>Pengajuan sudah ditinjau oleh pihak penerima.</span>
              </div>
            </article>

            <article className="done">
              <Handshake size={18} />
              <div>
                <strong>Kemitraan aktif</strong>
                <span>Kerja sama dapat dipantau dari halaman status/inbox.</span>
              </div>
            </article>
          </div>

          <div className="partnership-success-actions">
            {pengajuanID ? (
              <button type="button" onClick={() => navigate(`${partnershipBasePath}/review/${pengajuanID}`)}>
                Lihat Detail Pengajuan
              </button>
            ) : null}
            <button type="button" onClick={() => navigate(inboxPath)}>
              <Inbox size={17} />
              Kembali ke Inbox
            </button>

            <button className="umkm-secondary-btn" type="button" onClick={() => navigate(`${partnershipBasePath}/status`)}>
              <ClipboardList size={17} />
              Lihat Status
            </button>

            <button className="umkm-secondary-btn" type="button" onClick={() => navigate(dashboardPath)}>
              <Home size={17} />
              Dashboard
            </button>
          </div>
        </section>
      </main>
    </UmkmLayout>
  );
}
