import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/laporan/custom?tahun=2026&negeri=Selangor,Johor&kategori=Infrastruktur&status=DalamPelaksanaan&objekAm=Aset&metrics=JumlahProgram,JumlahBajet
// Returns filtered aggregate data + table rows.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const tahun = searchParams.get("tahun");
  const negeri = searchParams.getAll("negeri");
  const kategori = searchParams.getAll("kategori");
  const status = searchParams.getAll("status");
  const objekAm = searchParams.getAll("objekAm");
  const metricsParam = searchParams.get("metrics") || "";

  const metrics = metricsParam
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  // Build program filter
  const programWhere: any = {};
  if (tahun) {
    const t = Number(tahun);
    programWhere.tarikhMula = { gte: new Date(`${t}-01-01`), lte: new Date(`${t}-12-31`) };
  }
  if (negeri.length) programWhere.negeri = { in: negeri };
  if (kategori.length) programWhere.kategori = { in: kategori };
  if (status.length) programWhere.status = { in: status };

  const programs = await db.program.findMany({
    where: programWhere,
    select: {
      id: true, kodProgram: true, namaProgram: true, kategori: true, negeri: true, status: true,
      bajetDianggar: true, bajetSebenar: true, peratusKemajuan: true, penerimaManfaat: true,
      skorPenilaian: true, gredPenilaian: true,
    },
  });

  // OE filter (only if objekAm selected, otherwise OE aggregate by tahun)
  const oeWhere: any = {};
  if (tahun) oeWhere.tahunKewangan = Number(tahun);
  if (objekAm.length) oeWhere.objekAm = { in: objekAm };
  const peruntukan = await db.peruntukanOE.findMany({
    where: oeWhere,
    select: { silingPeruntukan: true, jumlahDibelanjakan: true, bakiPeruntukan: true, objekAm: true, programId: true },
  });

  // Aggregate stats
  const totalProgram = programs.length;
  const totalBajet = programs.reduce((s, p) => s + p.bajetDianggar, 0);
  const totalPenerima = programs.reduce((s, p) => s + p.penerimaManfaat, 0);
  const avgKemajuan = totalProgram ? programs.reduce((s, p) => s + p.peratusKemajuan, 0) / totalProgram : 0;
  const programsSkor = programs.filter((p) => p.skorPenilaian != null);
  const avgSkor = programsSkor.length ? programsSkor.reduce((s, p) => s + (p.skorPenilaian || 0), 0) / programsSkor.length : 0;
  const totalSiling = peruntukan.reduce((s, o) => s + o.silingPeruntukan, 0);
  const totalBaki = peruntukan.reduce((s, o) => s + o.bakiPeruntukan, 0);

  // Build summary based on metrics requested
  const allMetrics: { key: string; label: string; value: string }[] = [
    { key: "JumlahProgram", label: "Jumlah Program", value: String(totalProgram) },
    { key: "JumlahBajet", label: "Jumlah Bajet", value: `RM ${totalBajet.toLocaleString("ms-MY")}` },
    { key: "PenerimaManfaat", label: "Penerima Manfaat", value: totalPenerima.toLocaleString("ms-MY") },
    { key: "PurataKemajuan", label: "Purata Kemajuan", value: `${avgKemajuan.toFixed(1)}%` },
    { key: "SkorPenilaian", label: "Skor Penilaian", value: avgSkor.toFixed(2) },
    { key: "PeruntukanOE", label: "Peruntukan OE", value: `RM ${totalSiling.toLocaleString("ms-MY")}` },
    { key: "BakiPeruntukan", label: "Baki Peruntukan", value: `RM ${totalBaki.toLocaleString("ms-MY")}` },
  ];
  const summary = metrics.length
    ? allMetrics.filter((m) => metrics.includes(m.key))
    : allMetrics;

  // Table rows — merge program + OE per row
  const tableRows = programs.map((p) => {
    const oeForProgram = peruntukan.filter((o) => o.programId === p.id);
    const siling = oeForProgram.reduce((s, o) => s + o.silingPeruntukan, 0);
    const baki = oeForProgram.reduce((s, o) => s + o.bakiPeruntukan, 0);
    return {
      "Kod Program": p.kodProgram,
      "Nama Program": p.namaProgram,
      "Kategori": p.kategori,
      "Negeri": p.negeri,
      "Status": p.status,
      "Bajet (RM)": p.bajetDianggar.toFixed(2),
      "Penerima": p.penerimaManfaat,
      "Kemajuan (%)": p.peratusKemajuan.toFixed(1),
      "Skor Penilaian": p.skorPenilaian != null ? p.skorPenilaian.toFixed(2) : "-",
      "Gred": p.gredPenilaian ?? "-",
      "Peruntukan OE (RM)": siling.toFixed(2),
      "Baki Peruntukan (RM)": baki.toFixed(2),
    };
  });

  return NextResponse.json({
    filters: { tahun, negeri, kategori, status, objekAm, metrics },
    summary,
    tableRows,
    meta: {
      totalProgram,
      totalBajet,
      totalPenerima,
      avgKemajuan,
      avgSkor,
      totalSiling,
      totalBaki,
    },
    generatedAt: new Date().toISOString(),
  });
}
