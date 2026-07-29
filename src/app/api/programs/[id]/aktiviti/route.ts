import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/programs/[id]/aktiviti — list aktiviti for a program (for Gantt chart)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const aktiviti = await db.aktiviti.findMany({
    where: { programId: id },
    orderBy: { tarikhMula: "asc" },
  });
  return NextResponse.json({ data: aktiviti });
}
