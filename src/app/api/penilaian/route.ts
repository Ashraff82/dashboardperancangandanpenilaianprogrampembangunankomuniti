import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Helper: compute gred from skor
function computeGred(skor: number): string {
  if (skor >= 4.5) return "A";
  if (skor >= 3.5) return "B";
  if (skor >= 2.5) return "C";
  if (skor >= 1.5) return "D";
  return "E";
}

// GET /api/penilaian — list penilaian with program included, plus filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gred = searchParams.get("gred");
  const kategori = searchParams.get("kategori");

  const where: any = {};
  if (gred && gred !== "all") where.gred = gred;
  if (kategori && kategori !== "all") where.program = { kategori };

  const penilaian = await db.penilaian.findMany({
    where,
    orderBy: [{ gred: "asc" }, { skorKeseluruhan: "desc" }],
    include: {
      program: {
        select: {
          id: true,
          kodProgram: true,
          namaProgram: true,
          kategori: true,
          negeri: true,
          penerimaManfaat: true,
          tarikhTamat: true,
          gredPenilaian: true,
          skorPenilaian: true,
          _count: { select: { maklumBalas: true, kpi: true } },
        },
      },
      penilai: { select: { nama: true, jawatan: true } },
    },
  });

  // Also fetch Selesai programs that have NO penilaian yet (for "Rekod Penilaian Baharu")
  const evaluatedProgramIds = penilaian.map((p) => p.programId);
  const belumDinilai = await db.program.findMany({
    where: {
      status: "Selesai",
      id: { notIn: evaluatedProgramIds },
    },
    select: {
      id: true,
      kodProgram: true,
      namaProgram: true,
      kategori: true,
      negeri: true,
      penerimaManfaat: true,
      tarikhTamat: true,
      _count: { select: { kpi: true, maklumBalas: true } },
    },
    orderBy: { tarikhTamat: "desc" },
  });

  // Distribution by gred
  const byGred: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  let sumSkor = 0;
  let sumKPI = 0;
  for (const p of penilaian) {
    byGred[p.gred] = (byGred[p.gred] ?? 0) + 1;
    sumSkor += p.skorKeseluruhan;
    sumKPI += p.pencapaianKPI;
  }

  const summary = {
    totalDinilai: penilaian.length,
    belumDinilai: belumDinilai.length,
    skorPurata: penilaian.length ? sumSkor / penilaian.length : 0,
    kpiPurata: penilaian.length ? sumKPI / penilaian.length : 0,
    gredAB: (byGred.A ?? 0) + (byGred.B ?? 0),
    byGred,
  };

  return NextResponse.json({
    data: penilaian,
    belumDinilai,
    summary,
  });
}

// POST /api/penilaian — create new evaluation; compute skor & gred;
// also update related Program.skorPenilaian & gredPenilaian
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    programId,
    penilaiId,
    skorOutput,
    skorOutcome,
    skorImpact,
    pencapaianKPI,
    pengajaran,
    cadangan,
  } = body;

  if (!programId) {
    return NextResponse.json({ error: "programId diperlukan" }, { status: 400 });
  }

  const program = await db.program.findUnique({ where: { id: programId } });
  if (!program) {
    return NextResponse.json({ error: "Program tidak dijumpai" }, { status: 404 });
  }

  const sO = Number(skorOutput) || 0;
  const sC = Number(skorOutcome) || 0;
  const sI = Number(skorImpact) || 0;
  const skorKeseluruhan = (sO + sC + sI) / 3;
  const gred = computeGred(skorKeseluruhan);
  const kpi = Number(pencapaianKPI) || 0;

  // Resolve penilai
  let pId = penilaiId;
  if (!pId) {
    const u = await db.pengguna.findFirst({
      where: { peranan: "Penilai", statusAktif: true },
    });
    pId = u?.id;
  }
  if (!pId) {
    return NextResponse.json({ error: "Penilai tidak dijumpai" }, { status: 400 });
  }

  const [penilaian, ,] = await db.$transaction([
    db.penilaian.create({
      data: {
        programId,
        penilaiId: pId,
        skorOutput: sO,
        skorOutcome: sC,
        skorImpact: sI,
        skorKeseluruhan,
        gred,
        pencapaianKPI: kpi,
        pengajaran: pengajaran || null,
        cadangan: cadangan || null,
      },
      include: {
        program: { select: { kodProgram: true, namaProgram: true, kategori: true } },
        penilai: { select: { nama: true, jawatan: true } },
      },
    }),
    db.program.update({
      where: { id: programId },
      data: {
        skorPenilaian: skorKeseluruhan,
        gredPenilaian: gred,
      },
    }),
    db.auditLog.create({
      data: {
        penggunaId: pId,
        modul: "Penilaian",
        aksi: "Cipta",
        entiti: "Penilaian",
        entitiId: programId,
        butiran: `Rekod penilaian ${gred} (${skorKeseluruhan.toFixed(2)}) untuk ${program.kodProgram}`,
      },
    }),
  ]);

  return NextResponse.json({ data: penilaian }, { status: 201 });
}
