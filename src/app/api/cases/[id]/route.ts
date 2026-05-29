import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCase, softDeleteCase, updateCase } from "@/lib/cases";
import { caseUpdateSchema } from "@/lib/validators";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const item = await getCase(id);

  if (!item) {
    return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ case: item });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const payload = caseUpdateSchema.parse(await request.json());
    const item = await updateCase(id, payload);

    if (!item) {
      return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ case: item });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Datos invalidos" }, { status: 400 });
    }

    return NextResponse.json({ error: "No se pudo actualizar el caso" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const actor = request.nextUrl.searchParams.get("actor");
  const item = await softDeleteCase(id, actor);

  if (!item) {
    return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
