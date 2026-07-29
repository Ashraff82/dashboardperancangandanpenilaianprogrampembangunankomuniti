"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area, LineChart, Line,
} from "recharts";
import {
  Wallet, Plus, FileText, ArrowLeftRight, ListChecks, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle2, ShieldCheck, Building2, Calendar, Pencil, X,
  Gauge, BarChart3, FileBarChart,
} from "lucide-react";

import {
  GlassCard, StatCard, ModuleHeader, TrafficLight, ProgressBar, EmptyState,
} from "@/components/shared/dppk-ui";
import {
  OBJEK_AM, OBJEK_AM_COLORS, BULAN_LABEL,
  formatRM, formatNumber, formatDate, oeStatusFromPercent,
} from "@/lib/domain";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";

/* ============================================================
 * Types
 * ============================================================ */
type PeruntukanOE = {
  id: string;
  tahunKewangan: number;
  bahagian: string;
  objekAm: string;
  kodVot: string;
  kodAktiviti: string;
  silingPeruntukan: number;
  jumlahDibelanjakan: number;
  jumlahKomited: number;
  bakiPeruntukan: number;
  peratusPenggunaan: number;
  statusPenggunaan: string;
  program?: { id: string; kodProgram: string; namaProgram: string } | null;
  kemaskiniOleh?: { id: string; nama: string } | null;
  tarikhKemaskini: string;
  bilWaran: number;
};

type Waran = {
  id: string;
  nomborWaran: string;
  tahunKewangan: number;
  bahagian: string;
  objekAm: string;
  jumlah: number;
  tarikhWaran: string;
  dikeluarkanOleh: string;
  status: string;
  peruntukanOE?: { id: string; kodVot: string; bahagian: string } | null;
  dikeluarkanKepada?: { id: string; nama: string; jawatan: string } | null;
};

type Virement = {
  id: string;
  nomborRujukan: string;
  tahunKewangan: number;
  bahagian: string;
  objekAmAsal: string;
  objekAmDestinasi: string;
  jumlah: number;
  justifikasi: string;
  status: string;
  dimohonOleh: string;
  tarikhMohon: string;
  tarikhLulus?: string | null;
};

const BAHAGIAN_LIST = [
  "Bahagian Pembangunan Komuniti",
  "Bahagian Perancangan Strategik & Digital",
  "Bahagian Kewangan",
  "Bahagian Pengurusan Bandar",
  "Bahagian Perumahan",
];

const WARAN_STATUS: Record<string, { label: string; cls: string }> = {
  Draf: { label: "Draf", cls: "bg-slate-100 text-slate-700 border-slate-300" },
  BerkuatKuasa: { label: "Berkuat Kuasa", cls: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  DitarikBalik: { label: "Ditarik Balik", cls: "bg-rose-100 text-rose-700 border-rose-300" },
};

const VIREMENT_STATUS: Record<string, { label: string; cls: string }> = {
  Mohon: { label: "Dimohon", cls: "bg-amber-100 text-amber-700 border-amber-300" },
  Disemak: { label: "Disemak", cls: "bg-blue-100 text-blue-700 border-blue-300" },
  Diluluskan: { label: "Diluluskan", cls: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  Ditolak: { label: "Ditolak", cls: "bg-rose-100 text-rose-700 border-rose-300" },
};

/* ============================================================
 * Main Component
 * ============================================================ */
export function BudgetOEModule() {
  const [activeTab, setActiveTab] = React.useState("ringkasan");
  const [tahunKewangan, setTahunKewangan] = React.useState(2026);

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Pengurusan Bajet & Sumber"
        description="Sub-modul Pemantauan Peruntukan OE — siling MOF, waran, virement & burn rate (FR-3.1 hingga FR-3.14)"
        icon={<Wallet className="h-5 w-5" />}
        action={
          <div className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-3 py-1.5 text-xs backdrop-blur">
            <Calendar className="h-3.5 w-3.5 text-[#0f2a66]" />
            Tahun Kewangan
            <Select value={String(tahunKewangan)} onValueChange={(v) => setTahunKewangan(Number(v))}>
              <SelectTrigger className="h-7 w-20 border-0 p-0 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="ringkasan"><Gauge className="h-3.5 w-3.5" /> Ringkasan OE</TabsTrigger>
          <TabsTrigger value="waran"><FileText className="h-3.5 w-3.5" /> Waran Peruntukan</TabsTrigger>
          <TabsTrigger value="virement"><ArrowLeftRight className="h-3.5 w-3.5" /> Virement</TabsTrigger>
          <TabsTrigger value="terperinci"><ListChecks className="h-3.5 w-3.5" /> Peruntukan Terperinci</TabsTrigger>
        </TabsList>

        <TabsContent value="ringkasan" className="mt-4">
          <RingkasanTab tahunKewangan={tahunKewangan} />
        </TabsContent>

        <TabsContent value="waran" className="mt-4">
          <WaranTab tahunKewangan={tahunKewangan} />
        </TabsContent>

        <TabsContent value="virement" className="mt-4">
          <VirementTab tahunKewangan={tahunKewangan} />
        </TabsContent>

        <TabsContent value="terperinci" className="mt-4">
          <TerperinciTab tahunKewangan={tahunKewangan} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============================================================
 * Tab 1: Ringkasan OE
 * ============================================================ */
function RingkasanTab({ tahunKewangan }: { tahunKewangan: number }) {
  const [loading, setLoading] = React.useState(true);
  const [oe, setOe] = React.useState<{ data: PeruntukanOE[]; summary: any; byObjekAm: any } | null>(null);
  const [burn, setBurn] = React.useState<any>(null);

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    try {
      const [oeR, burnR] = await Promise.all([
        fetch(`/api/peruntukan-oe?tahunKewangan=${tahunKewangan}`),
        fetch(`/api/perbelanjaan?tahun=${tahunKewangan}`),
      ]);
      const oeJ = await oeR.json();
      const burnJ = await burnR.json();
      setOe(oeJ);
      setBurn(burnJ);
    } catch {
      toast.error("Gagal memuatkan data OE");
    } finally {
      setLoading(false);
    }
  }, [tahunKewangan]);

  React.useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading || !oe) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  const s = oe.summary;
  const objekRows = Object.entries(oe.byObjekAm).map(([k, v]: [string, any]) => ({
    name: k,
    siling: v.siling,
    dibelanjakan: v.dibelanjakan,
    komited: v.komited,
    baki: v.baki,
    count: v.count,
    peratus: v.siling > 0 ? ((v.dibelanjakan + v.komited) / v.siling) * 100 : 0,
    fill: OBJEK_AM_COLORS[k] || "#94a3b8",
  }));

  const burnData = (burn?.monthly || []).map((m: any) => ({
    name: m.label,
    Sebenar: m.sebenar,
    Unjuran: m.unjuran,
    Komited: m.komited,
  }));

  const trendData = (burn?.byTahun || []).map((t: any) => ({
    tahun: String(t.tahun),
    Siling: t.siling,
    Dibelanjakan: t.dibelanjakan,
  }));

  return (
    <div className="space-y-4">
      {/* Hero card */}
      <GlassCard className="overflow-hidden p-0">
        <div className="relative navy-gradient p-5 text-white sm:p-6">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 90% 20%, #f5b82e 0%, transparent 40%)" }} />
          <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-5 lg:items-center">
            <div className="lg:col-span-3">
              <p className="text-xs font-medium uppercase tracking-wider text-white/70">
                Siling Peruntukan OE — Tahun Kewangan {tahunKewangan} (Diluluskan MOF)
              </p>
              <p className="text-3xl font-bold tracking-tight">{formatRM(s.siling)}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <HeroStat label="Dibelanjakan" value={formatRM(s.dibelanjakan, true)} color="text-[#fcd768]" />
                <HeroStat label="Komited" value={formatRM(s.komited, true)} color="text-white" />
                <HeroStat label="Baki" value={formatRM(s.baki, true)} color="text-emerald-300" />
                <HeroStat label="Penggunaan" value={`${s.peratusPenggunaan.toFixed(1)}%`} color="text-[#fcd768]" />
              </div>
            </div>
            <div className="lg:col-span-2 flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/10 p-4 backdrop-blur">
              <div className="text-center">
                <p className="text-xs text-white/70 uppercase">Status Penggunaan</p>
                <div className="mt-2 flex items-center justify-center">
                  <TrafficLight status={s.status} />
                </div>
              </div>
              <div className="w-full">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    className={cn("h-full rounded-full transition-all",
                      s.status === "Merah" ? "bg-rose-500" : s.status === "Kuning" ? "bg-amber-400" : "bg-emerald-400")}
                    style={{ width: `${Math.min(100, s.peratusPenggunaan)}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-white/60">
                  <span>0%</span><span>80%</span><span>95%</span><span>100%</span>
                </div>
              </div>
              {s.status === "Merah" && (
                <div className="mt-1 flex items-center gap-1.5 rounded-md bg-rose-500/20 px-2 py-1 text-[11px] text-rose-200">
                  <AlertTriangle className="h-3 w-3" /> Amaran: Penggunaan melebihi 95% siling
                </div>
              )}
              {s.status === "Kuning" && (
                <div className="mt-1 flex items-center gap-1.5 rounded-md bg-amber-500/20 px-2 py-1 text-[11px] text-amber-200">
                  <AlertTriangle className="h-3 w-3" /> Perhatian: Penggunaan menghampiri siling
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Siling Diluluskan" value={formatRM(s.siling, true)} sub={`${oe.data.length} peruntukan`} icon={<ShieldCheck className="h-5 w-5" />} accent="navy" />
        <StatCard label="Dibelanjakan" value={formatRM(s.dibelanjakan, true)} sub={`${s.peratusPenggunaan.toFixed(1)}% siling`} icon={<TrendingUp className="h-5 w-5" />} accent="gold" />
        <StatCard label="Komited" value={formatRM(s.komited, true)} sub="belum dibayar" icon={<FileText className="h-5 w-5" />} accent="amber" />
        <StatCard label="Baki Peruntukan" value={formatRM(s.baki, true)} sub="untuk perbelanjaan akan datang" icon={<Wallet className="h-5 w-5" />} accent="green" />
      </div>

      {/* Burn rate chart */}
      <GlassCard className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Kadar Perbelanjaan OE Bulanan (Burn Rate) — {tahunKewangan}</h3>
            <p className="text-xs text-muted-foreground">Perbelanjaan sebenar vs unjuran merentas 12 bulan (FR-3.8)</p>
          </div>
          <Gauge className="h-4 w-4 text-muted-foreground" />
        </div>
        {burnData.length === 0 ? (
          <EmptyState icon={<Gauge className="h-8 w-8" />} title="Tiada data perbelanjaan" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={burnData} margin={{ left: -5, right: 10 }}>
              <defs>
                <linearGradient id="gSebenar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f2a66" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0f2a66" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gUnjuran" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f5b82e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f5b82e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,42,102,0.08)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#64748b" />
              <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}J`} tick={{ fontSize: 11 }} stroke="#64748b" />
              <Tooltip formatter={(v: number) => formatRM(v)} contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="Unjuran" stroke="#f5b82e" strokeWidth={2} fill="url(#gUnjuran)" />
              <Area type="monotone" dataKey="Sebenar" stroke="#0f2a66" strokeWidth={2.5} fill="url(#gSebenar)" />
              <Area type="monotone" dataKey="Komited" stroke="#7d96dd" strokeWidth={1.5} fill="transparent" strokeDasharray="4 3" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </GlassCard>

      {/* Two-up: Objek Am breakdown + multi-year trend */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <GlassCard className="p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Peruntukan OE mengikut Objek Am — {tahunKewangan}</h3>
              <p className="text-xs text-muted-foreground">Siling, dibelanjakan & baki per kategori iGFMAS (FR-3.1, FR-3.5)</p>
            </div>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={objekRows} margin={{ left: -5, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,42,102,0.08)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#64748b" interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}J`} tick={{ fontSize: 11 }} stroke="#64748b" />
              <Tooltip formatter={(v: number) => formatRM(v)} contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="siling" name="Siling" fill="#0f2a66" radius={[4, 4, 0, 0]} />
              <Bar dataKey="dibelanjakan" name="Dibelanjakan" fill="#f5b82e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="komited" name="Komited" fill="#7d96dd" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Trend Multi-Tahun (FR-3.12)</h3>
              <p className="text-xs text-muted-foreground">Siling vs Dibelanjakan merentas tahun kewangan</p>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          {trendData.length === 0 ? (
            <EmptyState title="Tiada data tahunan" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,42,102,0.08)" vertical={false} />
                <XAxis dataKey="tahun" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}J`} tick={{ fontSize: 11 }} stroke="#64748b" />
                <Tooltip formatter={(v: number) => formatRM(v)} contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Siling" stroke="#0f2a66" strokeWidth={3} dot={{ r: 4, fill: "#0f2a66" }} />
                <Line type="monotone" dataKey="Dibelanjakan" stroke="#f5b82e" strokeWidth={3} dot={{ r: 4, fill: "#f5b82e" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </GlassCard>
      </div>

      {/* OE by Objek Am table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-200/60">
          <h3 className="text-sm font-semibold">Jadual Pecahan OE mengikut Objek Am</h3>
          <p className="text-xs text-muted-foreground">Status lampu: Hijau &lt;80% · Kuning 80–95% · Merah &gt;95% (FR-3.9)</p>
        </div>
        <div className="max-h-96 overflow-y-auto scroll-thin">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-white/90 backdrop-blur">
              <TableRow>
                <TableHead>Objek Am</TableHead>
                <TableHead className="text-right">Siling (RM)</TableHead>
                <TableHead className="text-right">Dibelanjakan</TableHead>
                <TableHead className="text-right">Komited</TableHead>
                <TableHead className="text-right">Baki</TableHead>
                <TableHead className="min-w-[140px]">Penggunaan</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {objekRows.length === 0 ? (
                <TableRow><TableCell colSpan={7}><EmptyState title="Tiada data peruntukan OE" /></TableCell></TableRow>
              ) : objekRows.map((r) => {
                const status = oeStatusFromPercent(r.peratus);
                return (
                  <TableRow key={r.name}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.fill }} />
                        <div>
                          <p className="font-medium text-sm">{r.name}</p>
                          <p className="text-[10px] text-muted-foreground">{r.count} peruntukan</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatRM(r.siling, true)}</TableCell>
                    <TableCell className="text-right text-[#0f2a66] font-medium">{formatRM(r.dibelanjakan, true)}</TableCell>
                    <TableCell className="text-right text-amber-700">{formatRM(r.komited, true)}</TableCell>
                    <TableCell className="text-right text-emerald-700 font-medium">{formatRM(r.baki, true)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ProgressBar value={r.peratus} status={status} />
                        <span className="text-xs w-10 text-right">{r.peratus.toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell><TrafficLight status={status} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </GlassCard>

      {/* OE Spending Performance Report (FR-3.11) */}
      <GlassCard className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Laporan Prestasi Perbelanjaan OE (FR-3.11)</h3>
            <p className="text-xs text-muted-foreground">Ringkasan prestasi suku tahunan selaras keperluan pelaporan MOF / ICU JPM</p>
          </div>
          <FileBarChart className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { q: "Q1", bulan: [1, 2, 3] },
            { q: "Q2", bulan: [4, 5, 6] },
            { q: "Q3", bulan: [7, 8, 9] },
            { q: "Q4", bulan: [10, 11, 12] },
          ].map((q) => {
            const qSebenar = (burn?.monthly || []).filter((m: any) => q.bulan.includes(m.bulan)).reduce((s: number, m: any) => s + m.sebenar, 0);
            const qUnjuran = (burn?.monthly || []).filter((m: any) => q.bulan.includes(m.bulan)).reduce((s: number, m: any) => s + m.unjuran, 0);
            const pct = qUnjuran > 0 ? (qSebenar / qUnjuran) * 100 : 0;
            const status = oeStatusFromPercent(pct);
            return (
              <div key={q.q} className="rounded-xl border border-slate-200 bg-white/50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{q.q} {tahunKewangan}</p>
                  <TrafficLight status={status} />
                </div>
                <p className="mt-1 text-lg font-bold text-[#0f2a66]">{formatRM(qSebenar, true)}</p>
                <p className="text-[10px] text-muted-foreground">vs unjuran {formatRM(qUnjuran, true)}</p>
                <div className="mt-2">
                  <ProgressBar value={pct} status={status} />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">{pct.toFixed(1)}% unjuran</p>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

function HeroStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-white/60">{label}</p>
      <p className={cn("text-sm font-bold", color)}>{value}</p>
    </div>
  );
}

/* ============================================================
 * Tab 2: Waran Peruntukan
 * ============================================================ */
function WaranTab({ tahunKewangan }: { tahunKewangan: number }) {
  const [list, setList] = React.useState<Waran[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [filterBahagian, setFilterBahagian] = React.useState("all");
  const [filterObjekAm, setFilterObjekAm] = React.useState("all");

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tahunKewangan: String(tahunKewangan) });
      if (filterBahagian !== "all") params.set("bahagian", filterBahagian);
      if (filterObjekAm !== "all") params.set("objekAm", filterObjekAm);
      const r = await fetch(`/api/waran?${params}`);
      const j = await r.json();
      setList(j.data || []);
    } catch {
      toast.error("Gagal memuatkan waran");
    } finally {
      setLoading(false);
    }
  }, [tahunKewangan, filterBahagian, filterObjekAm]);

  React.useEffect(() => { fetchList(); }, [fetchList]);

  const totalJumlah = list.reduce((s, w) => s + w.jumlah, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Jumlah Waran" value={formatNumber(list.length)} sub={`TK ${tahunKewangan}`} icon={<FileText className="h-5 w-5" />} accent="navy" />
        <StatCard label="Nilai Jumlah Waran" value={formatRM(totalJumlah, true)} sub="dikeluarkan MOF" icon={<Wallet className="h-5 w-5" />} accent="gold" />
        <StatCard label="Berkuat Kuasa" value={formatNumber(list.filter((w) => w.status === "BerkuatKuasa").length)} sub="waran aktif" icon={<CheckCircle2 className="h-5 w-5" />} accent="green" />
      </div>

      <GlassCard className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={filterBahagian} onValueChange={setFilterBahagian}>
              <SelectTrigger className="w-full sm:w-64"><Building2 className="mr-1.5 h-3.5 w-3.5" /><SelectValue placeholder="Bahagian" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bahagian</SelectItem>
                {BAHAGIAN_LIST.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterObjekAm} onValueChange={setFilterObjekAm}>
              <SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="Objek Am" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Objek Am</SelectItem>
                {OBJEK_AM.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="bg-[#0f2a66] text-white hover:bg-[#1a3a82]">
            <Plus className="h-4 w-4" /> Cipta Waran
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto scroll-thin">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-white/90 backdrop-blur">
              <TableRow>
                <TableHead>Nombor Waran</TableHead>
                <TableHead>Bahagian</TableHead>
                <TableHead>Objek Am</TableHead>
                <TableHead className="text-right">Jumlah (RM)</TableHead>
                <TableHead>Tarikh Waran</TableHead>
                <TableHead>Dikeluarkan Oleh</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5" /></TableCell>)}
                  </TableRow>
                ))
              ) : list.length === 0 ? (
                <TableRow><TableCell colSpan={7}><EmptyState icon={<FileText className="h-10 w-10" />} title="Tiada waran dijumpai" /></TableCell></TableRow>
              ) : list.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-mono text-xs font-semibold">{w.nomborWaran}</TableCell>
                  <TableCell className="text-sm">{w.bahagian}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <span className="h-2 w-2 rounded-full" style={{ background: OBJEK_AM_COLORS[w.objekAm] || "#94a3b8" }} />
                      {w.objekAm}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-[#0f2a66]">{formatRM(w.jumlah, true)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(w.tarikhWaran)}</TableCell>
                  <TableCell className="text-xs">{w.dikeluarkanOleh}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={WARAN_STATUS[w.status]?.cls || "bg-slate-100"}>
                      {WARAN_STATUS[w.status]?.label || w.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </GlassCard>

      <CreateWaranDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={() => { setCreateOpen(false); fetchList(); }} tahunKewangan={tahunKewangan} />
    </div>
  );
}

function CreateWaranDialog({
  open, onOpenChange, onCreated, tahunKewangan,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
  tahunKewangan: number;
}) {
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    nomborWaran: `WRN-${tahunKewangan}-${String(Math.floor(Math.random() * 900) + 100)}`,
    bahagian: BAHAGIAN_LIST[0],
    objekAm: OBJEK_AM[0],
    jumlah: "",
    tarikhWaran: new Date().toISOString().slice(0, 10),
    dikeluarkanOleh: "Kementerian Kewangan Malaysia (MOF)",
    status: "BerkuatKuasa",
  });

  const submit = async () => {
    if (!form.nomborWaran || !form.jumlah) {
      toast.error("Nombor waran & jumlah wajib diisi");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/waran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tahunKewangan, jumlah: Number(form.jumlah) }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        toast.error(e.error || "Gagal mencipta waran");
        return;
      }
      toast.success("Waran berjaya dicipta");
      onCreated();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-[#0f2a66]" /> Cipta Waran Peruntukan</DialogTitle>
          <DialogDescription>Waran peruntukan OE baharu yang dikeluarkan oleh MOF untuk Tahun Kewangan {tahunKewangan}.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Nombor Waran <span className="text-rose-500">*</span></Label>
            <Input value={form.nomborWaran} onChange={(e) => setForm({ ...form, nomborWaran: e.target.value })} className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label>Bahagian</Label>
            <Select value={form.bahagian} onValueChange={(v) => setForm({ ...form, bahagian: v })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{BAHAGIAN_LIST.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Objek Am</Label>
            <Select value={form.objekAm} onValueChange={(v) => setForm({ ...form, objekAm: v })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{OBJEK_AM.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Jumlah (RM) <span className="text-rose-500">*</span></Label>
            <Input type="number" value={form.jumlah} onChange={(e) => setForm({ ...form, jumlah: e.target.value })} placeholder="0.00" />
          </div>
          <div className="space-y-1.5">
            <Label>Tarikh Waran</Label>
            <Input type="date" value={form.tarikhWaran} onChange={(e) => setForm({ ...form, tarikhWaran: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Dikeluarkan Oleh</Label>
            <Input value={form.dikeluarkanOleh} onChange={(e) => setForm({ ...form, dikeluarkanOleh: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(WARAN_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
          <Button onClick={submit} disabled={submitting} className="bg-[#0f2a66] text-white hover:bg-[#1a3a82]">
            {submitting ? "Menyimpan..." : "Simpan Waran"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
 * Tab 3: Virement
 * ============================================================ */
function VirementTab({ tahunKewangan }: { tahunKewangan: number }) {
  const [list, setList] = React.useState<Virement[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [filterStatus, setFilterStatus] = React.useState("all");

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tahunKewangan: String(tahunKewangan) });
      if (filterStatus !== "all") params.set("status", filterStatus);
      const r = await fetch(`/api/virement?${params}`);
      const j = await r.json();
      setList(j.data || []);
    } catch {
      toast.error("Gagal memuatkan virement");
    } finally {
      setLoading(false);
    }
  }, [tahunKewangan, filterStatus]);

  React.useEffect(() => { fetchList(); }, [fetchList]);

  const totalJumlah = list.reduce((s, v) => s + v.jumlah, 0);
  const approvedJumlah = list.filter((v) => v.status === "Diluluskan").reduce((s, v) => s + v.jumlah, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Jumlah Permohonan" value={formatNumber(list.length)} sub="virement" icon={<ArrowLeftRight className="h-5 w-5" />} accent="navy" />
        <StatCard label="Nilai Dipindahkan" value={formatRM(totalJumlah, true)} sub="jumlah dipohon" icon={<Wallet className="h-5 w-5" />} accent="gold" />
        <StatCard label="Diluluskan" value={formatRM(approvedJumlah, true)} sub={`${list.filter((v) => v.status === "Diluluskan").length} diluluskan`} icon={<CheckCircle2 className="h-5 w-5" />} accent="green" />
      </div>

      <GlassCard className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {Object.entries(VIREMENT_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateOpen(true)} className="bg-[#0f2a66] text-white hover:bg-[#1a3a82]">
            <Plus className="h-4 w-4" /> Mohon Virement
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto scroll-thin">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-white/90 backdrop-blur">
              <TableRow>
                <TableHead>Nombor Rujukan</TableHead>
                <TableHead>Bahagian</TableHead>
                <TableHead>Pindahan</TableHead>
                <TableHead className="text-right">Jumlah (RM)</TableHead>
                <TableHead>Justifikasi</TableHead>
                <TableHead>Tarikh Mohon</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5" /></TableCell>)}
                  </TableRow>
                ))
              ) : list.length === 0 ? (
                <TableRow><TableCell colSpan={7}><EmptyState icon={<ArrowLeftRight className="h-10 w-10" />} title="Tiada permohonan virement" /></TableCell></TableRow>
              ) : list.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-xs font-semibold">{v.nomborRujukan}</TableCell>
                  <TableCell className="text-sm">{v.bahagian}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full" style={{ background: OBJEK_AM_COLORS[v.objekAmAsal] || "#94a3b8" }} />
                        {v.objekAmAsal}
                      </span>
                      <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
                      <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full" style={{ background: OBJEK_AM_COLORS[v.objekAmDestinasi] || "#94a3b8" }} />
                        {v.objekAmDestinasi}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-[#0f2a66]">{formatRM(v.jumlah, true)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={v.justifikasi}>{v.justifikasi || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(v.tarikhMohon)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={VIREMENT_STATUS[v.status]?.cls || "bg-slate-100"}>
                      {VIREMENT_STATUS[v.status]?.label || v.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </GlassCard>

      <CreateVirementDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={() => { setCreateOpen(false); fetchList(); }} tahunKewangan={tahunKewangan} />
    </div>
  );
}

function CreateVirementDialog({
  open, onOpenChange, onCreated, tahunKewangan,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
  tahunKewangan: number;
}) {
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    nomborRujukan: `VIR-${tahunKewangan}-${String(Math.floor(Math.random() * 900) + 100)}`,
    bahagian: BAHAGIAN_LIST[0],
    objekAmAsal: OBJEK_AM[0],
    objekAmDestinasi: OBJEK_AM[1],
    jumlah: "",
    justifikasi: "",
    dimohonOleh: "Pengurus Program",
  });

  const submit = async () => {
    if (!form.nomborRujukan || !form.jumlah || form.objekAmAsal === form.objekAmDestinasi) {
      toast.error("Semak medan wajib & pastikan objek am asal/destinasi berbeza");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/virement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tahunKewangan, jumlah: Number(form.jumlah) }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        toast.error(e.error || "Gagal memohon virement");
        return;
      }
      toast.success("Permohonan virement berjaya dihantar");
      onCreated();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ArrowLeftRight className="h-5 w-5 text-[#0f2a66]" /> Mohon Virement Baharu</DialogTitle>
          <DialogDescription>Pindahan peruntukan OE antara objek am/aktiviti — memerlukan kelulusan MOF/Perbendaharaan (FR-3.10).</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Nombor Rujukan <span className="text-rose-500">*</span></Label>
            <Input value={form.nomborRujukan} onChange={(e) => setForm({ ...form, nomborRujukan: e.target.value })} className="font-mono" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Bahagian</Label>
            <Select value={form.bahagian} onValueChange={(v) => setForm({ ...form, bahagian: v })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{BAHAGIAN_LIST.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Objek Am Asal</Label>
            <Select value={form.objekAmAsal} onValueChange={(v) => setForm({ ...form, objekAmAsal: v })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{OBJEK_AM.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Objek Am Destinasi</Label>
            <Select value={form.objekAmDestinasi} onValueChange={(v) => setForm({ ...form, objekAmDestinasi: v })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{OBJEK_AM.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Jumlah (RM) <span className="text-rose-500">*</span></Label>
            <Input type="number" value={form.jumlah} onChange={(e) => setForm({ ...form, jumlah: e.target.value })} placeholder="0.00" />
          </div>
          <div className="space-y-1.5">
            <Label>Dimohon Oleh</Label>
            <Input value={form.dimohonOleh} onChange={(e) => setForm({ ...form, dimohonOleh: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Justifikasi</Label>
            <Textarea rows={3} value={form.justifikasi} onChange={(e) => setForm({ ...form, justifikasi: e.target.value })} placeholder="Sebab pindahan peruntukan..." />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
          <Button onClick={submit} disabled={submitting} className="bg-[#0f2a66] text-white hover:bg-[#1a3a82]">
            {submitting ? "Menghantar..." : "Hantar Permohonan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
 * Tab 4: Peruntukan OE Terperinci
 * ============================================================ */
function TerperinciTab({ tahunKewangan }: { tahunKewangan: number }) {
  const [list, setList] = React.useState<PeruntukanOE[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filterBahagian, setFilterBahagian] = React.useState("all");
  const [filterObjekAm, setFilterObjekAm] = React.useState("all");
  const [filterStatus, setFilterStatus] = React.useState("all");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tahunKewangan: String(tahunKewangan) });
      if (filterBahagian !== "all") params.set("bahagian", filterBahagian);
      if (filterObjekAm !== "all") params.set("objekAm", filterObjekAm);
      if (filterStatus !== "all") params.set("status", filterStatus);
      const r = await fetch(`/api/peruntukan-oe?${params}`);
      const j = await r.json();
      setList(j.data || []);
    } catch {
      toast.error("Gagal memuatkan peruntukan OE");
    } finally {
      setLoading(false);
    }
  }, [tahunKewangan, filterBahagian, filterObjekAm, filterStatus]);

  React.useEffect(() => { fetchList(); }, [fetchList]);

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Select value={filterBahagian} onValueChange={setFilterBahagian}>
              <SelectTrigger className="w-full"><Building2 className="mr-1.5 h-3.5 w-3.5" /><SelectValue placeholder="Bahagian" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bahagian</SelectItem>
                {BAHAGIAN_LIST.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterObjekAm} onValueChange={setFilterObjekAm}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Objek Am" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Objek Am</SelectItem>
                {OBJEK_AM.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="Hijau">Hijau (On-Track)</SelectItem>
                <SelectItem value="Kuning">Kuning (Perhatian)</SelectItem>
                <SelectItem value="Merah">Merah (Kritikal)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="bg-[#0f2a66] text-white hover:bg-[#1a3a82]">
            <Plus className="h-4 w-4" /> Tambah Peruntukan
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="max-h-[640px] overflow-y-auto scroll-thin">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-white/90 backdrop-blur">
              <TableRow>
                <TableHead>Bahagian / Kod Vot</TableHead>
                <TableHead>Objek Am</TableHead>
                <TableHead>Program</TableHead>
                <TableHead className="text-right">Siling</TableHead>
                <TableHead className="text-right">Dibelanjakan</TableHead>
                <TableHead className="text-right">Komited</TableHead>
                <TableHead className="text-right">Baki</TableHead>
                <TableHead className="min-w-[120px]">Penggunaan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 10 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5" /></TableCell>)}
                  </TableRow>
                ))
              ) : list.length === 0 ? (
                <TableRow><TableCell colSpan={10}><EmptyState icon={<ListChecks className="h-10 w-10" />} title="Tiada peruntukan OE dijumpai" /></TableCell></TableRow>
              ) : list.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{p.bahagian}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{p.kodVot} · {p.kodAktiviti}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <span className="h-2 w-2 rounded-full" style={{ background: OBJEK_AM_COLORS[p.objekAm] || "#94a3b8" }} />
                      {p.objekAm}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">
                    {p.program ? (
                      <div className="flex flex-col">
                        <span className="font-mono text-[10px] text-muted-foreground">{p.program.kodProgram}</span>
                        <span className="truncate max-w-[160px]">{p.program.namaProgram}</span>
                      </div>
                    ) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatRM(p.silingPeruntukan, true)}</TableCell>
                  <TableCell className="text-right text-[#0f2a66]">{formatRM(p.jumlahDibelanjakan, true)}</TableCell>
                  <TableCell className="text-right text-amber-700">{formatRM(p.jumlahKomited, true)}</TableCell>
                  <TableCell className="text-right text-emerald-700 font-semibold">{formatRM(p.bakiPeruntukan, true)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ProgressBar value={p.peratusPenggunaan} status={p.statusPenggunaan} />
                      <span className="text-xs w-10 text-right">{p.peratusPenggunaan.toFixed(0)}%</span>
                    </div>
                  </TableCell>
                  <TableCell><TrafficLight status={p.statusPenggunaan} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditId(p.id)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </GlassCard>

      <CreatePeruntukanDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={() => { setCreateOpen(false); fetchList(); }} tahunKewangan={tahunKewangan} />
      <EditPeruntukanDialog id={editId} onClose={() => setEditId(null)} onSaved={() => { setEditId(null); fetchList(); }} />
    </div>
  );
}

function CreatePeruntukanDialog({
  open, onOpenChange, onCreated, tahunKewangan,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
  tahunKewangan: number;
}) {
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    bahagian: BAHAGIAN_LIST[0],
    objekAm: OBJEK_AM[0],
    kodVot: "",
    kodAktiviti: "",
    silingPeruntukan: "",
  });

  const submit = async () => {
    if (!form.silingPeruntukan) {
      toast.error("Siling peruntukan wajib diisi");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/peruntukan-oe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tahunKewangan, silingPeruntukan: Number(form.silingPeruntukan) }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        toast.error(e.error || "Gagal mencipta peruntukan");
        return;
      }
      toast.success("Peruntukan OE berjaya dicipta");
      onCreated();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-[#0f2a66]" /> Tambah Peruntukan OE</DialogTitle>
          <DialogDescription>Cipta siling peruntukan OE baharu untuk Tahun Kewangan {tahunKewangan} (FR-3.5).</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Bahagian</Label>
            <Select value={form.bahagian} onValueChange={(v) => setForm({ ...form, bahagian: v })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{BAHAGIAN_LIST.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Objek Am</Label>
            <Select value={form.objekAm} onValueChange={(v) => setForm({ ...form, objekAm: v })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{OBJEK_AM.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Kod Vot (iGFMAS)</Label>
            <Input value={form.kodVot} onChange={(e) => setForm({ ...form, kodVot: e.target.value })} placeholder="auto-jana jika dikosongkan" />
          </div>
          <div className="space-y-1.5">
            <Label>Kod Aktiviti</Label>
            <Input value={form.kodAktiviti} onChange={(e) => setForm({ ...form, kodAktiviti: e.target.value })} placeholder="auto-jana jika dikosongkan" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Siling Peruntukan (RM) <span className="text-rose-500">*</span></Label>
            <Input type="number" value={form.silingPeruntukan} onChange={(e) => setForm({ ...form, silingPeruntukan: e.target.value })} placeholder="0.00" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
          <Button onClick={submit} disabled={submitting} className="bg-[#0f2a66] text-white hover:bg-[#1a3a82]">
            {submitting ? "Menyimpan..." : "Simpan Peruntukan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditPeruntukanDialog({
  id, onClose, onSaved,
}: {
  id: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [data, setData] = React.useState<PeruntukanOE | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({ silingPeruntukan: "", jumlahDibelanjakan: "", jumlahKomited: "" });

  React.useEffect(() => {
    if (!id) { setData(null); return; }
    setLoading(true);
    fetch(`/api/peruntukan-oe?tahunKewangan=all`)
      .then((r) => r.json())
      .then((j) => {
        const found = (j.data || []).find((p: PeruntukanOE) => p.id === id);
        setData(found || null);
        if (found) {
          setForm({
            silingPeruntukan: String(found.silingPeruntukan),
            jumlahDibelanjakan: String(found.jumlahDibelanjakan),
            jumlahKomited: String(found.jumlahKomited),
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const submit = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      const r = await fetch(`/api/peruntukan-oe/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          silingPeruntukan: Number(form.silingPeruntukan),
          jumlahDibelanjakan: Number(form.jumlahDibelanjakan),
          jumlahKomited: Number(form.jumlahKomited),
        }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        toast.error(e.error || "Gagal mengemaskini");
        return;
      }
      toast.success("Peruntukan berjaya dikemaskini");
      onSaved();
    } finally {
      setSubmitting(false);
    }
  };

  const previewBaki = (Number(form.silingPeruntukan) || 0) - (Number(form.jumlahDibelanjakan) || 0) - (Number(form.jumlahKomited) || 0);
  const previewPct = Number(form.silingPeruntukan) > 0
    ? ((Number(form.jumlahDibelanjakan) + Number(form.jumlahKomited)) / Number(form.silingPeruntukan)) * 100
    : 0;
  const previewStatus = oeStatusFromPercent(previewPct);

  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5 text-[#0f2a66]" /> Kemaskini Peruntukan OE</DialogTitle>
          <DialogDescription>
            {data && (
              <span>{data.bahagian} · {data.objekAm} · <span className="font-mono">{data.kodVot}</span></span>
            )}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
        ) : data ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Siling Peruntukan (RM)</Label>
                <Input type="number" value={form.silingPeruntukan} onChange={(e) => setForm({ ...form, silingPeruntukan: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Jumlah Dibelanjakan (RM)</Label>
                <Input type="number" value={form.jumlahDibelanjakan} onChange={(e) => setForm({ ...form, jumlahDibelanjakan: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Jumlah Komited (RM)</Label>
                <Input type="number" value={form.jumlahKomited} onChange={(e) => setForm({ ...form, jumlahKomited: e.target.value })} />
              </div>
            </div>

            {/* Computed preview */}
            <div className="rounded-lg border border-slate-200 bg-white/60 p-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Baki (auto)</p>
                  <p className="text-sm font-bold text-emerald-700">{formatRM(previewBaki, true)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Penggunaan</p>
                  <p className="text-sm font-bold text-[#0f2a66]">{previewPct.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Status</p>
                  <div className="mt-1 flex justify-center"><TrafficLight status={previewStatus} /></div>
                </div>
              </div>
              <div className="mt-2">
                <ProgressBar value={previewPct} status={previewStatus} />
              </div>
            </div>
          </>
        ) : (
          <EmptyState title="Peruntukan tidak dijumpai" />
        )}
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
          <Button onClick={submit} disabled={submitting || !data} className="bg-[#0f2a66] text-white hover:bg-[#1a3a82]">
            {submitting ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
