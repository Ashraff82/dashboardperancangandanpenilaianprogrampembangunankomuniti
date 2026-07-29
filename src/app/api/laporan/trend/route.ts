import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/laporan/trend — multi-year (2024-2026) aggregates.
export async function GET() {
  const years = [2024, 2025, 2026];

  const [programs, peruntukan, penilaian] = await Promise.all([
    db.program.findMany({
      select: {
        tarikhMula: true, kategori: true, bajetDianggar: true, bajetSebenar: true,
        penerimaManfaat: true, peratusKemajuan: true, skorPenilaian: true,
      },
    }),
    db.peruntukanOE.findMany({
      select: { tahunKewangan: true, silingPeruntukan: true, jumlahDibelanjakan: true, objekAm: true },
    }),
    db.penilaian.findMany({
      select: { tarikhPenilaian: true, skorKeseluruhan: true, gred: true },
    }),
  ]);

  const byYear: Record<number, any> = {};
  for (const y of years) byYear[y] = {
    year: y,
    programCount: 0,
    bajetDianggar: 0,
    bajetSebenar: 0,
    oeSiling: 0,
    oeDibelanjakan: 0,
    avgSkor: 0,
    penilaianCount: 0,
    byKategori: {} as Record<string, number>,
  };

  // Programs
  for (const p of programs) {
    const y = new Date(p.tarikhMula).getFullYear();
    if (!byYear[y]) continue;
    byYear[y].programCount += 1;
    byYear[y].bajetDianggar += p.bajetDianggar;
    byYear[y].bajetSebenar += p.bajetSebenar;
    byYear[y].byKategori[p.kategori] = (byYear[y].byKategori[p.kategori] ?? 0) + 1;
  }

  // OE
  for (const o of peruntukan) {
    if (!byYear[o.tahunKewangan]) continue;
    byYear[o.tahunKewangan].oeSiling += o.silingPeruntukan;
    byYear[o.tahunKewangan].oeDibelanjakan += o.jumlahDibelanjakan;
  }

  // Penilaian
  for (const e of penilaian) {
    const y = new Date(e.tarikhPenilaian).getFullYear();
    if (!byYear[y]) continue;
    byYear[y].penilaianCount += 1;
    byYear[y].avgSkor += e.skorKeseluruhan;
  }
  for (const y of years) {
    if (byYear[y].penilaianCount > 0) {
      byYear[y].avgSkor = byYear[y].avgSkor / byYear[y].penilaianCount;
    }
  }

  // Build chart-ready arrays
  const programCountTrend = years.map((y) => ({ year: String(y), value: byYear[y].programCount }));
  const bajetTrend = years.map((y) => ({
    year: String(y),
    Dianggar: byYear[y].bajetDianggar,
    Sebenar: byYear[y].bajetSebenar,
  }));
  const oeTrend = years.map((y) => ({
    year: String(y),
    Siling: byYear[y].oeSiling,
    Dibelanjakan: byYear[y].oeDibelanjakan,
  }));
  const skorTrend = years.map((y) => ({
    year: String(y),
    Skor: Number(byYear[y].avgSkor.toFixed(2)),
    Penilaian: byYear[y].penilaianCount,
  }));

  // Kategori distribution by year (stacked)
  const allKategori = Array.from(
    new Set(Object.values(byYear).flatMap((y: any) => Object.keys(y.byKategori)))
  );
  const kategoriStacked = years.map((y) => {
    const row: Record<string, any> = { year: String(y) };
    for (const k of allKategori) row[k] = byYear[y].byKategori[k] ?? 0;
    return row;
  });

  return NextResponse.json({
    years,
    programCountTrend,
    bajetTrend,
    oeTrend,
    skorTrend,
    kategoriStacked,
    kategoriList: allKategori,
    raw: byYear,
  });
}
