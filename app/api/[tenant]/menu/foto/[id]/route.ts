import { NextRequest, NextResponse } from 'next/server';
import { getMenuItemFotoUrl } from '../../../../../../lib/notion';

export const dynamic = 'force-dynamic';

// Stable, CDN-cacheable URL for a menu item photo. Notion's own file URLs are
// signed and rotate on every read, which defeats any image cache; this route
// gives the optimizer/CDN a fixed key while re-resolving the signature server-side.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> },
) {
  const { tenant, id } = await params;
  const url = await getMenuItemFotoUrl(tenant, id);
  if (!url) return new NextResponse(null, { status: 404 });

  const img = await fetch(url, { cache: 'no-store' });
  if (!img.ok) return new NextResponse(null, { status: 502 });

  return new NextResponse(img.body, {
    headers: {
      'Content-Type':  img.headers.get('content-type') ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
