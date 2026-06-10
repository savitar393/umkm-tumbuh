import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { partnershipsApi } from "../api";
import type { PartnershipRequest, PartnershipStatus } from "../types";

const PartnershipDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [partnership, setPartnership] = useState<PartnershipRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get user role from localStorage or context (simulated)
  const userRole = localStorage.getItem("userRole") || "UMKM";
  const isReceiver = userRole === "MITRA"; // Simplified logic

  useEffect(() => {
    if (id) {
      fetchPartnership(id);
    }
  }, [id]);

  const fetchPartnership = async (partnershipId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await partnershipsApi.getDetail(partnershipId);
      
      if (response.status === "success" && response.data) {
        setPartnership(response.data as PartnershipRequest);
      } else {
        setError(response.message || "Gagal memuat detail kemitraan");
      }
    } catch (err) {
      console.error("Error fetching partnership:", err);
      setError("Terjadi kesalahan saat memuat data");
      
      // Mock data for demo
      setPartnership({
        id: partnershipId,
        request_code: "PKS-2026-00000001",
        requester_id: "user1",
        receiver_id: "mitra1",
        requester_role: "UMKM",
        receiver_role: "MITRA",
        category: "Pendanaan",
        proposal_title: "Pengajuan Kerjasama Pendanaan untuk Pengembangan Produk Roti Tradisional",
        proposal_description: "Mengajukan kerjasama pendanaan untuk pengembangan produk roti tradisional dengan berbagai varian rasa baru. Dana akan digunakan untuk:\n1. Pengembangan resep dan varian rasa baru\n2. Pembelian peralatan produksi yang lebih modern\n3. Pengemasan produk yang lebih menarik\n4. Promosi dan pemasaran digital\n\nTarget yang ingin dicapai:\n- Meningkatkan produksi sebesar 50%\n- Memperluas pasar ke 3 kota baru\n- Meningkatkan omset sebesar 100% dalam 1 tahun",
        business_name: "UMKM Sari Roti",
        contact_person: "+628123456789 / sariroti@email.com",
        product_description: "Roti tradisional dengan berbagai varian rasa seperti coklat, keju, kacang hijau, dan durian. Produk dibuat dengan bahan-bahan alami tanpa pengawet dan memiliki masa simpan 3 hari. Telah memiliki izin PIRT dan sertifikat halal.",
        reason_for_partnership: "Membutuhkan mitra pendanaan untuk mengembangkan usaha yang sudah berjalan selama 2 tahun. Saat ini produksi terbatas karena modal yang terbatas. Dengan pendanaan yang memadai, dapat meningkatkan kapasitas produksi dan memperluas pasar.",
        nib_ktp_file: "nib_umkm_sari_roti.pdf",
        proposal_file: "proposal_pendanaan_roti.pdf",
        certificate_file: "sertifikat_halal.pdf",
        status: "SUBMITTED",
        submitted_at: "2026-06-08T10:00:00Z",
        created_at: "2026-06-08T10:00:00Z",
        updated_at: "2026-06-08T10:00:00Z",
        requester_name: "UMKM Sari Roti (Budi Santoso)",
        receiver_name: "PT. Mitra Sejahtera",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: PartnershipStatus) => {
    const colors: Record<PartnershipStatus, string> = {
      DRAFT: "bg-gray-100 text-gray-800",
      SUBMITTED: "bg-blue-100 text-blue-800",
      REVIEWED: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      ACTIVE: "bg-indigo-100 text-indigo-800",
      COMPLETED: "bg-purple-100 text-purple-800",
      CANCELLED: "bg-gray-100 text-gray-800",
      WAITING_DOCUMENT: "bg-orange-100 text-orange-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status: PartnershipStatus) => {
    const texts: Record<PartnershipStatus, string> = {
      DRAFT: "Draft",
      SUBMITTED: "Terkirim - Menunggu Tinjauan",
      REVIEWED: "Sedang Ditinjau",
      APPROVED: "Disetujui",
      REJECTED: "Ditolak",
      ACTIVE: "Aktif",
      COMPLETED: "Selesai",
      CANCELLED: "Dibatalkan",
      WAITING_DOCUMENT: "Menunggu Dokumen Tanda Tangan",
    };
    return texts[status] || status;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleApprove = async () => {
    if (!partnership || !window.confirm("Setujui pengajuan kemitraan ini?")) return;
    
    try {
      const response = await partnershipsApi.approve(partnership.id);
      
      if (response.status === "success") {
        alert("Pengajuan berhasil disetujui!");
        fetchPartnership(partnership.id);
      } else {
        alert(`Gagal menyetujui: ${response.message}`);
      }
    } catch (err) {
      console.error("Error approving partnership:", err);
      alert("Terjadi kesalahan saat menyetujui pengajuan");
    }
  };

  const handleReject = async () => {
    if (!partnership) return;
    
    const reason = prompt("Masukkan alasan penolakan:");
    if (!reason || reason.trim() === "") {
      alert("Alasan penolakan harus diisi");
      return;
    }
    
    if (!window.confirm("Tolak pengajuan kemitraan ini?")) return;
    
    try {
      const response = await partnershipsApi.reject(partnership.id, reason);
      
      if (response.status === "success") {
        alert("Pengajuan berhasil ditolak!");
        fetchPartnership(partnership.id);
      } else {
        alert(`Gagal menolak: ${response.message}`);
      }
    } catch (err) {
      console.error("Error rejecting partnership:", err);
      alert("Terjadi kesalahan saat menolak pengajuan");
    }
  };

  const handleSign = async () => {
    if (!partnership) return;
    
    const documentId = prompt("Masukkan ID dokumen kontrak yang sudah ditandatangani:");
    if (!documentId || documentId.trim() === "") {
      alert("ID dokumen kontrak harus diisi");
      return;
    }
    
    if (!window.confirm("Tandatangani dan setujui kemitraan ini?")) return;
    
    try {
      const response = await partnershipsApi.sign(partnership.id, { contract_document_id: documentId });
      
      if (response.status === "success") {
        alert("Kemitraan berhasil ditandatangani dan diaktifkan!");
        fetchPartnership(partnership.id);
      } else {
        alert(`Gagal menandatangani: ${response.message}`);
      }
    } catch (err) {
      console.error("Error signing partnership:", err);
      alert("Terjadi kesalahan saat menandatangani kemitraan");
    }
  };

  const handleBack = () => {
    navigate("/partnerships");
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Memuat detail kemitraan...</p>
      </div>
    );
  }

  if (error || !partnership) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error || "Data kemitraan tidak ditemukan"}</p>
          <button
            onClick={handleBack}
            className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
          >
            Kembali ke Daftar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <button
              onClick={handleBack}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Daftar
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Detail Pengajuan Kemitraan</h1>
            <p className="text-gray-600 mt-2">{partnership.request_code}</p>
          </div>
          
          <div className="text-right">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(partnership.status)}`}>
              {getStatusText(partnership.status)}
            </span>
            <p className="mt-2 text-sm text-gray-500">
              Diajukan: {formatDate(partnership.submitted_at || partnership.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons for Receiver */}
      {isReceiver && partnership.status === "SUBMITTED" && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">Tinjau Pengajuan</h3>
          <div className="flex space-x-4">
            <button
              onClick={handleApprove}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Setujui
            </button>
            <button
              onClick={handleReject}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Tolak
            </button>
            <button
              onClick={() => navigate(`/partnerships/review/${partnership.id}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Tinjau Detail
            </button>
          </div>
        </div>
      )}

      {/* Action Button for Waiting Document */}
      {isReceiver && partnership.status === "WAITING_DOCUMENT" && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h3 className="font-medium text-orange-800 mb-2">Menunggu Tanda Tangan Dokumen</h3>
          <button
            onClick={handleSign}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Tandatangani & Aktifkan
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-6">
        {/* Basic Info Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Informasi Dasar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Pengaju</p>
              <p className="font-medium text-gray-900">{partnership.requester_name || partnership.business_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Penerima</p>
              <p className="font-medium text-gray-900">{partnership.receiver_name || "Mitra"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Kategori Kerjasama</p>
              <p className="font-medium text-gray-900">{partnership.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Kontak Person</p>
              <p className="font-medium text-gray-900">{partnership.contact_person}</p>
            </div>
          </div>
        </div>

        {/* Proposal Details Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Detail Proposal</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Judul Proposal</p>
              <p className="font-medium text-gray-900">{partnership.proposal_title}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Deskripsi Proposal</p>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                <p className="text-gray-900 whitespace-pre-line">{partnership.proposal_description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Business Details Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Detail Usaha</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Nama Usaha/Organisasi</p>
              <p className="font-medium text-gray-900">{partnership.business_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Deskripsi Produk/Jasa</p>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                <p className="text-gray-900 whitespace-pre-line">{partnership.product_description}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Alasan Ingin Bermitra</p>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                <p className="text-gray-900 whitespace-pre-line">{partnership.reason_for_partnership}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Dokumen Pendukung</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
              <div>
                <p className="font-medium text-gray-900">NIB / KTP</p>
                <p className="text-sm text-gray-500">{partnership.nib_ktp_file}</p>
              </div>
              <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm">
                Lihat / Unduh
              </button>
            </div>
            
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
              <div>
                <p className="font-medium text-gray-900">Proposal Kemitraan (PDF)</p>
                <p className="text-sm text-gray-500">{partnership.proposal_file}</p>
              </div>
              <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm">
                Lihat / Unduh
              </button>
            </div>
            
            {partnership.certificate_file && (
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                <div>
                  <p className="font-medium text-gray-900">Sertifikat Halal/PIRT</p>
                  <p className="text-sm text-gray-500">{partnership.certificate_file}</p>
                </div>
                <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm">
                  Lihat / Unduh
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Timeline Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Timeline</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                </div>
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-900">Pengajuan Dikirim</p>
                <p className="text-sm text-gray-500">{formatDate(partnership.submitted_at || partnership.created_at)}</p>
              </div>
            </div>
            
            {partnership.decided_at && (
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    partnership.status === "APPROVED" || partnership.status === "ACTIVE" 
                      ? "bg-green-100" 
                      : "bg-red-100"
                  }`}>
                    <div className={`w-3 h-3 rounded-full ${
                      partnership.status === "APPROVED" || partnership.status === "ACTIVE" 
                        ? "bg-green-600" 
                        : "bg-red-600"
                    }`}></div>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-900">
                    {partnership.status === "APPROVED" || partnership.status === "ACTIVE" ? "Disetujui" : "Ditolak"}
                  </p>
                  <p className="text-sm text-gray-500">{formatDate(partnership.decided_at)}</p>
                  {partnership.rejection_reason && partnership.status === "REJECTED" && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-md">
                      <p className="text-sm text-red-700">Alasan penolakan: {partnership.rejection_reason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {partnership.contract_signed_at && (
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-900">Dokumen Ditandatangani</p>
                  <p className="text-sm text-gray-500">{formatDate(partnership.contract_signed_at)}</p>
                </div>
              </div>
            )}
            
            {partnership.partnership_start && (
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-900">Kerjasama Dimulai</p>
                  <p className="text-sm text-gray-500">{formatDate(partnership.partnership_start)}</p>
                  {partnership.partnership_end && (
                    <p className="text-sm text-gray-500">Berakhir: {formatDate(partnership.partnership_end)}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnershipDetailPage;