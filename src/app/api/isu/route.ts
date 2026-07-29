import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/isu — list issues with filters: jenis, status, keutamaan, programId
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jenis = searchParams.get("jenis");
  const status = searchParams.get("status");
  const keutamaan = searchParams.get("keutamaan");
  const programId = searchParams.get("programId");

  const where: any = {};
  if (jenis && jenis !== "all") where.jenis = jenis;
  if (status && status !== "all") where.status = status;
  if (keutamaan && keutamaan !== "all") where.keutamaan = keutamaan;
  if (programId) where.programId = programId;

  const isu = await db.isuRisiko.findMany({
    where,
    orderBy: [{ keutamaan: "desc" }, { tarikhLapor: "desc" }],
    include: {
      program: { select: { kodProgram: true, namaProgram: true, negeri: true } },
      pelapor: { select: { nama: true, jawatan: true } },
    },
  });

  // summary counts
  const summary = {
    total: isu.length,
    terbuka: isu.filter((i) => i.status === "Terbuka").length,
    dalamTindakan: isu.filter((i) => i.status === "DalamTindakan").length,
    selesai: isu.filter((i) => i.status === "Selesai").length,
    kritikal: isu.filter((i) => i.keutamaan === "Kritikal").length,
    tinggi: isu.filter((i) => i.keutamaan === "Tinggi").length,
  };

  return NextResponse.json({ data: isu, summary });
}

// POST /api/isu — create a new issue/risk
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    programId,
    jenis,
    tajuk,
    penerangan,
    keutamaan = "Sederhana",
    pelaporId,
  } = body;

  if (!programId || !jenis || !tajuk || !penerangan) {
    return NextResponse.json(
      { error: "Medan wajib: programId, jenis, tajuk, penerangan" },
      { status: 400 }
    );
  }

  // Resolve pelapor
  let reporterId = pelaporId;
  if (!reporterId) {
    const u = await db.pengguna.findFirst({
      where: { peranan: { in: ["PegawaiPBT", "PengurusProgram"] }, statusAktif: true },
    });
    reporterId = u?.id;
  }
  if (!reporterId) {
    return NextResponse.json({ error: "Pelapor tidak dijumpai" }, { status: 400 });
  }

  const isu = await db.isuRisiko.create({
    data: {
      programId,
      jenis,
      tajuk,
      penerangan,
      keutamaan,
      status: "Terbuka",
      pelaporId: reporterId,
    },
    include: {
      program: { select: { kodProgram: true, namaProgram: true } },
      pelapor: { select: { nama: true, jawatan: true } },
    },
  });

  await db.auditLog.create({
    data: {
      penggunaId: reporterId,
      modul: "Pelaksanaan",
      aksi: "Cipta",
      entiti: "IsuRisiko",
      entitiId: isu.id,
      butiran: `Lapor ${jenis}: ${tajuk}`,
    },
  });

  return NextResponse.json({ data: isu }, { status: 201 });
}
