import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { oeStatusFromPercent } from "@/lib/domain";

// GET /api/overview — Executive Dashboard summary stats
export async function GET() {
  const [
    totalProgram,
    programs,
    peruntukanOE,
    penilaian,
    pengguna,
  ] = await Promise.all([
    db.program.count(),
    db.program.findMany({ select: { status: true, statusLampu: true, kategori: true, negeri: true, bajetDianggar: true, bajetSebenar: true, peratusKemajuan: true, penerimaManfaat: true, tarikhMula: true } }),
    db.peruntukanOE.findMany({ where: { tahunKewangan: 2026 }, select: { silingPeruntukan: true, jumlahDibelanjakan: true, jumlahKomited: true, bakiPeruntukan: true, objekAm: true, bahagian: true, statusPenggunaan: true, peratusPenggunaan: true } }),
    db.penilaian.findMany({ select: { skorKeseluruhan: true, gred: true, pencapaianKPI: true } }),
    db.pengguna.count(),
  ]);

  // Program by status
  const byStatus: Record<string, number> = {};
  const byLampu: Record<string, number> = { Hijau: 0, Kuning: 0, Merah: 0 };
  const byKategori: Record<string, number> = {};
  const byNegeri: Record<string, number> = {};
  let totalBajetDianggar = 0;
  let totalBajetSebenar = 0;
  let totalPenerima = 0;

  for (const p of programs) {
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
    byLampu[p.statusLampu] = (byLampu[p.statusLampu] ?? 0) + 1;
    byKategori[p.kategori] = (byKategori[p.kategori] ?? 0) + 1;
    byNegeri[p.negeri] = (byNegeri[p.negeri] ?? 0) + 1;
    totalBajetDianggar += p.bajetDianggar;
    totalBajetSebenar += p.bajetSebenar;
    totalPenerima += p.penerimaManfaat;
  }

  // OE aggregate for current FY
  let silingTotal = 0;
  let dibelanjakanTotal = 0;
  let komitedTotal = 0;
  const byObjekAm: Record<string, { siling: number; dibelanjakan: number; komited: number }> = {};
  for (const oe of peruntukanOE) {
    silingTotal += oe.silingPeruntukan;
    dibelanjakanTotal += oe.jumlahDibelanjakan;
    komitedTotal += oe.jumlahKomited;
    if (!byObjekAm[oe.objekAm]) byObjekAm[oe.objekAm] = { siling: 0, dibelanjakan: 0, komited: 0 };
    byObjekAm[oe.objekAm].siling += oe.silingPeruntukan;
    byObjekAm[oe.objekAm].dibelanjakan += oe.jumlahDibelanjakan;
    byObjekAm[oe.objekAm].komited += oe.jumlahKomited;
  }
  const bakiTotal = silingTotal - dibelanjakanTotal - komitedTotal;
  const pctPenggunaan = silingTotal > 0 ? (dibelanjakanTotal + komitedTotal) / silingTotal * 100 : 0;

  // Evaluation
  const avgSkor = penilaian.length ? penilaian.reduce((s, p) => s + p.skorKeseluruhan, 0) / penilaian.length : 0;
  const avgKPI = penilaian.length ? penilaian.reduce((s, p) => s + p.pencapaianKPI, 0) / penilaian.length : 0;
  const byGred: Record<string, number> = {};
  for (const p of penilaian) byGred[p.gred] = (byGred[p.gred] ?? 0) + 1;

  // Monthly burn rate (2026)
  const perbelanjaan = await db.perbelanjaanBulanan.findMany({
    where: { tahun: 2026 },
    select: { bulan: true, jumlahDibelanjakan: true, unjuran: true },
  });
  const monthlyBurn: { bulan: number; sebenar: number; unjuran: number }[] = [];
  for (let m = 1; m <= 12; m++) {
    const recs = perbelanjaan.filter((p) => p.bulan === m);
    monthlyBurn.push({
      bulan: m,
      sebenar: recs.reduce((s, r) => s + r.jumlahDibelanjakan, 0),
      unjuran: recs.reduce((s, r) => s + r.unjuran, 0),
    });
  }

  // Program trend by year
  const byTahun: Record<number, number> = {};
  for (const p of programs) {
    const y = new Date(p.tarikhMula).getFullYear();
    byTahun[y] = (byTahun[y] ?? 0) + 1;
  }

  return NextResponse.json({
    totalProgram,
    totalPengguna: pengguna,
    byStatus,
    byLampu,
    byKategori,
    byNegeri,
    byTahun,
    bajet: {
      totalDianggar: totalBajetDianggar,
      totalSebenar: totalBajetSebenar,
      variance: totalBajetDianggar - totalBajetSebenar,
    },
    penerimaManfaat: totalPenerima,
    oe: {
      tahunKewangan: 2026,
      siling: silingTotal,
      dibelanjakan: dibelanjakanTotal,
      komited: komitedTotal,
      baki: bakiTotal,
      peratusPenggunaan: pctPenggunaan,
      status: oeStatusFromPercent(pctPenggunaan),
      byObjekAm,
    },
    penilaian: {
      count: penilaian.length,
      avgSkor,
      avgKPI,
      byGred,
    },
    monthlyBurn,
  });
}
