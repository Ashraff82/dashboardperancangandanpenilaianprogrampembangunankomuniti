import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/programs — list with filters: status, kategori, negeri, search
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const kategori = searchParams.get("kategori") || undefined;
  const negeri = searchParams.get("negeri") || undefined;
  const search = searchParams.get("search") || undefined;
  const pengurusId = searchParams.get("pengurusId") || undefined;

  const where: any = {};
  if (status && status !== "all") where.status = status;
  if (kategori && kategori !== "all") where.kategori = kategori;
  if (negeri && negeri !== "all") where.negeri = negeri;
  if (pengurusId) where.pengurusId = pengurusId;
  if (search) {
    where.OR = [
      { namaProgram: { contains: search } },
      { kodProgram: { contains: search } },
    ];
  }

  const programs = await db.program.findMany({
    where,
    orderBy: { tarikhCipta: "desc" },
    include: {
      _count: { select: { kpi: true, aktiviti: true, peruntukan: true } },
    },
  });

  const result = programs.map((p) => ({
    id: p.id,
    kodProgram: p.kodProgram,
    namaProgram: p.namaProgram,
    kategori: p.kategori,
    subKategori: p.subKategori,
    negeri: p.negeri,
    daerah: p.daerah,
    pbt: p.pbt,
    status: p.status,
    statusLampu: p.statusLampu,
    bajetDianggar: p.bajetDianggar,
    bajetSebenar: p.bajetSebenar,
    peratusKemajuan: p.peratusKemajuan,
    tarikhMula: p.tarikhMula,
    tarikhTamat: p.tarikhTamat,
    objektif: p.objektif,
    kumpulanSasaran: p.kumpulanSasaran,
    penerimaManfaat: p.penerimaManfaat,
    bilKPI: p._count.kpi,
    bilAktiviti: p._count.aktiviti,
    bilPeruntukan: p._count.peruntukan,
    tarikhCipta: p.tarikhCipta,
  }));

  return NextResponse.json({ data: result, total: result.length });
}

// POST /api/programs — create new program with KPIs & optional aktiviti
export async function POST(req: Request) {
  const body = await req.json();
  const {
    namaProgram,
    kategori,
    subKategori,
    negeri,
    daerah,
    pbt,
    objektif,
    kumpulanSasaran,
    tarikhMula,
    tarikhTamat,
    bajetDianggar,
    pengurusId,
    kpis = [],
    aktiviti = [],
  } = body;

  if (!namaProgram || !kategori || !negeri || !tarikhMula || !tarikhTamat) {
    return NextResponse.json(
      { error: "Medan wajib tidak lengkap (nama, kategori, negeri, tarikh mula/tamat)" },
      { status: 400 }
    );
  }

  // Generate unique kod program: PROG-YYYY-NNN (find max existing suffix + 1, with retry)
  const year = new Date(tarikhMula).getFullYear();
  const existing = await db.program.findMany({
    where: { kodProgram: { contains: `PROG-${year}-` } },
    select: { kodProgram: true },
  });
  let maxNum = 0;
  for (const p of existing) {
    const match = p.kodProgram.match(/PROG-\d{4}-(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  let kodProgram = `PROG-${year}-${String(maxNum + 1).padStart(3, "0")}`;
  // Ensure unique (in case of race / non-standard codes)
  let attempt = 0;
  while (await db.program.findUnique({ where: { kodProgram } })) {
    attempt += 1;
    kodProgram = `PROG-${year}-${String(maxNum + 1 + attempt).padStart(3, "0")}`;
    if (attempt > 100) break;
  }

  // Pick a default pengurus if not provided
  let managerId = pengurusId;
  if (!managerId) {
    const mgr = await db.pengguna.findFirst({
      where: { peranan: "PengurusProgram" },
    });
    managerId = mgr?.id;
  }
  if (!managerId) {
    return NextResponse.json(
      { error: "Pengurus program tidak dijumpai" },
      { status: 400 }
    );
  }

  const program = await db.program.create({
    data: {
      kodProgram,
      namaProgram,
      kategori,
      subKategori: subKategori || null,
      negeri,
      daerah,
      pbt: pbt || null,
      status: "Perancangan",
      statusLampu: "Hijau",
      bajetDianggar: Number(bajetDianggar) || 0,
      tarikhMula: new Date(tarikhMula),
      tarikhTamat: new Date(tarikhTamat),
      objektif: objektif || "",
      kumpulanSasaran: kumpulanSasaran || null,
      pengurusId: managerId,
      kpi:
        kpis.length > 0
          ? {
              create: kpis.map((k: any) => ({
                nama: k.nama,
                sasaran: k.sasaran || "",
                nilaiSasaran: Number(k.nilaiSasaran) || 0,
                unit: k.unit || "",
                jenis: k.jenis || "Output",
              })),
            }
          : undefined,
      aktiviti:
        aktiviti.length > 0
          ? {
              create: aktiviti.map((a: any) => ({
                nama: a.nama,
                tarikhMula: new Date(a.tarikhMula),
                tarikhTamat: new Date(a.tarikhTamat),
                PIC: a.PIC || null,
                status: "BelumMula",
              })),
            }
          : undefined,
    },
    include: { kpi: true, aktiviti: true },
  });

  // Audit log
  if (managerId) {
    await db.auditLog.create({
      data: {
        penggunaId: managerId,
        modul: "Perancangan",
        aksi: "Cipta",
        entiti: "Program",
        entitiId: program.id,
        butiran: `Cipta program baharu ${kodProgram}: ${namaProgram}`,
      },
    });
  }

  return NextResponse.json({ data: program }, { status: 201 });
}
