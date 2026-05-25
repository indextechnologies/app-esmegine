import { NextRequest, NextResponse } from 'next/server';
import { getReservations, createReservation } from '../../../../lib/notion';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  const { tenant } = await params;
  const reservas = await getReservations(tenant);
  return NextResponse.json(reservas);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  const { tenant } = await params;
  const body = await req.json();
  const result = await createReservation(tenant, body);
  return NextResponse.json(result);
}
