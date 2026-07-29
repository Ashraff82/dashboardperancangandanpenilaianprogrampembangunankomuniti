import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/programs/[id]/lulus — approve program (set status Diluluskan + pelulusId)
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const pelulusId = body.pelulusId;
  const catatan = body.catatan || "Diluluskan untuk pelaksanaan";

  const existing = await db.program.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Program tidak dijumpai" }, { status: 404 });
  }
  if (existing.status === "Diluluskan" || existing.status === "DalamPelaksanaan" || existing.status === "Selesai") {
    return NextResponse.json(
      { error: `Program telah diluluskan/selesai (status semasa: ${existing.status})` },
      { status: 400 }
    );
  }

  // pick first pengurusan atasan as pelulus if not provided
  let approverId = pelulusId;
  if (!approverId) {
    const approver = await db.pengguna.findFirst({
      where: { peranan: { in: ["PengurusanAtasan", "Admin"] } },
    });
    approverId = approver?.id;
  }
  if (!approverId) {
    return NextResponse.json({ error: "Pelulus tidak dijumpai" }, { status: 400 });
  }

  const updated = await db.program.update({
    where: { id },
    data: {
      status: "Diluluskan",
      pelulusId: approverId,
      statusLampu: "Hijau",
    },
  });

  await db.auditLog.create({
    data: {
      penggunaId: approverId,
      modul: "Perancangan",
      aksi: "Lulus",
      entiti: "Program",
      entitiId: id,
      butiran: `Lulus program ${existing.kodProgram}: ${catatan}`,
    },
  });

  return NextResponse.json({ data: updated });
}
