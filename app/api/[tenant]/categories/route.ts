import { NextRequest, NextResponse } from 'next/server';
import { getCategories, createCategory } from '../../../../lib/notion';
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
    const categories = await getCategories(tenant);
    return NextResponse.json(categories, { headers: corsHeaders(req.headers.get('origin')) });
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
  const result = await createCategory(tenant, body);
  return NextResponse.json(result, { headers: corsHeaders(req.headers.get('origin')) });
}
