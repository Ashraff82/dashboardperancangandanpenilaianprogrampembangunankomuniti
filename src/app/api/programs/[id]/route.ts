import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/programs/[id] — full detail
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const program = await db.program.findUnique({
    where: { id },
    include: {
      pengurus: { select: { id: true, nama: true, jawatan: true, bahagian: true } },
      pelulus: { select: { id: true, nama: true, jawatan: true } },
      kpi: { orderBy: { tarikhCipta: "asc" } },
      aktiviti: { orderBy: { tarikhMula: "asc" } },
      kemajuan: {
        orderBy: { tarikh: "desc" },
        take: 5,
        include: { pengguna: { select: { nama: true } } },
      },
      isuRisiko: { orderBy: { tarikhLapor: "desc" }, take: 10 },
      peruntukan: { orderBy: { tarikhCipta: "asc" } },
      _count: { select: { kpi: true, aktiviti: true, peruntukan: true, maklumBalas: true } },
    },
  });
  if (!program) {
    return NextResponse.json({ error: "Program tidak dijumpai" }, { status: 404 });
  }
  return NextResponse.json({ data: program });
}

// PUT /api/programs/[id] — update
export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json();

  const existing = await db.program.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Program tidak dijumpai" }, { status: 404 });
  }

  const data: any = {};
  for (const f of [
    "namaProgram", "kategori", "subKategori", "negeri", "daerah", "pbt",
    "status", "statusLampu", "objektif", "kumpulanSasaran", "catatan",
    "bajetDianggar", "bajetSebenar", "peratusKemajuan", "penerimaManfaat",
    "skorPenilaian", "gredPenilaian",
  ]) {
    if (body[f] !== undefined) data[f] = body[f];
  }
  if (body.tarikhMula) data.tarikhMula = new Date(body.tarikhMula);
  if (body.tarikhTamat) data.tarikhTamat = new Date(body.tarikhTamat);
  if (body.pelulusId) data.pelulusId = body.pelulusId;

  const updated = await db.program.update({ where: { id }, data });

  // KPI replace if provided
  if (Array.isArray(body.kpis)) {
    await db.kPI.deleteMany({ where: { programId: id } });
    if (body.kpis.length > 0) {
      await db.kPI.createMany({
        data: body.kpis.map((k: any) => ({
          programId: id,
          nama: k.nama,
          sasaran: k.sasaran || "",
          nilaiSasaran: Number(k.nilaiSasaran) || 0,
          unit: k.unit || "",
          jenis: k.jenis || "Output",
        })),
      });
    }
  }

  // Audit log
  const editorId = body.editorId || existing.pengurusId;
  if (editorId) {
    await db.auditLog.create({
      data: {
        penggunaId: editorId,
        modul: "Perancangan",
        aksi: "Kemaskini",
        entiti: "Program",
        entitiId: id,
        butiran: `Kemaskini program ${existing.kodProgram}`,
      },
    });
  }

  return NextResponse.json({ data: updated });
}

// DELETE /api/programs/[id]
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const existing = await db.program.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Program tidak dijumpai" }, { status: 404 });
  }
  await db.program.delete({ where: { id } });

  if (existing.pengurusId) {
    await db.auditLog.create({
      data: {
        penggunaId: existing.pengurusId,
        modul: "Perancangan",
        aksi: "Padam",
        entiti: "Program",
        entitiId: id,
        butiran: `Padam program ${existing.kodProgram}`,
      },
    });
  }
  return NextResponse.json({ success: true });
}
