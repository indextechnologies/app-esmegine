import { NextRequest, NextResponse } from 'next/server';
import { getInstagramLinks, createInstagramLink } from '../../../../lib/notion';
import { corsHeaders, options as corsOptions } from '../../../../lib/cors';

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  const { tenant } = await params;
  const items = await getInstagramLinks(tenant);
  return NextResponse.json(items, { headers: corsHeaders(req.headers.get('origin')) });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  const { tenant } = await params;
  const body = await req.json();
  const result = await createInstagramLink(tenant, body);
  return NextResponse.json(result, { headers: corsHeaders(req.headers.get('origin')) });
}
