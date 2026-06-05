import { NextRequest, NextResponse } from 'next/server';
import { getHorarios, createHorario } from '../../../../lib/notion';
import { corsHeaders, options as corsOptions } from '../../../../lib/cors';

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  const { tenant } = await params;
  try {
    const horarios = await getHorarios(tenant);
    return NextResponse.json(horarios, { headers: corsHeaders(req.headers.get('origin')) });
  } catch {
    return NextResponse.json([], { status: 200, headers: corsHeaders(req.headers.get('origin')) });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  const { tenant } = await params;
  const body = await req.json();
  const result = await createHorario(tenant, body);
  return NextResponse.json(result, { headers: corsHeaders(req.headers.get('origin')) });
}
