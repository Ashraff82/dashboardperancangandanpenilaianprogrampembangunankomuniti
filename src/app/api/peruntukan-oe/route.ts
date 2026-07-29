import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { oeStatusFromPercent } from "@/lib/domain";

// GET /api/peruntukan-oe — list with filters: tahunKewangan, bahagian, objekAm, status
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tahunKewangan = searchParams.get("tahunKewangan");
  const bahagian = searchParams.get("bahagian");
  const objekAm = searchParams.get("objekAm");
  const status = searchParams.get("status");

  const where: any = {};
  if (tahunKewangan && tahunKewangan !== "all") where.tahunKewangan = Number(tahunKewangan);
  if (bahagian && bahagian !== "all") where.bahagian = bahagian;
  if (objekAm && objekAm !== "all") where.objekAm = objekAm;
  if (status && status !== "all") where.statusPenggunaan = status;

  const list = await db.peruntukanOE.findMany({
    where,
    orderBy: [{ tahunKewangan: "desc" }, { bahagian: "asc" }, { objekAm: "asc" }],
    include: {
      program: { select: { id: true, kodProgram: true, namaProgram: true } },
      kemaskiniOleh: { select: { id: true, nama: true } },
      _count: { select: { waran: true, perbelanjaanBulanan: true } },
    },
  });

  const data = list.map((p) => {
    const baki = p.silingPeruntukan - p.jumlahDibelanjakan - p.jumlahKomited;
    const peratus = p.silingPeruntukan > 0
      ? ((p.jumlahDibelanjakan + p.jumlahKomited) / p.silingPeruntukan) * 100
      : 0;
    const statusComputed = oeStatusFromPercent(peratus);
    return {
      id: p.id,
      tahunKewangan: p.tahunKewangan,
      bahagian: p.bahagian,
      objekAm: p.objekAm,
      kodVot: p.kodVot,
      kodAktiviti: p.kodAktiviti,
      silingPeruntukan: p.silingPeruntukan,
      jumlahDibelanjakan: p.jumlahDibelanjakan,
      jumlahKomited: p.jumlahKomited,
      bakiPeruntukan: baki,
      peratusPenggunaan: peratus,
      statusPenggunaan: statusComputed,
      program: p.program,
      kemaskiniOleh: p.kemaskiniOleh,
      tarikhKemaskini: p.tarikhKemaskini,
      bilWaran: p._count.waran,
    };
  });

  // Summary aggregates
  const summary = data.reduce(
    (acc, d) => {
      acc.siling += d.silingPeruntukan;
      acc.dibelanjakan += d.jumlahDibelanjakan;
      acc.komited += d.jumlahKomited;
      acc.baki += d.bakiPeruntukan;
      return acc;
    },
    { siling: 0, dibelanjakan: 0, komited: 0, baki: 0 }
  );
  const summaryPeratus = summary.siling > 0
    ? ((summary.dibelanjakan + summary.komited) / summary.siling) * 100
    : 0;

  // Group by objek am
  const byObjekAm: Record<string, any> = {};
  for (const d of data) {
    if (!byObjekAm[d.objekAm]) {
      byObjekAm[d.objekAm] = { siling: 0, dibelanjakan: 0, komited: 0, baki: 0, count: 0 };
    }
    byObjekAm[d.objekAm].siling += d.silingPeruntukan;
    byObjekAm[d.objekAm].dibelanjakan += d.jumlahDibelanjakan;
    byObjekAm[d.objekAm].komited += d.jumlahKomited;
    byObjekAm[d.objekAm].baki += d.bakiPeruntukan;
    byObjekAm[d.objekAm].count += 1;
  }

  return NextResponse.json({
    data,
    summary: { ...summary, peratusPenggunaan: summaryPeratus, status: oeStatusFromPercent(summaryPeratus) },
    byObjekAm,
    total: data.length,
  });
}

// POST /api/peruntukan-oe — create
export async function POST(req: Request) {
  const body = await req.json();
  const {
    tahunKewangan, bahagian, objekAm, kodVot, kodAktiviti,
    silingPeruntukan, programId, kemaskiniOlehId,
  } = body;

  if (!tahunKewangan || !bahagian || !objekAm || !silingPeruntukan) {
    return NextResponse.json(
      { error: "Medan wajib tidak lengkap (tahun, bahagian, objek am, siling)" },
      { status: 400 }
    );
  }

  const siling = Number(silingPeruntukan);
  const created = await db.peruntukanOE.create({
    data: {
      tahunKewangan: Number(tahunKewangan),
      bahagian,
      objekAm,
      kodVot: kodVot || `${objekAm.slice(0, 3).toUpperCase()}-${tahunKewangan}`,
      kodAktiviti: kodAktiviti || `AKT-${tahunKewangan}`,
      silingPeruntukan: siling,
      jumlahDibelanjakan: 0,
      jumlahKomited: 0,
      bakiPeruntukan: siling,
      peratusPenggunaan: 0,
      statusPenggunaan: "Hijau",
      programId: programId || null,
      kemaskiniOlehId: kemaskiniOlehId || null,
    },
  });

  // audit
  if (kemaskiniOlehId) {
    await db.auditLog.create({
      data: {
        penggunaId: kemaskiniOlehId,
        modul: "Bajet",
        aksi: "Cipta",
        entiti: "PeruntukanOE",
        entitiId: created.id,
        butiran: `Cipta peruntukan OE ${bahagian}/${objekAm} siling RM${siling} untuk ${tahunKewangan}`,
      },
    });
  }

  return NextResponse.json({ data: created }, { status: 201 });
}
