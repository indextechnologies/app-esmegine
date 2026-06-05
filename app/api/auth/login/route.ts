import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '../../../../lib/notion';

export async function POST(req: NextRequest) {
  try {
    const { usuario, pin } = await req.json().catch(() => ({ usuario: '', pin: '' }));
    const user = await verifyUser(String(usuario ?? ''), String(pin ?? ''));
    if (!user) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    return NextResponse.json({ ok: true, ...user });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
