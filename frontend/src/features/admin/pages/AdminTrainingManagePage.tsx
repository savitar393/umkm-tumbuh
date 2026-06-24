import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, MoreVertical, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "../components/AdminLayout";
import {
  getAdminTrainings,
  getTrainingStats,
  deleteTraining,
  updateTrainingStatus,
  type AdminTrainingItem,
} from "../api";

type StatusFilterType = "ALL" | "PUBLISHED" | "DRAFT" | "ARCHIVED" | "ONGOING";

const STATUS_OPTIONS: { value: StatusFilterType; label: string; color: string }[] = [
  { value: "ALL", label: "Semua Status", color: "#6b7280" },
  { value: "PUBLISHED", label: "Published", color: "#10b981" },
  { value: "DRAFT", label: "Draft", color: "#f59e0b" },
  { value: "ONGOING", label: "Ongoing", color: "#3b82f6" },
  { value: "ARCHIVED", label: "Archived", color: "#6b7280" },
];

const JENIS_PELATIHAN_OPTIONS = [
  { value: "JP01", label: "Kelas Proyek" },
  { value: "JP02", label: "Kelas Proyek" },
  { value: "JP03", label: "Praktis" },
  { value: "JP04", label: "Terapan" },
  { value: "JP05", label: "Terapan" },
  { value: "JP06", label: "Kelas Proyek" },
  { value: "JP07", label: "Intensif" },
  { value: "JP08", label: "Pemula" },
  { value: "JP09", label: "Mandiri" },
];

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
    PUBLISHED: { bg: "#ecfdf5", color: "#059669", label: "Published" },
    DRAFT: { bg: "#fef3c7", color: "#d97706", label: "Draft" },
    ONGOING: { bg: "#dbeafe", color: "#2563eb", label: "Ongoing" },
    ARCHIVED: { bg: "#f3f4f6", color: "#6b7280", label: "Archived" },
    SCHEDULED: { bg: "#e0e7ff", color: "#6366f1", label: "Scheduled" },
    COMPLETED: { bg: "#dcfce7", color: "#16a34a", label: "Completed" },
  };

  const config = statusConfig[status] || { bg: "#f3f4f6", color: "#6b7280", label: status };

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 12px", borderRadius: 20,
      background: config.bg, color: config.color,
      fontSize: 12, fontWeight: 700, textTransform: "uppercase",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: config.color }} />
      {config.label}
    </span>
  );
}

export default function AdminTrainingManagePage() {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("ALL");
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch training stats
  const { data: statsData } = useQuery({
    queryKey: ["admin", "training-stats"],
    queryFn: getTrainingStats,
    staleTime: 60 * 1000,
  });

  const stats = statsData || {
    total_trainings: 0,
    published_count: 0,
    draft_count: 0,
    archived_count: 0,
  };

  // Fetch trainings list
  const { data: trainingsData, isLoading } = useQuery({
    queryKey: ["admin", "trainings", statusFilter, searchText, page],
    queryFn: () => getAdminTrainings({
      status: statusFilter === "ALL" ? "" : statusFilter,
      search: searchText,
      page,
      limit: 10,
    }),
    staleTime: 30 * 1000,
  });

  const trainings = trainingsData?.trainings || [];
  const pagination = trainingsData?.pagination || { page: 1, limit: 10, total: 0, total_pages: 0 };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteTraining,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "trainings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "training-stats"] });
      toast.success("Pelatihan berhasil dihapus");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menghapus pelatihan");
    },
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateTrainingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "trainings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "training-stats"] });
      toast.success("Status pelatihan berhasil diperbarui");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal mengupdate status");
    },
  });

  const handleDelete = (training: AdminTrainingItem) => {
    if (confirm(`Apakah Anda yakin ingin menghapus pelatihan "${training.judul_pelatihan}"?`)) {
      deleteMutation.mutate(training.pelatihan_id);
    }
  };

  const handlePublish = (training: AdminTrainingItem) => {
    statusMutation.mutate({
      id: training.pelatihan_id,
      status: "PUBLISHED",
    });
  };

  const handleArchive = (training: AdminTrainingItem) => {
    statusMutation.mutate({
      id: training.pelatihan_id,
      status: "ARCHIVED",
    });
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.2 }}>
            Manage Courses
          </h1>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => navigate("/admin/training")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 20px", borderRadius: 12,
                background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
                color: "#fff", fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Dashboard Pelatihan
            </button>
            <button
              onClick={() => navigate("/admin/training/certificates")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 20px", borderRadius: 12,
                background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
                color: "#fff", fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Verifikasi Sertifikat
            </button>
            <button
              onClick={() => navigate("/admin/training/new")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 20px", borderRadius: 12,
                background: "#fff", border: "none",
                color: "#1f45b6", fontSize: 14, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              <Plus size={18} />
              Buat Pelatihan Baru
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards + Featured Course */}
      <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: 24, marginBottom: 32 }}>
        {/* Left: Stats */}
        <div style={{
          background: "rgba(15,23,42,0.8)", borderRadius: 20,
          padding: 32, border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
            TOTAL ACTIVE CONTENT
          </div>
          <div style={{ fontSize: 48, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
            {stats.total_trainings} Courses
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 24, lineHeight: 1.6 }}>
            Your curriculum is growing! You've published 4 new modules this month across 3 distinct categories.
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "8px 16px", borderRadius: 10,
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
            color: "#fff", fontSize: 13, fontWeight: 600,
          }}>
            <CheckCircle size={16} />
            {stats.published_count} Published
          </div>
        </div>

        {/* Right: Featured Course */}
        <div style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.12) 100%)",
          borderRadius: 20, padding: 32, border: "1px solid rgba(255,255,255,0.15)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#fbbf24", marginBottom: 12 }}>
              FEATURED COURSE
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 12, lineHeight: 1.3 }}>
              Advanced Business Strategy
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 16, lineHeight: 1.7 }}>
              Our top-performing course for Q3. Analyze market trends, competitive positioning, and sustainable growth frameworks.
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
              <div>
                <div style={{ fontWeight: 700, color: "#fbbf24", fontSize: 11, marginBottom: 4 }}>ENROLLED</div>
                <div style={{ fontWeight: 700, fontSize: 20 }}>1,240 Students</div>
              </div>
            </div>
          </div>
          <div style={{
            position: "absolute", top: 0, right: -40, width: "50%", height: "100%",
            background: "url(data:image/svg+xml,%3Csvg width='300' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='300' height='300' fill='%23ffffff' opacity='0.05'/%3E%3C/svg%3E)",
            backgroundSize: "cover", opacity: 0.15,
          }} />
        </div>
      </div>

      {/* Filters and Table */}
      <div style={{
        background: "#fff", borderRadius: 20,
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "24px 32px", borderBottom: "1px solid #f3f4f6",
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>
            Recent Course Modules
          </h2>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Status Filter */}
            <div style={{ position: "relative" }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)}
                style={{
                  appearance: "none", WebkitAppearance: "none", MozAppearance: "none",
                  background: "#fff", border: "1px solid #e5e7eb",
                  borderRadius: 10, padding: "8px 36px 8px 14px",
                  fontSize: 13, fontWeight: 600, color: "#374151",
                  cursor: "pointer", outline: "none", fontFamily: "inherit",
                }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <span style={{
                position: "absolute", right: 12, top: "50%",
                transform: "translateY(-50%)", fontSize: 12,
                color: "#6b7280", pointerEvents: "none",
              }}>▾</span>
            </div>

            {/* Filter Button */}
            <button style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "8px 16px", borderRadius: 10,
              background: "#1f45b6", border: "none",
              color: "#fff", fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              <Filter size={16} />
              Terapkan Filter
            </button>

            {/* Search */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#f9fafb", border: "1px solid #e5e7eb",
              borderRadius: 10, padding: "8px 14px", minWidth: 280,
            }}>
              <Search size={16} style={{ color: "#9ca3af", flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{
                  border: "none", background: "transparent", fontSize: 13,
                  color: "#374151", outline: "none", width: "100%",
                  padding: 0,
                }}
              />
            </div>
          </div>
        </div>

        {/* Table Header */}
        <div style={{
          display: "grid", gridTemplateColumns: "2fr 1fr 1fr",
          padding: "16px 32px", borderBottom: "1px solid #f3f4f6",
          fontSize: 11, fontWeight: 700, color: "#9ca3af",
          letterSpacing: "0.05em", textTransform: "uppercase",
        }}>
          <div>COURSE TITLE</div>
          <div>STATUS</div>
          <div>DATE CREATED</div>
        </div>

        {/* Table Body */}
        {isLoading ? (
          <div style={{ padding: "80px 32px", textAlign: "center", color: "#9ca3af" }}>
            Loading...
          </div>
        ) : trainings.length === 0 ? (
          <div style={{ padding: "80px 32px", textAlign: "center", color: "#9ca3af" }}>
            Tidak ada data pelatihan
          </div>
        ) : (
          trainings.map((training) => (
            <div
              key={training.pelatihan_id}
              style={{
                display: "grid", gridTemplateColumns: "2fr 1fr 1fr",
                padding: "20px 32px", borderBottom: "1px solid #f9fafb",
                alignItems: "center", transition: "background 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {/* Title */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <span style={{ color: "#fff", fontSize: 20 }}>📚</span>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 2 }}>
                    {training.judul_pelatihan}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {training.jenis_pelatihan} • {training.total_modul} modul
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                {getStatusBadge(training.status_pelatihan_id)}
              </div>

              {/* Date */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  {new Date(training.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>

                {/* Actions */}
                <div style={{ position: "relative" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Open action menu
                    }}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "6px 8px", borderRadius: 8,
                      background: "transparent", border: "1px solid #e5e7eb",
                      color: "#6b7280", fontSize: 12, fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    <MoreVertical size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 32px", borderTop: "1px solid #f3f4f6",
          }}>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Page {pagination.page} of {pagination.total_pages}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                disabled={pagination.page === 1}
                onClick={() => setPage(page - 1)}
                style={{
                  padding: "8px 16px", borderRadius: 8,
                  background: pagination.page === 1 ? "#f3f4f6" : "#fff",
                  border: "1px solid #e5e7eb",
                  color: pagination.page === 1 ? "#9ca3af" : "#374151",
                  fontSize: 13, fontWeight: 600,
                  cursor: pagination.page === 1 ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                Previous
              </button>
              <button
                disabled={pagination.page === pagination.total_pages}
                onClick={() => setPage(page + 1)}
                style={{
                  padding: "8px 16px", borderRadius: 8,
                  background: pagination.page === pagination.total_pages ? "#f3f4f6" : "#fff",
                  border: "1px solid #e5e7eb",
                  color: pagination.page === pagination.total_pages ? "#9ca3af" : "#374151",
                  fontSize: 13, fontWeight: 600,
                  cursor: pagination.page === pagination.total_pages ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
