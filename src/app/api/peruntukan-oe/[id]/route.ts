import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { oeStatusFromPercent } from "@/lib/domain";

type Ctx = { params: Promise<{ id: string }> };

// PUT /api/peruntukan-oe/[id] — update dibelanjakan/komited and recompute
export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json();

  const existing = await db.peruntukanOE.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Peruntukan OE tidak dijumpai" }, { status: 404 });
  }

  const jumlahDibelanjakan =
    body.jumlahDibelanjakan !== undefined ? Number(body.jumlahDibelanjakan) : existing.jumlahDibelanjakan;
  const jumlahKomited =
    body.jumlahKomited !== undefined ? Number(body.jumlahKomited) : existing.jumlahKomited;
  const silingPeruntukan =
    body.silingPeruntukan !== undefined ? Number(body.silingPeruntukan) : existing.silingPeruntukan;

  const baki = silingPeruntukan - jumlahDibelanjakan - jumlahKomited;
  const peratus = silingPeruntukan > 0
    ? ((jumlahDibelanjakan + jumlahKomited) / silingPeruntukan) * 100
    : 0;
  const statusPenggunaan = oeStatusFromPercent(peratus);

  // pick first pengguna as editor if not provided
  let editorId = body.kemaskiniOlehId;
  if (!editorId) {
    const editor = await db.pengguna.findFirst();
    editorId = editor?.id;
  }

  const updated = await db.peruntukanOE.update({
    where: { id },
    data: {
      jumlahDibelanjakan,
      jumlahKomited,
      silingPeruntukan,
      bakiPeruntukan: baki,
      peratusPenggunaan: peratus,
      statusPenggunaan,
      kemaskiniOlehId: editorId || null,
    },
  });

  if (editorId) {
    await db.auditLog.create({
      data: {
        penggunaId: editorId,
        modul: "Bajet",
        aksi: "Kemaskini",
        entiti: "PeruntukanOE",
        entitiId: id,
        butiran: `Kemaskini OE ${existing.bahagian}/${existing.objekAm}: belanjawan RM${jumlahDibelanjakan}, komited RM${jumlahKomited} (${peratus.toFixed(1)}%)`,
      },
    });
  }

  return NextResponse.json({ data: updated });
}
