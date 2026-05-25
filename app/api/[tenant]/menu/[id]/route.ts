import { NextRequest, NextResponse } from 'next/server';
import { updateMenuItem, deleteMenuItem } from '../../../../../lib/notion';
import { corsHeaders, options as corsOptions } from '../../../../../lib/cors';

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const result = await updateMenuItem(id, body);
  return NextResponse.json(result, { headers: corsHeaders(req.headers.get('origin')) });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await deleteMenuItem(id);
  return NextResponse.json({ ok: true }, { headers: corsHeaders(req.headers.get('origin')) });
}
