import { NextRequest, NextResponse } from 'next/server';
import { updateMenuItem, deleteMenuItem } from '../../../../../lib/notion';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const result = await updateMenuItem(id, body);
  return NextResponse.json(result);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await deleteMenuItem(id);
  return NextResponse.json({ ok: true });
}
