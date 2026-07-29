"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  ClipboardList, Plus, Search, Filter, List, GanttChart, Kanban,
  Eye, Pencil, CheckCircle2, Trash2, X, Calendar, Target, MapPin,
  Users2, Wallet, FileText, ArrowRight, Layers, Tag, Building2, Clock,
} from "lucide-react";

import {
  GlassCard, StatCard, ModuleHeader, StatusBadge, TrafficLight,
  ProgressBar, EmptyState,
} from "@/components/shared/dppk-ui";
import {
  PROGRAM_STATUS, KATEGORI_PROGRAM, KATEGORI_COLORS,
  formatRM, formatNumber, formatDate,
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
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

/* ============================================================
 * Types
 * ============================================================ */
type ProgramListItem = {
  id: string;
  kodProgram: string;
  namaProgram: string;
  kategori: string;
  subKategori?: string | null;
  negeri: string;
  daerah: string;
  pbt?: string | null;
  status: string;
  statusLampu: string;
  bajetDianggar: number;
  bajetSebenar: number;
  peratusKemajuan: number;
  tarikhMula: string;
  tarikhTamat: string;
  objektif: string;
  kumpulanSasaran?: string | null;
  penerimaManfaat: number;
  bilKPI: number;
  bilAktiviti: number;
  bilPeruntukan: number;
  tarikhCipta: string;
};

type KPI = {
  id?: string;
  nama: string;
  sasaran: string;
  nilaiSasaran: number;
  unit: string;
  jenis: string;
};

type Aktiviti = {
  id?: string;
  nama: string;
  tarikhMula: string;
  tarikhTamat: string;
  peratusKemajuan: number;
  status: string;
  PIC?: string | null;
};

type ProgramDetail = ProgramListItem & {
  pengurus?: { nama: string; jawatan: string; bahagian: string };
  pelulus?: { nama: string; jawatan: string } | null;
  kpi: KPI[];
  aktiviti: Aktiviti[];
};

const NEGERI_LIST = [
  "Selangor", "Johor", "Pulau Pinang", "Sabah", "Sarawak", "Perak",
  "Kedah", "Kelantan", "Pahang", "Negeri Sembilan", "Melaka",
  "Terengganu", "Perlis", "Wilayah Persekutuan Kuala Lumpur",
  "Wilayah Persekutuan Putrajaya", "Wilayah Persekutuan Labuan",
];

const APPROVAL_STAGES = [
  { key: "Perancangan", label: "Draf Cadangan", desc: "Disediakan oleh pengurus program", color: "from-slate-500 to-slate-600" },
  { key: "Semakan", label: "Semakan", desc: "Semakan oleh ketua bahagian", color: "from-amber-500 to-amber-600" },
  { key: "Kelulusan", label: "Kelulusan", desc: "Pengurusan atasan / YB", color: "from-[#e09c12] to-[#f5b82e]" },
  { key: "Diluluskan", label: "Diluluskan", desc: "Sedia untuk pelaksanaan", color: "from-emerald-500 to-emerald-600" },
];

/* ============================================================
 * Main Component
 * ============================================================ */
export function ProgramPlanning() {
  const [list, setList] = React.useState<ProgramListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState({
    status: "all", kategori: "all", negeri: "all", search: "",
  });
  const [activeTab, setActiveTab] = React.useState("senarai");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [detailId, setDetailId] = React.useState<string | null>(null);

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status !== "all") params.set("status", filters.status);
      if (filters.kategori !== "all") params.set("kategori", filters.kategori);
      if (filters.negeri !== "all") params.set("negeri", filters.negeri);
      if (filters.search) params.set("search", filters.search);
      const r = await fetch(`/api/programs?${params}`);
      const j = await r.json();
      setList(j.data || []);
    } catch {
      toast.error("Gagal memuatkan senarai program");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  React.useEffect(() => { fetchList(); }, [fetchList]);

  // Stats
  const total = list.length;
  const totalBajet = list.reduce((s, p) => s + p.bajetDianggar, 0);
  const draftCount = list.filter((p) => p.status === "Perancangan").length;
  const approvedCount = list.filter((p) => p.status === "Diluluskan" || p.status === "DalamPelaksanaan").length;

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Perancangan Program"
        description="Cipta, semak dan lulus cadangan program pembangunan komuniti (FR-2.1 hingga FR-2.7)"
        icon={<ClipboardList className="h-5 w-5" />}
        action={
          <Button onClick={() => setCreateOpen(true)} className="bg-[#0f2a66] text-white hover:bg-[#1a3a82]">
            <Plus className="h-4 w-4" /> Cipta Program Baharu
          </Button>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Jumlah Cadangan" value={formatNumber(total)} sub={`${draftCount} draf aktif`} icon={<ClipboardList className="h-5 w-5" />} accent="navy" />
        <StatCard label="Diluluskan / Aktif" value={formatNumber(approvedCount)} sub="sedia pelaksanaan" icon={<CheckCircle2 className="h-5 w-5" />} accent="green" />
        <StatCard label="Bajet Dianggar" value={formatRM(totalBajet, true)} sub={`${list.length} program`} icon={<Wallet className="h-5 w-5" />} accent="gold" />
        <StatCard label="Purata Kemajuan" value={`${(list.reduce((s, p) => s + p.peratusKemajuan, 0) / (total || 1)).toFixed(1)}%`} sub="kemajuan purata" icon={<Target className="h-5 w-5" />} accent="amber" />
      </div>

      {/* Filter bar */}
      <GlassCard className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama / kod program..."
              className="pl-9"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
            <SelectTrigger className="w-full"><Filter className="mr-1.5 h-3.5 w-3.5" /><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {Object.entries(PROGRAM_STATUS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.kategori} onValueChange={(v) => setFilters({ ...filters, kategori: v })}>
            <SelectTrigger className="w-full"><Tag className="mr-1.5 h-3.5 w-3.5" /><SelectValue placeholder="Kategori" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {KATEGORI_PROGRAM.map((k) => (
                <SelectItem key={k} value={k}>{k}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.negeri} onValueChange={(v) => setFilters({ ...filters, negeri: v })}>
            <SelectTrigger className="w-full md:col-span-1"><MapPin className="mr-1.5 h-3.5 w-3.5" /><SelectValue placeholder="Negeri" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Negeri</SelectItem>
              {NEGERI_LIST.map((n) => (
                <SelectItem key={n} value={n}>{n.replace("Wilayah Persekutuan ", "WP ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start sm:w-auto">
          <TabsTrigger value="senarai"><List className="h-3.5 w-3.5" /> Senarai Program</TabsTrigger>
          <TabsTrigger value="gantt"><GanttChart className="h-3.5 w-3.5" /> Carta Gantt</TabsTrigger>
          <TabsTrigger value="aliran"><Kanban className="h-3.5 w-3.5" /> Aliran Kelulusan</TabsTrigger>
        </TabsList>

        <TabsContent value="senarai" className="mt-4">
          <ProgramTable
            list={list}
            loading={loading}
            onView={(id) => setDetailId(id)}
            onApprove={async (id) => {
              const r = await fetch(`/api/programs/${id}/lulus`, { method: "POST" });
              if (r.ok) { toast.success("Program berjaya diluluskan"); fetchList(); }
              else { const e = await r.json().catch(() => ({})); toast.error(e.error || "Galat meluluskan program"); }
            }}
            onDelete={async (id) => {
              const r = await fetch(`/api/programs/${id}`, { method: "DELETE" });
              if (r.ok) { toast.success("Program dipadam"); fetchList(); }
              else { toast.error("Gagal memadam"); }
            }}
          />
        </TabsContent>

        <TabsContent value="gantt" className="mt-4">
          <GanttView list={list} loading={loading} onSelect={(id) => setDetailId(id)} />
        </TabsContent>

        <TabsContent value="aliran" className="mt-4">
          <ApprovalBoard list={list} loading={loading} onSelect={(id) => setDetailId(id)} />
        </TabsContent>
      </Tabs>

      {/* Create dialog */}
      <CreateProgramDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={() => { setCreateOpen(false); fetchList(); }} />

      {/* Detail sheet */}
      <ProgramDetailSheet id={detailId} onClose={() => setDetailId(null)} onChanged={fetchList} />
    </div>
  );
}

/* ============================================================
 * Programs Table
 * ============================================================ */
function ProgramTable({
  list, loading, onView, onApprove, onDelete,
}: {
  list: ProgramListItem[];
  loading: boolean;
  onView: (id: string) => void;
  onApprove: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (loading) {
    return (
      <GlassCard className="p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="mb-2 h-12 w-full" />
        ))}
      </GlassCard>
    );
  }
  if (list.length === 0) {
    return (
      <GlassCard className="p-4">
        <EmptyState icon={<ClipboardList className="h-10 w-10" />} title="Tiada program dijumpai" description="Cuba ubah penapis atau cipta program baharu." />
      </GlassCard>
    );
  }
  return (
    <GlassCard className="p-0 overflow-hidden">
      <div className="max-h-[600px] overflow-y-auto scroll-thin">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-white/90 backdrop-blur">
            <TableRow>
              <TableHead className="min-w-[140px]">Kod / Nama</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Negeri</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Bajet</TableHead>
              <TableHead className="min-w-[120px]">Kemajuan</TableHead>
              <TableHead>Tempoh</TableHead>
              <TableHead className="text-right">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((p) => (
              <TableRow key={p.id} className="cursor-pointer hover:bg-[#0f2a66]/5" onClick={() => onView(p.id)}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-xs font-mono text-muted-foreground">{p.kodProgram}</span>
                    <span className="font-medium text-foreground line-clamp-2 max-w-[260px]">{p.namaProgram}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-xs">
                    <span className="h-2 w-2 rounded-full" style={{ background: KATEGORI_COLORS[p.kategori] || "#94a3b8" }} />
                    {p.kategori}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{p.negeri.replace("Wilayah Persekutuan ", "WP ")}</TableCell>
                <TableCell><StatusBadge status={p.status} /></TableCell>
                <TableCell className="text-right font-medium">{formatRM(p.bajetDianggar, true)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={p.peratusKemajuan} status={p.statusLampu} />
                    <span className="text-xs w-10 text-right">{p.peratusKemajuan.toFixed(0)}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(p.tarikhMula)}</div>
                  <div className="flex items-center gap-1"><ArrowRight className="h-3 w-3" />{formatDate(p.tarikhTamat)}</div>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Layers className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(p.id)}><Eye className="mr-2 h-3.5 w-3.5" /> Lihat Butiran</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onView(p.id)}><Pencil className="mr-2 h-3.5 w-3.5" /> Kemaskini</DropdownMenuItem>
                      {(p.status === "Perancangan" || p.status === "Semakan") && (
                        <DropdownMenuItem onClick={() => onApprove(p.id)} className="text-emerald-700">
                          <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Lulus Program
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDelete(p.id)} className="text-rose-700">
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Padam
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </GlassCard>
  );
}

/* ============================================================
 * Gantt View
 * ============================================================ */
function GanttView({
  list, loading, onSelect,
}: {
  list: ProgramListItem[];
  loading: boolean;
  onSelect: (id: string) => void;
}) {
  if (loading) {
    return <GlassCard className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</GlassCard>;
  }
  if (list.length === 0) {
    return <GlassCard className="p-4"><EmptyState icon={<GanttChart className="h-10 w-10" />} title="Tiada program untuk paparan Gantt" /></GlassCard>;
  }

  // Build global timeline range
  const dates = list.flatMap((p) => [new Date(p.tarikhMula), new Date(p.tarikhTamat)]);
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
  // add padding
  minDate.setDate(minDate.getDate() - 7);
  maxDate.setDate(maxDate.getDate() + 7);
  const totalMs = maxDate.getTime() - minDate.getTime();

  // Month ticks
  const ticks: { label: string; pct: number }[] = [];
  const cursor = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  while (cursor <= maxDate) {
    const pct = ((cursor.getTime() - minDate.getTime()) / totalMs) * 100;
    ticks.push({ label: cursor.toLocaleDateString("ms-MY", { month: "short", year: "2-digit" }), pct });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return (
    <GlassCard className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Carta Gantt Program</h3>
          <p className="text-xs text-muted-foreground">Garis masa pelaksanaan program mengikut tarikh mula & tamat</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {Object.entries(KATEGORI_COLORS).map(([k, v]) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: v }} />{k}
            </span>
          ))}
        </div>
      </div>

      {/* Header timeline */}
      <div className="relative mb-2 h-6 border-b border-slate-200">
        {ticks.map((t, i) => (
          <div key={i} className="absolute top-0 flex h-full flex-col justify-end text-[10px] text-muted-foreground" style={{ left: `${t.pct}%` }}>
            <div className="h-2 w-px bg-slate-200" />
            <span className="whitespace-nowrap">{t.label}</span>
          </div>
        ))}
      </div>

      {/* Bars */}
      <div className="space-y-2 max-h-[480px] overflow-y-auto scroll-thin pr-2">
        {list.map((p) => {
          const start = new Date(p.tarikhMula).getTime();
          const end = new Date(p.tarikhTamat).getTime();
          const left = ((start - minDate.getTime()) / totalMs) * 100;
          const width = Math.max(2, ((end - start) / totalMs) * 100);
          const color = KATEGORI_COLORS[p.kategori] || "#0f2a66";
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className="group flex items-center gap-2 w-full hover:bg-[#0f2a66]/5 rounded-lg px-1 py-0.5"
            >
              <div className="w-56 shrink-0 truncate text-left text-xs">
                <div className="font-medium truncate">{p.namaProgram}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{p.kodProgram}</div>
              </div>
              <div className="relative flex-1 h-6 rounded bg-slate-100/60">
                <div
                  className="absolute top-0.5 h-5 rounded-md shadow-sm transition-all group-hover:scale-y-110"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                  }}
                  title={`${p.namaProgram} (${formatDate(p.tarikhMula)} → ${formatDate(p.tarikhTamat)})`}
                >
                  <div className="flex h-full items-center justify-between px-1.5 text-[9px] font-medium text-white">
                    <span className="truncate">{p.peratusKemajuan.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
}

/* ============================================================
 * Approval Board (Kanban)
 * ============================================================ */
function ApprovalBoard({
  list, loading, onSelect,
}: {
  list: ProgramListItem[];
  loading: boolean;
  onSelect: (id: string) => void;
}) {
  if (loading) {
    return <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64" />)}</div>;
  }

  const grouped = APPROVAL_STAGES.map((s) => ({
    ...s,
    items: list.filter((p) => p.status === s.key),
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      {grouped.map((col) => (
        <GlassCard key={col.key} className="p-3 flex flex-col">
          <div className="mb-3 flex items-center gap-2">
            <div className={cn("flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br text-white text-xs font-bold", col.color)}>
              {col.items.length}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{col.label}</p>
              <p className="text-[10px] text-muted-foreground truncate">{col.desc}</p>
            </div>
          </div>
          <div className="flex-1 space-y-2 max-h-[520px] overflow-y-auto scroll-thin pr-1">
            {col.items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-muted-foreground">
                Tiada program
              </div>
            ) : (
              col.items.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelect(p.id)}
                  className="w-full rounded-lg border border-slate-200 bg-white/60 p-3 text-left transition-all hover:border-[#0f2a66]/40 hover:shadow-md"
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground">{p.kodProgram}</span>
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: KATEGORI_COLORS[p.kategori] || "#94a3b8" }} />
                  </div>
                  <p className="text-xs font-medium line-clamp-2 min-h-[2.4em]">{p.namaProgram}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{p.negeri.replace("Wilayah Persekutuan ", "WP ")}</span>
                    <span className="font-semibold text-foreground">{formatRM(p.bajetDianggar, true)}</span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar value={p.peratusKemajuan} status={p.statusLampu} />
                  </div>
                </button>
              ))
            )}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

/* ============================================================
 * Create Program Dialog
 * ============================================================ */
function CreateProgramDialog({
  open, onOpenChange, onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}) {
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    namaProgram: "", kategori: "Infrastruktur", subKategori: "",
    negeri: "Selangor", daerah: "", pbt: "",
    objektif: "", kumpulanSasaran: "",
    tarikhMula: "", tarikhTamat: "",
    bajetDianggar: "",
  });
  const [kpis, setKpis] = React.useState<KPI[]>([
    { nama: "", sasaran: "", nilaiSasaran: 0, unit: "", jenis: "Output" },
  ]);

  const submit = async () => {
    if (!form.namaProgram || !form.negeri || !form.tarikhMula || !form.tarikhTamat) {
      toast.error("Sila isi medan wajib: nama, negeri, tarikh mula & tamat");
      return;
    }
    setSubmitting(true);
    try {
      const validKpis = kpis.filter((k) => k.nama.trim() !== "");
      const r = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, bajetDianggar: Number(form.bajetDianggar) || 0, kpis: validKpis }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        toast.error(e.error || "Gagal mencipta program");
        return;
      }
      toast.success("Program baharu berjaya dicipta sebagai Draf Cadangan");
      setForm({
        namaProgram: "", kategori: "Infrastruktur", subKategori: "",
        negeri: "Selangor", daerah: "", pbt: "",
        objektif: "", kumpulanSasaran: "",
        tarikhMula: "", tarikhTamat: "", bajetDianggar: "",
      });
      setKpis([{ nama: "", sasaran: "", nilaiSasaran: 0, unit: "", jenis: "Output" }]);
      onCreated();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-[#0f2a66]" /> Cipta Program Baharu</DialogTitle>
          <DialogDescription>Borang cadangan program pembangunan komuniti — status akan ditetapkan sebagai "Perancangan" (Draf Cadangan).</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Section: Asas */}
          <section className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Maklumat Asas</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Nama Program <span className="text-rose-500">*</span></Label>
                <Input value={form.namaProgram} onChange={(e) => setForm({ ...form, namaProgram: e.target.value })} placeholder="cth. Program Penyelenggaraan Taman Komuniti" />
              </div>
              <div className="space-y-1.5">
                <Label>Kategori <span className="text-rose-500">*</span></Label>
                <Select value={form.kategori} onValueChange={(v) => setForm({ ...form, kategori: v })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {KATEGORI_PROGRAM.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Sub-Kategori</Label>
                <Input value={form.subKategori} onChange={(e) => setForm({ ...form, subKategori: e.target.value })} placeholder="cth. Infrastruktur Komuniti" />
              </div>
            </div>
          </section>

          {/* Section: Lokasi */}
          <section className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lokasi Pelaksanaan</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Negeri <span className="text-rose-500">*</span></Label>
                <Select value={form.negeri} onValueChange={(v) => setForm({ ...form, negeri: v })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NEGERI_LIST.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Daerah</Label>
                <Input value={form.daerah} onChange={(e) => setForm({ ...form, daerah: e.target.value })} placeholder="cth. Petaling" />
              </div>
              <div className="space-y-1.5">
                <Label>PBT</Label>
                <Input value={form.pbt} onChange={(e) => setForm({ ...form, pbt: e.target.value })} placeholder="cth. MBPJ" />
              </div>
            </div>
          </section>

          {/* Section: Objektif & Sasaran */}
          <section className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Objektif & Kumpulan Sasaran</h4>
            <div className="space-y-1.5">
              <Label>Objektif Program</Label>
              <Textarea rows={2} value={form.objektif} onChange={(e) => setForm({ ...form, objektif: e.target.value })} placeholder="Pernyataan objektif program..." />
            </div>
            <div className="space-y-1.5">
              <Label>Kumpulan Sasaran</Label>
              <Input value={form.kumpulanSasaran} onChange={(e) => setForm({ ...form, kumpulanSasaran: e.target.value })} placeholder="cth. Penduduk B40, Warga Emas, Belia" />
            </div>
          </section>

          {/* Section: Tempoh & Bajet */}
          <section className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tempoh & Bajet Dianggar</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Tarikh Mula <span className="text-rose-500">*</span></Label>
                <Input type="date" value={form.tarikhMula} onChange={(e) => setForm({ ...form, tarikhMula: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Tarikh Tamat <span className="text-rose-500">*</span></Label>
                <Input type="date" value={form.tarikhTamat} onChange={(e) => setForm({ ...form, tarikhTamat: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Bajet Dianggar (RM)</Label>
                <Input type="number" value={form.bajetDianggar} onChange={(e) => setForm({ ...form, bajetDianggar: e.target.value })} placeholder="0.00" />
              </div>
            </div>
          </section>

          {/* Section: KPI setter */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">KPI & Sasaran Terukur</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setKpis([...kpis, { nama: "", sasaran: "", nilaiSasaran: 0, unit: "", jenis: "Output" }])}
              >
                <Plus className="h-3.5 w-3.5" /> Tambah KPI
              </Button>
            </div>
            <div className="space-y-2">
              {kpis.map((k, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end rounded-lg border border-slate-200 bg-white/50 p-2">
                  <div className="col-span-12 sm:col-span-4 space-y-1">
                    <Label className="text-[10px]">Nama KPI</Label>
                    <Input value={k.nama} onChange={(e) => { const n = [...kpis]; n[idx] = { ...k, nama: e.target.value }; setKpis(n); }} placeholder="cth. Kadar Penyertaan" />
                  </div>
                  <div className="col-span-6 sm:col-span-2 space-y-1">
                    <Label className="text-[10px]">Jenis</Label>
                    <Select value={k.jenis} onValueChange={(v) => { const n = [...kpis]; n[idx] = { ...k, jenis: v }; setKpis(n); }}>
                      <SelectTrigger className="w-full text-xs h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Output">Output</SelectItem>
                        <SelectItem value="Outcome">Outcome</SelectItem>
                        <SelectItem value="Impact">Impact</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-6 sm:col-span-2 space-y-1">
                    <Label className="text-[10px]">Nilai Sasaran</Label>
                    <Input type="number" value={k.nilaiSasaran} onChange={(e) => { const n = [...kpis]; n[idx] = { ...k, nilaiSasaran: Number(e.target.value) }; setKpis(n); }} />
                  </div>
                  <div className="col-span-6 sm:col-span-1 space-y-1">
                    <Label className="text-[10px]">Unit</Label>
                    <Input value={k.unit} onChange={(e) => { const n = [...kpis]; n[idx] = { ...k, unit: e.target.value }; setKpis(n); }} placeholder="%" />
                  </div>
                  <div className="col-span-5 sm:col-span-2 space-y-1">
                    <Label className="text-[10px]">Penerangan Sasaran</Label>
                    <Input value={k.sasaran} onChange={(e) => { const n = [...kpis]; n[idx] = { ...k, sasaran: e.target.value }; setKpis(n); }} placeholder="cth. 80% penyertaan" />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:bg-rose-50" onClick={() => setKpis(kpis.filter((_, i) => i !== idx))} disabled={kpis.length === 1}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
          <Button onClick={submit} disabled={submitting} className="bg-[#0f2a66] text-white hover:bg-[#1a3a82]">
            {submitting ? "Menyimpan..." : "Simpan sebagai Draf"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
 * Program Detail Sheet (drawer)
 * ============================================================ */
function ProgramDetailSheet({
  id, onClose, onChanged,
}: {
  id: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [data, setData] = React.useState<ProgramDetail | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!id) { setData(null); return; }
    setLoading(true);
    fetch(`/api/programs/${id}`)
      .then((r) => r.json())
      .then((j) => setData(j.data))
      .catch(() => toast.error("Gagal memuatkan butiran"))
      .finally(() => setLoading(false));
  }, [id]);

  const approve = async () => {
    if (!id) return;
    const r = await fetch(`/api/programs/${id}/lulus`, { method: "POST" });
    if (r.ok) { toast.success("Program diluluskan"); onChanged(); onClose(); }
    else { const e = await r.json().catch(() => ({})); toast.error(e.error || "Gagal meluluskan"); }
  };

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto scroll-thin">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {data && <StatusBadge status={data.status} />}
            <span className="font-mono text-sm text-muted-foreground">{data?.kodProgram}</span>
          </SheetTitle>
          <SheetDescription>{data?.namaProgram}</SheetDescription>
        </SheetHeader>

        {loading && (
          <div className="space-y-3 px-1">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        )}

        {data && !loading && (
          <div className="space-y-4 px-1 pb-6">
            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <MiniStat label="Bajet" value={formatRM(data.bajetDianggar, true)} icon={<Wallet className="h-3.5 w-3.5" />} />
              <MiniStat label="Kemajuan" value={`${data.peratusKemajuan.toFixed(0)}%`} icon={<Target className="h-3.5 w-3.5" />} />
              <MiniStat label="Penerima" value={formatNumber(data.penerimaManfaat)} icon={<Users2 className="h-3.5 w-3.5" />} />
              <MiniStat label="Lampu" value={<TrafficLight status={data.statusLampu} />} icon={<Clock className="h-3.5 w-3.5" />} />
            </div>

            {/* Detail rows */}
            <GlassCard className="p-4 space-y-3">
              <Row label="Kategori" value={
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: KATEGORI_COLORS[data.kategori] || "#94a3b8" }} />
                  {data.kategori}{data.subKategori ? ` · ${data.subKategori}` : ""}
                </span>
              } />
              <Row label="Lokasi" value={`${data.negeri.replace("Wilayah Persekutuan ", "WP ")}, ${data.daerah}${data.pbt ? ` (${data.pbt})` : ""}`} />
              <Row label="Tempoh" value={`${formatDate(data.tarikhMula)} → ${formatDate(data.tarikhTamat)}`} />
              <Row label="Kumpulan Sasaran" value={data.kumpulanSasaran || "—"} />
              <Row label="Pengurus Program" value={data.pengurus ? `${data.pengurus.nama} (${data.pengurus.jawatan})` : "—"} />
              {data.pelulus && <Row label="Diluluskan Oleh" value={`${data.pelulus.nama} (${data.pelulus.jawatan})`} />}
            </GlassCard>

            {/* Objektif */}
            <GlassCard className="p-4">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4 text-[#0f2a66]" /> Objektif Program</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{data.objektif || "Tiada objektif direkodkan."}</p>
            </GlassCard>

            {/* KPI list */}
            <GlassCard className="p-4">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Target className="h-4 w-4 text-[#0f2a66]" /> KPI & Sasaran ({data.kpi.length})</h4>
              {data.kpi.length === 0 ? (
                <EmptyState title="Tiada KPI ditetapkan" />
              ) : (
                <div className="space-y-2">
                  {data.kpi.map((k) => (
                    <div key={k.id} className="flex items-start justify-between rounded-lg border border-slate-200 bg-white/50 p-2.5">
                      <div>
                        <p className="text-sm font-medium">{k.nama}</p>
                        <p className="text-xs text-muted-foreground">{k.sasaran || "—"}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-1">{k.jenis}</Badge>
                        <p className="text-sm font-semibold text-[#0f2a66]">{k.nilaiSasaran} {k.unit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Aktiviti mini Gantt */}
            <GlassCard className="p-4">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold"><GanttChart className="h-4 w-4 text-[#0f2a66]" /> Aktiviti ({data.aktiviti.length})</h4>
              {data.aktiviti.length === 0 ? (
                <EmptyState title="Tiada aktiviti direkodkan" />
              ) : (
                <div className="space-y-1.5">
                  {data.aktiviti.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 text-xs">
                      <span className="w-32 truncate font-medium">{a.nama}</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-200/70 overflow-hidden">
                        <div className="h-full bg-[#0f2a66] rounded-full" style={{ width: `${Math.min(100, a.peratusKemajuan)}%` }} />
                      </div>
                      <span className="w-10 text-right text-muted-foreground">{a.peratusKemajuan.toFixed(0)}%</span>
                      <span className="text-[10px] text-muted-foreground">{formatDate(a.tarikhMula)}</span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Documents placeholder (FR-2.5) */}
            <GlassCard className="p-4">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4 text-[#0f2a66]" /> Dokumen Sokongan</h4>
              <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-muted-foreground">
                <FileText className="mx-auto mb-1 h-5 w-5" />
                Muat naik kertas cadangan, kajian keperluan komuniti, & dokumen sokongan (Fasa 2)
              </div>
            </GlassCard>

            {/* Approval actions */}
            {(data.status === "Perancangan" || data.status === "Semakan") && (
              <div className="flex gap-2">
                <Button onClick={approve} className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> Luluskan Program
                </Button>
                <Button variant="outline" className="flex-1"><Pencil className="h-4 w-4" /> Kemaskini</Button>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/60 p-2.5">
      <div className="flex items-center gap-1 text-[10px] uppercase text-muted-foreground">{icon}{label}</div>
      <p className="mt-0.5 text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground sm:text-right">{value}</span>
    </div>
  );
}
