import { NextResponse } from 'next/server';
import { getClients } from '../../../lib/notion';

export async function GET() {
  try {
    const clients = await getClients();
    return NextResponse.json(clients, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
