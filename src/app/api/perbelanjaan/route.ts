import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { BULAN_LABEL } from "@/lib/domain";

// GET /api/perbelanjaan?tahun=2026 — aggregate monthly burn
// Returns [{bulan, label, sebenar, unjuran, komited}]
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tahunParam = searchParams.get("tahun");
  const tahun = tahunParam ? Number(tahunParam) : new Date().getFullYear();

  // Get perbelanjaan for selected year
  const records = await db.perbelanjaanBulanan.findMany({
    where: { tahun },
    select: { bulan: true, jumlahDibelanjakan: true, jumlahKomited: true, unjuran: true },
  });

  // aggregate per month
  const monthly: { bulan: number; label: string; sebenar: number; unjuran: number; komited: number }[] = [];
  for (let m = 1; m <= 12; m++) {
    const recs = records.filter((r) => r.bulan === m);
    monthly.push({
      bulan: m,
      label: BULAN_LABEL[m - 1],
      sebenar: recs.reduce((s, r) => s + r.jumlahDibelanjakan, 0),
      unjuran: recs.reduce((s, r) => s + r.unjuran, 0),
      komited: recs.reduce((s, r) => s + r.jumlahKomited, 0),
    });
  }

  // also get multi-year totals (for trend comparison)
  const allYearsRecords = await db.perbelanjaanBulanan.findMany({
    select: { tahun: true, jumlahDibelanjakan: true },
  });
  const allOERecords = await db.peruntukanOE.findMany({
    select: { tahunKewangan: true, silingPeruntukan: true, jumlahDibelanjakan: true },
  });

  const yearSet = new Set<number>();
  for (const r of allYearsRecords) yearSet.add(r.tahun);
  for (const r of allOERecords) yearSet.add(r.tahunKewangan);
  const tahunList = Array.from(yearSet).sort();

  const byTahun = tahunList.map((y) => {
    const siling = allOERecords
      .filter((r) => r.tahunKewangan === y)
      .reduce((s, r) => s + r.silingPeruntukan, 0);
    const dibelanjakanOE = allOERecords
      .filter((r) => r.tahunKewangan === y)
      .reduce((s, r) => s + r.jumlahDibelanjakan, 0);
    const dibelanjakanBulanan = allYearsRecords
      .filter((r) => r.tahun === y)
      .reduce((s, r) => s + r.jumlahDibelanjakan, 0);
    return {
      tahun: y,
      siling,
      dibelanjakan: dibelanjakanBulanan || dibelanjakanOE,
    };
  });

  // totals
  const totalSebenar = monthly.reduce((s, m) => s + m.sebenar, 0);
  const totalUnjuran = monthly.reduce((s, m) => s + m.unjuran, 0);
  const totalKomited = monthly.reduce((s, m) => s + m.komited, 0);

  return NextResponse.json({
    tahun,
    monthly,
    byTahun,
    totals: {
      sebenar: totalSebenar,
      unjuran: totalUnjuran,
      komited: totalKomited,
      variance: totalUnjuran - totalSebenar,
    },
  });
}
