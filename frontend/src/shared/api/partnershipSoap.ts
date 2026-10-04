import { getAccessToken, getCurrentUser } from "../auth/currentUser";

const SOAP_ENDPOINT = import.meta.env.VITE_PARTNERSHIP_SOAP_URL || "/backend/soap/partnership";
const SOAP_NS = "http://umkm-tumbuh.example.com/partnerships";
const SOAP_ENV_NS = "http://schemas.xmlsoap.org/soap/envelope/";

export class SoapFaultError extends Error {
  faultCode: string;
  faultString: string;
  constructor(faultCode: string, faultString: string) {
    super(`SOAP Fault: ${faultCode} - ${faultString}`);
    this.name = "SoapFaultError";
    this.faultCode = faultCode;
    this.faultString = faultString;
  }
}

function escapeXml(unsafe: string): string {
  if (unsafe == null) return "";
  return unsafe
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function callSoap(operation: string, bodyInnerXml: string) {
  const token = getAccessToken();
  const user = getCurrentUser();
  
  if (!token || !user) {
    throw new Error("Missing auth for SOAP call");
  }

  // Insert userId and userRole at the beginning of the body as required by WSDL
  const fullBody = `<par:${operation} xmlns:par="${SOAP_NS}">
  <userId>${escapeXml(user.id)}</userId>
  <userRole>${escapeXml(user.role)}</userRole>
  ${bodyInnerXml}
</par:${operation}>`;

  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="${SOAP_ENV_NS}">
  <soap:Body>
    ${fullBody}
  </soap:Body>
</soap:Envelope>`;

  const response = await fetch(SOAP_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "SOAPAction": `${SOAP_NS}/${operation}`,
      "Authorization": `Bearer ${token}`,
    },
    body: envelope,
  });

  const responseText = await response.text();
  
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(responseText, "text/xml");

  // Check for parse error
  const parseError = xmlDoc.getElementsByTagName("parsererror");
  if (parseError.length > 0) {
    throw new Error("Invalid XML response from SOAP server");
  }

  // Check for SOAP Fault
  const faults = xmlDoc.getElementsByTagName("Fault");
  if (faults.length === 0) {
    // Some implementations might use namespace prefixes for Fault
    const soapFaults = xmlDoc.getElementsByTagNameNS(SOAP_ENV_NS, "Fault");
    if (soapFaults.length > 0) {
      const code = soapFaults[0].getElementsByTagName("faultcode")[0]?.textContent || "Unknown";
      const string = soapFaults[0].getElementsByTagName("faultstring")[0]?.textContent || "Unknown";
      throw new SoapFaultError(code, string);
    }
  } else {
    const code = faults[0].getElementsByTagName("faultcode")[0]?.textContent || "Unknown";
    const string = faults[0].getElementsByTagName("faultstring")[0]?.textContent || "Unknown";
    throw new SoapFaultError(code, string);
  }

  if (!response.ok) {
    throw new Error(`HTTP Error ${response.status}: ${responseText}`);
  }

  return xmlDoc;
}

// Helper to extract text content
function getText(el: Element | Document, tag: string): string {
  const node = el.getElementsByTagName(tag)[0];
  return node ? node.textContent || "" : "";
}

function getInt(el: Element | Document, tag: string): number {
  return parseInt(getText(el, tag) || "0", 10);
}

function getBool(el: Element | Document, tag: string): boolean {
  return getText(el, tag) === "true";
}

// Define the API client
export const partnershipSoap = {
  create: async (data: { receiver_id: string; proposal_title: string; proposal_description: string }) => {
    const xml = `<receiverId>${escapeXml(data.receiver_id)}</receiverId>
<proposalTitle>${escapeXml(data.proposal_title)}</proposalTitle>
<proposalDescription>${escapeXml(data.proposal_description)}</proposalDescription>`;
    
    const doc = await callSoap("CreatePartnershipApplication", xml);
    return {
      success: getBool(doc, "success"),
      message: getText(doc, "message"),
      data: {
        pengajuanID: getText(doc, "applicationId"),
      }
    };
  },

  getStatus: async (params?: { status?: string; page?: number; limit?: number }) => {
    let xml = "";
    if (params?.status) xml += `<status>${escapeXml(params.status)}</status>`;
    if (params?.page) xml += `<page>${params.page}</page>`;
    if (params?.limit) xml += `<limit>${params.limit}</limit>`;
    
    const doc = await callSoap("GetPartnershipApplications", xml);
    
    const apps = Array.from(doc.getElementsByTagName("application")).map(app => ({
      pengajuanID: getText(app, "applicationId"),
      statusPengajuan: getText(app, "status") as import("../../features/partnerships/types").PartnershipStatus,
      tanggalPengajuan: getText(app, "submittedAt") || getText(app, "createdAt"),
      mitraUmkmTujuan: getText(app, "receiverName") || getText(app, "receiverBusinessName"),
      proposalTitle: getText(app, "proposalTitle"),
    }));

    const totalCount = getInt(doc, "totalCount");
    const limit = params?.limit || 10;
    const page = params?.page || 1;

    return {
      success: true,
      data: {
        pengajuan: apps,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        }
      }
    };
  },

  getIncoming: async (params?: { status?: string; page?: number; limit?: number }) => {
    let xml = "";
    if (params?.status) xml += `<status>${escapeXml(params.status)}</status>`;
    if (params?.page) xml += `<page>${params.page}</page>`;
    if (params?.limit) xml += `<limit>${params.limit}</limit>`;
    
    const doc = await callSoap("GetIncomingPartnerships", xml);
    
    const apps = Array.from(doc.getElementsByTagName("application")).map(app => ({
      pengajuanID: getText(app, "applicationId"),
      pengirim: getText(app, "requesterName") || getText(app, "requesterBusinessName"),
      proposal_title: getText(app, "proposalTitle"),
      tanggalPengajuan: getText(app, "submittedAt") || getText(app, "createdAt"),
      status: getText(app, "status"),
    }));

    const totalCount = getInt(doc, "totalCount");
    const limit = params?.limit || 10;
    const page = params?.page || 1;

    return {
      success: true,
      data: {
        pengajuan_masuk: apps,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        }
      }
    };
  },

  getIncomingSummary: async () => {
    const doc = await callSoap("GetIncomingPartnershipSummary", "");
    const items = Array.from(doc.getElementsByTagName("item"));
    const summary: { menunggu: number; disetujui: number; ditolak: number; dibatalkan: number; total: number } = { menunggu: 0, disetujui: 0, ditolak: 0, dibatalkan: 0, total: 0 };
    
    items.forEach(item => {
      const status = getText(item, "status");
      const count = getInt(item, "count");
      if (status === "DIAJUKAN" || status === "DITINJAU") summary.menunggu += count;
      else if (status === "AKTIF") summary.disetujui += count;
      else if (status === "DITOLAK") summary.ditolak += count;
      else if (status === "DIBATALKAN") summary.dibatalkan += count;
      summary.total += count;
    });

    return { success: true, data: { summary } };
  },

  getDetail: async (id: string) => {
    const xml = `<applicationId>${escapeXml(id)}</applicationId>`;
    const doc = await callSoap("GetPartnershipApplication", xml);
    
    return {
      success: true,
      data: {
        id: getText(doc, "applicationId"),
        request_code: getText(doc, "requestCode"),
        requester_id: getText(doc, "requesterId"),
        receiver_id: getText(doc, "receiverId"),
        requester_name: getText(doc, "requesterName"),
        receiver_name: getText(doc, "receiverName"),
        proposal_title: getText(doc, "proposalTitle"),
        pesan_pengajuan: getText(doc, "proposalText"),
        status: getText(doc, "status"),
        catatan_keputusan: getText(doc, "rejectionReason"),
        contract_document_id: getText(doc, "contractDocumentId"),
        submitted_at: getText(doc, "submittedAt"),
        decided_at: getText(doc, "decidedAt"),
        created_at: getText(doc, "createdAt"),
        updated_at: getText(doc, "updatedAt"),
      }
    };
  },

  getSummary: async () => {
    const doc = await callSoap("GetPartnershipSummary", "");
    const items = Array.from(doc.getElementsByTagName("item"));
    const summary: { bermitra: number; menunggu: number; ditolak: number; total: number } = { bermitra: 0, menunggu: 0, ditolak: 0, total: 0 };
    
    items.forEach(item => {
      const status = getText(item, "status");
      const count = getInt(item, "count");
      if (status === "DIAJUKAN" || status === "DITINJAU") summary.menunggu += count;
      else if (status === "AKTIF") summary.bermitra += count;
      else if (status === "DITOLAK") summary.ditolak += count;
      summary.total += count;
    });

    return { success: true, data: { summary } };
  },

  sign: async (id: string, dokumenKontrak: string) => {
    const xml = `<applicationId>${escapeXml(id)}</applicationId><documentId>${escapeXml(dokumenKontrak)}</documentId>`;
    const doc = await callSoap("SignPartnership", xml);
    return {
      success: getBool(doc, "success"),
      message: getText(doc, "message"),
      data: undefined
    };
  },

  markAsRead: async (id: string) => {
    const xml = `<applicationId>${escapeXml(id)}</applicationId>`;
    const doc = await callSoap("MarkPartnershipAsRead", xml);
    return {
      success: getBool(doc, "success"),
      message: getText(doc, "message"),
      data: undefined
    };
  },

  approve: async (id: string) => {
    const xml = `<applicationId>${escapeXml(id)}</applicationId><status>AKTIF</status>`;
    const doc = await callSoap("UpdatePartnershipStatus", xml);
    return {
      success: getBool(doc, "success"),
      message: getText(doc, "message"),
      data: undefined
    };
  },

  reject: async (id: string, rejection_reason: string) => {
    const xml = `<applicationId>${escapeXml(id)}</applicationId><status>DITOLAK</status><rejectionReason>${escapeXml(rejection_reason)}</rejectionReason>`;
    const doc = await callSoap("UpdatePartnershipStatus", xml);
    return {
      success: getBool(doc, "success"),
      message: getText(doc, "message"),
      data: undefined
    };
  },

  cancel: async (id: string) => {
    const xml = `<applicationId>${escapeXml(id)}</applicationId><status>DIBATALKAN</status>`;
    const doc = await callSoap("UpdatePartnershipStatus", xml);
    return {
      success: getBool(doc, "success"),
      message: getText(doc, "message"),
      data: undefined
    };
  },
};
