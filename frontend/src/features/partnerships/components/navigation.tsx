/* eslint-disable react-refresh/only-export-components */
import type { NavItem } from "./Sidebar";

const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const InboxIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M22 12h-4l-3 3-3-3H2" />
    <path d="M2 6v10a2 2 0 002 2h16a2 2 0 002-2V6" />
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const StatusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);

export function getUMKMNavItems(): NavItem[] {
  return [
    { label: "Temukan Mitra", path: "/partnerships", icon: <HomeIcon /> },
    { label: "Ajukan Kemitraan", path: "/partnerships/create", icon: <PlusIcon /> },
    { label: "Status Pengajuan", path: "/partnerships/status", icon: <StatusIcon /> },
  ];
}

export function getMitraNavItems(pendingCount?: number): NavItem[] {
  return [
    { label: "Inbox Pengajuan", path: "/mitra/partnerships/inbox", icon: <InboxIcon />, badge: pendingCount },
    { label: "Cari UMKM", path: "/mitra/partnerships", icon: <SearchIcon /> },
    { label: "Status Pengajuan", path: "/mitra/partnerships/status", icon: <StatusIcon /> },
  ];
}