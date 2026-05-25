import { NextRequest, NextResponse } from 'next/server';
import { updateReservationStatus } from '../../../../../lib/notion';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { estado } = await req.json();
  const result = await updateReservationStatus(id, estado);
  return NextResponse.json(result);
}
