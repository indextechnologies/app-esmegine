import { NextRequest, NextResponse } from 'next/server';
import { getMenuItems, getCategories, createMenuItem } from '../../../../lib/notion';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  const { tenant } = await params;
  const [items, categories] = await Promise.all([
    getMenuItems(tenant),
    getCategories(tenant),
  ]);
  return NextResponse.json({ items, categories });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  const { tenant } = await params;
  const body = await req.json();
  const item = await createMenuItem(tenant, body);
  return NextResponse.json(item);
}
