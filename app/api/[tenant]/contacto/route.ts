import { NextRequest, NextResponse } from 'next/server';
import { getTenantContacto, updateTenantContacto } from '../../../../lib/notion';
import { corsHeaders, options as corsOptions } from '../../../../lib/cors';

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  try {
    const data = await getTenantContacto(tenant);
    return NextResponse.json(data ?? {}, { headers: corsHeaders(req.headers.get('origin')) });
  } catch {
    return NextResponse.json({}, { status: 500, headers: corsHeaders(req.headers.get('origin')) });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const body = await req.json();
  await updateTenantContacto(tenant, body);
  return NextResponse.json({ ok: true }, { headers: corsHeaders(req.headers.get('origin')) });
}
