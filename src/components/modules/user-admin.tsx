"use client";

import * as React from "react";
import {
  Users2, ShieldCheck, ScrollText, Plus, Pencil, Power, History,
  Search, Loader2, UserPlus, CheckCircle2, XCircle, Filter, KeyRound, Crown, Eye, Edit3,
} from "lucide-react";

import { GlassCard, StatCard, ModuleHeader, EmptyState } from "@/components/shared/dppk-ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  PERANAN_LABEL, PERANAN_COLOR, formatDate,
} from "@/lib/domain";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================
type Pengguna = {
  id: string;
  nama: string;
  email: string;
  jawatan: string;
  peranan: string;
  bahagian: string;
  negeri: string | null;
  telefon: string | null;
  statusAktif: boolean;
  tarikhCipta: string;
  tarikhKemaskini: string;
};

type AuditLog = {
  id: string;
  penggunaId: string;
  pengguna: { nama: string; email: string; peranan: string };
  modul: string;
  aksi: string;
  entiti: string;
  entitiId: string | null;
  butiran: string | null;
  ipAlamat: string | null;
  tarikh: string;
};

const PERANAN_KEYS = Object.keys(PERANAN_LABEL);

const BAHAGIAN_LIST = [
  "Bahagian Pembangunan Komuniti",
  "Bahagian Perancangan Strategik & Digital",
  "Bahagian Kewangan",
  "Bahagian Pengurusan Bandar",
  "Bahagian Perumahan",
];

const NEGERI_LIST = [
  "Selangor", "Johor", "Pulau Pinang", "Sabah", "Sarawak", "Perak",
  "Kedah", "Kelantan", "Pahang", "Negeri Sembilan", "Melaka",
  "Terengganu", "Perlis", "Wilayah Persekutuan Kuala Lumpur",
  "Wilayah Persekutuan Putrajaya", "Wilayah Persekutuan Labuan",
];

// Role → permission map per module (rows = modules, cols = roles)
const MODULES = [
  "Papan Pemuka",
  "Perancangan Program",
  "Bajet & OE",
  "Pelaksanaan",
  "Penilaian",
  "Pelaporan",
  "Pentadbiran",
];

// permission per role per module: R = read, W = write, — = none
type Perm = "R" | "W" | "—";
const PERMISSION_MATRIX: Record<string, Record<string, Perm>> = {
  Admin:            { "Papan Pemuka": "W", "Perancangan Program": "W", "Bajet & OE": "W", "Pelaksanaan": "W", "Penilaian": "W", "Pelaporan": "W", "Pentadbiran": "W" },
  PengurusProgram:  { "Papan Pemuka": "R", "Perancangan Program": "W", "Bajet & OE": "R", "Pelaksanaan": "W", "Penilaian": "R", "Pelaporan": "R", "Pentadbiran": "—" },
  PegawaiPBT:       { "Papan Pemuka": "R", "Perancangan Program": "—", "Bajet & OE": "—", "Pelaksanaan": "W", "Penilaian": "—", "Pelaporan": "R", "Pentadbiran": "—" },
  Penilai:          { "Papan Pemuka": "R", "Perancangan Program": "R", "Bajet & OE": "R", "Pelaksanaan": "R", "Penilaian": "W", "Pelaporan": "R", "Pentadbiran": "—" },
  PengurusanAtasan: { "Papan Pemuka": "R", "Perancangan Program": "R", "Bajet & OE": "R", "Pelaksanaan": "R", "Penilaian": "R", "Pelaporan": "R", "Pentadbiran": "—" },
  OrangAwam:        { "Papan Pemuka": "R", "Perancangan Program": "—", "Bajet & OE": "—", "Pelaksanaan": "—", "Penilaian": "—", "Pelaporan": "—", "Pentadbiran": "—" },
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  Admin: "Akses penuh ke semua modul sistem. Menguruskan pengguna, peranan & konfigurasi.",
  PengurusProgram: "Merancang & melaksanakan program komuniti. Kemas kini kemajuan program.",
  PegawaiPBT: "Wakil Pihak Berkuasa Tempatan. Kemas kini status pelaksanaan program di PBT.",
  Penilai: "Menilai prestasi program & mengemukakan skor penilaian serta cadangan.",
  PengurusanAtasan: "Pengurusan KPKT — capaian baca sahaja untuk pemantauan & laporan.",
  OrangAwam: "Paparan ringkasan awam (read-only) untuk ketelusan program.",
};

const ROLE_ICON: Record<string, React.ReactNode> = {
  Admin: <Crown className="h-4 w-4" />,
  PengurusProgram: <KeyRound className="h-4 w-4" />,
  PegawaiPBT: <Users2 className="h-4 w-4" />,
  Penilai: <ShieldCheck className="h-4 w-4" />,
  PengurusanAtasan: <Eye className="h-4 w-4" />,
  OrangAwam: <UserPlus className="h-4 w-4" />,
};

// Use first Admin's id as "current user" for audit log attribution.
const ADMIN_FALLBACK_ID = "self";

// ============================================================
// MAIN COMPONENT
// ============================================================
export function UserAdmin() {
  return (
    <div>
      <ModuleHeader
        title="Pentadbiran Pengguna & Peranan"
        description="Urus akaun pengguna, kawalan akses berasaskan peranan (RBAC) & log audit aktiviti."
        icon={<Users2 className="h-5 w-5" />}
        action={
          <Badge variant="outline" className="gap-1.5 border-[#0f2a66]/30 bg-white/60 text-[#0f2a66]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Modul 7
          </Badge>
        }
      />

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="glass flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl p-1.5">
          <TabsTrigger value="users" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Users2 className="h-4 w-4" /> Pengguna
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <ShieldCheck className="h-4 w-4" /> Peranan & Kebenaran
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <ScrollText className="h-4 w-4" /> Log Audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4"><UsersTab /></TabsContent>
        <TabsContent value="roles" className="mt-4"><RolesTab /></TabsContent>
        <TabsContent value="audit" className="mt-4"><AuditTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// TAB 1: USERS
// ============================================================
function UsersTab() {
  const { toast } = useToast();
  const [users, setUsers] = React.useState<Pengguna[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({ total: 0, active: 0, roles: 6, log7: 0 });

  // Filter state
  const [search, setSearch] = React.useState("");
  const [filterPeranan, setFilterPeranan] = React.useState("all");
  const [filterBahagian, setFilterBahagian] = React.useState("all");
  const [filterStatus, setFilterStatus] = React.useState("all");

  // Dialog state
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Pengguna | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [logsByUser, setLogsByUser] = React.useState<AuditLog[] | null>(null);
  const [logsUser, setLogsUser] = React.useState<Pengguna | null>(null);
  const [logsLoading, setLogsLoading] = React.useState(false);

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterPeranan !== "all") params.set("peranan", filterPeranan);
    if (filterBahagian !== "all") params.set("bahagian", filterBahagian);
    if (filterStatus !== "all") params.set("statusAktif", filterStatus);
    try {
      const res = await fetch(`/api/pengguna?${params.toString()}`);
      const data = await res.json();
      setUsers(data.pengguna || []);
    } catch {
      toast({ title: "Ralat", description: "Gagal memuatkan pengguna.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [search, filterPeranan, filterBahagian, filterStatus, toast]);

  React.useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Stats
  React.useEffect(() => {
    const active = users.filter((u) => u.statusAktif).length;
    setStats((s) => ({ ...s, total: users.length, active, roles: 6 }));
  }, [users]);

  React.useEffect(() => {
    // Log count for last 7 days
    const since = new Date();
    since.setDate(since.getDate() - 7);
    fetch(`/api/audit-log?tarikhMula=${since.toISOString().slice(0, 10)}&take=1000`)
      .then((r) => r.json())
      .then((d) => setStats((s) => ({ ...s, log7: d.total ?? 0 })))
      .catch(() => {});
  }, []);

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (u: Pengguna) => { setEditing(u); setFormOpen(true); };

  const toggleStatus = async (u: Pengguna) => {
    try {
      const res = await fetch(`/api/pengguna/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusAktif: !u.statusAktif, pelakanaId: ADMIN_FALLBACK_ID }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mengemas kini status.");
      }
      toast({
        title: u.statusAktif ? "Pengguna Dinyahaktif" : "Pengguna Diaktifkan",
        description: `${u.nama} — ${u.statusAktif ? "tidak aktif" : "aktif"}`,
      });
      fetchUsers();
    } catch (e: any) {
      toast({ title: "Ralat", description: e.message, variant: "destructive" });
    }
  };

  const viewLogs = async (u: Pengguna) => {
    setLogsUser(u);
    setLogsLoading(true);
    setLogsByUser(null);
    try {
      const res = await fetch(`/api/audit-log?penggunaId=${u.id}&take=50`);
      const data = await res.json();
      setLogsByUser(data.logs || []);
    } catch {
      toast({ title: "Ralat", description: "Gagal memuatkan log.", variant: "destructive" });
    } finally {
      setLogsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Jumlah Pengguna" value={stats.total} icon={<Users2 className="h-5 w-5" />} accent="navy" />
        <StatCard label="Pengguna Aktif" value={stats.active} icon={<CheckCircle2 className="h-5 w-5" />} accent="green" />
        <StatCard label="Bilangan Peranan" value={stats.roles} icon={<ShieldCheck className="h-5 w-5" />} accent="gold" />
        <StatCard label="Log Aktiviti (7 hari)" value={stats.log7} icon={<ScrollText className="h-5 w-5" />} accent="navy" />
      </div>

      {/* Filter bar */}
      <GlassCard className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative w-full lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama, e-mel, jawatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex">
            <Select value={filterPeranan} onValueChange={setFilterPeranan}>
              <SelectTrigger className="h-9 w-full text-xs sm:w-40"><SelectValue placeholder="Peranan" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Peranan</SelectItem>
                {PERANAN_KEYS.map((p) => <SelectItem key={p} value={p}>{PERANAN_LABEL[p]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterBahagian} onValueChange={setFilterBahagian}>
              <SelectTrigger className="h-9 w-full text-xs sm:w-52"><SelectValue placeholder="Bahagian" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bahagian</SelectItem>
                {BAHAGIAN_LIST.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9 w-full text-xs sm:w-32"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="true">Aktif</SelectItem>
                <SelectItem value="false">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={openAdd} className="gap-1.5 bg-[#0f2a66] text-white hover:bg-[#0a1f4d]">
            <Plus className="h-4 w-4" /> Tambah Pengguna
          </Button>
        </div>
      </GlassCard>

      {/* Users table */}
      <GlassCard className="p-3">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#0f2a66]" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState icon={<Users2 className="h-10 w-10" />} title="Tiada pengguna dijumpai" description="Sesuaikan penapis atau tambah pengguna baharu." />
        ) : (
          <div className="max-h-[600px] overflow-auto scroll-thin rounded-lg border border-slate-200/60">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-[#0f2a66]">
                <TableRow className="hover:bg-[#0f2a66]">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-white">Nama / E-mel</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-white">Jawatan</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-white">Peranan</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-white">Bahagian</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-white">Negeri</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-white">Status</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-white">Dicipta</TableHead>
                  <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wide text-white">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="text-xs">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#0f2a66] to-[#1a3a82] text-[10px] font-bold text-white">
                          {initials(u.nama)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{u.nama}</p>
                          <p className="text-[10px] text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{u.jawatan}</TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium", PERANAN_COLOR[u.peranan] || "bg-slate-100 text-slate-700 border-slate-300")}>
                        {ROLE_ICON[u.peranan]} {PERANAN_LABEL[u.peranan] || u.peranan}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">{u.bahagian}</TableCell>
                    <TableCell className="text-xs">{u.negeri || "—"}</TableCell>
                    <TableCell>
                      {u.statusAktif ? (
                        <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700">Aktif</Badge>
                      ) : (
                        <Badge variant="outline" className="border-slate-300 bg-slate-100 text-slate-500">Tidak Aktif</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">{formatDate(new Date(u.tarikhCipta))}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Kemaskini" onClick={() => openEdit(u)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm" variant="ghost" className="h-7 w-7 p-0"
                          title={u.statusAktif ? "Nyahaktif" : "Aktifkan"}
                          onClick={() => toggleStatus(u)}
                        >
                          <Power className={cn("h-3.5 w-3.5", u.statusAktif ? "text-emerald-600" : "text-slate-400")} />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Lihat Log" onClick={() => viewLogs(u)}>
                          <History className="h-3.5 w-3.5 text-[#0f2a66]" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassCard>

      {/* Add / Edit dialog */}
      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        saving={saving}
        onSave={async (payload) => {
          setSaving(true);
          try {
            const body = { ...payload, pelakanaId: ADMIN_FALLBACK_ID };
            if (editing) {
              const res = await fetch(`/api/pengguna/${editing.id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
              });
              if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Gagal mengemas kini.");
              }
              toast({ title: "Pengguna Dikemaskini", description: payload.nama });
            } else {
              const res = await fetch(`/api/pengguna`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
              });
              if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Gagal mencipta pengguna.");
              }
              toast({ title: "Pengguna Baharu Dicipta", description: payload.nama });
            }
            setFormOpen(false);
            fetchUsers();
          } catch (e: any) {
            toast({ title: "Ralat", description: e.message, variant: "destructive" });
          } finally {
            setSaving(false);
          }
        }}
      />

      {/* User logs dialog */}
      <Dialog open={!!logsUser} onOpenChange={(o) => { if (!o) { setLogsUser(null); setLogsByUser(null); } }}>
        <DialogContent className="max-h-[88vh] w-[96vw] max-w-3xl overflow-hidden rounded-2xl border-white/55 bg-white/85 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-[#0f2a66]">
              <History className="h-5 w-5" /> Log Aktiviti — {logsUser?.nama}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {logsUser?.email} · {PERANAN_LABEL[logsUser?.peranan || ""] || logsUser?.peranan}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto scroll-thin pr-1">
            {logsLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-[#0f2a66]" />
              </div>
            ) : logsByUser && logsByUser.length ? (
              <div className="space-y-2">
                {logsByUser.map((log) => (
                  <div key={log.id} className="rounded-lg border border-slate-200/70 bg-white/60 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-[#0f2a66]/30 bg-[#0f2a66]/5 text-[#0f2a66] text-[10px]">{log.aksi}</Badge>
                        <Badge variant="outline" className="text-[10px]">{log.modul}</Badge>
                        <span className="text-[10px] text-muted-foreground">{log.entiti}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{formatDate(new Date(log.tarikh))}</span>
                    </div>
                    {log.butiran && <p className="mt-1 text-xs text-foreground">{log.butiran}</p>}
                    {log.ipAlamat && <p className="mt-0.5 text-[10px] text-muted-foreground">IP: {log.ipAlamat}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<ScrollText className="h-10 w-10" />} title="Tiada log aktiviti" description="Pengguna ini belum mempunyai rekod aktiviti." />
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Tutup</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("");
}

// ============================================================
// USER FORM DIALOG
// ============================================================
function UserFormDialog({
  open, onOpenChange, editing, saving, onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Pengguna | null;
  saving: boolean;
  onSave: (payload: { nama: string; email: string; jawatan: string; peranan: string; bahagian: string; negeri: string | null; telefon: string | null }) => void;
}) {
  const [form, setForm] = React.useState({
    nama: "", email: "", jawatan: "", peranan: "PegawaiPBT",
    bahagian: BAHAGIAN_LIST[0], negeri: "" as string, telefon: "",
  });

  React.useEffect(() => {
    if (editing) {
      setForm({
        nama: editing.nama,
        email: editing.email,
        jawatan: editing.jawatan,
        peranan: editing.peranan,
        bahagian: editing.bahagian,
        negeri: editing.negeri || "",
        telefon: editing.telefon || "",
      });
    } else {
      setForm({ nama: "", email: "", jawatan: "", peranan: "PegawaiPBT", bahagian: BAHAGIAN_LIST[0], negeri: "", telefon: "" });
    }
  }, [editing, open]);

  const submit = () => {
    if (!form.nama || !form.email || !form.bahagian || !form.peranan) return;
    onSave({
      ...form,
      negeri: form.negeri || null,
      telefon: form.telefon || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[96vw] max-w-lg overflow-y-auto rounded-2xl border-white/55 bg-white/85 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base text-[#0f2a66]">
            {editing ? <Pencil className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            {editing ? "Kemaskini Pengguna" : "Tambah Pengguna Baharu"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {editing ? `Kemaskini maklumat untuk ${editing.nama}` : "Lengkapkan borang untuk mendaftar pengguna baharu."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="text-xs">Nama Penuh *</Label>
            <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Cth: Ahmad Faizal bin Rahman" className="mt-1" />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">E-mel *</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nama@kpkt.gov.my" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Jawatan</Label>
            <Input value={form.jawatan} onChange={(e) => setForm({ ...form, jawatan: e.target.value })} placeholder="Pegawai" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Peranan *</Label>
            <Select value={form.peranan} onValueChange={(v) => setForm({ ...form, peranan: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PERANAN_KEYS.map((p) => <SelectItem key={p} value={p}>{PERANAN_LABEL[p]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">Bahagian *</Label>
            <Select value={form.bahagian} onValueChange={(v) => setForm({ ...form, bahagian: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {BAHAGIAN_LIST.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Negeri</Label>
            <Select value={form.negeri} onValueChange={(v) => setForm({ ...form, negeri: v })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih negeri" /></SelectTrigger>
              <SelectContent>
                {NEGERI_LIST.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Telefon</Label>
            <Input value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} placeholder="03-12345678" className="mt-1" />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
          <Button onClick={submit} disabled={saving} className="bg-[#0f2a66] text-white hover:bg-[#0a1f4d]">
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            {editing ? "Simpan Perubahan" : "Cipta Pengguna"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// TAB 2: ROLES & PERMISSIONS
// ============================================================
function RolesTab() {
  return (
    <div className="space-y-4">
      {/* Role cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PERANAN_KEYS.map((key) => (
          <GlassCard key={key} className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg border", PERANAN_COLOR[key])}>
                  {ROLE_ICON[key]}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{PERANAN_LABEL[key]}</p>
                  <p className="text-[10px] text-muted-foreground">{key}</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[key]}</p>
            <div className="mt-3 space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Kebenaran Utama</p>
              {MODULES.map((m) => {
                const p = PERMISSION_MATRIX[key][m];
                if (p === "—") return null;
                return (
                  <div key={m} className="flex items-center gap-2 text-[11px]">
                    {p === "W" ? <Edit3 className="h-3 w-3 text-emerald-600" /> : <Eye className="h-3 w-3 text-[#0f2a66]" />}
                    <span className="text-foreground">{m}</span>
                    <span className={cn("ml-auto text-[10px] font-medium", p === "W" ? "text-emerald-600" : "text-[#0f2a66]")}>
                      {p === "W" ? "Tulis" : "Baca"}
                    </span>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Permission matrix */}
      <GlassCard className="p-3">
        <div className="mb-2 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#0f2a66]" />
          <h3 className="text-sm font-bold text-foreground">Matriks Kebenaran (RBAC)</h3>
        </div>
        <p className="mb-2 text-xs text-muted-foreground">R = Baca sahaja, W = Baca & Tulis, — = Tiada akses</p>
        <div className="overflow-x-auto scroll-thin">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-[#0f2a66]">
              <TableRow className="hover:bg-[#0f2a66]">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-white">Modul</TableHead>
                {PERANAN_KEYS.map((r) => (
                  <TableHead key={r} className="text-center text-[11px] font-semibold uppercase tracking-wide text-white">{PERANAN_LABEL[r]}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {MODULES.map((m) => (
                <TableRow key={m} className="text-xs">
                  <TableCell className="text-xs font-medium text-foreground">{m}</TableCell>
                  {PERANAN_KEYS.map((r) => {
                    const p = PERMISSION_MATRIX[r][m];
                    return (
                      <TableCell key={r} className="text-center">
                        {p === "W" ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-xs font-bold text-emerald-700">W</span>
                        ) : p === "R" ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#0f2a66]/10 text-xs font-bold text-[#0f2a66]">R</span>
                        ) : (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-xs text-slate-400">—</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </GlassCard>
    </div>
  );
}

// ============================================================
// TAB 3: AUDIT LOG
// ============================================================
function AuditTab() {
  const { toast } = useToast();
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const [filterPengguna, setFilterPengguna] = React.useState("all");
  const [filterModul, setFilterModul] = React.useState("all");
  const [filterAksi, setFilterAksi] = React.useState("all");
  const [tarikhMula, setTarikhMula] = React.useState("");
  const [tarikhTamat, setTarikhTamat] = React.useState("");

  const [penggunaList, setPenggunaList] = React.useState<Pengguna[]>([]);

  // Load pengguna list for filter
  React.useEffect(() => {
    fetch("/api/pengguna?take=200")
      .then((r) => r.json())
      .then((d) => setPenggunaList(d.pengguna || []))
      .catch(() => {});
  }, []);

  const fetchLogs = React.useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterPengguna !== "all") params.set("penggunaId", filterPengguna);
    if (filterModul !== "all") params.set("modul", filterModul);
    if (filterAksi !== "all") params.set("aksi", filterAksi);
    if (tarikhMula) params.set("tarikhMula", tarikhMula);
    if (tarikhTamat) params.set("tarikhTamat", tarikhTamat);
    params.set("take", "200");
    try {
      const res = await fetch(`/api/audit-log?${params.toString()}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch {
      toast({ title: "Ralat", description: "Gagal memuatkan log audit.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [filterPengguna, filterModul, filterAksi, tarikhMula, tarikhTamat, toast]);

  React.useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const AKSI_LIST = Array.from(new Set(logs.map((l) => l.aksi)));
  const MODUL_LIST = Array.from(new Set(["Perancangan", "Bajet", "Pelaksanaan", "Penilaian", "Pelaporan", "Pentadbiran"]));

  return (
    <div className="space-y-4">
      {/* Filters */}
      <GlassCard className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#0f2a66]" />
          <h3 className="text-sm font-bold text-foreground">Penapis Log Audit</h3>
          <Badge variant="outline" className="ml-auto text-[10px]">{total} rekod</Badge>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Label className="mb-1 block text-[10px] text-muted-foreground">Pengguna</Label>
            <Select value={filterPengguna} onValueChange={setFilterPengguna}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Pengguna</SelectItem>
                {penggunaList.map((p) => <SelectItem key={p.id} value={p.id}>{p.nama}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block text-[10px] text-muted-foreground">Modul</Label>
            <Select value={filterModul} onValueChange={setFilterModul}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Modul</SelectItem>
                {MODUL_LIST.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block text-[10px] text-muted-foreground">Aksi</Label>
            <Select value={filterAksi} onValueChange={setFilterAksi}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Aksi</SelectItem>
                {["Cipta", "Kemaskini", "Padam", "Lulus", "Nyahaktif", "Aktifkan"].map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                {AKSI_LIST.filter((a) => !["Cipta", "Kemaskini", "Padam", "Lulus", "Nyahaktif", "Aktifkan"].includes(a)).map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block text-[10px] text-muted-foreground">Tarikh Mula</Label>
            <Input type="date" value={tarikhMula} onChange={(e) => setTarikhMula(e.target.value)} className="h-9 text-xs" />
          </div>
          <div>
            <Label className="mb-1 block text-[10px] text-muted-foreground">Tarikh Tamat</Label>
            <Input type="date" value={tarikhTamat} onChange={(e) => setTarikhTamat(e.target.value)} className="h-9 text-xs" />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => {
            setFilterPengguna("all"); setFilterModul("all"); setFilterAksi("all");
            setTarikhMula(""); setTarikhTamat("");
          }} className="text-xs">Set Semula</Button>
        </div>
      </GlassCard>

      {/* Audit table */}
      <GlassCard className="p-3">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#0f2a66]" />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState icon={<ScrollText className="h-10 w-10" />} title="Tiada log dijumpai" description="Sesuaikan penapis untuk melihat rekod aktiviti." />
        ) : (
          <div className="max-h-[600px] overflow-auto scroll-thin rounded-lg border border-slate-200/60">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-[#0f2a66]">
                <TableRow className="hover:bg-[#0f2a66]">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-white">Tarikh & Masa</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-white">Pengguna</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-white">Modul</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-white">Aksi</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-white">Entiti</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-white">Butiran</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-white">IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id} className="text-xs">
                    <TableCell className="whitespace-nowrap text-[11px] text-muted-foreground">
                      {formatDate(new Date(l.tarikh))}<br />
                      <span className="text-[10px]">{new Date(l.tarikh).toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit" })}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#0f2a66] to-[#1a3a82] text-[9px] font-bold text-white">
                          {initials(l.pengguna?.nama || "?")}
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-foreground">{l.pengguna?.nama || "—"}</p>
                          <p className="text-[10px] text-muted-foreground">{l.pengguna ? PERANAN_LABEL[l.pengguna.peranan] : ""}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{l.modul}</Badge></TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px]", aksiBadgeClass(l.aksi))}>{l.aksi}</Badge>
                    </TableCell>
                    <TableCell className="text-[11px]">{l.entiti}</TableCell>
                    <TableCell className="max-w-[280px] truncate text-[11px] text-muted-foreground" title={l.butiran || ""}>{l.butiran || "—"}</TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">{l.ipAlamat || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function aksiBadgeClass(aksi: string): string {
  switch (aksi) {
    case "Cipta": return "border-emerald-300 bg-emerald-50 text-emerald-700";
    case "Kemaskini": return "border-amber-300 bg-amber-50 text-amber-700";
    case "Padam": return "border-rose-300 bg-rose-50 text-rose-700";
    case "Lulus": return "border-[#0f2a66]/30 bg-[#0f2a66]/5 text-[#0f2a66]";
    case "Nyahaktif": return "border-slate-300 bg-slate-100 text-slate-600";
    case "Aktifkan": return "border-emerald-300 bg-emerald-50 text-emerald-700";
    default: return "border-slate-300 bg-slate-50 text-slate-600";
  }
}
