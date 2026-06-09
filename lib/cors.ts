import { NextResponse } from 'next/server';

const ALLOWED = [
  'https://bompain.indexte.com',
  'https://www.bompain.indexte.com',
  'https://demo-bompain.vercel.app',
  'https://kobsrestoran.indexte.com',
  'https://fkn-finger.indexte.com',
  'https://app.indexte.cloud',
  'https://app-esmegine.vercel.app',
  'http://localhost:3000',
];

export function corsHeaders(origin: string | null) {
  const allowed = ALLOWED.includes(origin ?? '') ? (origin as string) : ALLOWED[0];
  return {
    'Access-Control-Allow-Origin':  allowed,
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export function options(req: Request) {
  const origin = req.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}
