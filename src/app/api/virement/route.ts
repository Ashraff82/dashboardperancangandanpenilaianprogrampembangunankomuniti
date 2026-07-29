import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/virement — list with filters
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tahunKewangan = searchParams.get("tahunKewangan");
  const bahagian = searchParams.get("bahagian");
  const status = searchParams.get("status");

  const where: any = {};
  if (tahunKewangan && tahunKewangan !== "all") where.tahunKewangan = Number(tahunKewangan);
  if (bahagian && bahagian !== "all") where.bahagian = bahagian;
  if (status && status !== "all") where.status = status;

  const virement = await db.virement.findMany({
    where,
    orderBy: [{ tarikhMohon: "desc" }],
  });

  const total = virement.reduce((s, v) => s + v.jumlah, 0);
  const byStatus: Record<string, { count: number; jumlah: number }> = {};
  for (const v of virement) {
    if (!byStatus[v.status]) byStatus[v.status] = { count: 0, jumlah: 0 };
    byStatus[v.status].count += 1;
    byStatus[v.status].jumlah += v.jumlah;
  }

  return NextResponse.json({ data: virement, total, byStatus });
}

// POST /api/virement — create new virement request (status default "Mohon")
export async function POST(req: Request) {
  const body = await req.json();
  const {
    nomborRujukan, tahunKewangan, bahagian, objekAmAsal, objekAmDestinasi,
    jumlah, justifikasi, dimohonOleh,
  } = body;

  if (!nomborRujukan || !tahunKewangan || !bahagian || !objekAmAsal || !objekAmDestinasi || !jumlah) {
    return NextResponse.json(
      { error: "Medan wajib tidak lengkap" },
      { status: 400 }
    );
  }

  // ensure unique rujukan
  const dup = await db.virement.findUnique({ where: { nomborRujukan } });
  if (dup) {
    return NextResponse.json(
      { error: `Nombor rujukan ${nomborRujukan} sudah wujud` },
      { status: 400 }
    );
  }

  const created = await db.virement.create({
    data: {
      nomborRujukan,
      tahunKewangan: Number(tahunKewangan),
      bahagian,
      objekAmAsal,
      objekAmDestinasi,
      jumlah: Number(jumlah),
      justifikasi: justifikasi || "",
      dimohonOleh: dimohonOleh || "Pengurus Program",
      status: "Mohon",
    },
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
