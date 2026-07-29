"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PROGRAM_STATUS, TRAFFIC_LIGHT, GRED_COLOR } from "@/lib/domain";

/* ---------- GlassCard ---------- */
export function GlassCard({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        "glass-card rounded-2xl border-white/55 shadow-[0_8px_32px_-8px_rgba(10,31,77,0.16)]",
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
}

/* ---------- StatusBadge for program status ---------- */
export function StatusBadge({ status }: { status: string }) {
  const cfg = (PROGRAM_STATUS as Record<string, any>)[status] ?? {
    label: status,
    color: "bg-slate-100 text-slate-700 border-slate-300",
    dot: "bg-slate-400",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", cfg.color)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

/* ---------- TrafficLight indicator ---------- */
export function TrafficLight({ status, label }: { status: string; label?: string }) {
  const cfg = (TRAFFIC_LIGHT as Record<string, any>)[status] ?? TRAFFIC_LIGHT.Hijau;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", cfg.soft)}>
      <span className={cn("h-2 w-2 rounded-full", cfg.bg)} />
      {label ?? cfg.label}
    </span>
  );
}

/* ---------- Gred badge ---------- */
export function GredBadge({ gred }: { gred: string }) {
  const colorClass = (GRED_COLOR as Record<string, string>)[gred] ?? "bg-slate-100 text-slate-700 border-slate-300";
  return (
    <span className={cn("inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-sm font-bold", colorClass)}>
      {gred}
    </span>
  );
}

/* ---------- Stat Card (KPI summary tile) ---------- */
export function StatCard({
  label,
  value,
  sub,
  icon,
  trend,
  accent = "navy",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  trend?: { value: string; up?: boolean };
  accent?: "navy" | "gold" | "green" | "red" | "amber";
}) {
  const accentMap: Record<string, string> = {
    navy: "from-[#0f2a66] to-[#1a3a82] text-white",
    gold: "from-[#e09c12] to-[#f5b82e] text-white",
    green: "from-[#15803d] to-[#16a34a] text-white",
    red: "from-[#b91c1c] to-[#dc2626] text-white",
    amber: "from-[#ca8a04] to-[#eab308] text-white",
  };
  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="flex items-start justify-between p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          {trend && (
            <p className={cn("text-xs font-medium", trend.up ? "text-emerald-600" : "text-rose-600")}>
              {trend.up ? "▲" : "▼"} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg", accentMap[accent])}>
            {icon}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

/* ---------- Module Header ---------- */
export function ModuleHeader({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#0f2a66] to-[#1a3a82] text-white shadow-lg">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ---------- Progress Bar (traffic-light aware) ---------- */
export function ProgressBar({ value, status }: { value: number; status?: string }) {
  const color =
    status === "Merah" ? "bg-rose-500" : status === "Kuning" ? "bg-amber-500" : value >= 100 ? "bg-emerald-500" : "bg-[#0f2a66]";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

/* ---------- Empty state ---------- */
export function EmptyState({ icon, title, description }: { icon?: React.ReactNode; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      {icon && <div className="text-muted-foreground/50">{icon}</div>}
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground/80">{description}</p>}
    </div>
  );
}
