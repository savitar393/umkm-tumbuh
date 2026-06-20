import type { UserStatus } from "../auth/api";

export const STATUS_LABEL: Record<UserStatus, string> = {
  MENUNGGU: "Menunggu Review",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
  PENDING: "Menunggu Review",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};

export const STATUS_OPTIONS: { value: UserStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Semua Status" },
  { value: "MENUNGGU", label: "Menunggu Review" },
  { value: "DISETUJUI", label: "Disetujui" },
  { value: "DITOLAK", label: "Ditolak" },
];

export function statusLabel(s: UserStatus): string {
  return STATUS_LABEL[s] ?? s;
}

export function statusClass(s: UserStatus): string {
  return s.toLowerCase();
}
