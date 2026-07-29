import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/kpi?programId=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const programId = searchParams.get("programId");

  const where: any = {};
  if (programId) where.programId = programId;

  const kpi = await db.kPI.findMany({
    where,
    orderBy: [{ jenis: "asc" }, { nama: "asc" }],
    include: {
      program: { select: { kodProgram: true, namaProgram: true } },
    },
  });

  // Compute pencapaian % where possible
  const result = kpi.map((k) => {
    const pct =
      k.pencapaianSebenar !== null && k.nilaiSasaran > 0
        ? (k.pencapaianSebenar / k.nilaiSasaran) * 100
        : null;
    return { ...k, peratusPencapaian: pct };
  });

  return NextResponse.json({ data: result });
}
