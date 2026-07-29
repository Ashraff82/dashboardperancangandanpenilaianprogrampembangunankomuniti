// Shared domain constants & helpers for DPPK dashboard
// Centralised so every module renders status / traffic lights consistently.

export const PROGRAM_STATUS = {
  Perancangan: { label: "Perancangan", color: "bg-slate-100 text-slate-700 border-slate-300", dot: "bg-slate-400" },
  Diluluskan: { label: "Diluluskan", color: "bg-blue-100 text-blue-700 border-blue-300", dot: "bg-blue-500" },
  DalamPelaksanaan: { label: "Dalam Pelaksanaan", color: "bg-amber-100 text-amber-800 border-amber-300", dot: "bg-amber-500" },
  Selesai: { label: "Selesai", color: "bg-emerald-100 text-emerald-700 border-emerald-300", dot: "bg-emerald-500" },
  Tergendala: { label: "Tergendala", color: "bg-rose-100 text-rose-700 border-rose-300", dot: "bg-rose-500" },
} as const;

export const TRAFFIC_LIGHT = {
  Hijau: { label: "On-Track", color: "text-emerald-600", bg: "bg-emerald-500", soft: "bg-emerald-100 text-emerald-700 border-emerald-300", hex: "#16a34a" },
  Kuning: { label: "Perhatian", color: "text-amber-600", bg: "bg-amber-500", soft: "bg-amber-100 text-amber-700 border-amber-300", hex: "#eab308" },
  Merah: { label: "Kritikal", color: "text-rose-600", bg: "bg-rose-500", soft: "bg-rose-100 text-rose-700 border-rose-300", hex: "#dc2626" },
} as const;

export const OE_STATUS = TRAFFIC_LIGHT; // same colour semantics

export const KATEGORI_PROGRAM = ["Infrastruktur", "Sosioekonomi", "Kesejahteraan Rakyat", "Transformasi Bandar"] as const;

export const KATEGORI_COLORS: Record<string, string> = {
  Infrastruktur: "#0f2a66",
  Sosioekonomi: "#f5b82e",
  "Kesejahteraan Rakyat": "#16a34a",
  "Transformasi Bandar": "#7d96dd",
};

export const OBJEK_AM = ["Emolumen", "Perkhidmatan & Bekalan", "Aset", "Bantuan & Kebajikan", "Lain-lain"] as const;

export const OBJEK_AM_COLORS: Record<string, string> = {
  Emolumen: "#0f2a66",
  "Perkhidmatan & Bekalan": "#f5b82e",
  Aset: "#16a34a",
  "Bantuan & Kebajikan": "#7d96dd",
  "Lain-lain": "#94a3b8",
};

export const PERANAN_LABEL: Record<string, string> = {
  Admin: "Pentadbir Sistem",
  PengurusProgram: "Pengurus Program",
  PegawaiPBT: "Pegawai PBT",
  Penilai: "Penilai Program",
  PengurusanAtasan: "Pengurusan Atasan",
  OrangAwam: "Orang Awam",
};

export const PERANAN_COLOR: Record<string, string> = {
  Admin: "bg-rose-100 text-rose-700 border-rose-300",
  PengurusProgram: "bg-blue-100 text-blue-700 border-blue-300",
  PegawaiPBT: "bg-amber-100 text-amber-800 border-amber-300",
  Penilai: "bg-emerald-100 text-emerald-700 border-emerald-300",
  PengurusanAtasan: "bg-purple-100 text-purple-700 border-purple-300",
  OrangAwam: "bg-slate-100 text-slate-700 border-slate-300",
};

export const GRED_COLOR: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-700 border-emerald-300",
  B: "bg-lime-100 text-lime-700 border-lime-300",
  C: "bg-amber-100 text-amber-800 border-amber-300",
  D: "bg-orange-100 text-orange-700 border-orange-300",
  E: "bg-rose-100 text-rose-700 border-rose-300",
};

export const BULAN_LABEL = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogs", "Sep", "Okt", "Nov", "Dis"];

// Format currency in RM
export function formatRM(value: number, compact = false): string {
  if (compact) {
    if (Math.abs(value) >= 1_000_000) return `RM ${(value / 1_000_000).toFixed(2)}J`;
    if (Math.abs(value) >= 1_000) return `RM ${(value / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat("ms-MY", { style: "currency", currency: "MYR", maximumFractionDigits: 0 }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("ms-MY").format(value);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ms-MY", { day: "2-digit", month: "short", year: "numeric" });
}

export function oeStatusFromPercent(pct: number): "Hijau" | "Kuning" | "Merah" {
  if (pct > 95) return "Merah";
  if (pct >= 80) return "Kuning";
  return "Hijau";
}
