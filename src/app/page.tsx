"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClipboardList,
  Wallet,
  Activity,
  Award,
  BarChart3,
  Users,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";

import { ExecutiveDashboard } from "@/components/modules/executive-dashboard";
import { ProgramPlanning } from "@/components/modules/program-planning";
import { BudgetOEModule } from "@/components/modules/budget-oe";
import { ImplementationMonitoring } from "@/components/modules/implementation-monitoring";
import { ProgramEvaluation } from "@/components/modules/program-evaluation";
import { ReportingAnalytics } from "@/components/modules/reporting-analytics";
import { UserAdmin } from "@/components/modules/user-admin";

type ModuleKey =
  | "dashboard"
  | "planning"
  | "budget"
  | "implementation"
  | "evaluation"
  | "reporting"
  | "admin";

const NAV_GROUPS: {
  label: string;
  items: { key: ModuleKey; label: string; icon: React.ReactNode; desc: string }[];
}[] = [
  {
    label: "Pengurusan",
    items: [
      { key: "dashboard", label: "Papan Pemuka Utama", icon: <LayoutDashboard className="h-4.5 w-4.5" />, desc: "Executive Dashboard" },
      { key: "planning", label: "Perancangan Program", icon: <ClipboardList className="h-4.5 w-4.5" />, desc: "Program Planning" },
      { key: "budget", label: "Bajet & Peruntukan OE", icon: <Wallet className="h-4.5 w-4.5" />, desc: "Budget & OE Monitoring" },
    ],
  },
  {
    label: "Pelaksanaan",
    items: [
      { key: "implementation", label: "Pelaksanaan & Pemantauan", icon: <Activity className="h-4.5 w-4.5" />, desc: "Implementation" },
      { key: "evaluation", label: "Penilaian Program", icon: <Award className="h-4.5 w-4.5" />, desc: "Evaluation & Impact" },
    ],
  },
  {
    label: "Pentadbiran",
    items: [
      { key: "reporting", label: "Pelaporan & Analitik", icon: <BarChart3 className="h-4.5 w-4.5" />, desc: "Reporting & Analytics" },
      { key: "admin", label: "Pentadbiran Pengguna", icon: <Users className="h-4.5 w-4.5" />, desc: "User & Role Admin" },
    ],
  },
];

export default function Home() {
  const [active, setActive] = React.useState<ModuleKey>("dashboard");
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const activeMeta = React.useMemo(() => {
    for (const g of NAV_GROUPS) {
      const found = g.items.find((i) => i.key === active);
      if (found) return found;
    }
    return null;
  }, [active]);

  const renderModule = () => {
    switch (active) {
      case "dashboard": return <ExecutiveDashboard />;
      case "planning": return <ProgramPlanning />;
      case "budget": return <BudgetOEModule />;
      case "implementation": return <ImplementationMonitoring />;
      case "evaluation": return <ProgramEvaluation />;
      case "reporting": return <ReportingAnalytics />;
      case "admin": return <UserAdmin />;
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* ---------- SIDEBAR ---------- */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 lg:static lg:translate-x-0",
          "flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: "linear-gradient(180deg, #0a1f4d 0%, #06122e 100%)",
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#f5b82e] to-[#e09c12] shadow-lg">
            <ShieldCheck className="h-6 w-6 text-[#0a1f4d]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight text-white">DPPK KPKT</p>
            <p className="text-[11px] leading-tight text-white/60">Dashboard Program Komuniti</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5 scroll-thin">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-[#f5b82e]/70">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      setActive(item.key);
                      setSidebarOpen(false);
                    }}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all",
                      active === item.key
                        ? "nav-item-active font-semibold"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <span className={cn("transition-colors", active === item.key ? "text-[#fcd768]" : "text-white/50 group-hover:text-white")}>
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#f5b82e] to-[#e09c12] text-sm font-bold text-[#0a1f4d]">
              AF
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">Ahmad Faizal</p>
              <p className="truncate text-[11px] text-white/60">Pentadbir Sistem</p>
            </div>
            <div className="h-2 w-2 rounded-full bg-emerald-400" title="Dalam talian" />
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ---------- MAIN CONTENT ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-white/40 bg-white/70 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-1.5 text-foreground hover:bg-slate-200/60 lg:hidden"
              aria-label="Buka menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden flex-1 items-center md:flex">
              <h2 className="text-sm font-semibold text-foreground">{activeMeta?.label}</h2>
              <span className="mx-2 text-muted-foreground/40">/</span>
              <span className="text-xs text-muted-foreground">{activeMeta?.desc}</span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="relative hidden sm:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari program, waran, pengguna..."
                  className="h-9 w-56 rounded-full border border-slate-200/70 bg-white/70 pl-9 pr-3 text-sm outline-none backdrop-blur transition-all placeholder:text-muted-foreground/70 focus:w-72 focus:border-[#0f2a66] focus:ring-2 focus:ring-[#0f2a66]/10"
                />
              </div>
              <button className="relative rounded-full border border-slate-200/70 bg-white/70 p-2 text-foreground backdrop-blur hover:bg-white">
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>
              <div className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-2 py-1.5 backdrop-blur">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#0f2a66] to-[#1a3a82] text-xs font-bold text-white">
                  AF
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
          </div>
        </header>

        {/* Module content */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div key={active} className="animate-in fade-in duration-300">
            {renderModule()}
          </div>
        </main>

        {/* ---------- STICKY FOOTER ---------- */}
        <footer className="mt-auto border-t border-white/40 bg-white/60 backdrop-blur-xl">
          <div className="flex flex-col items-center justify-between gap-2 px-6 py-4 text-xs text-muted-foreground sm:flex-row">
            <p>
              © {new Date().getFullYear()} Kementerian Perumahan dan Kerajaan Tempatan (KPKT) — DPPK v1.0
            </p>
            <p className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Data dummy (simulasi)
              </span>
              <span className="text-muted-foreground/40">|</span>
              <span>Disediakan dengan z.ai GLM 5.2</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
