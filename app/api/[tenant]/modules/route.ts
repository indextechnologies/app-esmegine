import { NextRequest, NextResponse } from 'next/server';
import { setTenantModules } from '../../../../lib/notion';

export const dynamic = 'force-dynamic';

// PUT { keys: string[] } → overwrites the tenant's enabled modules. Admin-only (same-origin).
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  const { tenant } = await params;
  try {
    const body = await req.json();
    const keys = Array.isArray(body?.keys) ? body.keys.filter((k: unknown) => typeof k === 'string') : [];
    const applied = await setTenantModules(tenant, keys);
    return NextResponse.json({ ok: true, keys: applied });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
