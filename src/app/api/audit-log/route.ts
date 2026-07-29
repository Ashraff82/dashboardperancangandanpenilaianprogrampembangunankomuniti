import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/audit-log?penggunaId=&modul=&aksi=&take=100&skip=0&tarikhMula=&tarikhTamat=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const penggunaId = searchParams.get("penggunaId");
  const modul = searchParams.get("modul");
  const aksi = searchParams.get("aksi");
  const take = Number(searchParams.get("take") || "100");
  const skip = Number(searchParams.get("skip") || "0");
  const tarikhMula = searchParams.get("tarikhMula");
  const tarikhTamat = searchParams.get("tarikhTamat");

  const where: any = {};
  if (penggunaId) where.penggunaId = penggunaId;
  if (modul) where.modul = modul;
  if (aksi) where.aksi = aksi;
  if (tarikhMula || tarikhTamat) {
    where.tarikh = {};
    if (tarikhMula) where.tarikh.gte = new Date(tarikhMula);
    if (tarikhTamat) where.tarikh.lte = new Date(`${tarikhTamat}T23:59:59`);
  }

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { tarikh: "desc" },
      take,
      skip,
      include: {
        pengguna: {
          select: { nama: true, email: true, peranan: true },
        },
      },
    }),
    db.auditLog.count({ where }),
  ]);

  return NextResponse.json({
    logs,
    total,
    take,
    skip,
  });
}
