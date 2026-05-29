import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createCase, listCases } from "@/lib/cases";
import { caseCreateSchema, statusSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const statusParam = searchParams.get("status");
  const q = searchParams.get("q")?.trim();
  const status = statusParam ? statusSchema.safeParse(statusParam) : null;

  if (statusParam && !status?.success) {
    return NextResponse.json({ error: "Estado invalido" }, { status: 400 });
  }

  const cases = await listCases({
    status: status?.success ? status.data : undefined,
    q: q || undefined
  });

  return NextResponse.json({ cases });
}

export async function POST(request: NextRequest) {
  try {
    const payload = caseCreateSchema.parse(await request.json());
    const item = await createCase(payload);

    return NextResponse.json({ case: item }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Datos invalidos" }, { status: 400 });
    }

    return NextResponse.json({ error: "No se pudo crear el caso" }, { status: 500 });
  }
}
