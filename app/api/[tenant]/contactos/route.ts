import { NextRequest, NextResponse } from 'next/server';
import { getContactos, createContacto } from '../../../../lib/notion';
import { corsHeaders, options as corsOptions } from '../../../../lib/cors';

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  try {
    const data = await getContactos(tenant);
    return NextResponse.json(data, { headers: corsHeaders(req.headers.get('origin')) });
  } catch {
    return NextResponse.json([], { status: 200, headers: corsHeaders(req.headers.get('origin')) });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const body = await req.json();
  const result = await createContacto(tenant, body);
  return NextResponse.json(result, { headers: corsHeaders(req.headers.get('origin')) });
}
