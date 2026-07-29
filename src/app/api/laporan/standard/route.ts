import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { oeStatusFromPercent, BULAN_LABEL } from "@/lib/domain";

// GET /api/laporan/standard?jenis=bulanan|sukutahunan|tahunan|oe|penilaian|impak&tahun=2026
// Returns structured KPKT-standard report data.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jenis = searchParams.get("jenis") || "tahunan";
  const tahun = Number(searchParams.get("tahun") || "2026");

  const titleMap: Record<string, string> = {
    bulanan: `Laporan Bulanan Program Komuniti KPKT — ${tahun}`,
    sukutahunan: `Laporan Suku Tahunan Program Komuniti KPKT — ${tahun}`,
    tahunan: `Laporan Tahunan Program Pembangunan Komuniti KPKT — ${tahun}`,
    oe: `Laporan Prestasi Perbelanjaan Objek Ekonomi (OE) — ${tahun}`,
    penilaian: `Laporan Penilaian Program Komuniti KPKT — ${tahun}`,
    impak: `Laporan Impak Komuniti Program KPKT — ${tahun}`,
  };

  const title = titleMap[jenis] ?? titleMap.tahunan;

  // Period label
  let periodLabel = `Tahun Kewangan ${tahun}`;
  if (jenis === "bulanan") periodLabel = `Bulanan ${BULAN_LABEL[new Date().getMonth()]} ${tahun}`;
  if (jenis === "sukutahunan") {
    const q = Math.floor(new Date().getMonth() / 3) + 1;
    periodLabel = `Suku Tahunan ke-${q} ${tahun}`;
  }

  // Common: program data
  const programs = await db.program.findMany({
    where: { tarikhMula: { gte: new Date(`${tahun}-01-01`), lte: new Date(`${tahun}-12-31`) } },
    select: {
      id: true, kodProgram: true, namaProgram: true, kategori: true, negeri: true,
      status: true, statusLampu: true, bajetDianggar: true, bajetSebenar: true,
      peratusKemajuan: true, penerimaManfaat: true, skorPenilaian: true, gredPenilaian: true,
      tarikhMula: true, tarikhTamat: true,
    },
  });

  // Standard summary stats
  const totalProgram = programs.length;
  const totalBajetDianggar = programs.reduce((s, p) => s + p.bajetDianggar, 0);
  const totalBajetSebenar = programs.reduce((s, p) => s + p.bajetSebenar, 0);
  const totalPenerima = programs.reduce((s, p) => s + p.penerimaManfaat, 0);
  const avgKemajuan = totalProgram ? programs.reduce((s, p) => s + p.peratusKemajuan, 0) / totalProgram : 0;

  const byStatus: Record<string, number> = {};
  const byKategori: Record<string, number> = {};
  const byLampu: Record<string, number> = { Hijau: 0, Kuning: 0, Merah: 0 };
  for (const p of programs) {
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
    byKategori[p.kategori] = (byKategori[p.kategori] ?? 0) + 1;
    byLampu[p.statusLampu] = (byLampu[p.statusLampu] ?? 0) + 1;
  }

  let summaryStats: { label: string; value: string }[] = [];
  let tableRows: Record<string, any>[] = [];
  let chartData: Record<string, any>[] = [];

  if (jenis === "oe") {
    const oe = await db.peruntukanOE.findMany({
      where: { tahunKewangan: tahun },
      select: { bahagian: true, objekAm: true, kodVot: true, silingPeruntukan: true, jumlahDibelanjakan: true, jumlahKomited: true, bakiPeruntukan: true, peratusPenggunaan: true },
    });
    const silingTotal = oe.reduce((s, o) => s + o.silingPeruntukan, 0);
    const dibelanjakanTotal = oe.reduce((s, o) => s + o.jumlahDibelanjakan, 0);
    const komitedTotal = oe.reduce((s, o) => s + o.jumlahKomited, 0);
    const bakiTotal = silingTotal - dibelanjakanTotal - komitedTotal;
    const pct = silingTotal > 0 ? (dibelanjakanTotal + komitedTotal) / silingTotal * 100 : 0;

    summaryStats = [
      { label: "Siling Peruntukan", value: `RM ${silingTotal.toLocaleString("ms-MY")}` },
      { label: "Jumlah Dibelanjakan", value: `RM ${dibelanjakanTotal.toLocaleString("ms-MY")}` },
      { label: "Jumlah Komited", value: `RM ${komitedTotal.toLocaleString("ms-MY")}` },
      { label: "Baki Peruntukan", value: `RM ${bakiTotal.toLocaleString("ms-MY")}` },
      { label: "Peratus Penggunaan", value: `${pct.toFixed(1)}%` },
      { label: "Status", value: oeStatusFromPercent(pct) },
    ];

    // Aggregate by Objek Am
    const byObjek: Record<string, { siling: number; dibelanjakan: number; komited: number }> = {};
    for (const o of oe) {
      if (!byObjek[o.objekAm]) byObjek[o.objekAm] = { siling: 0, dibelanjakan: 0, komited: 0 };
      byObjek[o.objekAm].siling += o.silingPeruntukan;
      byObjek[o.objekAm].dibelanjakan += o.jumlahDibelanjakan;
      byObjek[o.objekAm].komited += o.jumlahKomited;
    }
    tableRows = Object.entries(byObjek).map(([objek, v]) => ({
      "Objek Am": objek,
      "Siling (RM)": v.siling.toFixed(2),
      "Dibelanjakan (RM)": v.dibelanjakan.toFixed(2),
      "Komited (RM)": v.komited.toFixed(2),
      "Baki (RM)": (v.siling - v.dibelanjakan - v.komited).toFixed(2),
      "Penggunaan (%)": v.siling > 0 ? ((v.dibelanjakan + v.komited) / v.siling * 100).toFixed(1) : "0.0",
    }));
    chartData = Object.entries(byObjek).map(([objek, v]) => ({
      name: objek,
      Siling: v.siling,
      Dibelanjakan: v.dibelanjakan,
      Komited: v.komited,
    }));
  } else if (jenis === "penilaian") {
    const penilaian = await db.penilaian.findMany({
      where: { tarikhPenilaian: { gte: new Date(`${tahun}-01-01`), lte: new Date(`${tahun}-12-31`) } },
      include: { program: { select: { kodProgram: true, namaProgram: true, kategori: true, negeri: true } } },
    });
    const avgSkor = penilaian.length ? penilaian.reduce((s, p) => s + p.skorKeseluruhan, 0) / penilaian.length : 0;
    const avgKPI = penilaian.length ? penilaian.reduce((s, p) => s + p.pencapaianKPI, 0) / penilaian.length : 0;
    const byGred: Record<string, number> = {};
    for (const p of penilaian) byGred[p.gred] = (byGred[p.gred] ?? 0) + 1;

    summaryStats = [
      { label: "Bilangan Penilaian", value: String(penilaian.length) },
      { label: "Purata Skor", value: avgSkor.toFixed(2) },
      { label: "Purata Pencapaian KPI", value: `${avgKPI.toFixed(1)}%` },
      { label: "Gred A", value: String(byGred["A"] ?? 0) },
      { label: "Gred B", value: String(byGred["B"] ?? 0) },
      { label: "Gred C & Below", value: String((byGred["C"] ?? 0) + (byGred["D"] ?? 0) + (byGred["E"] ?? 0)) },
    ];
    tableRows = penilaian.map((p) => ({
      "Kod Program": p.program.kodProgram,
      "Nama Program": p.program.namaProgram,
      "Kategori": p.program.kategori,
      "Negeri": p.program.negeri,
      "Skor": p.skorKeseluruhan.toFixed(2),
      "Gred": p.gred,
      "Pencapaian KPI (%)": p.pencapaianKPI.toFixed(1),
    }));
    chartData = ["A", "B", "C", "D", "E"].map((g) => ({ name: `Gred ${g}`, value: byGred[g] ?? 0 }));
  } else if (jenis === "impak") {
    // Impak: aggregate beneficiaries, satisfaction, evaluation scores
    const maklumBalas = await db.maklumBalasKomuniti.findMany({
      where: { tarikh: { gte: new Date(`${tahun}-01-01`), lte: new Date(`${tahun}-12-31`) } },
      select: { skorKepuasan: true, programId: true },
    });
    const avgKepuasan = maklumBalas.length ? maklumBalas.reduce((s, m) => s + m.skorKepuasan, 0) / maklumBalas.length : 0;
    const programsWithSkor = programs.filter((p) => p.skorPenilaian != null);
    const avgSkor = programsWithSkor.length ? programsWithSkor.reduce((s, p) => s + (p.skorPenilaian || 0), 0) / programsWithSkor.length : 0;

    summaryStats = [
      { label: "Jumlah Penerima Manfaat", value: totalPenerima.toLocaleString("ms-MY") },
      { label: "Jumlah Program", value: String(totalProgram) },
      { label: "Purata Skor Penilaian", value: avgSkor.toFixed(2) },
      { label: "Purata Skor Kepuasan", value: avgKepuasan.toFixed(2) },
      { label: "Program Selesai", value: String(byStatus["Selesai"] ?? 0) },
      { label: "Program Tergendala", value: String(byStatus["Tergendala"] ?? 0) },
    ];
    tableRows = programs.map((p) => ({
      "Kod Program": p.kodProgram,
      "Nama Program": p.namaProgram,
      "Kategori": p.kategori,
      "Negeri": p.negeri,
      "Penerima Manfaat": p.penerimaManfaat,
      "Skor Penilaian": p.skorPenilaian != null ? p.skorPenilaian.toFixed(2) : "-",
      "Gred": p.gredPenilaian ?? "-",
    }));
    chartData = Object.entries(byKategori).map(([k, v]) => ({ name: k, value: v }));
  } else {
    // bulanan / sukutahunan / tahunan — program summary
    summaryStats = [
      { label: "Jumlah Program", value: String(totalProgram) },
      { label: "Bajet Dianggar", value: `RM ${totalBajetDianggar.toLocaleString("ms-MY")}` },
      { label: "Bajet Sebenar", value: `RM ${totalBajetSebenar.toLocaleString("ms-MY")}` },
      { label: "Penerima Manfaat", value: totalPenerima.toLocaleString("ms-MY") },
      { label: "Purata Kemajuan", value: `${avgKemajuan.toFixed(1)}%` },
      { label: "Program Hijau", value: String(byLampu.Hijau) },
    ];
    tableRows = programs.map((p) => ({
      "Kod Program": p.kodProgram,
      "Nama Program": p.namaProgram,
      "Kategori": p.kategori,
      "Negeri": p.negeri,
      "Status": p.status,
      "Bajet (RM)": p.bajetDianggar.toFixed(2),
      "Kemajuan (%)": p.peratusKemajuan.toFixed(1),
      "Penerima": p.penerimaManfaat,
    }));
    chartData = [
      ...Object.entries(byStatus).map(([k, v]) => ({ name: k, value: v, kind: "Status" })),
    ];
  }

  return NextResponse.json({
    jenis,
    tahun,
    title,
    period: periodLabel,
    generatedAt: new Date().toISOString(),
    summaryStats,
    tableRows,
    chartData,
    meta: {
      totalProgram,
      totalBajetDianggar,
      totalBajetSebenar,
      totalPenerima,
      byStatus,
      byKategori,
      byLampu,
    },
  });
}
