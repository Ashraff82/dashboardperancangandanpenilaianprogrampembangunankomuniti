import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Helper: recompute statusLampu from progress + status
function computeLampu(progress: number, status: string): "Hijau" | "Kuning" | "Merah" {
  if (status === "Tergendala") return "Merah";
  if (progress < 40) return "Merah";
  if (progress < 70) return "Kuning";
  return "Hijau";
}

// GET /api/programs/[id]/kemajuan
// List kemajuan updates for a program (with related pengguna PIC) — newest first
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const kemajuan = await db.kemajuanProgram.findMany({
    where: { programId: id },
    orderBy: { tarikh: "desc" },
    include: {
      pengguna: { select: { nama: true, jawatan: true, peranan: true } },
    },
  });
  return NextResponse.json({ data: kemajuan });
}

// POST /api/programs/[id]/kemajuan
// Add a new kemajuan update; also update program.peratusKemajuan to latest value
// and recompute statusLampu.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const peratusKemajuan = Number(body.peratusKemajuan);
  const catatan = body.catatan ?? null;
  const bukti = body.bukti ?? null;
  const penggunaId = body.penggunaId;

  if (Number.isNaN(peratusKemajuan) || peratusKemajuan < 0 || peratusKemajuan > 100) {
    return NextResponse.json(
      { error: "Peratus kemajuan mesti antara 0-100" },
      { status: 400 }
    );
  }

  // Get program (need status for lampu computation)
  const program = await db.program.findUnique({ where: { id }, select: { status: true } });
  if (!program) {
    return NextResponse.json({ error: "Program tidak dijumpai" }, { status: 404 });
  }

  // Resolve a pengguna if not provided
  let userId = penggunaId;
  if (!userId) {
    const mgr = await db.pengguna.findFirst({
      where: { peranan: { in: ["PegawaiPBT", "PengurusProgram"] }, statusAktif: true },
    });
    userId = mgr?.id;
  }
  if (!userId) {
    return NextResponse.json({ error: "Pengguna tidak dijumpai" }, { status: 400 });
  }

  const statusLampu = computeLampu(peratusKemajuan, program.status);

  // Use a transaction to add kemajuan + update program in one shot
  const [kemajuan, ,] = await db.$transaction([
    db.kemajuanProgram.create({
      data: {
        programId: id,
        penggunaId: userId,
        peratusKemajuan,
        catatan,
        bukti,
      },
      include: { pengguna: { select: { nama: true, jawatan: true } } },
    }),
    db.program.update({
      where: { id },
      data: { peratusKemajuan, statusLampu },
    }),
    db.auditLog.create({
      data: {
        penggunaId: userId,
        modul: "Pelaksanaan",
        aksi: "Kemaskini",
        entiti: "KemajuanProgram",
        entitiId: id,
        butiran: `Kemas kini kemajuan ${peratusKemajuan}% (${statusLampu})`,
      },
    }),
  ]);

  return NextResponse.json({ data: kemajuan, statusLampu }, { status: 201 });
}
