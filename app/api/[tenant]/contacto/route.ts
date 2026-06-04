import { NextRequest, NextResponse } from 'next/server';
import { updateTenantContacto } from '../../../../lib/notion';
import { corsHeaders, options as corsOptions } from '../../../../lib/cors';

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const body = await req.json();
  await updateTenantContacto(tenant, body);
  return NextResponse.json({ ok: true }, { headers: corsHeaders(req.headers.get('origin')) });
}
