import { NextRequest, NextResponse } from 'next/server';
import { updateUserPin } from '../../../../lib/notion';
import { corsHeaders, options as corsOptions } from '../../../../lib/cors';

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const { currentPin, newPin } = await req.json();
  const result = await updateUserPin(tenant, currentPin, newPin);
  const status = result.ok ? 200 : 400;
  return NextResponse.json(result, { status, headers: corsHeaders(req.headers.get('origin')) });
}
