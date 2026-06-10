import { NextResponse } from 'next/server';
import { getModules } from '../../../lib/notion';

export const dynamic = 'force-dynamic';

// Catálogo de módulos disponibles en el portal (solo los globalmente activos).
export async function GET() {
  try {
    const modules = (await getModules()).filter(m => m.activoGlobal);
    return NextResponse.json(modules, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
