"use client";

import * as React from "react";
import {
  Award, Trophy, Plus, Star, MessageSquare, Target, BarChart3,
  RefreshCw, Eye, ClipboardCheck, Lightbulb, TrendingUp, Users,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  RadialBarChart, RadialBar, PolarAngleAxis, Legend,
} from "recharts";

import {
  GlassCard, StatCard, ModuleHeader, GredBadge, EmptyState, ProgressBar,
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
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import {
  formatRM, formatNumber, formatDate, GRED_COLOR, KATEGORI_COLORS,
} from "@/lib/domain";
import { cn } from "@/lib/utils";

/* ===================== Types ===================== */
type PenilaianSummary = {
  totalDinilai: number;
  belumDinilai: number;
  skorPurata: number;
  kpiPurata: number;
  gredAB: number;
  byGred: Record<string, number>;
};

type PenilaianListItem = {
  id: string;
  tarikhPenilaian: string;
  skorOutput: number;
  skorOutcome: number;
  skorImpact: number;
  skorKeseluruhan: number;
  gred: string;
  pencapaianKPI: number;
  pengajaran: string | null;
  cadangan: string | null;
  program: {
    id: string;
    kodProgram: string;
    namaProgram: string;
    kategori: string;
    negeri: string;
    penerimaManfaat: number;
    tarikhTamat: string;
    _count: { maklumBalas: number; kpi: number };
  };
  penilai: { nama: string; jawatan: string };
};

type BelumDinilai = {
  id: string;
  kodProgram: string;
  namaProgram: string;
  kategori: string;
  negeri: string;
  penerimaManfaat: number;
  tarikhTamat: string;
  _count: { kpi: number; maklumBalas: number };
};

type PenilaianDetail = {
  id: string;
  tarikhPenilaian: string;
  skorOutput: number;
  skorOutcome: number;
  skorImpact: number;
  skorKeseluruhan: number;
  gred: string;
  pencapaianKPI: number;
  pengajaran: string | null;
  cadangan: string | null;
  penilai: { nama: string; jawatan: string };
  program: {
    id: string;
    kodProgram: string;
    namaProgram: string;
    kategori: string;
    negeri: string;
    penerimaManfaat: number;
    tarikhMula: string;
    tarikhTamat: string;
    bajetDianggar: number;
    bajetSebenar: number;
    objektif: string;
    kpi: Array<{
      id: string;
      nama: string;
      sasaran: string;
      nilaiSasaran: number;
      unit: string;
      jenis: string;
      pencapaianSebenar: number | null;
    }>;
    maklumBalas: Array<{
      id: string;
      namaResponden: string;
      skorKepuasan: number;
      komen: string | null;
      tarikh: string;
    }>;
  };
};

/* ===================== Helpers ===================== */
const GRED_HEX: Record<string, string> = {
  A: "#16a34a",
  B: "#84cc16",
  C: "#eab308",
  D: "#f97316",
  E: "#dc2626",
};

const JENIS_COLOR: Record<string, string> = {
  Output: "#0f2a66",
  Outcome: "#f5b82e",
  Impact: "#16a34a",
};

function computeGred(skor: number): string {
  if (skor >= 4.5) return "A";
  if (skor >= 3.5) return "B";
  if (skor >= 2.5) return "C";
  if (skor >= 1.5) return "D";
  return "E";
}

/* ===================== Component ===================== */
export function ProgramEvaluation() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [penilaianList, setPenilaianList] = React.useState<PenilaianListItem[]>([]);
  const [belumDinilai, setBelumDinilai] = React.useState<BelumDinilai[]>([]);
  const [summary, setSummary] = React.useState<PenilaianSummary>({
    totalDinilai: 0, belumDinilai: 0, skorPurata: 0, kpiPurata: 0, gredAB: 0,
    byGred: { A: 0, B: 0, C: 0, D: 0, E: 0 },
  });
  const [fGred, setFGred] = React.useState("all");
  const [fKategori, setFKategori] = React.useState("all");

  // Detail dialog
  const [detail, setDetail] = React.useState<PenilaianDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  // New evaluation dialog
  const [baruOpen, setBaruOpen] = React.useState(false);
  const [baruForm, setBaruForm] = React.useState({
    programId: "",
    skorOutput: 3,
    skorOutcome: 3,
    skorImpact: 3,
    pencapaianKPI: 0,
    pengajaran: "",
    cadangan: "",
  });
  const [baruSaving, setBaruSaving] = React.useState(false);

  // Maklum balas dialog
  const [mbOpen, setMbOpen] = React.useState(false);
  const [mbProgram, setMbProgram] = React.useState<{ id: string; kod: string; nama: string } | null>(null);
  const [mbList, setMbList] = React.useState<any[]>([]);
  const [mbForm, setMbForm] = React.useState({ namaResponden: "", skorKepuasan: 4, komen: "" });

  const load = React.useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (fGred !== "all") params.set("gred", fGred);
    if (fKategori !== "all") params.set("kategori", fKategori);
    try {
      const res = await fetch(`/api/penilaian?${params.toString()}`);
      const data = await res.json();
      setPenilaianList(data.data);
      setBelumDinilai(data.belumDinilai);
      setSummary(data.summary);
    } catch {
      toast({ title: "Ralat", description: "Gagal memuatkan data penilaian", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [fGred, fKategori, toast]);

  React.useEffect(() => { load(); }, [load]);

  // Open detail
  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/penilaian/${id}`);
      const data = await res.json();
      setDetail(data.data);
    } catch {
      toast({ title: "Ralat", description: "Gagal memuatkan butiran penilaian", variant: "destructive" });
    } finally {
      setDetailLoading(false);
    }
  };

  // Submit new evaluation
  const submitBaru = async () => {
    if (!baruForm.programId) {
      toast({ title: "Ralat", description: "Sila pilih program untuk dinilai", variant: "destructive" });
      return;
    }
    setBaruSaving(true);
    try {
      const res = await fetch(`/api/penilaian`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId: baruForm.programId,
          skorOutput: Number(baruForm.skorOutput),
          skorOutcome: Number(baruForm.skorOutcome),
          skorImpact: Number(baruForm.skorImpact),
          pencapaianKPI: Number(baruForm.pencapaianKPI),
          pengajaran: baruForm.pengajaran || null,
          cadangan: baruForm.cadangan || null,
        }),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      const skor = d.data.skorKeseluruhan;
      const gred = d.data.gred;
      toast({
        title: "Penilaian Direkod",
        description: `${d.data.program.kodProgram}: Gred ${gred} (skor ${skor.toFixed(2)}/5)`,
      });
      setBaruForm({ programId: "", skorOutput: 3, skorOutcome: 3, skorImpact: 3, pencapaianKPI: 0, pengajaran: "", cadangan: "" });
      setBaruOpen(false);
      await load();
    } catch {
      toast({ title: "Ralat", description: "Gagal merekod penilaian", variant: "destructive" });
    } finally {
      setBaruSaving(false);
    }
  };

  // Maklum balas
  const openMaklumBalas = async (programId: string, kod: string, nama: string) => {
    setMbProgram({ id: programId, kod, nama });
    setMbOpen(true);
    try {
      const res = await fetch(`/api/maklum-balas?programId=${programId}`);
      const d = await res.json();
      setMbList(d.data ?? []);
    } catch {
      setMbList([]);
    }
  };
  const submitMaklumBalas = async () => {
    if (!mbProgram || !mbForm.namaResponden) {
      toast({ title: "Ralat", description: "Nama responden diperlukan", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`/api/maklum-balas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId: mbProgram.id,
          namaResponden: mbForm.namaResponden,
          skorKepuasan: Number(mbForm.skorKepuasan),
          komen: mbForm.komen || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Maklum Balas Direkod", description: `Terima kasih, ${mbForm.namaResponden}` });
      setMbForm({ namaResponden: "", skorKepuasan: 4, komen: "" });
      // refresh list
      const r = await fetch(`/api/maklum-balas?programId=${mbProgram.id}`);
      const d = await r.json();
      setMbList(d.data ?? []);
    } catch {
      toast({ title: "Ralat", description: "Gagal menyimpan maklum balas", variant: "destructive" });
    }
  };

  /* ===================== Render ===================== */
  if (loading) {
    return (
      <div>
        <ModuleHeader title="Penilaian Program" description="Memuatkan modul..." icon={<Award className="h-5 w-5" />} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/40" />
          ))}
        </div>
        <div className="mt-4 h-96 animate-pulse rounded-2xl bg-white/40" />
      </div>
    );
  }

  // Distribution chart data
  const distData = ["A", "B", "C", "D", "E"].map((g) => ({
    gred: g,
    bil: summary.byGred[g] ?? 0,
    fill: GRED_HEX[g],
  }));

  const kategoriOptions = Array.from(new Set(penilaianList.map((p) => p.program.kategori)));

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Penilaian Program"
        description="Penilaian pelbagai dimensi (Output / Outcome / Impak), maklum balas komuniti & gred prestasi program"
        icon={<Award className="h-5 w-5" />}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="h-4 w-4" /> Segar Semula
            </Button>
            <Button size="sm" className="bg-[#0f2a66] hover:bg-[#1a3a82]" onClick={() => setBaruOpen(true)}>
              <Plus className="h-4 w-4" /> Rekod Penilaian Baharu
            </Button>
          </div>
        }
      />

      {/* ============ TOP STAT CARDS ============ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Program Dinilai"
          value={formatNumber(summary.totalDinilai)}
          sub={`${summary.belumDinilai} lagi menunggu penilaian`}
          icon={<ClipboardCheck className="h-5 w-5" />}
          accent="navy"
        />
        <StatCard
          label="Skor Purata"
          value={`${summary.skorPurata.toFixed(2)}`}
          sub="skala 1-5 merentas program"
          icon={<Star className="h-5 w-5" />}
          accent="gold"
        />
        <StatCard
          label="Gred A & B"
          value={formatNumber(summary.gredAB)}
          sub="program berprestasi tinggi"
          icon={<Trophy className="h-5 w-5" />}
          accent="green"
        />
        <StatCard
          label="Pencapaian KPI"
          value={`${summary.kpiPurata.toFixed(1)}%`}
          sub="purata pencapaian sasaran"
          icon={<Target className="h-5 w-5" />}
          accent="amber"
        />
      </div>

      {/* ============ DISTRIBUTION CHART + BENCHMARK ============ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <GlassCard className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Taburan Penilaian mengikut Gred</h3>
              <p className="text-xs text-muted-foreground">Bilangan program bagi setiap gred A-E</p>
            </div>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={distData} margin={{ left: -16, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,42,102,0.08)" vertical={false} />
              <XAxis dataKey="gred" tick={{ fontSize: 13, fontWeight: 700 }} stroke="#64748b" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#64748b" />
              <Tooltip formatter={(v: number) => [`${v} program`, "Bilangan"]} contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="bil" name="Bilangan Program" radius={[6, 6, 0, 0]} barSize={56}>
                {distData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {distData.map((g) => (
              <span key={g.gred} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-md border text-[10px] font-bold"
                  style={{
                    background: `${g.fill}22`,
                    color: g.fill,
                    borderColor: `${g.fill}55`,
                  }}
                >
                  {g.gred}
                </span>
                {g.bil} program
              </span>
            ))}
          </div>
        </GlassCard>

        {/* Benchmark across categories */}
        <GlassCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Benchmark mengikut Kategori</h3>
              <p className="text-xs text-muted-foreground">Purata skor /5 (FR-5.6)</p>
            </div>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
          {(() => {
            const byKat: Record<string, { sum: number; count: number }> = {};
            for (const p of penilaianList) {
              if (!byKat[p.program.kategori]) byKat[p.program.kategori] = { sum: 0, count: 0 };
              byKat[p.program.kategori].sum += p.skorKeseluruhan;
              byKat[p.program.kategori].count += 1;
            }
            const benchData = Object.entries(byKat).map(([k, v]) => ({
              kategori: k.length > 18 ? k.slice(0, 16) + "…" : k,
              skor: v.count > 0 ? v.sum / v.count : 0,
              bil: v.count,
              fill: KATEGORI_COLORS[k] ?? "#94a3b8",
            }));
            if (benchData.length === 0) {
              return <EmptyState icon={<BarChart3 className="h-7 w-7" />} title="Tiada data benchmark" />;
            }
            return (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={benchData} layout="vertical" margin={{ left: 20, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,42,102,0.08)" horizontal={false} />
                  <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} stroke="#64748b" />
                  <YAxis type="category" dataKey="kategori" tick={{ fontSize: 10 }} stroke="#64748b" width={120} />
                  <Tooltip
                    formatter={(v: number) => [`${v.toFixed(2)} / 5`, "Skor purata"]}
                    contentStyle={{ fontSize: 11 }}
                  />
                  <Bar dataKey="skor" name="Skor" radius={[0, 4, 4, 0]} barSize={18}>
                    {benchData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            );
          })()}
        </GlassCard>
      </div>

      {/* ============ FILTER BAR ============ */}
      <GlassCard className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Gred</Label>
            <Select value={fGred} onValueChange={setFGred}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Gred</SelectItem>
                <SelectItem value="A">A (Cemerlang)</SelectItem>
                <SelectItem value="B">B (Baik)</SelectItem>
                <SelectItem value="C">C (Sederhana)</SelectItem>
                <SelectItem value="D">D (Lemah)</SelectItem>
                <SelectItem value="E">E (Sangat Lemah)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Kategori</Label>
            <Select value={fKategori} onValueChange={setFKategori}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {kategoriOptions.map((k) => (
                  <SelectItem key={k} value={k}>{k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <div className="rounded-lg border border-slate-200 bg-white/60 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{penilaianList.length}</span> program dipaparkan • <span className="font-semibold text-amber-700">{summary.belumDinilai}</span> menunggu penilaian
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ============ EVALUATION TABLE ============ */}
      <GlassCard className="p-0">
        <div className="flex items-center justify-between border-b border-slate-200/60 p-4">
          <div>
            <h3 className="text-sm font-semibold">Senarai Penilaian Program Selesai</h3>
            <p className="text-xs text-muted-foreground">Skor 3-dimensi, gred & pencapaian KPI</p>
          </div>
        </div>
        <div className="max-h-[28rem] overflow-y-auto scroll-thin">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur">
              <TableRow className="border-b border-slate-200">
                <TableHead className="pl-4">Program</TableHead>
                <TableHead>Gred</TableHead>
                <TableHead>Skor /5</TableHead>
                <TableHead className="w-40">Pencapaian KPI</TableHead>
                <TableHead>Penerima Manfaat</TableHead>
                <TableHead>Penilai</TableHead>
                <TableHead>Dinilai Pada</TableHead>
                <TableHead className="text-right pr-4">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {penilaianList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyState
                      icon={<Award className="h-8 w-8" />}
                      title="Tiada penilaian setakat ini"
                      description="Klik 'Rekod Penilaian Baharu' untuk menilai program selesai."
                    />
                  </TableCell>
                </TableRow>
              )}
              {penilaianList.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="pl-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-mono text-[#0f2a66]">{p.program.kodProgram}</span>
                      <span className="text-sm font-medium line-clamp-1 max-w-xs">{p.program.namaProgram}</span>
                      <span className="text-[11px] text-muted-foreground">{p.program.kategori} • {p.program.negeri}</span>
                    </div>
                  </TableCell>
                  <TableCell><GredBadge gred={p.gred} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-[#f5b82e] text-[#f5b82e]" />
                      <span className="text-sm font-semibold">{p.skorKeseluruhan.toFixed(2)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ProgressBar value={p.pencapaianKPI} status={p.pencapaianKPI >= 100 ? "Hijau" : p.pencapaianKPI >= 70 ? "Kuning" : "Merah"} />
                      <span className="w-12 text-right text-xs font-medium">{p.pencapaianKPI.toFixed(0)}%</span>
                    </div>
                  </TableCell>
                  <TableCell><span className="text-xs font-medium">{formatNumber(p.program.penerimaManfaat)}</span></TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs">{p.penilai.nama}</span>
                      <span className="text-[11px] text-muted-foreground">{p.penilai.jawatan}</span>
                    </div>
                  </TableCell>
                  <TableCell><span className="text-xs text-muted-foreground">{formatDate(p.tarikhPenilaian)}</span></TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                        onClick={() => openDetail(p.id)}
                      >
                        <Eye className="h-3 w-3" /> Lihat Penilaian
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                        onClick={() => openMaklumBalas(p.program.id, p.program.kodProgram, p.program.namaProgram)}
                      >
                        <MessageSquare className="h-3 w-3" /> Maklum Balas ({p.program._count.maklumBalas})
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </GlassCard>

      {/* ============ PROGRAMS BELUM DINILAI ============ */}
      {summary.belumDinilai > 0 && (
        <GlassCard className="p-0">
          <div className="flex items-center justify-between border-b border-slate-200/60 p-4">
            <div>
              <h3 className="text-sm font-semibold">Program Selesai Belum Dinilai</h3>
              <p className="text-xs text-muted-foreground">Program yang menunggu penilaian pasca-pelaksanaan</p>
            </div>
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">{summary.belumDinilai} menunggu</Badge>
          </div>
          <div className="max-h-64 overflow-y-auto scroll-thin">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                <TableRow>
                  <TableHead className="pl-4">Program</TableHead>
                  <TableHead>Tamat Pada</TableHead>
                  <TableHead>KPI</TableHead>
                  <TableHead>Maklum Balas</TableHead>
                  <TableHead className="text-right pr-4">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {belumDinilai.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="pl-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-mono text-[#0f2a66]">{p.kodProgram}</span>
                        <span className="text-sm font-medium line-clamp-1 max-w-xs">{p.namaProgram}</span>
                      </div>
                    </TableCell>
                    <TableCell><span className="text-xs text-muted-foreground">{formatDate(p.tarikhTamat)}</span></TableCell>
                    <TableCell><Badge variant="outline">{p._count.kpi} KPI</Badge></TableCell>
                    <TableCell><Badge variant="outline">{p._count.maklumBalas} maklum balas</Badge></TableCell>
                    <TableCell className="text-right pr-4">
                      <Button size="sm" className="h-7 px-2 text-xs bg-[#0f2a66] hover:bg-[#1a3a82]"
                        onClick={() => {
                          setBaruForm({
                            programId: p.id,
                            skorOutput: 3, skorOutcome: 3, skorImpact: 3,
                            pencapaianKPI: 0, pengajaran: "", cadangan: "",
                          });
                          setBaruOpen(true);
                        }}
                      >
                        <Plus className="h-3 w-3" /> Nilai Sekarang
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </GlassCard>
      )}

      {/* ============ PENILAIAN DETAIL DIALOG ============ */}
      <Dialog open={!!detail || detailLoading} onOpenChange={(o) => { if (!o) { setDetail(null); setDetailLoading(false); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          {detailLoading ? (
            <div className="space-y-3 py-6">
              <div className="h-7 w-1/2 animate-pulse rounded bg-slate-200" />
              <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ) : detail ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-[#0f2a66]/10 px-2 py-0.5 font-mono text-xs text-[#0f2a66]">
                    {detail.program.kodProgram}
                  </span>
                  <GredBadge gred={detail.gred} />
                  <div className="flex items-center gap-1 text-sm font-semibold">
                    <Star className="h-4 w-4 fill-[#f5b82e] text-[#f5b82e]" />
                    {detail.skorKeseluruhan.toFixed(2)} / 5
                  </div>
                </div>
                <DialogTitle className="text-lg">{detail.program.namaProgram}</DialogTitle>
                <DialogDescription>
                  {detail.program.kategori} • {detail.program.negeri} • Dinilai oleh {detail.penilai.nama} ({detail.penilai.jawatan}) pada {formatDate(detail.tarikhPenilaian)}
                </DialogDescription>
              </DialogHeader>

              {/* 3-dimension radial bars */}
              <div>
                <h4 className="mb-3 text-sm font-semibold">Skor 3-Dimensi Penilaian</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white/60 p-3">
                    <ResponsiveContainer width="100%" height={180}>
                      <RadialBarChart
                        innerRadius="30%"
                        outerRadius="100%"
                        data={[
                          { name: "Output", value: detail.skorOutput, fill: JENIS_COLOR.Output },
                          { name: "Outcome", value: detail.skorOutcome, fill: JENIS_COLOR.Outcome },
                          { name: "Impak", value: detail.skorImpact, fill: JENIS_COLOR.Impact },
                        ]}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <PolarAngleAxis type="number" domain={[0, 5]} tick={false} />
                        <RadialBar background dataKey="value" cornerRadius={8} />
                        <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: 11 }} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "Output (hasil segera)", skor: detail.skorOutput, color: JENIS_COLOR.Output },
                      { label: "Outcome (kesan jangka sederhana)", skor: detail.skorOutcome, color: JENIS_COLOR.Outcome },
                      { label: "Impak (jangka panjang)", skor: detail.skorImpact, color: JENIS_COLOR.Impact },
                    ].map((d) => (
                      <div key={d.label} className="rounded-lg border border-slate-200 bg-white/60 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground">{d.label}</span>
                          <span className="text-sm font-bold" style={{ color: d.color }}>
                            {d.skor.toFixed(1)} / 5
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                          <div className="h-full rounded-full" style={{ width: `${(d.skor / 5) * 100}%`, background: d.color }} />
                        </div>
                      </div>
                    ))}
                    <div className="rounded-lg border border-[#0f2a66]/20 bg-[#0f2a66]/[0.04] p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#0f2a66]">Pencapaian KPI Keseluruhan</span>
                        <span className="text-sm font-bold text-[#0f2a66]">{detail.pencapaianKPI.toFixed(1)}%</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-[#0f2a66]" style={{ width: `${Math.min(100, detail.pencapaianKPI)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* KPI table */}
              <div>
                <h4 className="mb-2 text-sm font-semibold">Pencapaian KPI berbanding Sasaran</h4>
                {detail.program.kpi.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Tiada KPI ditetapkan untuk program ini.</p>
                ) : (
                  <div className="max-h-56 overflow-y-auto scroll-thin rounded-lg border border-slate-200">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white/95">
                        <TableRow>
                          <TableHead className="pl-3">KPI</TableHead>
                          <TableHead>Jenis</TableHead>
                          <TableHead>Sasaran</TableHead>
                          <TableHead>Sebenar</TableHead>
                          <TableHead className="pr-3 text-right">% Pencapaian</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.program.kpi.map((k) => {
                          const pct = k.pencapaianSebenar !== null && k.nilaiSasaran > 0
                            ? (k.pencapaianSebenar / k.nilaiSasaran) * 100
                            : null;
                          return (
                            <TableRow key={k.id}>
                              <TableCell className="pl-3">
                                <div className="flex flex-col">
                                  <span className="text-xs font-medium">{k.nama}</span>
                                  <span className="text-[10px] text-muted-foreground">{k.sasaran}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white"
                                  style={{ background: JENIS_COLOR[k.jenis] ?? "#64748b" }}
                                >
                                  {k.jenis}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs">{formatNumber(k.nilaiSasaran)} {k.unit}</TableCell>
                              <TableCell className="text-xs">
                                {k.pencapaianSebenar !== null ? `${formatNumber(k.pencapaianSebenar)} ${k.unit}` : "—"}
                              </TableCell>
                              <TableCell className="pr-3 text-right">
                                {pct !== null ? (
                                  <span className={cn(
                                    "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
                                    pct >= 100 ? "bg-emerald-100 text-emerald-700"
                                    : pct >= 70 ? "bg-amber-100 text-amber-800"
                                    : "bg-rose-100 text-rose-700"
                                  )}>
                                    {pct.toFixed(0)}%
                                  </span>
                                ) : "—"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Maklum balas komuniti */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Maklum Balas Komuniti</h4>
                  {detail.program.maklumBalas.length > 0 && (
                    <Badge variant="outline" className="border-[#f5b82e]/40 bg-[#f5b82e]/10 text-[#b87a09]">
                      <Star className="mr-1 h-3 w-3 fill-[#f5b82e] text-[#f5b82e]" />
                      Purata: {(detail.program.maklumBalas.reduce((s, m) => s + m.skorKepuasan, 0) / detail.program.maklumBalas.length).toFixed(2)} / 5
                    </Badge>
                  )}
                </div>
                {detail.program.maklumBalas.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Tiada maklum balas komuniti direkodkan.</p>
                ) : (
                  <div className="max-h-40 space-y-2 overflow-y-auto scroll-thin">
                    {detail.program.maklumBalas.map((m) => (
                      <div key={m.id} className="rounded-lg border border-slate-200 bg-white/60 p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{m.namaResponden}</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={cn(
                                "h-3 w-3",
                                s <= m.skorKepuasan ? "fill-[#f5b82e] text-[#f5b82e]" : "text-slate-300"
                              )} />
                            ))}
                            <span className="ml-1 text-xs font-semibold text-[#b87a09]">{m.skorKepuasan.toFixed(1)}</span>
                          </div>
                        </div>
                        {m.komen && <p className="mt-1 text-xs text-muted-foreground">"{m.komen}"</p>}
                        <p className="mt-0.5 text-[10px] text-muted-foreground">{formatDate(m.tarikh)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pengajaran & cadangan */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-emerald-700" />
                    <h5 className="text-xs font-semibold text-emerald-800">Pengajaran (Lessons Learned)</h5>
                  </div>
                  <p className="text-xs text-foreground">
                    {detail.pengajaran || "Tiada pengajaran direkodkan."}
                  </p>
                </div>
                <div className="rounded-xl border border-[#0f2a66]/20 bg-[#0f2a66]/[0.04] p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#0f2a66]" />
                    <h5 className="text-xs font-semibold text-[#0f2a66]">Cadangan Penambahbaikan</h5>
                  </div>
                  <p className="text-xs text-foreground">
                    {detail.cadangan || "Tiada cadangan direkodkan."}
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setDetail(null); }}>
                  Tutup
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ============ REKOD PENILAIAN BAHARU DIALOG ============ */}
      <Dialog open={baruOpen} onOpenChange={setBaruOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Rekod Penilaian Program</DialogTitle>
            <DialogDescription>
              Nilai program berdasarkan 3 dimensi (Output / Outcome / Impak). Skor 0-5 — sistem akan menjana skor keseluruhan & gred A-E.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Program <span className="text-rose-600">*</span></Label>
              <Select
                value={baruForm.programId}
                onValueChange={(v) => setBaruForm({ ...baruForm, programId: v })}
              >
                <SelectTrigger><SelectValue placeholder="Pilih program selesai yang belum dinilai" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {belumDinilai.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.kodProgram} — {p.namaProgram.slice(0, 40)}{p.namaProgram.length > 40 ? "…" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {belumDinilai.length === 0 && (
                <p className="text-[11px] text-amber-700">Semua program selesai telah dinilai.</p>
              )}
            </div>

            {/* Sliders for skor */}
            <SliderRow
              label="Skor Output (hasil segera)"
              value={baruForm.skorOutput}
              onChange={(v) => setBaruForm({ ...baruForm, skorOutput: v })}
              color={JENIS_COLOR.Output}
            />
            <SliderRow
              label="Skor Outcome (kesan jangka sederhana)"
              value={baruForm.skorOutcome}
              onChange={(v) => setBaruForm({ ...baruForm, skorOutcome: v })}
              color={JENIS_COLOR.Outcome}
            />
            <SliderRow
              label="Skor Impak (jangka panjang)"
              value={baruForm.skorImpact}
              onChange={(v) => setBaruForm({ ...baruForm, skorImpact: v })}
              color={JENIS_COLOR.Impact}
            />

            {/* Computed preview */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Skor Keseluruhan (purata 3 dimensi):</span>
                <span className="font-bold text-[#0f2a66]">
                  {((baruForm.skorOutput + baruForm.skorOutcome + baruForm.skorImpact) / 3).toFixed(2)} / 5
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Gred Dijana:</span>
                <GredBadge gred={computeGred((baruForm.skorOutput + baruForm.skorOutcome + baruForm.skorImpact) / 3)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Pencapaian KPI Keseluruhan (%)</Label>
              <Input
                type="number" min={0} max={200} step={1}
                value={baruForm.pencapaianKPI || ""}
                onChange={(e) => setBaruForm({ ...baruForm, pencapaianKPI: Number(e.target.value) })}
                placeholder="cth: 85"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Pengajaran (Lessons Learned)</Label>
              <Textarea
                rows={2}
                value={baruForm.pengajaran}
                onChange={(e) => setBaruForm({ ...baruForm, pengajaran: e.target.value })}
                placeholder="Apakah pengajaran yang boleh diambil dari program ini?"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cadangan Penambahbaikan</Label>
              <Textarea
                rows={2}
                value={baruForm.cadangan}
                onChange={(e) => setBaruForm({ ...baruForm, cadangan: e.target.value })}
                placeholder="Cadangan untuk program akan datang..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBaruOpen(false)}>Batal</Button>
            <Button className="bg-[#0f2a66] hover:bg-[#1a3a82]" disabled={baruSaving || !baruForm.programId} onClick={submitBaru}>
              {baruSaving ? "Menyimpan..." : "Simpan Penilaian"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ MAKLUM BALAS DIALOG ============ */}
      <Dialog open={mbOpen} onOpenChange={setMbOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Maklum Balas Komuniti</DialogTitle>
            <DialogDescription>
              {mbProgram && `${mbProgram.kod} — ${mbProgram.nama}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {/* Add maklum balas form */}
            <div className="rounded-xl border border-slate-200 bg-white/60 p-3">
              <h4 className="mb-2 text-xs font-semibold">Tambah Maklum Balas Baharu</h4>
              <div className="space-y-2">
                <Input
                  placeholder="Nama responden"
                  value={mbForm.namaResponden}
                  onChange={(e) => setMbForm({ ...mbForm, namaResponden: e.target.value })}
                />
                <div className="space-y-1.5">
                  <Label className="text-xs">Skor Kepuasan: {mbForm.skorKepuasan.toFixed(1)} / 5</Label>
                  <Slider
                    value={[mbForm.skorKepuasan]}
                    min={0} max={5} step={0.5}
                    onValueChange={(v) => setMbForm({ ...mbForm, skorKepuasan: v[0] })}
                  />
                </div>
                <Textarea
                  rows={2}
                  placeholder="Komen responden (pilihan)"
                  value={mbForm.komen}
                  onChange={(e) => setMbForm({ ...mbForm, komen: e.target.value })}
                />
                <div className="flex justify-end">
                  <Button size="sm" className="bg-[#0f2a66] hover:bg-[#1a3a82]" onClick={submitMaklumBalas}>
                    <Plus className="h-3.5 w-3.5" /> Simpan
                  </Button>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="max-h-64 space-y-2 overflow-y-auto scroll-thin">
              {mbList.length === 0 ? (
                <EmptyState icon={<MessageSquare className="h-7 w-7" />} title="Tiada maklum balas lagi" description="Tambah maklum balas pertama di atas." />
              ) : (
                mbList.map((m: any) => (
                  <div key={m.id} className="rounded-lg border border-slate-200 bg-white/60 p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{m.namaResponden}</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn(
                            "h-3 w-3",
                            s <= m.skorKepuasan ? "fill-[#f5b82e] text-[#f5b82e]" : "text-slate-300"
                          )} />
                        ))}
                        <span className="ml-1 text-xs font-semibold text-[#b87a09]">{m.skorKepuasan.toFixed(1)}</span>
                      </div>
                    </div>
                    {m.komen && <p className="mt-1 text-xs text-muted-foreground">"{m.komen}"</p>}
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{formatDate(m.tarikh)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMbOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ===================== Slider Row Subcomponent ===================== */
function SliderRow({
  label, value, onChange, color,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="rounded-md px-2 py-0.5 text-xs font-bold" style={{ background: `${color}22`, color }}>
          {value.toFixed(1)} / 5
        </span>
      </div>
      <Slider
        value={[value]}
        min={0} max={5} step={0.1}
        onValueChange={(v) => onChange(v[0])}
      />
    </div>
  );
}
