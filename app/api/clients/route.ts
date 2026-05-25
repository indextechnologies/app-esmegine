import { NextResponse } from 'next/server';
import { getClients } from '../../../lib/notion';

export async function GET() {
  const clients = await getClients();
  return NextResponse.json(clients, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}
