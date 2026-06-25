import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Edit, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "../components/AdminLayout";
import {
  getAdminTrainingDetail,
  createTraining,
  updateTraining,
  type CreateTrainingPayload,
} from "../api";
import { getCurrentUser } from "../../../shared/auth/currentUser";

type Step = 1 | 2 | 3 | 4;

type ModuleForm = {
  id?: string;
  urutan_modul: number;
  judul_modul: string;
  deskripsi_modul: string;
  durasi_menit: number;
  is_preview: boolean;
};

type AssignmentForm = {
  id?: string;
  judul_assignment: string;
  deskripsi_tugas: string;
};

type FormData = {
  judul_pelatihan: string;
  jenis_pelatihan_id: string;
  deskripsi_pelatihan: string;
  durasi_jam: number;
  mentor_nama: string;
  harga: number;
  masa_akses_hari: number;
  modules: ModuleForm[];
  assignments: AssignmentForm[];
};

const JENIS_PELATIHAN_OPTIONS = [
  { value: "JP01", label: "Fundamental Business" },
  { value: "JP02", label: "Digital Marketing" },
  { value: "JP03", label: "Finance Management" },
  { value: "JP04", label: "Leadership" },
  { value: "JP05", label: "Product Development" },
];

export default function AdminTrainingFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>({
    judul_pelatihan: "",
    jenis_pelatihan_id: "JP01",
    deskripsi_pelatihan: "",
    durasi_jam: 12,
    mentor_nama: "",
    harga: 0,
    masa_akses_hari: 365,
    modules: [],
    assignments: [],
  });

  // Fetch training data if edit mode
  const { data: trainingData, isLoading } = useQuery({
    queryKey: ["admin", "training", id],
    queryFn: () => getAdminTrainingDetail(id!),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (trainingData) {
      setFormData({
        judul_pelatihan: trainingData.judul_pelatihan || "",
        jenis_pelatihan_id: trainingData.jenis_pelatihan_id || "JP01",
        deskripsi_pelatihan: trainingData.deskripsi_pelatihan || "",
        durasi_jam: trainingData.durasi_jam || 12,
        mentor_nama: trainingData.mentor_nama || "",
        harga: trainingData.harga || 0,
        masa_akses_hari: trainingData.masa_akses_hari || 365,
        modules: trainingData.modules || [],
        assignments: trainingData.assignments || [],
      });
    }
  }, [trainingData]);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const user = getCurrentUser();
      if (!user) throw new Error("User tidak ditemukan");

      const payload: CreateTrainingPayload = {
        dibuat_oleh_admin_id: user.id,
        jenis_pelatihan_id: data.jenis_pelatihan_id,
        judul_pelatihan: data.judul_pelatihan,
        deskripsi_pelatihan: data.deskripsi_pelatihan,
        mentor_nama: data.mentor_nama,
        durasi_jam: data.durasi_jam,
        total_modul: data.modules.length,
        harga: data.harga,
        akses_seumur_hidup: true,
        masa_akses_hari: data.masa_akses_hari,
      };

      if (isEditMode && id) {
        return updateTraining(id, payload);
      } else {
        return createTraining(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "trainings"] });
      toast.success(isEditMode ? "Pelatihan berhasil diperbarui" : "Pelatihan berhasil dibuat");
      navigate("/admin/training");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menyimpan pelatihan");
    },
  });

  const handleSaveDetail = () => {
    if (!formData.judul_pelatihan.trim()) {
      toast.error("Judul pelatihan wajib diisi");
      return;
    }
    if (formData.durasi_jam <= 0) {
      toast.error("Durasi harus lebih dari 0");
      return;
    }
    setCurrentStep(2);
  };

  const handleAddModule = () => {
    setFormData({
      ...formData,
      modules: [
        ...formData.modules,
        {
          urutan_modul: formData.modules.length + 1,
          judul_modul: "",
          deskripsi_modul: "",
          durasi_menit: 30,
          is_preview: false,
        },
      ],
    });
  };

  const handleUpdateModule = (index: number, module: ModuleForm) => {
    const newModules = [...formData.modules];
    newModules[index] = module;
    setFormData({ ...formData, modules: newModules });
  };

  const handleDeleteModule = (index: number) => {
    const newModules = formData.modules.filter((_, i) => i !== index);
    // Reorder urutan_modul
    newModules.forEach((m, i) => (m.urutan_modul = i + 1));
    setFormData({ ...formData, modules: newModules });
  };

  const handleAddAssignment = () => {
    setFormData({
      ...formData,
      assignments: [
        ...formData.assignments,
        {
          judul_assignment: "",
          deskripsi_tugas: "",
        },
      ],
    });
  };

  const handleUpdateAssignment = (index: number, assignment: AssignmentForm) => {
    const newAssignments = [...formData.assignments];
    newAssignments[index] = assignment;
    setFormData({ ...formData, assignments: newAssignments });
  };

  const handleDeleteAssignment = (index: number) => {
    setFormData({
      ...formData,
      assignments: formData.assignments.filter((_, i) => i !== index),
    });
  };

  const handlePublish = () => {
    if (formData.modules.length === 0) {
      toast.error("Tambahkan minimal 1 modul sebelum publish");
      return;
    }
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div style={{ padding: "80px 0", textAlign: "center", color: "rgba(255,255,255,0.6)" }}>
          Loading...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 4 }}>
        <span
          onClick={() => navigate("/admin")}
          style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}
        >
          Beranda
        </span>
        <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
        <span
          onClick={() => navigate("/admin/training")}
          style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}
        >
          Pelatihan
        </span>
        <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
        <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
          {isEditMode ? "Edit Pelatihan" : "Buat Pelatihan Baru"}
        </span>
      </div>

      {/* Page title */}
      <div style={{ marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.2 }}>
            Manage Training
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", margin: "4px 0 0" }}>
            {isEditMode ? "Edit pelatihan yang sudah ada" : "Buat pelatihan baru untuk UMKM"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => navigate("/admin/training")}
            style={{
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
              padding: "10px 20px", borderRadius: 12,
              background: "#fff", border: "none",
              color: "#1f45b6", fontSize: 14, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            Buat Pelatihan Baru
          </button>
        </div>
      </div>

      {/* Step Indicator */}
      <div style={{
        background: "#fff", borderRadius: 20, padding: "24px 32px",
        marginBottom: 24, boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[
            { num: 1, label: "Detail" },
            { num: 2, label: "Module" },
            { num: 3, label: "Assignment" },
            { num: 4, label: "Publish" },
          ].map((step) => (
            <div
              key={step.num}
              onClick={() => setCurrentStep(step.num as Step)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", borderRadius: 12,
                background: currentStep === step.num ? "#1f45b6" : "#f9fafb",
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: currentStep === step.num ? "#fff" : "#e5e7eb",
                color: currentStep === step.num ? "#1f45b6" : "#6b7280",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 14,
              }}>
                {step.num}
              </div>
              <span style={{
                fontSize: 14, fontWeight: 600,
                color: currentStep === step.num ? "#fff" : "#6b7280",
              }}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div style={{
        background: "#fff", borderRadius: 20,
        padding: "32px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      }}>
        {/* Step 1: Detail */}
        {currentStep === 1 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 24 }}>
              Detail Pelatihan
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Training Title */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                    Training Title
                  </label>
                  <input
                    type="text"
                    value={formData.judul_pelatihan}
                    onChange={(e) => setFormData({ ...formData, judul_pelatihan: e.target.value })}
                    placeholder="Strategi Digital Marketing UMKM"
                    style={{
                      width: "100%", padding: "12px 16px", borderRadius: 10,
                      border: "1px solid #e5e7eb", fontSize: 14, outline: "none",
                      background: "#f9fafb",
                    }}
                  />
                </div>

                {/* Training Type */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                    Training Type
                  </label>
                  <select
                    value={formData.jenis_pelatihan_id}
                    onChange={(e) => setFormData({ ...formData, jenis_pelatihan_id: e.target.value })}
                    style={{
                      width: "100%", padding: "12px 16px", borderRadius: 10,
                      border: "1px solid #e5e7eb", fontSize: 14, outline: "none",
                      background: "#f9fafb",
                    }}
                  >
                    {JENIS_PELATIHAN_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                  Description
                </label>
                <textarea
                  value={formData.deskripsi_pelatihan}
                  onChange={(e) => setFormData({ ...formData, deskripsi_pelatihan: e.target.value })}
                  rows={5}
                  placeholder="Mempelajari teknik dasar pemasaran digital mulai dari pemilihan platform hingga optimasi konten untuk pertumbuhan bisnis kecil menengah."
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: 10,
                    border: "1px solid #e5e7eb", fontSize: 14, outline: "none",
                    resize: "vertical", fontFamily: "inherit", background: "#f9fafb",
                  }}
                />
              </div>

              {/* Estimated Duration */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                  Estimated Duration (Hours)
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.durasi_jam}
                  onChange={(e) => setFormData({ ...formData, durasi_jam: parseInt(e.target.value) || 0 })}
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: 10,
                    border: "1px solid #e5e7eb", fontSize: 14, outline: "none",
                    background: "#f9fafb", maxWidth: 200,
                  }}
                />
              </div>

              {/* Button */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                <button
                  onClick={handleSaveDetail}
                  style={{
                    padding: "12px 32px", borderRadius: 10,
                    background: "#1f45b6", border: "none",
                    color: "#fff", fontSize: 14, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Simpan Detail
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Module */}
        {currentStep === 2 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>
                Module
              </h2>
              <button
                onClick={handleAddModule}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 20px", borderRadius: 10,
                  background: "#1f45b6", border: "none",
                  color: "#fff", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <Plus size={16} />
                Tambah Modul
              </button>
            </div>

            {formData.modules.length === 0 ? (
              <div style={{
                padding: "60px 20px", textAlign: "center",
                background: "#f9fafb", borderRadius: 12,
              }}>
                <p style={{ color: "#6b7280", marginBottom: 16 }}>
                  Belum ada modul. Klik "Tambah Modul" untuk menambahkan.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {formData.modules.map((module, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "20px", borderRadius: 12,
                      background: "#f9fafb", border: "1px solid #e5e7eb",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 10,
                          background: "#1f45b6", color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 14, fontWeight: 700,
                        }}>
                          {module.urutan_modul}
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
                            {module.judul_modul || `Modul ${module.urutan_modul}`}
                          </div>
                          <div style={{ fontSize: 12, color: "#6b7280" }}>
                            {module.deskripsi_modul || "Memahami landasan mata sosial untuk bisnis."}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          style={{
                            padding: "8px", borderRadius: 8,
                            background: "#fff", border: "1px solid #e5e7eb",
                            color: "#6b7280", cursor: "pointer",
                            display: "flex", alignItems: "center",
                          }}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteModule(index)}
                          style={{
                            padding: "8px", borderRadius: 8,
                            background: "#fff", border: "1px solid #e5e7eb",
                            color: "#ef4444", cursor: "pointer",
                            display: "flex", alignItems: "center",
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Module Form Fields */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>
                          Judul Modul
                        </label>
                        <input
                          type="text"
                          value={module.judul_modul}
                          onChange={(e) => handleUpdateModule(index, { ...module, judul_modul: e.target.value })}
                          placeholder="Pengenalan Ekosistem Digital"
                          style={{
                            width: "100%", padding: "10px 12px", borderRadius: 8,
                            border: "1px solid #e5e7eb", fontSize: 13, outline: "none",
                            background: "#fff",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>
                          Durasi (Menit)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={module.durasi_menit}
                          onChange={(e) => handleUpdateModule(index, { ...module, durasi_menit: parseInt(e.target.value) || 0 })}
                          style={{
                            width: "100%", padding: "10px 12px", borderRadius: 8,
                            border: "1px solid #e5e7eb", fontSize: 13, outline: "none",
                            background: "#fff",
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>
                        Deskripsi Modul
                      </label>
                      <textarea
                        value={module.deskripsi_modul}
                        onChange={(e) => handleUpdateModule(index, { ...module, deskripsi_modul: e.target.value })}
                        rows={3}
                        placeholder="Memahami landasan mata sosial untuk bisnis."
                        style={{
                          width: "100%", padding: "10px 12px", borderRadius: 8,
                          border: "1px solid #e5e7eb", fontSize: 13, outline: "none",
                          resize: "vertical", fontFamily: "inherit", background: "#fff",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
              <button
                onClick={() => setCurrentStep(1)}
                style={{
                  padding: "12px 32px", borderRadius: 10,
                  background: "#f3f4f6", border: "none",
                  color: "#374151", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Kembali
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                style={{
                  padding: "12px 32px", borderRadius: 10,
                  background: "#1f45b6", border: "none",
                  color: "#fff", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Lanjut ke Assignment
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Assignment */}
        {currentStep === 3 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>
                Assignment
              </h2>
              <button
                onClick={handleAddAssignment}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 20px", borderRadius: 10,
                  background: "#1f45b6", border: "none",
                  color: "#fff", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <Plus size={16} />
                Tambah Assignment
              </button>
            </div>

            {formData.assignments.length === 0 ? (
              <div style={{
                padding: "60px 20px", textAlign: "center",
                background: "#f9fafb", borderRadius: 12,
              }}>
                <p style={{ color: "#6b7280", marginBottom: 16 }}>
                  Belum ada assignment. Klik "Tambah Assignment" untuk menambahkan.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {formData.assignments.map((assignment, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "20px", borderRadius: 12,
                      background: "#f9fafb", border: "1px solid #e5e7eb",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 10,
                          background: "#0ea5e9", color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 20,
                        }}>
                          📋
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
                            {assignment.judul_assignment || `Assignment ${index + 1}`}
                          </div>
                          <div style={{ fontSize: 12, color: "#6b7280" }}>
                            {assignment.deskripsi_tugas || "Deskripsi tugas"}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          style={{
                            padding: "8px", borderRadius: 8,
                            background: "#fff", border: "1px solid #e5e7eb",
                            color: "#6b7280", cursor: "pointer",
                            display: "flex", alignItems: "center",
                          }}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteAssignment(index)}
                          style={{
                            padding: "8px", borderRadius: 8,
                            background: "#fff", border: "1px solid #e5e7eb",
                            color: "#ef4444", cursor: "pointer",
                            display: "flex", alignItems: "center",
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>
                          Judul Assignment
                        </label>
                        <input
                          type="text"
                          value={assignment.judul_assignment}
                          onChange={(e) => handleUpdateAssignment(index, { ...assignment, judul_assignment: e.target.value })}
                          placeholder="Penugasan Akhir"
                          style={{
                            width: "100%", padding: "10px 12px", borderRadius: 8,
                            border: "1px solid #e5e7eb", fontSize: 13, outline: "none",
                            background: "#fff",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>
                          Deskripsi Tugas
                        </label>
                        <textarea
                          value={assignment.deskripsi_tugas}
                          onChange={(e) => handleUpdateAssignment(index, { ...assignment, deskripsi_tugas: e.target.value })}
                          rows={3}
                          placeholder="Buat studi kasus..."
                          style={{
                            width: "100%", padding: "10px 12px", borderRadius: 8,
                            border: "1px solid #e5e7eb", fontSize: 13, outline: "none",
                            resize: "vertical", fontFamily: "inherit", background: "#fff",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
              <button
                onClick={() => setCurrentStep(2)}
                style={{
                  padding: "12px 32px", borderRadius: 10,
                  background: "#f3f4f6", border: "none",
                  color: "#374151", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Kembali
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                style={{
                  padding: "12px 32px", borderRadius: 10,
                  background: "#1f45b6", border: "none",
                  color: "#fff", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Lanjut ke Publish
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Publish */}
        {currentStep === 4 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 24, textAlign: "center" }}>
              Finalize Training
            </h2>

            <div style={{
              padding: "40px", textAlign: "center",
              background: "#f9fafb", borderRadius: 12,
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
              <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.7, maxWidth: 600, margin: "0 auto 24px" }}>
                Pastikan semua modul dan assignment telah diisi dengan benar. Setelah dipublikasikan,
                pelatihan akan tersedia untuk seluruh ekosistem UMKM Tumbuh.
              </p>

              {/* Summary */}
              <div style={{
                background: "#fff", borderRadius: 12, padding: "20px",
                marginBottom: 24, textAlign: "left",
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Judul Pelatihan</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                      {formData.judul_pelatihan || "-"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Jenis Pelatihan</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                      {JENIS_PELATIHAN_OPTIONS.find(o => o.value === formData.jenis_pelatihan_id)?.label || "-"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Total Modul</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                      {formData.modules.length} Modul
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Total Assignment</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                      {formData.assignments.length} Assignment
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePublish}
                disabled={saveMutation.isPending}
                style={{
                  padding: "14px 40px", borderRadius: 10,
                  background: saveMutation.isPending ? "#9ca3af" : "#1f45b6",
                  border: "none",
                  color: "#fff", fontSize: 15, fontWeight: 700,
                  cursor: saveMutation.isPending ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  boxShadow: "0 4px 12px rgba(31, 69, 182, 0.3)",
                }}
              >
                {saveMutation.isPending ? "Menyimpan..." : "Publish Pelatihan"}
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 24 }}>
              <button
                onClick={() => setCurrentStep(3)}
                style={{
                  padding: "12px 32px", borderRadius: 10,
                  background: "#f3f4f6", border: "none",
                  color: "#374151", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Kembali
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
