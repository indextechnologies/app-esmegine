import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToNotion } from '../../../../../lib/notion';
import { corsHeaders, options as corsOptions } from '../../../../../lib/cors';

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

// Receives a multipart image (camera/gallery) and uploads it to Notion,
// returning a file_upload id to attach to a menu item's "Foto" property.
export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  const form = await req.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'no file' }, { status: 400, headers: corsHeaders(origin) });
  }
  const bytes = await file.arrayBuffer();
  const id = await uploadFileToNotion(
    bytes,
    file.name || 'foto.jpg',
    file.type || 'image/jpeg',
  );
  return NextResponse.json({ fileUploadId: id, filename: file.name || 'foto.jpg' }, { headers: corsHeaders(origin) });
}
