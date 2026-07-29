import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PUT /api/isu/[id] — update status & tindakan.
// If status becomes "Selesai", set tarikhSelesai + penyelesaiId.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { status, tindakan, penyelesaiId } = body;

  const existing = await db.isuRisiko.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Isu/Risiko tidak dijumpai" }, { status: 404 });
  }

  const data: any = {};
  if (status) data.status = status;
  if (typeof tindakan === "string") data.tindakan = tindakan || null;
  if (status === "Selesai") {
    data.tarikhSelesai = new Date();
    if (penyelesaiId) data.penyelesaiId = penyelesaiId;
    else {
      // resolve a default penyelesai
      const u = await db.pengguna.findFirst({
        where: { peranan: { in: ["PengurusProgram", "Admin"] }, statusAktif: true },
      });
      if (u) data.penyelesaiId = u.id;
    }
  }

  const updated = await db.isuRisiko.update({
    where: { id },
    data,
    include: {
      program: { select: { kodProgram: true, namaProgram: true } },
      pelapor: { select: { nama: true, jawatan: true } },
    },
  });

  await db.auditLog.create({
    data: {
      penggunaId: data.penyelesaiId ?? existing.pelaporId,
      modul: "Pelaksanaan",
      aksi: "Kemaskini",
      entiti: "IsuRisiko",
      entitiId: id,
      butiran: `Kemas kini isu ${existing.tajuk}: status=${status ?? existing.status}`,
    },
  });

  return NextResponse.json({ data: updated });
}
