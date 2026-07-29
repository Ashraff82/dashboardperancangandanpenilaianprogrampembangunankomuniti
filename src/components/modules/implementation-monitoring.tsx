"use client";

import * as React from "react";
import {
  Activity, AlertTriangle, CheckCircle2, Clock, ClipboardList,
  Plus, X, FileText, ImageIcon, Upload, Eye, RefreshCw, PencilLine,
  AlertOctagon, TrendingDown, Calendar,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

import {
  GlassCard, StatCard, ModuleHeader, StatusBadge, TrafficLight, ProgressBar, EmptyState,
} from "@/components/shared/dppk-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  formatRM, formatNumber, formatDate, KATEGORI_COLORS, TRAFFIC_LIGHT,
} from "@/lib/domain";
import { cn } from "@/lib/utils";

/* ===================== Types ===================== */
type MonitoringProgram = {
  id: string;
  kodProgram: string;
  namaProgram: string;
  kategori: string;
  negeri: string;
  daerah: string;
  pbt: string | null;
  status: string;
  statusLampu: string;
  peratusKemajuan: number;
  bajetDianggar: number;
  bajetSebenar: number;
  tarikhMula: string;
  tarikhTamat: string;
  pengurus: { nama: string; jawatan: string };
  _count: { aktiviti: number; isuRisiko: number; kemajuan: number };
  bajetVariance: number;
  peratusBajet: number;
  isuTerbuka: number;
};

type Kemajuan = {
  id: string;
  peratusKemajuan: number;
  catatan: string | null;
  bukti: string | null;
  tarikh: string;
  pengguna: { nama: string; jawatan: string; peranan: string };
};

type Aktiviti = {
  id: string;
  nama: string;
  tarikhMula: string;
  tarikhTamat: string;
  peratusKemajuan: number;
  status: string;
  PIC: string | null;
};

type Isu = {
  id: string;
  jenis: string;
  tajuk: string;
  penerangan: string;
  keutamaan: string;
  status: string;
  tarikhLapor: string;
  tarikhSelesai: string | null;
  tindakan: string | null;
  program: { kodProgram: string; namaProgram: string; negeri: string };
  pelapor: { nama: string; jawatan: string };
};

/* ===================== Helpers ===================== */
const KEUTAMAAN_COLOR: Record<string, string> = {
  Kritikal: "bg-rose-100 text-rose-700 border-rose-300",
  Tinggi: "bg-orange-100 text-orange-700 border-orange-300",
  Sederhana: "bg-amber-100 text-amber-800 border-amber-300",
  Rendah: "bg-slate-100 text-slate-700 border-slate-300",
};

const ISU_STATUS_COLOR: Record<string, string> = {
  Terbuka: "bg-rose-100 text-rose-700 border-rose-300",
  DalamTindakan: "bg-amber-100 text-amber-800 border-amber-300",
  Selesai: "bg-emerald-100 text-emerald-700 border-emerald-300",
};

const AKTIVITI_COLOR: Record<string, string> = {
  Selesai: "#16a34a",
  DalamProgress: "#0f2a66",
  BelumMula: "#94a3b8",
  Tertangguh: "#dc2626",
};

/* ===================== Component ===================== */
export function ImplementationMonitoring() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [programs, setPrograms] = React.useState<MonitoringProgram[]>([]);
  const [summary, setSummary] = React.useState({
    totalAktif: 0, totalTergendala: 0, totalIsuTerbuka: 0, purataKemajuan: 0, totalDipaparkan: 0,
  });
  const [alerts, setAlerts] = React.useState<MonitoringProgram[]>([]);
  const [dismissedAlertIds, setDismissedAlertIds] = React.useState<Set<string>>(new Set());
  const [filters, setFilters] = React.useState<{ negeriList: string[]; kategoriList: string[] }>({
    negeriList: [], kategoriList: [],
  });

  // Filter state
  const [fStatus, setFStatus] = React.useState("all");
  const [fNegeri, setFNegeri] = React.useState("all");
  const [fKategori, setFKategori] = React.useState("all");
  const [fLampu, setFLampu] = React.useState("all");
  const [search, setSearch] = React.useState("");

  // Issue log state
  const [isuList, setIsuList] = React.useState<Isu[]>([]);
  const [isuSummary, setIsuSummary] = React.useState({
    total: 0, terbuka: 0, dalamTindakan: 0, selesai: 0, kritikal: 0, tinggi: 0,
  });
  const [isuFilterStatus, setIsuFilterStatus] = React.useState("all");
  const [isuFilterJenis, setIsuFilterJenis] = React.useState("all");
  const [laporIsuOpen, setLaporIsuOpen] = React.useState(false);

  // Program detail drawer
  const [detailProgram, setDetailProgram] = React.useState<MonitoringProgram | null>(null);
  const [detailKemajuan, setDetailKemajuan] = React.useState<Kemajuan[]>([]);
  const [detailAktiviti, setDetailAktiviti] = React.useState<Aktiviti[]>([]);
  const [detailIsu, setDetailIsu] = React.useState<Isu[]>([]);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detailTab, setDetailTab] = React.useState("gantt");

  // "Tambah Kemajuan" form
  const [kemajuanForm, setKemajuanForm] = React.useState({
    peratusKemajuan: 0, catatan: "", bukti: "",
  });
  const [kemajuanSaving, setKemajuanSaving] = React.useState(false);

  // "Lapor Isu" form
  const [isuForm, setIsuForm] = React.useState({
    programId: "", jenis: "Isu", tajuk: "", penerangan: "", keutamaan: "Sederhana",
  });

  const loadMonitoring = React.useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (fStatus !== "all") params.set("status", fStatus);
    if (fNegeri !== "all") params.set("negeri", fNegeri);
    if (fKategori !== "all") params.set("kategori", fKategori);
    if (fLampu !== "all") params.set("statusLampu", fLampu);
    if (search) params.set("q", search);
    try {
      const res = await fetch(`/api/programs/monitoring?${params.toString()}`);
      const data = await res.json();
      setPrograms(data.programs);
      setSummary(data.summary);
      setAlerts(data.alerts);
      setFilters(data.filters);
    } catch {
      toast({ title: "Ralat", description: "Gagal memuatkan data pemantauan", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [fStatus, fNegeri, fKategori, fLampu, search, toast]);

  const loadIsu = React.useCallback(async () => {
    const params = new URLSearchParams();
    if (isuFilterStatus !== "all") params.set("status", isuFilterStatus);
    if (isuFilterJenis !== "all") params.set("jenis", isuFilterJenis);
    try {
      const res = await fetch(`/api/isu?${params.toString()}`);
      const data = await res.json();
      setIsuList(data.data);
      setIsuSummary(data.summary);
    } catch {
      /* ignore */
    }
  }, [isuFilterStatus, isuFilterJenis]);

  React.useEffect(() => { loadMonitoring(); }, [loadMonitoring]);
  React.useEffect(() => { loadIsu(); }, [loadIsu]);

  // ---- Program detail open ----
  const openDetail = async (p: MonitoringProgram) => {
    setDetailProgram(p);
    setDetailLoading(true);
    setDetailTab("gantt");
    try {
      const [kRes, aRes, iRes] = await Promise.all([
        fetch(`/api/programs/${p.id}/kemajuan`),
        fetch(`/api/programs/${p.id}/aktiviti`),
        fetch(`/api/isu?programId=${p.id}`),
      ]);
      // aktiviti endpoint may not exist — fall back to filter from program table
      let aktiviti: Aktiviti[] = [];
      if (aRes.ok) {
        const ad = await aRes.json();
        aktiviti = ad.data ?? ad ?? [];
      }
      const kd = await kRes.json();
      const id_ = await iRes.json();
      setDetailKemajuan(kd.data ?? []);
      setDetailAktiviti(aktiviti);
      setDetailIsu(id_.data ?? []);
    } catch {
      toast({ title: "Ralat", description: "Gagal memuatkan butiran program", variant: "destructive" });
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshKemajuan = async () => {
    if (!detailProgram) return;
    const res = await fetch(`/api/programs/${detailProgram.id}/kemajuan`);
    const d = await res.json();
    setDetailKemajuan(d.data ?? []);
  };

  // ---- Submit kemajuan ----
  const submitKemajuan = async () => {
    if (!detailProgram) return;
    if (kemajuanForm.peratusKemajuan < 0 || kemajuanForm.peratusKemajuan > 100) {
      toast({ title: "Ralat", description: "Peratus mesti 0-100", variant: "destructive" });
      return;
    }
    setKemajuanSaving(true);
    try {
      const res = await fetch(`/api/programs/${detailProgram.id}/kemajuan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          peratusKemajuan: Number(kemajuanForm.peratusKemajuan),
          catatan: kemajuanForm.catatan || null,
          bukti: kemajuanForm.bukti || null,
        }),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      toast({
        title: "Kemajuan Dikemas Kini",
        description: `${detailProgram.kodProgram}: ${kemajuanForm.peratusKemajuan}% (${d.statusLampu})`,
      });
      setKemajuanForm({ peratusKemajuan: 0, catatan: "", bukti: "" });
      await refreshKemajuan();
      await loadMonitoring();
    } catch {
      toast({ title: "Ralat", description: "Gagal menyimpan kemajuan", variant: "destructive" });
    } finally {
      setKemajuanSaving(false);
    }
  };

  // ---- Submit Isu ----
  const submitIsu = async () => {
    if (!isuForm.programId || !isuForm.tajuk || !isuForm.penerangan) {
      toast({ title: "Ralat", description: "Sila lengkapkan semua medan wajib", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`/api/isu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isuForm),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Isu Dilaporkan", description: `${isuForm.jenis}: ${isuForm.tajuk}` });
      setIsuForm({ programId: "", jenis: "Isu", tajuk: "", penerangan: "", keutamaan: "Sederhana" });
      setLaporIsuOpen(false);
      await loadIsu();
      await loadMonitoring();
    } catch {
      toast({ title: "Ralat", description: "Gagal melaporkan isu", variant: "destructive" });
    }
  };

  // ---- Mark Isu Selesai ----
  const markIsuSelesai = async (id: string, tajuk: string) => {
    try {
      const res = await fetch(`/api/isu/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Selesai", tindakan: "Selesai selepas pemantauan & tindakan." }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Isu Diselesaikan", description: tajuk });
      await loadIsu();
      await loadMonitoring();
      if (detailProgram) {
        const r = await fetch(`/api/isu?programId=${detailProgram.id}`);
        const d = await r.json();
        setDetailIsu(d.data ?? []);
      }
    } catch {
      toast({ title: "Ralat", description: "Gagal menyelesaikan isu", variant: "destructive" });
    }
  };

  // ---- Dismiss alert ----
  const dismissAlert = (id: string) => {
    setDismissedAlertIds((prev) => new Set(prev).add(id));
  };

  /* ===================== Render ===================== */
  if (loading) {
    return (
      <div>
        <ModuleHeader title="Pelaksanaan & Pemantauan" description="Memuatkan modul..." icon={<Activity className="h-5 w-5" />} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/40" />
          ))}
        </div>
        <div className="mt-4 h-96 animate-pulse rounded-2xl bg-white/40" />
      </div>
    );
  }

  const visibleAlerts = alerts.filter((a) => !dismissedAlertIds.has(a.id));

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Pelaksanaan & Pemantauan"
        description="Pemantauan kemajuan, jadual Gantt, pengurusan isu/risiko & status lampu isyarat program"
        icon={<Activity className="h-5 w-5" />}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { loadMonitoring(); loadIsu(); }}>
              <RefreshCw className="h-4 w-4" /> Segar Semula
            </Button>
            <Button size="sm" onClick={() => setLaporIsuOpen(true)} className="bg-[#0f2a66] hover:bg-[#1a3a82]">
              <Plus className="h-4 w-4" /> Lapor Isu
            </Button>
          </div>
        }
      />

      {/* ============ FILTER BAR ============ */}
      <GlassCard className="p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Semua status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="DalamPelaksanaan">Dalam Pelaksanaan</SelectItem>
                <SelectItem value="Tergendala">Tergendala</SelectItem>
                <SelectItem value="Selesai">Selesai</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Negeri</Label>
            <Select value={fNegeri} onValueChange={setFNegeri}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Semua negeri" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Negeri</SelectItem>
                {filters.negeriList.map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Kategori</Label>
            <Select value={fKategori} onValueChange={setFKategori}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Semua kategori" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {filters.kategoriList.map((k) => (
                  <SelectItem key={k} value={k}>{k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Lampu Isyarat</Label>
            <Select value={fLampu} onValueChange={setFLampu}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Semua lampu" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="Hijau">Hijau — On-Track</SelectItem>
                <SelectItem value="Kuning">Kuning — Perhatian</SelectItem>
                <SelectItem value="Merah">Merah — Kritikal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Carian</Label>
            <Input
              className="h-9"
              placeholder="Kod / nama program..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </GlassCard>

      {/* ============ TOP STAT CARDS ============ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Program Aktif"
          value={formatNumber(summary.totalAktif)}
          sub="Dalam pelaksanaan"
          icon={<Activity className="h-5 w-5" />}
          accent="navy"
        />
        <StatCard
          label="Program Tergendala"
          value={formatNumber(summary.totalTergendala)}
          sub="Memerlukan tindakan segera"
          icon={<AlertOctagon className="h-5 w-5" />}
          accent="red"
        />
        <StatCard
          label="Purata Kemajuan"
          value={`${summary.purataKemajuan.toFixed(1)}%`}
          sub={`${summary.totalDipaparkan} program dipantau`}
          icon={<TrendingDown className="h-5 w-5" />}
          accent="gold"
        />
        <StatCard
          label="Isu Terbuka"
          value={formatNumber(summary.totalIsuTerbuka)}
          sub={`${isuSummary.kritikal} kritikal • ${isuSummary.tinggi} tinggi`}
          icon={<AlertTriangle className="h-5 w-5" />}
          accent="amber"
        />
      </div>

      {/* ============ ALERT BANNER (FR-4.6) ============ */}
      {visibleAlerts.length > 0 && (
        <GlassCard className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Peringatan Automatik — Program Kritikal</h3>
                <p className="text-xs text-muted-foreground">
                  {visibleAlerts.length} program memerlukan tindakan segera (lampu Merah / Tergendala)
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-rose-300 bg-rose-50 text-rose-700">
              {visibleAlerts.length} amaran
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {visibleAlerts.slice(0, 6).map((p) => (
              <div
                key={p.id}
                className={cn(
                  "relative flex items-start gap-3 rounded-xl border p-3",
                  p.status === "Tergendala"
                    ? "border-rose-300 bg-rose-50/80"
                    : "border-amber-300 bg-amber-50/80"
                )}
              >
                <div className={cn(
                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  p.status === "Tergendala" ? "bg-rose-200" : "bg-amber-200"
                )}>
                  <AlertOctagon className={cn("h-4 w-4", p.status === "Tergendala" ? "text-rose-700" : "text-amber-700")} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground">{p.kodProgram}</span>
                    <TrafficLight status={p.statusLampu} />
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm font-medium text-foreground">{p.namaProgram}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Kemajuan {p.peratusKemajuan.toFixed(0)}% • {p.isuTerbuka} isu terbuka • Tamat {formatDate(p.tarikhTamat)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openDetail(p)}>
                      <Eye className="h-3 w-3" /> Lihat Butiran
                    </Button>
                  </div>
                </div>
                <button
                  onClick={() => dismissAlert(p.id)}
                  className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-white/60"
                  aria-label="Tutup amaran"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* ============ MAIN: PROGRAMS TABLE + ISSUE LOG (Tabs) ============ */}
      <Tabs defaultValue="monitoring" className="space-y-4">
        <TabsList className="glass-card grid w-full grid-cols-2 sm:w-auto sm:grid-cols-2">
          <TabsTrigger value="monitoring" className="data-[state=active]:bg-[#0f2a66] data-[state=active]:text-white">
            <Activity className="h-4 w-4" /> Pemantauan Program
          </TabsTrigger>
          <TabsTrigger value="isu" className="data-[state=active]:bg-[#0f2a66] data-[state=active]:text-white">
            <AlertTriangle className="h-4 w-4" /> Log Isu & Risiko
            {isuSummary.terbuka + isuSummary.dalamTindakan > 0 && (
              <Badge className="ml-1 h-4 px-1 text-[10px] bg-rose-500 text-white">{isuSummary.terbuka + isuSummary.dalamTindakan}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* -------- TAB: PROGRAM MONITORING TABLE -------- */}
        <TabsContent value="monitoring" className="space-y-0">
          <GlassCard className="p-0">
            <div className="flex items-center justify-between border-b border-slate-200/60 p-4">
              <div>
                <h3 className="text-sm font-semibold">Senarai Program Dipantau</h3>
                <p className="text-xs text-muted-foreground">{summary.totalDipaparkan} program dipaparkan</p>
              </div>
            </div>
            <div className="max-h-[28rem] overflow-y-auto scroll-thin">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="pl-4">Program</TableHead>
                    <TableHead>Negeri</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Lampu</TableHead>
                    <TableHead className="w-44">Kemajuan</TableHead>
                    <TableHead>Bajet (Varians)</TableHead>
                    <TableHead>Tamat</TableHead>
                    <TableHead className="text-right pr-4">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <EmptyState
                          icon={<ClipboardList className="h-8 w-8" />}
                          title="Tiada program dipaparkan"
                          description="Ubah penapis atau rekodkan program baharu."
                        />
                      </TableCell>
                    </TableRow>
                  )}
                  {programs.map((p) => {
                    const variance = p.bajetVariance;
                    const overBudget = variance < 0;
                    return (
                      <TableRow key={p.id} className="cursor-pointer hover:bg-slate-50/60" onClick={() => openDetail(p)}>
                        <TableCell className="pl-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-mono text-[#0f2a66]">{p.kodProgram}</span>
                            <span className="text-sm font-medium text-foreground line-clamp-1 max-w-xs">{p.namaProgram}</span>
                            <span className="text-[11px] text-muted-foreground">{p.kategori}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">{p.negeri}</span>
                        </TableCell>
                        <TableCell><StatusBadge status={p.status} /></TableCell>
                        <TableCell><TrafficLight status={p.statusLampu} /></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ProgressBar value={p.peratusKemajuan} status={p.statusLampu} />
                            <span className="w-9 text-right text-xs font-medium">{p.peratusKemajuan.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium">{formatRM(p.bajetSebenar, true)}</span>
                            <span className={cn(
                              "text-[11px]",
                              overBudget ? "text-rose-600" : "text-emerald-600"
                            )}>
                              {overBudget ? "▲" : "▼"} {formatRM(Math.abs(variance), true)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell><span className="text-xs text-muted-foreground">{formatDate(p.tarikhTamat)}</span></TableCell>
                        <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1.5">
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                              onClick={() => openDetail(p)}
                            >
                              <PencilLine className="h-3 w-3" /> Kemas Kini
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                              onClick={() => { openDetail(p); setDetailTab("isu"); }}
                              disabled={p.isuTerbuka === 0}
                            >
                              <AlertTriangle className="h-3 w-3" /> Isu ({p.isuTerbuka})
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </GlassCard>
        </TabsContent>

        {/* -------- TAB: ISSUE LOG -------- */}
        <TabsContent value="isu" className="space-y-0">
          <GlassCard className="p-0">
            <div className="flex flex-col gap-3 border-b border-slate-200/60 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold">Log Isu & Risiko Pelaksanaan</h3>
                <p className="text-xs text-muted-foreground">
                  {isuSummary.total} jumlah • {isuSummary.terbuka} terbuka • {isuSummary.dalamTindakan} dalam tindakan • {isuSummary.selesai} selesai
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={isuFilterJenis} onValueChange={setIsuFilterJenis}>
                  <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Jenis" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Jenis</SelectItem>
                    <SelectItem value="Isu">Isu</SelectItem>
                    <SelectItem value="Risiko">Risiko</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={isuFilterStatus} onValueChange={setIsuFilterStatus}>
                  <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="Terbuka">Terbuka</SelectItem>
                    <SelectItem value="DalamTindakan">Dalam Tindakan</SelectItem>
                    <SelectItem value="Selesai">Selesai</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-8 bg-[#0f2a66] hover:bg-[#1a3a82]" onClick={() => setLaporIsuOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Lapor Isu
                </Button>
              </div>
            </div>
            <div className="max-h-[28rem] overflow-y-auto scroll-thin">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="pl-4">Tajuk</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Keutamaan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Pelapor</TableHead>
                    <TableHead>Dilapor</TableHead>
                    <TableHead className="text-right pr-4">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isuList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <EmptyState
                          icon={<CheckCircle2 className="h-8 w-8" />}
                          title="Tiada isu/risiko"
                          description="Semua isu telah diselesaikan atau belum dilaporkan."
                        />
                      </TableCell>
                    </TableRow>
                  )}
                  {isuList.map((isu) => (
                    <TableRow key={isu.id}>
                      <TableCell className="pl-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium line-clamp-1 max-w-xs">{isu.tajuk}</span>
                          <span className="text-[11px] text-muted-foreground line-clamp-1 max-w-xs">{isu.penerangan}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={isu.jenis === "Risiko" ? "border-purple-300 bg-purple-50 text-purple-700" : "border-[#0f2a66]/30 bg-[#0f2a66]/5 text-[#0f2a66]"}>
                          {isu.jenis}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                          KEUTAMAAN_COLOR[isu.keutamaan] ?? KEUTAMAAN_COLOR.Sederhana
                        )}>
                          {isu.keutamaan}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                          ISU_STATUS_COLOR[isu.status] ?? ISU_STATUS_COLOR.Terbuka
                        )}>
                          {isu.status === "DalamTindakan" ? "Dalam Tindakan" : isu.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-mono text-[#0f2a66]">{isu.program.kodProgram}</span>
                          <span className="text-[11px] text-muted-foreground line-clamp-1 max-w-[10rem]">{isu.program.namaProgram}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs">{isu.pelapor.nama}</span>
                          <span className="text-[11px] text-muted-foreground">{isu.pelapor.jawatan}</span>
                        </div>
                      </TableCell>
                      <TableCell><span className="text-xs text-muted-foreground">{formatDate(isu.tarikhLapor)}</span></TableCell>
                      <TableCell className="text-right pr-4">
                        {isu.status !== "Selesai" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                            onClick={() => markIsuSelesai(isu.id, isu.tajuk)}
                          >
                            <CheckCircle2 className="h-3 w-3" /> Selesai
                          </Button>
                        )}
                        {isu.status === "Selesai" && (
                          <span className="text-xs text-emerald-600">✓ {isu.tarikhSelesai ? formatDate(isu.tarikhSelesai) : ""}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>

      {/* ============ PROGRAM DETAIL DRAWER (Sheet) ============ */}
      <Sheet open={!!detailProgram} onOpenChange={(o) => { if (!o) setDetailProgram(null); }}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-2xl lg:max-w-3xl">
          {detailProgram && (
            <>
              <SheetHeader className="border-b border-slate-200 bg-gradient-to-r from-[#0f2a66] to-[#1a3a82] p-5 text-white">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-white/15 px-2 py-0.5 text-xs font-mono">{detailProgram.kodProgram}</span>
                  <StatusBadge status={detailProgram.status} />
                  <TrafficLight status={detailProgram.statusLampu} />
                </div>
                <SheetTitle className="text-lg font-bold text-white">{detailProgram.namaProgram}</SheetTitle>
                <SheetDescription className="text-white/70">
                  {detailProgram.kategori} • {detailProgram.negeri} • Pengurus: {detailProgram.pengurus.nama}
                </SheetDescription>
              </SheetHeader>

              <div className="p-5">
                {/* Mini summary cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-white/60 p-3 text-center">
                    <p className="text-[10px] uppercase text-muted-foreground">Kemajuan</p>
                    <p className="mt-1 text-xl font-bold text-[#0f2a66]">{detailProgram.peratusKemajuan.toFixed(0)}%</p>
                  </div>
                  <div className="rounded-xl bg-white/60 p-3 text-center">
                    <p className="text-[10px] uppercase text-muted-foreground">Bajet Sebenar</p>
                    <p className="mt-1 text-sm font-bold text-foreground">{formatRM(detailProgram.bajetSebenar, true)}</p>
                    <p className="text-[10px] text-muted-foreground">dari {formatRM(detailProgram.bajetDianggar, true)}</p>
                  </div>
                  <div className="rounded-xl bg-white/60 p-3 text-center">
                    <p className="text-[10px] uppercase text-muted-foreground">Aktiviti</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{detailProgram._count.aktiviti}</p>
                  </div>
                  <div className="rounded-xl bg-white/60 p-3 text-center">
                    <p className="text-[10px] uppercase text-muted-foreground">Isu Terbuka</p>
                    <p className="mt-1 text-xl font-bold text-rose-600">{detailProgram.isuTerbuka}</p>
                  </div>
                </div>

                <Tabs value={detailTab} onValueChange={setDetailTab} className="mt-5">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="gantt"><Calendar className="h-3.5 w-3.5" /> Gantt & Aktiviti</TabsTrigger>
                    <TabsTrigger value="kemajuan"><TrendingDown className="h-3.5 w-3.5" /> Kemajuan</TabsTrigger>
                    <TabsTrigger value="isu"><AlertTriangle className="h-3.5 w-3.5" /> Isu ({detailIsu.length})</TabsTrigger>
                  </TabsList>

                  {/* GANTT TAB */}
                  <TabsContent value="gantt" className="mt-4 space-y-3">
                    {detailLoading ? (
                      <div className="h-48 animate-pulse rounded-xl bg-white/40" />
                    ) : detailAktiviti.length === 0 ? (
                      <EmptyState icon={<Calendar className="h-7 w-7" />} title="Tiada aktiviti direkodkan" />
                    ) : (
                      <GanttChart aktiviti={detailAktiviti} programMula={detailProgram.tarikhMula} programTamat={detailProgram.tarikhTamat} />
                    )}
                  </TabsContent>

                  {/* KEMAJUAN TAB */}
                  <TabsContent value="kemajuan" className="mt-4 space-y-4">
                    {/* Inline Tambah Kemajuan Form */}
                    <div className="rounded-xl border border-[#0f2a66]/15 bg-[#0f2a66]/[0.03] p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0f2a66] text-white">
                          <Plus className="h-3.5 w-3.5" />
                        </div>
                        <h4 className="text-sm font-semibold">Kemas Kini Kemajuan Baharu</h4>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Peratus Kemajuan (%)</Label>
                          <Input
                            type="number" min={0} max={100} step={1}
                            value={kemajuanForm.peratusKemajuan || ""}
                            onChange={(e) => setKemajuanForm({ ...kemajuanForm, peratusKemajuan: Number(e.target.value) })}
                            placeholder="cth: 75"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Bukti (nama fail)</Label>
                          <div className="flex gap-1.5">
                            <Input
                              value={kemajuanForm.bukti}
                              onChange={(e) => setKemajuanForm({ ...kemajuanForm, bukti: e.target.value })}
                              placeholder="cth: laporan-aktiviti-q3.pdf"
                            />
                            <Button type="button" variant="outline" size="icon" className="shrink-0"
                              onClick={() => {
                                const stubs = ["laporan-aktiviti.pdf", "minit-mesyuarat.docx", "gambar-lapangan.jpg", "sisipan-kewangan.xlsx"];
                                const stub = stubs[Math.floor(Math.random() * stubs.length)];
                                setKemajuanForm({ ...kemajuanForm, bukti: stub });
                              }}
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label className="text-xs">Catatan</Label>
                          <Textarea
                            rows={2}
                            value={kemajuanForm.catatan}
                            onChange={(e) => setKemajuanForm({ ...kemajuanForm, catatan: e.target.value })}
                            placeholder="Kemas kini status pelaksanaan, pencapaian, cabaran..."
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setKemajuanForm({ peratusKemajuan: 0, catatan: "", bukti: "" })}>
                          Reset
                        </Button>
                        <Button size="sm" className="bg-[#0f2a66] hover:bg-[#1a3a82]" disabled={kemajuanSaving} onClick={submitKemajuan}>
                          {kemajuanSaving ? "Menyimpan..." : "Simpan Kemajuan"}
                        </Button>
                      </div>
                    </div>

                    {/* Kemajuan Timeline */}
                    <div>
                      <h4 className="mb-3 text-sm font-semibold">Sejarah Kemas Kini Kemajuan</h4>
                      {detailKemajuan.length === 0 ? (
                        <EmptyState icon={<Clock className="h-7 w-7" />} title="Tiada kemas kini direkodkan" description="Kemas kini pertama akan dimulakan di atas." />
                      ) : (
                        <div className="space-y-3">
                          {detailKemajuan.map((k, idx) => (
                            <div key={k.id} className="relative flex gap-3 pb-4">
                              {idx < detailKemajuan.length - 1 && (
                                <div className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-200" />
                              )}
                              <div className={cn(
                                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                                k.peratusKemajuan >= 100
                                  ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                                  : k.peratusKemajuan >= 70
                                  ? "border-[#0f2a66] bg-[#0f2a66]/10 text-[#0f2a66]"
                                  : "border-amber-300 bg-amber-100 text-amber-700"
                              )}>
                                {k.peratusKemajuan.toFixed(0)}
                              </div>
                              <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white/60 p-3">
                                <div className="flex flex-wrap items-center justify-between gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-foreground">{k.peratusKemajuan.toFixed(0)}% kemajuan</span>
                                    <TrafficLight
                                      status={k.peratusKemajuan < 40 ? "Merah" : k.peratusKemajuan < 70 ? "Kuning" : "Hijau"}
                                      label={k.peratusKemajuan < 40 ? "Kritikal" : k.peratusKemajuan < 70 ? "Perhatian" : "On-Track"}
                                    />
                                  </div>
                                  <span className="text-[11px] text-muted-foreground">{formatDate(k.tarikh)}</span>
                                </div>
                                {k.catatan && <p className="mt-1 text-xs text-foreground">{k.catatan}</p>}
                                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                  <span className="inline-flex items-center gap-1">
                                    <PencilLine className="h-3 w-3" /> {k.pengguna.nama}
                                  </span>
                                  {k.bukti && (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-[#0f2a66]/5 px-1.5 py-0.5 text-[#0f2a66]">
                                      {k.bukti.endsWith(".pdf") || k.bukti.endsWith(".docx") ? <FileText className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                                      {k.bukti}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* ISU TAB */}
                  <TabsContent value="isu" className="mt-4 space-y-3">
                    {detailIsu.length === 0 ? (
                      <EmptyState icon={<CheckCircle2 className="h-7 w-7" />} title="Tiada isu/risiko" description="Program ini tiada isu berkaitan." />
                    ) : (
                      detailIsu.map((isu) => (
                        <div key={isu.id} className="rounded-xl border border-slate-200 bg-white/60 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-sm font-semibold text-foreground">{isu.tajuk}</span>
                              <Badge variant="outline" className={isu.jenis === "Risiko" ? "border-purple-300 bg-purple-50 text-purple-700" : "border-[#0f2a66]/30 bg-[#0f2a66]/5 text-[#0f2a66]"}>
                                {isu.jenis}
                              </Badge>
                              <span className={cn(
                                "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium",
                                KEUTAMAAN_COLOR[isu.keutamaan] ?? KEUTAMAAN_COLOR.Sederhana
                              )}>
                                {isu.keutamaan}
                              </span>
                              <span className={cn(
                                "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium",
                                ISU_STATUS_COLOR[isu.status] ?? ISU_STATUS_COLOR.Terbuka
                              )}>
                                {isu.status === "DalamTindakan" ? "Dalam Tindakan" : isu.status}
                              </span>
                            </div>
                            {isu.status !== "Selesai" && (
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                onClick={() => markIsuSelesai(isu.id, isu.tajuk)}
                              >
                                <CheckCircle2 className="h-3 w-3" /> Selesai
                              </Button>
                            )}
                          </div>
                          <p className="mt-1.5 text-xs text-muted-foreground">{isu.penerangan}</p>
                          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span>Dilapor oleh {isu.pelapor.nama} pada {formatDate(isu.tarikhLapor)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ============ LAPOR ISU DIALOG ============ */}
      <Dialog open={laporIsuOpen} onOpenChange={setLaporIsuOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Lapor Isu / Risiko Baharu</DialogTitle>
            <DialogDescription>
              Rekod isu pelaksanaan atau risiko yang dikenal pasti untuk program.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Program <span className="text-rose-600">*</span></Label>
              <Select value={isuForm.programId} onValueChange={(v) => setIsuForm({ ...isuForm, programId: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih program" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.kodProgram} — {p.namaProgram.slice(0, 40)}{p.namaProgram.length > 40 ? "…" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Jenis <span className="text-rose-600">*</span></Label>
                <Select value={isuForm.jenis} onValueChange={(v) => setIsuForm({ ...isuForm, jenis: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Isu">Isu (berlaku)</SelectItem>
                    <SelectItem value="Risiko">Risiko (berpotensi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Keutamaan</Label>
                <Select value={isuForm.keutamaan} onValueChange={(v) => setIsuForm({ ...isuForm, keutamaan: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rendah">Rendah</SelectItem>
                    <SelectItem value="Sederhana">Sederhana</SelectItem>
                    <SelectItem value="Tinggi">Tinggi</SelectItem>
                    <SelectItem value="Kritikal">Kritikal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tajuk <span className="text-rose-600">*</span></Label>
              <Input
                value={isuForm.tajuk}
                onChange={(e) => setIsuForm({ ...isuForm, tajuk: e.target.value })}
                placeholder="Ringkasan isu/risiko"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Penerangan <span className="text-rose-600">*</span></Label>
              <Textarea
                rows={3}
                value={isuForm.penerangan}
                onChange={(e) => setIsuForm({ ...isuForm, penerangan: e.target.value })}
                placeholder="Huraikan isu/risiko secara terperinci..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLaporIsuOpen(false)}>Batal</Button>
            <Button className="bg-[#0f2a66] hover:bg-[#1a3a82]" onClick={submitIsu}>
              <Plus className="h-4 w-4" /> Lapor Isu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ===================== Gantt Chart Subcomponent ===================== */
function GanttChart({
  aktiviti, programMula, programTamat,
}: {
  aktiviti: Aktiviti[];
  programMula: string;
  programTamat: string;
}) {
  const start = new Date(programMula).getTime();
  const end = new Date(programTamat).getTime();
  const span = Math.max(1, end - start);

  // Build month ticks across the span
  const ticks: { label: string; pct: number }[] = [];
  const cursor = new Date(programMula);
  cursor.setDate(1);
  while (cursor.getTime() < end) {
    const pct = ((cursor.getTime() - start) / span) * 100;
    if (pct >= 0 && pct <= 100) {
      ticks.push({
        label: cursor.toLocaleDateString("ms-MY", { month: "short", year: "2-digit" }),
        pct,
      });
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Gantt Pelaksanaan Aktiviti ({aktiviti.length} aktiviti)</span>
        <span>{formatDate(programMula)} → {formatDate(programTamat)}</span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {Object.entries(AKTIVITI_COLOR).map(([k, c]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c }} />
            {k === "DalamProgress" ? "Dalam Progress" : k === "BelumMula" ? "Belum Mula" : k}
          </span>
        ))}
      </div>

      {/* Gantt rows */}
      <div className="space-y-2">
        {aktiviti.map((a) => {
          const aStart = new Date(a.tarikhMula).getTime();
          const aEnd = new Date(a.tarikhTamat).getTime();
          const leftPct = ((aStart - start) / span) * 100;
          const widthPct = Math.max(2, ((aEnd - aStart) / span) * 100);
          const color = AKTIVITI_COLOR[a.status] ?? AKTIVITI_COLOR.BelumMula;
          return (
            <div key={a.id} className="grid grid-cols-[10rem_1fr] items-center gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-foreground" title={a.nama}>{a.nama}</p>
                <p className="text-[10px] text-muted-foreground">
                  {a.PIC ? a.PIC + " • " : ""}{a.peratusKemajuan.toFixed(0)}%
                </p>
              </div>
              <div className="relative h-7 rounded-md bg-slate-100/70">
                {/* Month gridlines */}
                {ticks.map((t, i) => (
                  <div key={i} className="absolute top-0 bottom-0 w-px bg-slate-200" style={{ left: `${t.pct}%` }} />
                ))}
                {/* Bar */}
                <div
                  className="absolute top-1 bottom-1 flex items-center justify-end rounded-sm px-1.5 text-[9px] font-bold text-white shadow-sm"
                  style={{
                    left: `${Math.max(0, leftPct)}%`,
                    width: `${Math.min(100 - Math.max(0, leftPct), widthPct)}%`,
                    background: color,
                  }}
                  title={`${a.nama}: ${formatDate(a.tarikhMula)} - ${formatDate(a.tarikhTamat)} (${a.status})`}
                >
                  {a.peratusKemajuan.toFixed(0)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Month axis */}
      <div className="relative ml-[10.5rem] h-4 text-[9px] text-muted-foreground">
        {ticks.filter((_, i) => i % Math.max(1, Math.floor(ticks.length / 6)) === 0).map((t, i) => (
          <span key={i} className="absolute -translate-x-1/2" style={{ left: `${t.pct}%` }}>
            {t.label}
          </span>
        ))}
      </div>

      {/* Progress mini-chart */}
      <div className="mt-4">
        <h5 className="mb-2 text-xs font-semibold text-muted-foreground">Peratus Kemajuan per Aktiviti</h5>
        <ResponsiveContainer width="100%" height={Math.max(120, aktiviti.length * 28)}>
          <BarChart
            data={aktiviti.map((a) => ({ nama: a.nama.length > 20 ? a.nama.slice(0, 18) + "…" : a.nama, pct: a.peratusKemajuan, status: a.status }))}
            layout="vertical"
            margin={{ left: 0, right: 16 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,42,102,0.08)" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#64748b" unit="%" />
            <YAxis type="category" dataKey="nama" tick={{ fontSize: 10 }} stroke="#64748b" width={140} />
            <Tooltip
              formatter={(v: number) => [`${v.toFixed(0)}%`, "Kemajuan"]}
              contentStyle={{ fontSize: 11 }}
            />
            <Bar dataKey="pct" name="Kemajuan" radius={[0, 4, 4, 0]} barSize={16}>
              {aktiviti.map((a, i) => (
                <Cell key={i} fill={AKTIVITI_COLOR[a.status] ?? AKTIVITI_COLOR.BelumMula} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
