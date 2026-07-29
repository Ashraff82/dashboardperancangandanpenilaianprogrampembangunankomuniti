import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/pengguna/[id] — single user with audit logs
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  const pengguna = await db.pengguna.findUnique({
    where: { id },
    include: {
      auditLog: {
        orderBy: { tarikh: "desc" },
        take: 50,
      },
    },
  });

  if (!pengguna) {
    return NextResponse.json({ error: "Pengguna tidak dijumpai." }, { status: 404 });
  }

  return NextResponse.json({ pengguna });
}

// PUT /api/pengguna/[id] — update user, also write audit log.
export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json();
  const { nama, email, jawatan, peranan, bahagian, negeri, telefon, pelakanaId } = body;

  const existing = await db.pengguna.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Pengguna tidak dijumpai." }, { status: 404 });
  }

  if (email && email !== existing.email) {
    const emailUsed = await db.pengguna.findUnique({ where: { email } });
    if (emailUsed) {
      return NextResponse.json({ error: "E-mel telah digunakan." }, { status: 409 });
    }
  }

  const updated = await db.pengguna.update({
    where: { id },
    data: { nama, email, jawatan, peranan, bahagian, negeri, telefon },
  });

  // Build change description
  const changes: string[] = [];
  if (nama && nama !== existing.nama) changes.push(`nama: "${existing.nama}" → "${nama}"`);
  if (email && email !== existing.email) changes.push(`email: "${existing.email}" → "${email}"`);
  if (peranan && peranan !== existing.peranan) changes.push(`peranan: ${existing.peranan} → ${peranan}`);
  if (bahagian && bahagian !== existing.bahagian) changes.push(`bahagian: ${existing.bahagian} → ${bahagian}`);
  if (jawatan && jawatan !== existing.jawatan) changes.push(`jawatan: ${existing.jawatan} → ${jawatan}`);

  await db.auditLog.create({
    data: {
      penggunaId: pelakanaId || id,
      modul: "Pentadbiran",
      aksi: "Kemaskini",
      entiti: "Pengguna",
      entitiId: id,
      butiran: `Kemaskini pengguna ${updated.nama}${changes.length ? ` — ${changes.join("; ")}` : ""}`,
      ipAlamat: req.headers.get("x-forwarded-for") || "127.0.0.1",
    },
  });

  return NextResponse.json({ pengguna: updated });
}

// PATCH /api/pengguna/[id] — toggle statusAktif.
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json();
  const { statusAktif, pelakanaId } = body as { statusAktif: boolean; pelakanaId?: string };

  const existing = await db.pengguna.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Pengguna tidak dijumpai." }, { status: 404 });
  }

  const updated = await db.pengguna.update({
    where: { id },
    data: { statusAktif },
  });

  await db.auditLog.create({
    data: {
      penggunaId: pelakanaId || id,
      modul: "Pentadbiran",
      aksi: statusAktif ? "Aktifkan" : "Nyahaktif",
      entiti: "Pengguna",
      entitiId: id,
      butiran: `${statusAktif ? "Mengaktifkan" : "Menyahaktif"} akaun pengguna ${updated.nama}`,
      ipAlamat: req.headers.get("x-forwarded-for") || "127.0.0.1",
    },
  });

  return NextResponse.json({ pengguna: updated });
}
