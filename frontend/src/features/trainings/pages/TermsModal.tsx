import { useState } from "react";
import { Icon } from "@iconify/react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const termsList = [
  {
    icon: "mdi:file-sign",
    text: "Pendaftaran bersifat mengikat dan tidak dapat dibatalkan setelah proses konfirmasi selesai.",
  },
  {
    icon: "mdi:clock-check-outline",
    text: "Kehadiran minimal 90% dari seluruh sesi modul diperlukan untuk memenuhi syarat sertifikasi.",
  },
  {
    icon: "mdi:shield-account-outline",
    text: "Peserta wajib menjaga kerahasiaan materi pelatihan dan tidak mendistribusikan kepada pihak lain.",
  },
  {
    icon: "mdi:account-group-outline",
    text: "Peserta diharapkan bersikap profesional dan saling menghormati selama proses pembelajaran berlangsung.",
  },
  {
    icon: "mdi:laptop-account",
    text: "Akses materi hanya dapat dilakukan melalui akun terdaftar dan tidak dapat dipindahtangankan.",
  },
  {
    icon: "mdi:certificate-outline",
    text: "Sertifikat diberikan setelah peserta menyelesaikan seluruh modul dan lulus evaluasi akhir.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function TermsModal({ isOpen, onClose, onConfirm }: TermsModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  const handleClose = () => {
    setAgreed(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    // ── Backdrop ──────────────────────────────────────────────────────────────
    <div
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        animation: "fadeIn 0.2s ease",
      }}
    >
      {/* ── Modal Panel ───────────────────────────────────────────────────── */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "460px",
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
          overflow: "hidden",
          animation: "slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 24px 20px",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                backgroundColor: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon icon="mdi:file-document-outline" style={{ fontSize: "20px", color: "#2563eb" }} />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: "800",
                  color: "#0f172a",
                  lineHeight: "1.3",
                }}
              >
                Syarat &amp; Ketentuan
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                Baca dengan seksama sebelum mendaftar
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              transition: "background 0.15s, color 0.15s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#f1f5f9";
              (e.currentTarget as HTMLButtonElement).style.color = "#374151";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
            }}
          >
            <Icon icon="mdi:close" style={{ fontSize: "18px" }} />
          </button>
        </div>

        {/* ── Scrollable Terms Body ────────────────────────────────────────── */}
        <div
          style={{
            padding: "16px 24px",
            maxHeight: "280px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {termsList.map((term, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredItem(i)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "12px",
                borderRadius: "12px",
                backgroundColor: hoveredItem === i ? "#eff6ff" : "#f8fafc",
                transition: "background-color 0.15s",
                cursor: "default",
              }}
            >
              {/* Icon box */}
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "8px",
                  backgroundColor: hoveredItem === i ? "#dbeafe" : "#ffffff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: "1px",
                  transition: "background-color 0.15s",
                }}
              >
                <Icon icon={term.icon} style={{ fontSize: "14px", color: "#3b82f6" }} />
              </div>

              <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: "1.6" }}>
                <span style={{ color: "#94a3b8", fontWeight: "600", marginRight: "4px" }}>
                  {i + 1}.
                </span>
                {term.text}
              </p>
            </div>
          ))}
        </div>

        {/* ── Footer: Checkbox + CTA ───────────────────────────────────────── */}
        <div
          style={{
            padding: "16px 24px 24px",
            borderTop: "1px solid #f1f5f9",
          }}
        >
          {/* Checkbox */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "16px",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            {/* Custom checkbox */}
            <div
              onClick={() => setAgreed(!agreed)}
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "6px",
                border: agreed ? "2px solid #2563eb" : "2px solid #cbd5e1",
                backgroundColor: agreed ? "#2563eb" : "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {agreed && (
                <Icon icon="mdi:check" style={{ fontSize: "13px", color: "#ffffff" }} />
              )}
            </div>
            <span style={{ fontSize: "13px", color: "#475569", lineHeight: "1.5" }}>
              Saya telah membaca dan menyetujui syarat &amp; ketentuan yang berlaku
            </span>
          </label>

          {/* Confirm Button */}
          <button
            disabled={!agreed}
            onClick={onConfirm}
            style={{
              width: "100%",
              padding: "13px 24px",
              borderRadius: "12px",
              border: "none",
              fontSize: "14px",
              fontWeight: "700",
              cursor: agreed ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s",
              background: agreed
                ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"
                : "#e2e8f0",
              color: agreed ? "#ffffff" : "#94a3b8",
              boxShadow: agreed ? "0 4px 14px rgba(37,99,235,0.35)" : "none",
              transform: "translateY(0)",
            }}
            onMouseEnter={(e) => {
              if (agreed) {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(37,99,235,0.45)";
              }
            }}
            onMouseLeave={(e) => {
              if (agreed) {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 14px rgba(37,99,235,0.35)";
              }
            }}
          >
            <Icon icon="mdi:account-plus-outline" style={{ fontSize: "16px" }} />
            Daftar Sekarang
          </button>
        </div>
      </div>

      {/* ── Keyframe animations via style tag ─────────────────────────────── */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: scale(0.92) translateY(20px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </div>
  );
}