import { NextRequest, NextResponse } from 'next/server';
import { updateReservationStatus } from '../../../../../lib/notion';
import { corsHeaders, options as corsOptions } from '../../../../../lib/cors';

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { estado } = await req.json();
  const result = await updateReservationStatus(id, estado);
  return NextResponse.json(result, { headers: corsHeaders(req.headers.get('origin')) });
}
