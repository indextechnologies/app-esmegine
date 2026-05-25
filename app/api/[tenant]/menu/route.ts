import { NextRequest, NextResponse } from 'next/server';
import { getMenuItems, getCategories, createMenuItem } from '../../../../lib/notion';
import { corsHeaders, options as corsOptions } from '../../../../lib/cors';

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  const { tenant } = await params;
  const [items, categories] = await Promise.all([
    getMenuItems(tenant),
    getCategories(tenant),
  ]);
  return NextResponse.json(
    { items, categories },
    { headers: corsHeaders(req.headers.get('origin')) },
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  const { tenant } = await params;
  const body = await req.json();
  const item = await createMenuItem(tenant, body);
  return NextResponse.json(item, { headers: corsHeaders(req.headers.get('origin')) });
}
