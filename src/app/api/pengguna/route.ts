import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/pengguna?peranan=&bahagian=&statusAktif=&search=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const peranan = searchParams.get("peranan");
  const bahagian = searchParams.get("bahagian");
  const statusAktif = searchParams.get("statusAktif");
  const search = searchParams.get("search");

  const where: any = {};
  if (peranan) where.peranan = peranan;
  if (bahagian) where.bahagian = bahagian;
  if (statusAktif !== null && statusAktif !== undefined && statusAktif !== "") {
    where.statusAktif = statusAktif === "true";
  }
  if (search) {
    where.OR = [
      { nama: { contains: search } },
      { email: { contains: search } },
      { jawatan: { contains: search } },
    ];
  }

  const pengguna = await db.pengguna.findMany({
    where,
    orderBy: [{ statusAktif: "desc" }, { tarikhCipta: "desc" }],
    select: {
      id: true, nama: true, email: true, jawatan: true, peranan: true,
      bahagian: true, negeri: true, telefon: true, statusAktif: true,
      tarikhCipta: true, tarikhKemaskini: true,
    },
  });

  return NextResponse.json({ pengguna, count: pengguna.length });
}

// POST /api/pengguna — create new user, also writes audit log.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nama, email, jawatan, peranan, bahagian, negeri, telefon, pelakanaId } = body;

  if (!nama || !email || !peranan || !bahagian) {
    return NextResponse.json({ error: "Ruangan wajib tidak lengkap." }, { status: 400 });
  }

  const existing = await db.pengguna.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "E-mel telah wujud." }, { status: 409 });
  }

  const created = await db.pengguna.create({
    data: { nama, email, jawatan, peranan, bahagian, negeri, telefon },
  });

  // Audit log
  await db.auditLog.create({
    data: {
      penggunaId: pelakanaId || created.id,
      modul: "Pentadbiran",
      aksi: "Cipta",
      entiti: "Pengguna",
      entitiId: created.id,
      butiran: `Cipta pengguna baharu: ${created.nama} (${created.email}) — peranan ${peranan}`,
      ipAlamat: req.headers.get("x-forwarded-for") || "127.0.0.1",
    },
  });

  return NextResponse.json({ pengguna: created }, { status: 201 });
}
