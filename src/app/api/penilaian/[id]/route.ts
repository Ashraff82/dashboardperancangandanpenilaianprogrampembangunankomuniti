import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function computeGred(skor: number): string {
  if (skor >= 4.5) return "A";
  if (skor >= 3.5) return "B";
  if (skor >= 2.5) return "C";
  if (skor >= 1.5) return "D";
  return "E";
}

// GET /api/penilaian/[id] — full detail including program.kpi, maklumBalas, penilai
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const penilaian = await db.penilaian.findUnique({
    where: { id },
    include: {
      program: {
        select: {
          id: true,
          kodProgram: true,
          namaProgram: true,
          kategori: true,
          negeri: true,
          penerimaManfaat: true,
          tarikhMula: true,
          tarikhTamat: true,
          bajetDianggar: true,
          bajetSebenar: true,
          objektif: true,
          kpi: true,
          maklumBalas: {
            orderBy: { tarikh: "desc" },
            select: {
              id: true,
              namaResponden: true,
              skorKepuasan: true,
              komen: true,
              tarikh: true,
            },
          },
        },
      },
      penilai: { select: { nama: true, jawatan: true } },
    },
  });

  if (!penilaian) {
    return NextResponse.json({ error: "Penilaian tidak dijumpai" }, { status: 404 });
  }

  // Compute average satisfaction from maklum balas
  const mb = penilaian.program.maklumBalas;
  const avgKepuasan = mb.length
    ? mb.reduce((s, m) => s + m.skorKepuasan, 0) / mb.length
    : 0;

  return NextResponse.json({ data: { ...penilaian, avgKepuasan } });
}

// PUT /api/penilaian/[id] — update evaluation scores; recompute keseluruhan & gred
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const existing = await db.penilaian.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Penilaian tidak dijumpai" }, { status: 404 });
  }

  const sO = body.skorOutput !== undefined ? Number(body.skorOutput) : existing.skorOutput;
  const sC = body.skorOutcome !== undefined ? Number(body.skorOutcome) : existing.skorOutcome;
  const sI = body.skorImpact !== undefined ? Number(body.skorImpact) : existing.skorImpact;
  const skorKeseluruhan = (sO + sC + sI) / 3;
  const gred = computeGred(skorKeseluruhan);
  const pencapaianKPI =
    body.pencapaianKPI !== undefined ? Number(body.pencapaianKPI) : existing.pencapaianKPI;

  const data: any = {
    skorOutput: sO,
    skorOutcome: sC,
    skorImpact: sI,
    skorKeseluruhan,
    gred,
    pencapaianKPI,
  };
  if (body.pengajaran !== undefined) data.pengajaran = body.pengajaran || null;
  if (body.cadangan !== undefined) data.cadangan = body.cadangan || null;

  const [updated, ] = await db.$transaction([
    db.penilaian.update({ where: { id }, data, include: { program: { select: { kodProgram: true } } } }),
    db.program.update({
      where: { id: existing.programId },
      data: { skorPenilaian: skorKeseluruhan, gredPenilaian: gred },
    }),
  ]);

  return NextResponse.json({ data: updated });
}
