"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
  AreaChart, Area,
  RadialBarChart, RadialBar,
  LineChart, Line,
} from "recharts";
import {
  FolderKanban, Users2, Wallet, TrendingUp, AlertTriangle,
  CheckCircle2, Clock, MapPin, Trophy, Target, Gauge, Activity,
} from "lucide-react";

import { GlassCard, StatCard, ModuleHeader, TrafficLight } from "@/components/shared/dppk-ui";
import {
  PROGRAM_STATUS, KATEGORI_COLORS, OBJEK_AM_COLORS, BULAN_LABEL,
  formatRM, formatNumber, formatDate,
} from "@/lib/domain";
import { cn } from "@/lib/utils";

type Overview = {
  totalProgram: number;
  totalPengguna: number;
  byStatus: Record<string, number>;
  byLampu: Record<string, number>;
  byKategori: Record<string, number>;
  byNegeri: Record<string, number>;
  byTahun: Record<number, number>;
  bajet: { totalDianggar: number; totalSebenar: number; variance: number };
  penerimaManfaat: number;
  oe: {
    tahunKewangan: number;
    siling: number;
    dibelanjakan: number;
    komited: number;
    baki: number;
    peratusPenggunaan: number;
    status: string;
    byObjekAm: Record<string, { siling: number; dibelanjakan: number; komited: number }>;
  };
  penilaian: { count: number; avgSkor: number; avgKPI: number; byGred: Record<string, number> };
  monthlyBurn: { bulan: number; sebenar: number; unjuran: number }[];
};

// Relative Malaysia map — simplified bar chart by negeri (visual proxy)
export function ExecutiveDashboard() {
  const [data, setData] = React.useState<Overview | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/overview")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div>
        <ModuleHeader title="Papan Pemuka Utama" description="Executive Dashboard — Ringkasan menyeluruh program, bajet & impak" icon={<TrendingUp className="h-5 w-5" />} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/40" />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-white/40" />
          ))}
        </div>
      </div>
    );
  }

  const statusData = Object.entries(PROGRAM_STATUS).map(([k, v]) => ({
    name: v.label,
    value: data.byStatus[k] ?? 0,
    key: k,
  }));
  const kategoriData = Object.entries(data.byKategori).map(([k, v]) => ({ name: k, value: v, fill: KATEGORI_COLORS[k] ?? "#94a3b8" }));
  const negeriData = Object.entries(data.byNegeri)
    .map(([k, v]) => ({ name: k.replace("Wilayah Persekutuan ", "WP "), value: v }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
  const tahunData = Object.entries(data.byTahun).map(([k, v]) => ({ tahun: k, program: v })).sort((a, b) => Number(a.tahun) - Number(b.tahun));
  const oeObjekData = Object.entries(data.oe.byObjekAm).map(([k, v]) => ({
    name: k.length > 18 ? k.slice(0, 16) + "…" : k,
    siling: v.siling,
    dibelanjakan: v.dibelanjakan,
    komited: v.komited,
    fill: OBJEK_AM_COLORS[k] ?? "#94a3b8",
  }));
  const burnData = data.monthlyBurn.map((m) => ({
    name: BULAN_LABEL[m.bulan - 1],
    Sebenar: m.sebenar,
    Unjuran: m.unjuran,
  }));

  const onTrack = data.byLampu.Hijau ?? 0;
  const perhatian = data.byLampu.Kuning ?? 0;
  const kritikal = data.byLampu.Merah ?? 0;
  const completionRate = data.totalProgram ? ((data.byStatus.Selesai ?? 0) / data.totalProgram * 100) : 0;

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Papan Pemuka Utama"
        description="Ringkasan menyeluruh program, bajet & impak komuniti KPKT"
        icon={<TrendingUp className="h-5 w-5" />}
        action={
          <div className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-3 py-1.5 text-xs backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Tahun Kewangan {data.oe.tahunKewangan}
          </div>
        }
      />

      {/* ============ OE CEILING SUMMARY (FR-1.7) ============ */}
      <GlassCard className="overflow-hidden p-0">
        <div className="relative navy-gradient p-5 text-white sm:p-6">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 90% 20%, #f5b82e 0%, transparent 40%)" }} />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5b82e]/20 backdrop-blur">
                <Wallet className="h-7 w-7 text-[#f5b82e]" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-white/70">
                  Siling Peruntukan OE — Tahun Kewangan {data.oe.tahunKewangan} (Diluluskan MOF)
                </p>
                <p className="text-3xl font-bold tracking-tight">{formatRM(data.oe.siling)}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-white/80">
                  <span>Dibelanjakan: <b className="text-[#fcd768]">{formatRM(data.oe.dibelanjakan, true)}</b></span>
                  <span className="text-white/30">•</span>
                  <span>Komited: <b>{formatRM(data.oe.komited, true)}</b></span>
                  <span className="text-white/30">•</span>
                  <span>Baki: <b>{formatRM(data.oe.baki, true)}</b></span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="relative h-24 w-24">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="72%"
                    outerRadius="100%"
                    data={[{ name: "Guna", value: data.oe.peratusPenggunaan, fill: data.oe.status === "Merah" ? "#dc2626" : data.oe.status === "Kuning" ? "#eab308" : "#16a34a" }]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar dataKey="value" cornerRadius={20} background={{ fill: "rgba(255,255,255,0.15)" }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold">{data.oe.peratusPenggunaan.toFixed(1)}%</span>
                  <span className="text-[9px] uppercase text-white/60">Penggunaan</span>
                </div>
              </div>
              <TrafficLight status={data.oe.status} />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ============ KPI STAT CARDS ============ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Jumlah Program"
          value={formatNumber(data.totalProgram)}
          sub={`${data.byStatus.Selesai ?? 0} selesai • ${data.byStatus.DalamPelaksanaan ?? 0} aktif`}
          icon={<FolderKanban className="h-5 w-5" />}
          accent="navy"
          trend={{ value: `${data.byTahun[2026] ?? 0} baharu 2026`, up: true }}
        />
        <StatCard
          label="Penerima Manfaat"
          value={formatNumber(data.penerimaManfaat)}
          sub="Komuniti seluruh negara"
          icon={<Users2 className="h-5 w-5" />}
          accent="gold"
          trend={{ value: "+12.4% YoY", up: true }}
        />
        <StatCard
          label="Peruntukan Bajet"
          value={formatRM(data.bajet.totalDianggar, true)}
          sub={`Belanjawan: ${formatRM(data.bajet.totalSebenar, true)}`}
          icon={<Wallet className="h-5 w-5" />}
          accent="green"
        />
        <StatCard
          label="Kadar Siap"
          value={`${completionRate.toFixed(1)}%`}
          sub={`${data.penilaian.count} program dinilai`}
          icon={<Target className="h-5 w-5" />}
          accent="amber"
          trend={{ value: "Skor avg " + data.penilaian.avgSkor.toFixed(2) + "/5", up: true }}
        />
      </div>

      {/* ============ TRAFFIC LIGHT SUMMARY ============ */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">On-Track</p>
              <p className="text-3xl font-bold text-emerald-600">{onTrack}</p>
              <p className="text-xs text-muted-foreground">program mengikut jadual</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Perhatian</p>
              <p className="text-3xl font-bold text-amber-600">{perhatian}</p>
              <p className="text-xs text-muted-foreground">memerlukan pemantauan</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Kritikal</p>
              <p className="text-3xl font-bold text-rose-600">{kritikal}</p>
              <p className="text-xs text-muted-foreground">tindakan segera diperlukan</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100">
              <AlertTriangle className="h-6 w-6 text-rose-600" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ============ CHARTS ROW 1 ============ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Program by status */}
        <GlassCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Program mengikut Status</h3>
              <p className="text-xs text-muted-foreground">Taburan kitaran hayat program</p>
            </div>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
              >
                {statusData.map((entry, i) => {
                  const cfg = (PROGRAM_STATUS as any)[entry.key];
                  const hex = entry.key === "Selesai" ? "#16a34a" : entry.key === "DalamPelaksanaan" ? "#eab308" : entry.key === "Tergendala" ? "#dc2626" : entry.key === "Diluluskan" ? "#29489f" : "#64748b";
                  return <Cell key={i} fill={hex} />;
                })}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v} program`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
            {statusData.map((s) => {
              const hex = s.key === "Selesai" ? "#16a34a" : s.key === "DalamPelaksanaan" ? "#eab308" : s.key === "Tergendala" ? "#dc2626" : s.key === "Diluluskan" ? "#29489f" : "#64748b";
              return (
                <span key={s.key} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ background: hex }} />
                  {s.name} ({s.value})
                </span>
              );
            })}
          </div>
        </GlassCard>

        {/* Budget allocation by Objek Am */}
        <GlassCard className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Peruntukan OE mengikut Objek Am — {data.oe.tahunKewangan}</h3>
              <p className="text-xs text-muted-foreground">Siling diluluskan vs dibelanjakan (selaras iGFMAS)</p>
            </div>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={oeObjekData} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,42,102,0.08)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#64748b" />
              <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}J`} tick={{ fontSize: 11 }} stroke="#64748b" />
              <Tooltip formatter={(v: number) => formatRM(v)} contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="siling" name="Siling" fill="#0f2a66" radius={[4, 4, 0, 0]} />
              <Bar dataKey="dibelanjakan" name="Dibelanjakan" fill="#f5b82e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="komited" name="Komited" fill="#7d96dd" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* ============ CHARTS ROW 2 ============ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Burn rate */}
        <GlassCard className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Kadar Perbelanjaan OE Bulanan (Burn Rate)</h3>
              <p className="text-xs text-muted-foreground">Perbelanjaan sebenar vs unjuran — {data.oe.tahunKewangan}</p>
            </div>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={burnData} margin={{ left: -10, right: 10 }}>
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
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Program by kategori */}
        <GlassCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Program mengikut Kategori</h3>
              <p className="text-xs text-muted-foreground">Tema pembangunan komuniti</p>
            </div>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={kategoriData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label={({ name, value }: any) => `${value}`}
                labelLine={false}
              >
                {kategoriData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v} program`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1">
            {kategoriData.map((k) => (
              <span key={k.name} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: k.fill }} />
                {k.name} ({k.value})
              </span>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* ============ CHARTS ROW 3 ============ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Program by negeri */}
        <GlassCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Taburan Program mengikut Negeri</h3>
              <p className="text-xs text-muted-foreground">Top 10 negeri / wilayah</p>
            </div>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={negeriData} layout="vertical" margin={{ left: 30, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,42,102,0.08)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#64748b" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="#64748b" width={110} />
              <Tooltip formatter={(v: number) => [`${v} program`, ""]} contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="value" name="Program" fill="#0f2a66" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Program trend by year */}
        <GlassCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Trend Program Tahunan</h3>
              <p className="text-xs text-muted-foreground">Bilangan program merentas tahun</p>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={tahunData} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,42,102,0.08)" vertical={false} />
              <XAxis dataKey="tahun" tick={{ fontSize: 11 }} stroke="#64748b" />
              <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
              <Tooltip formatter={(v: number) => [`${v} program`, ""]} contentStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="program" name="Program" stroke="#f5b82e" strokeWidth={3} dot={{ r: 5, fill: "#0f2a66" }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* ============ EVALUATION SUMMARY ============ */}
      <GlassCard className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Ringkasan Penilaian Program</h3>
            <p className="text-xs text-muted-foreground">Output / Outcome / Impact — gred penilaian pasca-pelaksanaan</p>
          </div>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-white/50 p-4 text-center">
            <p className="text-xs uppercase text-muted-foreground">Program Dinilai</p>
            <p className="mt-1 text-2xl font-bold text-[#0f2a66]">{data.penilaian.count}</p>
          </div>
          <div className="rounded-xl bg-white/50 p-4 text-center">
            <p className="text-xs uppercase text-muted-foreground">Skor Purata</p>
            <p className="mt-1 text-2xl font-bold text-[#f5b82e]">{data.penilaian.avgSkor.toFixed(2)}<span className="text-sm text-muted-foreground">/5</span></p>
          </div>
          <div className="rounded-xl bg-white/50 p-4 text-center">
            <p className="text-xs uppercase text-muted-foreground">Pencapaian KPI</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{data.penilaian.avgKPI.toFixed(1)}%</p>
          </div>
          <div className="rounded-xl bg-white/50 p-4 text-center">
            <p className="text-xs uppercase text-muted-foreground">Gred A & B</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{((data.penilaian.byGred.A ?? 0) + (data.penilaian.byGred.B ?? 0))}</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
