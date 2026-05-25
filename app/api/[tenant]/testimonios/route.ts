import { NextRequest, NextResponse } from 'next/server';
import { getTestimonios, getTestimoniosAll, createTestimonio } from '../../../../lib/notion';
import { corsHeaders, options as corsOptions } from '../../../../lib/cors';

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  const { tenant } = await params;
  const url = new URL(req.url);
  const all = url.searchParams.get('activo') === 'all';
  const items = all ? await getTestimoniosAll(tenant) : await getTestimonios(tenant);
  return NextResponse.json(items, { headers: corsHeaders(req.headers.get('origin')) });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  const { tenant } = await params;
  const body = await req.json();
  const result = await createTestimonio(tenant, body);
  return NextResponse.json(result, { headers: corsHeaders(req.headers.get('origin')) });
}
