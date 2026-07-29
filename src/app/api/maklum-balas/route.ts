import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/maklum-balas?programId=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const programId = searchParams.get("programId");

  const where: any = {};
  if (programId) where.programId = programId;

  const data = await db.maklumBalasKomuniti.findMany({
    where,
    orderBy: { tarikh: "desc" },
    include: {
      program: { select: { kodProgram: true, namaProgram: true } },
    },
  });

  const summary = {
    total: data.length,
    avgKepuasan: data.length
      ? data.reduce((s, d) => s + d.skorKepuasan, 0) / data.length
      : 0,
  };

  return NextResponse.json({ data, summary });
}

// POST /api/maklum-balas
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { programId, namaResponden, skorKepuasan, komen, penggunaId } = body;

  if (!programId || !namaResponden || skorKepuasan === undefined) {
    return NextResponse.json(
      { error: "Medan wajib: programId, namaResponden, skorKepuasan" },
      { status: 400 }
    );
  }

  const skor = Number(skorKepuasan);
  if (Number.isNaN(skor) || skor < 0 || skor > 5) {
    return NextResponse.json({ error: "Skor kepuasan mesti 0-5" }, { status: 400 });
  }

  const mb = await db.maklumBalasKomuniti.create({
    data: {
      programId,
      penggunaId: penggunaId || null,
      namaResponden,
      skorKepuasan: skor,
      komen: komen || null,
    },
  });

  return NextResponse.json({ data: mb }, { status: 201 });
}
