import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/waran — list with filters
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tahunKewangan = searchParams.get("tahunKewangan");
  const bahagian = searchParams.get("bahagian");
  const objekAm = searchParams.get("objekAm");
  const status = searchParams.get("status");

  const where: any = {};
  if (tahunKewangan && tahunKewangan !== "all") where.tahunKewangan = Number(tahunKewangan);
  if (bahagian && bahagian !== "all") where.bahagian = bahagian;
  if (objekAm && objekAm !== "all") where.objekAm = objekAm;
  if (status && status !== "all") where.status = status;

  const waran = await db.waranPeruntukan.findMany({
    where,
    orderBy: [{ tarikhWaran: "desc" }],
    include: {
      peruntukanOE: { select: { id: true, kodVot: true, bahagian: true, objekAm: true } },
      dikeluarkanKepada: { select: { id: true, nama: true, jawatan: true } },
    },
  });

  const total = waran.reduce((s, w) => s + w.jumlah, 0);
  const byStatus: Record<string, { count: number; jumlah: number }> = {};
  for (const w of waran) {
    if (!byStatus[w.status]) byStatus[w.status] = { count: 0, jumlah: 0 };
    byStatus[w.status].count += 1;
    byStatus[w.status].jumlah += w.jumlah;
  }

  return NextResponse.json({ data: waran, total, byStatus });
}

// POST /api/waran — create
export async function POST(req: Request) {
  const body = await req.json();
  const {
    nomborWaran, tahunKewangan, bahagian, objekAm, jumlah,
    tarikhWaran, dikeluarkanOleh, status, peruntukanOEId, dikeluarkanKepadaId,
  } = body;

  if (!nomborWaran || !tahunKewangan || !bahagian || !objekAm || !jumlah) {
    return NextResponse.json(
      { error: "Medan wajib tidak lengkap" },
      { status: 400 }
    );
  }

  // ensure unique nombor waran
  const dup = await db.waranPeruntukan.findUnique({ where: { nomborWaran } });
  if (dup) {
    return NextResponse.json(
      { error: `Nombor waran ${nomborWaran} sudah wujud` },
      { status: 400 }
    );
  }

  const created = await db.waranPeruntukan.create({
    data: {
      nomborWaran,
      tahunKewangan: Number(tahunKewangan),
      bahagian,
      objekAm,
      jumlah: Number(jumlah),
      tarikhWaran: tarikhWaran ? new Date(tarikhWaran) : new Date(),
      dikeluarkanOleh: dikeluarkanOleh || "Kementerian Kewangan Malaysia (MOF)",
      status: status || "BerkuatKuasa",
      peruntukanOEId: peruntukanOEId || null,
      dikeluarkanKepadaId: dikeluarkanKepadaId || null,
    },
  });

  // auto-link to OE allocation: bump up siling if linked
  if (peruntukanOEId) {
    await db.peruntukanOE.update({
      where: { id: peruntukanOEId },
      data: { silingPeruntukan: { increment: Number(jumlah) } },
    });
  }

  return NextResponse.json({ data: created }, { status: 201 });
}
