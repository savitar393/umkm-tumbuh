import type { UserStatus } from "../auth/api";

export const STATUS_LABEL: Record<UserStatus, string> = {
  PENDING: "Menunggu Review",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};

export const STATUS_OPTIONS: { value: UserStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Semua Status" },
  { value: "PENDING", label: "Menunggu Review" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "REJECTED", label: "Ditolak" },
];

export function displayStatus(status: UserStatus, isActive: boolean): string {
  if (status === "APPROVED" && !isActive) return "Nonaktif";
  return STATUS_LABEL[status];
}

export function statusLabel(s: UserStatus): string {
  return STATUS_LABEL[s];
}

export function statusClass(s: UserStatus): string {
  return s.toLowerCase();
}
