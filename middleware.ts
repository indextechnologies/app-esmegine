import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'https://demo-bompain.vercel.app',
  'https://app.indexte.com',
  'http://localhost:3000',
];

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: { 'Access-Control-Allow-Origin': allowedOrigin, ...CORS_HEADERS },
    });
  }

  const res = NextResponse.next();
  res.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export const config = { matcher: '/api/:path*' };
