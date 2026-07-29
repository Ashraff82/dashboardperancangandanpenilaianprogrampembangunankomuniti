"use client";

import * as React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line,
  PieChart, Pie, Cell,
  ResponsiveContainer,
} from "recharts";
import {
  BarChart3, FileText, FileSpreadsheet, FileBarChart, Download, Printer,
  Filter, Layers, CalendarDays, Award, Users2, Target, TrendingUp, Wallet,
  Trophy, ArrowUpDown, Loader2, FileDown,
} from "lucide-react";

import { GlassCard, StatCard, ModuleHeader, EmptyState, StatusBadge, GredBadge, ProgressBar } from "@/components/shared/dppk-ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  KATEGORI_PROGRAM, KATEGORI_COLORS, OBJEK_AM, PROGRAM_STATUS,
  formatRM, formatNumber, formatDate,
} from "@/lib/domain";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================
type StandardReport = {
  jenis: string;
  tahun: number;
  title: string;
  period: string;
  generatedAt: string;
  summaryStats: { label: string; value: string }[];
  tableRows: Record<string, any>[];
  chartData: Record<string, any>[];
  meta: {
    totalProgram: number;
    totalBajetDianggar: number;
    totalBajetSebenar: number;
    totalPenerima: number;
    byStatus: Record<string, number>;
    byKategori: Record<string, number>;
    byLampu: Record<string, number>;
  };
};

type CustomReport = {
  filters: any;
  summary: { key: string; label: string; value: string }[];
  tableRows: Record<string, any>[];
  meta: any;
  generatedAt: string;
};

type TrendReport = {
  years: number[];
  programCountTrend: { year: string; value: number }[];
  bajetTrend: { year: string; Dianggar: number; Sebenar: number }[];
  oeTrend: { year: string; Siling: number; Dibelanjakan: number }[];
  skorTrend: { year: string; Skor: number; Penilaian: number }[];
  kategoriStacked: Record<string, any>[];
  kategoriList: string[];
};

// ============================================================
// CSV / Print utilities
// ============================================================
function downloadCSV(rows: Record<string, any>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    const s = v == null ? "" : String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================
// Standard report catalog
// ============================================================
const STANDARD_REPORTS = [
  { jenis: "bulanan", title: "Laporan Bulanan", desc: "Ringkasan bulanan status program & perbelanjaan.", icon: CalendarDays, accent: "navy" as const },
  { jenis: "sukutahunan", title: "Laporan Suku Tahunan", desc: "Prestasi suku tahunan program komuniti KPKT.", icon: FileText, accent: "gold" as const },
  { jenis: "tahunan", title: "Laporan Tahunan", desc: "Laporan tahunan komprehensif semua program.", icon: BarChart3, accent: "navy" as const },
  { jenis: "oe", title: "Laporan Prestasi Perbelanjaan OE", desc: "Penggunaan siling & baki peruntukan objek ekonomi.", icon: Wallet, accent: "gold" as const },
  { jenis: "penilaian", title: "Laporan Penilaian Program", desc: "Skor penilaian, gred & pencapaian KPI program.", icon: Award, accent: "green" as const },
  { jenis: "impak", title: "Laporan Impak Komuniti", desc: "Penerima manfaat & maklum balas komuniti.", icon: Users2, accent: "navy" as const },
];

const TAHUN_OPTIONS = [2024, 2025, 2026];

// ============================================================
// MAIN COMPONENT
// ============================================================
export function ReportingAnalytics() {
  return (
    <div>
      <ModuleHeader
        title="Pelaporan & Analitik"
        description="Jana laporan standard KPKT, bina laporan tersuai & analisis trend pelbagai tahun."
        icon={<BarChart3 className="h-5 w-5" />}
        action={
          <Badge variant="outline" className="gap-1.5 border-[#0f2a66]/30 bg-white/60 text-[#0f2a66]">
            <FileBarChart className="h-3.5 w-3.5" />
            Modul 6
          </Badge>
        }
      />

      <Tabs defaultValue="standard" className="w-full">
        <TabsList className="glass flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl p-1.5 sm:flex-nowrap">
          <TabsTrigger value="standard" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <FileText className="h-4 w-4" /> Laporan Standard
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Filter className="h-4 w-4" /> Pembina Tersuai
          </TabsTrigger>
          <TabsTrigger value="trend" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <TrendingUp className="h-4 w-4" /> Analitik Trend
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Trophy className="h-4 w-4" /> Perbandingan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="standard" className="mt-4">
          <StandardReportsTab />
        </TabsContent>
        <TabsContent value="custom" className="mt-4">
          <CustomReportTab />
        </TabsContent>
        <TabsContent value="trend" className="mt-4">
          <TrendAnalyticsTab />
        </TabsContent>
        <TabsContent value="compare" className="mt-4">
          <ComparisonTab />
        </TabsContent>
      </Tabs>

      {/* Hidden print area — rendered only when standard report is open */}
      <PrintArea />
    </div>
  );
}

// ============================================================
// TAB 1: STANDARD REPORTS
// ============================================================
function StandardReportsTab() {
  const { toast } = useToast();
  const [tahun, setTahun] = React.useState(2026);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [report, setReport] = React.useState<StandardReport | null>(null);
  const [activeJenis, setActiveJenis] = React.useState<string>("");

  const generateReport = async (jenis: string) => {
    setActiveJenis(jenis);
    setLoading(true);
    setOpen(true);
    try {
      const res = await fetch(`/api/laporan/standard?jenis=${jenis}&tahun=${tahun}`);
      const data = await res.json();
      setReport(data);
    } catch (e) {
      toast({ title: "Ralat", description: "Gagal menjana laporan.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCSV = () => {
    if (!report) return;
    downloadCSV(report.tableRows, `laporan-${report.jenis}-${report.tahun}.csv`);
    toast({ title: "CSV Dimuat Turun", description: `Fail laporan_${report.jenis}_${report.tahun}.csv` });
  };

  const handlePrint = () => {
    if (!report) return;
    // Stash into a global so PrintArea can read it (set via window event)
    window.dispatchEvent(new CustomEvent("dppk-print-report", { detail: report }));
    setTimeout(() => window.print(), 100);
  };

  return (
    <div className="space-y-4">
      <GlassCard className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Pilih Laporan Standard KPKT</h3>
            <p className="text-sm text-muted-foreground">Tahun kewangan & jenis laporan tersenarai mengikut format standard KPKT.</p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="tahun-rep" className="text-xs text-muted-foreground">Tahun</Label>
            <Select value={String(tahun)} onValueChange={(v) => setTahun(Number(v))}>
              <SelectTrigger id="tahun-rep" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TAHUN_OPTIONS.map((t) => (
                  <SelectItem key={t} value={String(t)}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {STANDARD_REPORTS.map((r) => {
          const Icon = r.icon;
          return (
            <GlassCard key={r.jenis} className="group flex flex-col p-5 transition-all hover:shadow-[0_12px_40px_-8px_rgba(10,31,77,0.25)]">
              <div className="mb-3 flex items-start justify-between">
                <div className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg",
                  r.accent === "navy" ? "bg-gradient-to-br from-[#0f2a66] to-[#1a3a82]" : r.accent === "gold" ? "bg-gradient-to-br from-[#e09c12] to-[#f5b82e]" : "bg-gradient-to-br from-[#15803d] to-[#16a34a]"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="border-[#0f2a66]/20 bg-white/60 text-[#0f2a66]">{tahun}</Badge>
              </div>
              <h4 className="text-sm font-bold text-foreground">{r.title}</h4>
              <p className="mt-1 flex-1 text-xs text-muted-foreground">{r.desc}</p>
              <Button
                onClick={() => generateReport(r.jenis)}
                className="mt-4 w-full bg-[#0f2a66] text-white hover:bg-[#0a1f4d]"
                size="sm"
              >
                <FileBarChart className="mr-1.5 h-4 w-4" /> Jana Laporan
              </Button>
            </GlassCard>
          );
        })}
      </div>

      {/* Report Preview Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] w-[96vw] max-w-5xl overflow-hidden rounded-2xl border-white/55 bg-white/85 backdrop-blur-xl">
          <DialogHeader className="border-b border-slate-200/70 pb-3">
            <DialogTitle className="flex items-center gap-2 text-base text-[#0f2a66] sm:text-lg">
              <FileText className="h-5 w-5" /> {loading ? "Menjana laporan..." : report?.title || "Laporan"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {report ? `${report.period} · Dijana pada ${formatDate(new Date(report.generatedAt))}` : "Memuatkan data..."}
            </DialogDescription>
          </DialogHeader>

          {loading || !report ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#0f2a66]" />
            </div>
          ) : (
            <div className="max-h-[68vh] overflow-y-auto scroll-thin pr-1">
              {/* Summary Stats */}
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {report.summaryStats.map((s, i) => (
                  <div key={i} className="rounded-xl border border-slate-200/70 bg-white/70 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
                    <p className="mt-0.5 text-sm font-bold text-[#0f2a66]">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Mini chart */}
              {report.chartData.length > 0 && (
                <GlassCard className="mb-4 p-4">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">Carta Visual</p>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      {report.jenis === "oe" ? (
                        <BarChart data={report.chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}J`} />
                          <Tooltip formatter={(v: any) => formatRM(Number(v))} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="Siling" fill="#0f2a66" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Dibelanjakan" fill="#f5b82e" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Komited" fill="#7d96dd" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      ) : report.jenis === "penilaian" ? (
                        <PieChart>
                          <Pie data={report.chartData} dataKey="value" nameKey="name" outerRadius={80} label={{ fontSize: 11 }}>
                            {report.chartData.map((_, i) => (
                              <Cell key={i} fill={["#16a34a", "#84cc16", "#eab308", "#f97316", "#dc2626"][i % 5]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      ) : (
                        <PieChart>
                          <Pie data={report.chartData} dataKey="value" nameKey="name" outerRadius={80} label={{ fontSize: 11 }}>
                            {report.chartData.map((_, i) => (
                              <Cell key={i} fill={["#0f2a66", "#f5b82e", "#16a34a", "#7d96dd", "#dc2626", "#eab308"][i % 6]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
              )}

              {/* Table */}
              <GlassCard className="p-2">
                <p className="px-2 pb-2 pt-1 text-xs font-semibold text-muted-foreground">Butiran Laporan ({report.tableRows.length} baris)</p>
                <div className="max-h-72 overflow-auto scroll-thin rounded-lg border border-slate-200/60">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-[#0f2a66] text-white">
                      <TableRow className="hover:bg-[#0f2a66]">
                        {report.tableRows[0] && Object.keys(report.tableRows[0]).map((h) => (
                          <TableHead key={h} className="text-[11px] font-semibold uppercase tracking-wide text-white">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.tableRows.map((row, i) => (
                        <TableRow key={i} className="text-xs">
                          {Object.keys(report.tableRows[0]).map((h) => (
                            <TableCell key={h} className="py-1.5 text-xs">{String(row[h] ?? "")}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </GlassCard>
            </div>
          )}

          <DialogFooter className="border-t border-slate-200/70 pt-3">
            <Button variant="outline" onClick={() => setOpen(false)}>Tutup</Button>
            <Button variant="outline" onClick={handleCSV} disabled={!report || !report.tableRows.length} className="gap-1.5">
              <FileSpreadsheet className="h-4 w-4" /> Muat Turun CSV
            </Button>
            <Button onClick={handlePrint} disabled={!report} className="gap-1.5 bg-[#0f2a66] text-white hover:bg-[#0a1f4d]">
              <Printer className="h-4 w-4" /> Cetak PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// PRINT AREA (hidden, visible only on print)
// ============================================================
function PrintArea() {
  const [report, setReport] = React.useState<StandardReport | null>(null);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<StandardReport>;
      setReport(ce.detail);
    };
    window.addEventListener("dppk-print-report", handler as EventListener);
    return () => window.removeEventListener("dppk-print-report", handler as EventListener);
  }, []);

  if (!report) return null;

  return (
    <div id="report-print-area" className="hidden print:block">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #report-print-area, #report-print-area * { visibility: visible !important; }
          #report-print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; background: white !important; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="mb-6 border-b-2 border-[#0f2a66] pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#0f2a66]">KEMENTERIAN PERUMAHAN DAN KERAJAAN TEMPATAN (KPKT)</h1>
            <p className="text-sm text-slate-600">Dashboard Perancangan & Penilaian Program Pembangunan Komuniti (DPPK)</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>Dijana: {formatDate(new Date(report.generatedAt))}</p>
            <p>Tempoh: {report.period}</p>
          </div>
        </div>
        <h2 className="mt-3 text-lg font-bold text-[#0f2a66]">{report.title}</h2>
      </div>

      <h3 className="mb-2 text-sm font-bold text-slate-700">Ringkasan Statistik</h3>
      <table className="mb-5 w-full border-collapse border border-slate-300 text-xs">
        <tbody>
          {report.summaryStats.map((s, i) => (
            <tr key={i} className={i % 2 ? "bg-slate-50" : ""}>
              <td className="border border-slate-300 px-2 py-1 font-medium">{s.label}</td>
              <td className="border border-slate-300 px-2 py-1">{s.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="mb-2 text-sm font-bold text-slate-700">Jadual Butiran ({report.tableRows.length} rekod)</h3>
      <table className="w-full border-collapse border border-slate-300 text-[10px]">
        <thead>
          <tr className="bg-[#0f2a66] text-white">
            {report.tableRows[0] && Object.keys(report.tableRows[0]).map((h) => (
              <th key={h} className="border border-slate-300 px-1.5 py-1 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.tableRows.map((row, i) => (
            <tr key={i} className={i % 2 ? "bg-slate-50" : ""}>
              {report.tableRows[0] && Object.keys(report.tableRows[0]).map((h) => (
                <td key={h} className="border border-slate-300 px-1.5 py-0.5">{String(row[h] ?? "")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-6 text-[10px] italic text-slate-500">
        Laporan ini dijana secara automatik oleh Sistem DPPK KPKT. © {new Date().getFullYear()} KPKT Malaysia.
      </p>
    </div>
  );
}

// ============================================================
// TAB 2: CUSTOM REPORT BUILDER
// ============================================================
const METRICS = [
  { key: "JumlahProgram", label: "Jumlah Program" },
  { key: "JumlahBajet", label: "Jumlah Bajet" },
  { key: "PenerimaManfaat", label: "Penerima Manfaat" },
  { key: "PurataKemajuan", label: "Purata Kemajuan" },
  { key: "SkorPenilaian", label: "Skor Penilaian" },
  { key: "PeruntukanOE", label: "Peruntukan OE" },
  { key: "BakiPeruntukan", label: "Baki Peruntukan" },
];

function CustomReportTab() {
  const { toast } = useToast();
  const [tahun, setTahun] = React.useState<string>("2026");
  const [negeri, setNegeri] = React.useState<string[]>([]);
  const [kategori, setKategori] = React.useState<string[]>([]);
  const [status, setStatus] = React.useState<string[]>([]);
  const [objekAm, setObjekAm] = React.useState<string[]>([]);
  const [metrics, setMetrics] = React.useState<string[]>(METRICS.map((m) => m.key));
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<CustomReport | null>(null);

  const NEGERI_LIST = [
    "Selangor", "Johor", "Pulau Pinang", "Sabah", "Sarawak", "Perak",
    "Kedah", "Kelantan", "Pahang", "Negeri Sembilan", "Melaka",
    "Terengganu", "Perlis", "Wilayah Persekutuan Kuala Lumpur",
    "Wilayah Persekutuan Putrajaya", "Wilayah Persekutuan Labuan",
  ];

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (tahun) params.set("tahun", tahun);
    negeri.forEach((n) => params.append("negeri", n));
    kategori.forEach((k) => params.append("kategori", k));
    status.forEach((s) => params.append("status", s));
    objekAm.forEach((o) => params.append("objekAm", o));
    if (metrics.length) params.set("metrics", metrics.join(","));
    return params.toString();
  };

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/laporan/custom?${buildQuery()}`);
      const data = await res.json();
      setResult(data);
      toast({ title: "Laporan Dijana", description: `${data.tableRows.length} rekod diproses.` });
    } catch (e) {
      toast({ title: "Ralat", description: "Gagal menjana laporan.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Filter panel */}
      <GlassCard className="p-4 lg:col-span-4 xl:col-span-3">
        <div className="mb-3 flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#0f2a66]" />
          <h3 className="text-sm font-bold text-foreground">Penapis Laporan</h3>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tahun Kewangan</Label>
            <Select value={tahun} onValueChange={setTahun}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Tahun</SelectItem>
                {TAHUN_OPTIONS.map((t) => <SelectItem key={t} value={String(t)}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <CheckboxGroup label="Negeri" options={NEGERI_LIST} selected={negeri} onToggle={(v) => toggle(negeri, setNegeri, v)} />
          <CheckboxGroup label="Kategori Program" options={[...KATEGORI_PROGRAM]} selected={kategori} onToggle={(v) => toggle(kategori, setKategori, v)} />
          <CheckboxGroup label="Status Program" options={Object.keys(PROGRAM_STATUS)} selected={status} onToggle={(v) => toggle(status, setStatus, v)} />
          <CheckboxGroup label="Objek Am (OE)" options={[...OBJEK_AM]} selected={objekAm} onToggle={(v) => toggle(objekAm, setObjekAm, v)} />

          <div>
            <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Metrik</Label>
            <div className="grid grid-cols-1 gap-1.5 rounded-lg border border-slate-200/70 bg-white/60 p-2">
              {METRICS.map((m) => (
                <label key={m.key} className="flex items-center gap-2 text-xs">
                  <Checkbox checked={metrics.includes(m.key)} onCheckedChange={() => toggle(metrics, setMetrics, m.key)} />
                  {m.label}
                </label>
              ))}
            </div>
          </div>

          <Button onClick={generate} disabled={loading} className="w-full bg-[#0f2a66] text-white hover:bg-[#0a1f4d]">
            {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileBarChart className="mr-1.5 h-4 w-4" />}
            Jana Laporan
          </Button>
        </div>
      </GlassCard>

      {/* Results */}
      <div className="space-y-4 lg:col-span-8 xl:col-span-9">
        {!result ? (
          <GlassCard className="p-8">
            <EmptyState
              icon={<FileText className="h-10 w-10" />}
              title="Belum ada laporan dijana"
              description="Tetapkan penapis di sebelah kiri dan klik 'Jana Laporan' untuk melihat data tersuai."
            />
          </GlassCard>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {result.summary.map((s) => (
                <GlassCard key={s.key} className="p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
                  <p className="mt-0.5 text-base font-bold text-[#0f2a66]">{s.value}</p>
                </GlassCard>
              ))}
            </div>

            <GlassCard className="p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-muted-foreground">Keputusan ({result.tableRows.length} rekod)</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    downloadCSV(result.tableRows, "laporan-tersuai.csv");
                    toast({ title: "CSV Dimuat Turun" });
                  }}
                  className="gap-1.5"
                >
                  <FileDown className="h-4 w-4" /> Eksport CSV
                </Button>
              </div>
              <div className="max-h-[480px] overflow-auto scroll-thin rounded-lg border border-slate-200/60">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-[#0f2a66]">
                    <TableRow className="hover:bg-[#0f2a66]">
                      {result.tableRows[0] && Object.keys(result.tableRows[0]).map((h) => (
                        <TableHead key={h} className="text-[11px] font-semibold uppercase tracking-wide text-white">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.tableRows.map((row, i) => (
                      <TableRow key={i} className="text-xs">
                        {result.tableRows[0] && Object.keys(result.tableRows[0]).map((h) => (
                          <TableCell key={h} className="py-1.5 text-xs">{String(row[h] ?? "")}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </GlassCard>
          </>
        )}
      </div>
    </div>
  );
}

function CheckboxGroup({
  label, options, selected, onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="max-h-36 overflow-y-auto scroll-thin rounded-lg border border-slate-200/70 bg-white/60 p-2">
        <div className="space-y-1.5">
          {options.map((o) => (
            <label key={o} className="flex items-center gap-2 text-xs">
              <Checkbox checked={selected.includes(o)} onCheckedChange={() => onToggle(o)} />
              <span className="truncate">{o}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB 3: TREND ANALYTICS
// ============================================================
function TrendAnalyticsTab() {
  const [data, setData] = React.useState<TrendReport | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/laporan/trend")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-80 animate-pulse rounded-2xl bg-white/40" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Program (2026)" value={formatNumber(data.programCountTrend[2]?.value || 0)} icon={<Target className="h-5 w-5" />} accent="navy" />
        <StatCard label="Bajet Dianggar (2026)" value={formatRM(data.bajetTrend[2]?.Dianggar || 0, true)} icon={<Wallet className="h-5 w-5" />} accent="gold" />
        <StatCard label="OE Dibelanjakan (2026)" value={formatRM(data.oeTrend[2]?.Dibelanjakan || 0, true)} icon={<BarChart3 className="h-5 w-5" />} accent="navy" />
        <StatCard label="Purata Skor (2026)" value={(data.skorTrend[2]?.Skor || 0).toFixed(2)} icon={<Award className="h-5 w-5" />} accent="green" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Program count trend */}
        <GlassCard className="p-4">
          <p className="mb-2 text-sm font-semibold text-foreground">Trend Jumlah Program (2024–2026)</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.programCountTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" name="Bilangan Program" stroke="#0f2a66" strokeWidth={2.5} dot={{ r: 5, fill: "#0f2a66" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Bajet trend */}
        <GlassCard className="p-4">
          <p className="mb-2 text-sm font-semibold text-foreground">Trend Bajet: Dianggar vs Sebenar</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.bajetTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}J`} />
                <Tooltip formatter={(v: any) => formatRM(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Dianggar" fill="#0f2a66" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Sebenar" fill="#f5b82e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* OE trend */}
        <GlassCard className="p-4">
          <p className="mb-2 text-sm font-semibold text-foreground">Trend OE: Siling vs Dibelanjakan</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.oeTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}J`} />
                <Tooltip formatter={(v: any) => formatRM(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Siling" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Dibelanjakan" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Skor trend */}
        <GlassCard className="p-4">
          <p className="mb-2 text-sm font-semibold text-foreground">Trend Skor Penilaian (purata)</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.skorTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Skor" name="Purata Skor" stroke="#f5b82e" strokeWidth={2.5} dot={{ r: 5, fill: "#f5b82e" }} />
                <Line type="monotone" dataKey="Penilaian" name="Bil. Penilaian" stroke="#0f2a66" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Kategori distribution evolution */}
      <GlassCard className="p-4">
        <p className="mb-2 text-sm font-semibold text-foreground">Evolusi Taburan Kategori Program Mengikut Tahun</p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.kategoriStacked}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {data.kategoriList.map((k) => (
                <Bar key={k} dataKey={k} stackId="a" fill={KATEGORI_COLORS[k] || "#94a3b8"} radius={[0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}

// ============================================================
// TAB 4: PROGRAM COMPARISON
// ============================================================
type CompareRow = {
  kodProgram: string;
  namaProgram: string;
  kategori: string;
  negeri: string;
  bajetDianggar: number;
  penerimaManfaat: number;
  skorPenilaian: number | null;
  gredPenilaian: string | null;
  pencapaianKPI: number | null;
  peratusKemajuan: number;
};

function ComparisonTab() {
  const [rows, setRows] = React.useState<CompareRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [kategoriFilter, setKategoriFilter] = React.useState<string>("all");
  const [sortKey, setSortKey] = React.useState<keyof CompareRow>("bajetDianggar");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");

  React.useEffect(() => {
    fetch("/api/laporan/custom?metrics=JumlahBajet")
      .then((r) => r.json())
      .then((d) => {
        // We need richer data; fetch programs directly via custom report
        // The custom report returns tableRows (formatted strings); for comparison we want raw numeric.
        // Use the overview-like approach: fetch /api/laporan/custom without metrics filter.
        setRows(
          (d.tableRows || []).map((r: any) => ({
            kodProgram: r["Kod Program"],
            namaProgram: r["Nama Program"],
            kategori: r["Kategori"],
            negeri: r["Negeri"],
            bajetDianggar: parseFloat(String(r["Bajet (RM)"]).replace(/,/g, "")) || 0,
            penerimaManfaat: Number(r["Penerima"]) || 0,
            skorPenilaian: r["Skor Penilaian"] && r["Skor Penilaian"] !== "-" ? parseFloat(r["Skor Penilaian"]) : null,
            gredPenilaian: r["Gred"] && r["Gred"] !== "-" ? r["Gred"] : null,
            pencapaianKPI: null,
            peratusKemajuan: parseFloat(r["Kemajuan (%)"]) || 0,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = React.useMemo(() => {
    let out = rows;
    if (kategoriFilter !== "all") out = out.filter((r) => r.kategori === kategoriFilter);
    out = [...out].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return out;
  }, [rows, kategoriFilter, sortKey, sortDir]);

  // Top performer per kategori: highest skorPenilaian
  const topByKategori = React.useMemo(() => {
    const map: Record<string, CompareRow | null> = {};
    for (const r of rows) {
      if (r.skorPenilaian == null) continue;
      if (!map[r.kategori] || (map[r.kategori]!.skorPenilaian ?? 0) < r.skorPenilaian) {
        map[r.kategori] = r;
      }
    }
    return map;
  }, [rows]);

  const toggleSort = (key: keyof CompareRow) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-2xl bg-white/40" />
        <div className="h-96 animate-pulse rounded-2xl bg-white/40" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top performers banner */}
      <GlassCard className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[#f5b82e]" />
          <h3 className="text-sm font-bold text-foreground">Pencapaian Tertinggi Mengikut Kategori</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {KATEGORI_PROGRAM.map((k) => {
            const top = topByKategori[k];
            return (
              <div key={k} className="rounded-xl border border-slate-200/70 bg-white/60 p-3" style={{ borderLeft: `3px solid ${KATEGORI_COLORS[k]}` }}>
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: KATEGORI_COLORS[k] }}>{k}</p>
                {top ? (
                  <>
                    <p className="mt-1 line-clamp-1 text-xs font-bold text-foreground">{top.namaProgram}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <GredBadge gred={top.gredPenilaian ?? "-"} />
                      <span className="text-xs text-muted-foreground">Skor {(top.skorPenilaian ?? 0).toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">Tiada penilaian</p>
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard className="p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-foreground">Perbandingan Program (Boleh Disusun)</h3>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Kategori:</Label>
            <Select value={kategoriFilter} onValueChange={setKategoriFilter}>
              <SelectTrigger className="h-8 w-48 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {KATEGORI_PROGRAM.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="max-h-[520px] overflow-auto scroll-thin rounded-lg border border-slate-200/60">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-[#0f2a66]">
              <TableRow className="hover:bg-[#0f2a66]">
                <SortableHead label="Kod" k="kodProgram" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-white">Nama Program</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-white">Negeri</TableHead>
                <SortableHead label="Bajet" k="bajetDianggar" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableHead label="Penerima" k="penerimaManfaat" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableHead label="Skor" k="skorPenilaian" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-white">Gred</TableHead>
                <SortableHead label="Kemajuan" k="peratusKemajuan" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const isTop = topByKategori[r.kategori]?.kodProgram === r.kodProgram;
                return (
                  <TableRow key={r.kodProgram} className={cn("text-xs", isTop && "bg-[#f5b82e]/10")}>
                    <TableCell className="font-mono text-[11px] text-[#0f2a66]">{r.kodProgram}</TableCell>
                    <TableCell className="max-w-[220px] truncate text-xs font-medium">{r.namaProgram}</TableCell>
                    <TableCell className="text-xs">{r.negeri}</TableCell>
                    <TableCell className="text-xs font-medium">{formatRM(r.bajetDianggar, true)}</TableCell>
                    <TableCell className="text-xs">{formatNumber(r.penerimaManfaat)}</TableCell>
                    <TableCell className="text-xs font-semibold">{r.skorPenilaian != null ? r.skorPenilaian.toFixed(2) : "—"}</TableCell>
                    <TableCell>{r.gredPenilaian ? <GredBadge gred={r.gredPenilaian} /> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="w-28">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={r.peratusKemajuan} />
                        <span className="text-[10px] text-muted-foreground">{r.peratusKemajuan.toFixed(0)}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </GlassCard>
    </div>
  );
}

function SortableHead({
  label, k, sortKey, sortDir, onSort,
}: {
  label: string;
  k: keyof CompareRow;
  sortKey: keyof CompareRow;
  sortDir: "asc" | "desc";
  onSort: (k: keyof CompareRow) => void;
}) {
  return (
    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-white">
      <button
        onClick={() => onSort(k)}
        className="inline-flex items-center gap-1 hover:text-[#f5b82e]"
      >
        {label}
        <ArrowUpDown className={cn("h-3 w-3", sortKey === k && "text-[#f5b82e]")} />
        {sortKey === k && <span className="text-[9px]">{sortDir === "asc" ? "▲" : "▼"}</span>}
      </button>
    </TableHead>
  );
}
