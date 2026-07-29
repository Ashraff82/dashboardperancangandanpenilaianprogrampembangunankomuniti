import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/programs/monitoring
// List of programs with status in [DalamPelaksanaan, Tergendala, Selesai]
// includes aktiviti count, isu count, kemajuan count, plus filters.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // DalamPelaksanaan | Tergendala | Selesai
  const negeri = searchParams.get("negeri");
  const kategori = searchParams.get("kategori");
  const statusLampu = searchParams.get("statusLampu"); // Hijau | Kuning | Merah
  const q = searchParams.get("q"); // search kod/nama

  const where: any = {
    status: { in: ["DalamPelaksanaan", "Tergendala", "Selesai"] },
  };
  if (status && status !== "all") where.status = status;
  if (negeri && negeri !== "all") where.negeri = negeri;
  if (kategori && kategori !== "all") where.kategori = kategori;
  if (statusLampu && statusLampu !== "all") where.statusLampu = statusLampu;
  if (q) {
    where.OR = [
      { kodProgram: { contains: q } },
      { namaProgram: { contains: q } },
    ];
  }

  const programs = await db.program.findMany({
    where,
    orderBy: [{ statusLampu: "asc" }, { tarikhTamat: "asc" }],
    select: {
      id: true,
      kodProgram: true,
      namaProgram: true,
      kategori: true,
      negeri: true,
      daerah: true,
      pbt: true,
      status: true,
      statusLampu: true,
      peratusKemajuan: true,
      bajetDianggar: true,
      bajetSebenar: true,
      tarikhMula: true,
      tarikhTamat: true,
      pengurus: { select: { nama: true, jawatan: true } },
      _count: {
        select: {
          aktiviti: true,
          isuRisiko: true,
          kemajuan: true,
        },
      },
    },
  });

  // Count open issues per program (isu with status != Selesai)
  const openIsuCounts = await db.isuRisiko.groupBy({
    by: ["programId"],
    where: { programId: { in: programs.map((p) => p.id) }, status: { not: "Selesai" } },
    _count: { _all: true },
  });
  const openIsuMap: Record<string, number> = {};
  for (const r of openIsuCounts) openIsuMap[r.programId] = r._count._all;

  const result = programs.map((p) => {
    const variance = p.bajetDianggar - p.bajetSebenar;
    const pctBajet = p.bajetDianggar > 0 ? (p.bajetSebenar / p.bajetDianggar) * 100 : 0;
    return {
      ...p,
      bajetVariance: variance,
      peratusBajet: pctBajet,
      isuTerbuka: openIsuMap[p.id] ?? 0,
    };
  });

  // Summary stats
  const totalAktif = result.filter((p) => p.status === "DalamPelaksanaan").length;
  const totalTergendala = result.filter((p) => p.status === "Tergendala").length;
  const totalIsuTerbuka = result.reduce((s, p) => s + p.isuTerbuka, 0);
  const purataKemajuan = result.length
    ? result.reduce((s, p) => s + p.peratusKemajuan, 0) / result.length
    : 0;

  // Alerts: programs with Merah or Tergendala
  const alerts = result.filter((p) => p.statusLampu === "Merah" || p.status === "Tergendala");

  // Get distinct negeri & kategori for filter dropdowns
  const allPrograms = await db.program.findMany({
    where: { status: { in: ["DalamPelaksanaan", "Tergendala", "Selesai"] } },
    select: { negeri: true, kategori: true },
  });
  const negeriList = Array.from(new Set(allPrograms.map((p) => p.negeri))).sort();
  const kategoriList = Array.from(new Set(allPrograms.map((p) => p.kategori))).sort();

  return NextResponse.json({
    programs: result,
    summary: {
      totalAktif,
      totalTergendala,
      totalIsuTerbuka,
      purataKemajuan,
      totalDipaparkan: result.length,
    },
    alerts,
    filters: { negeriList, kategoriList },
  });
}
