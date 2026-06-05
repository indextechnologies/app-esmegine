const NOTION_VERSION = '2022-06-28';

const DB = {
  menu:           'bfcd74dc-ee82-484c-bc51-5156462166d6',
  categories:     'a2c5a8c9-9d48-4274-8a6e-b7b9b557a759',
  subcategories:  '36c1d551-0e64-81bd-95e7-e78eb9c76326',
  reservas:       'a35bfc4f-7cd6-41cd-a264-5315d75a03d0',
  tenants:        'c52d2d58-6f3a-463a-b347-dc5dda3f0e9b',
  horarios:       '80246a64-2a6d-4de7-a85f-692a3faca333',
  galeria:        'ed962b28-575f-4fc3-b69d-d1640b43d97a',
  testimonios:    'ac829574-7508-4a95-9308-5281ef11e95b',
  promociones:    '6558132f-a2cd-4b74-b4c0-695ff0899ac6',
  instagram:      'bc4310ab-cb12-4b6d-9f2f-f500005d7288',
  usuarios:       '21a4d81c-8f15-49ec-a291-9743ad436628',
  contactos:      '402974b8-c2cd-4203-a623-2c1b753c68f2',
};

// ─── Tenant cache (populated lazily from Notion) ────────────────────────────

let _tenantCache: Map<string, string> | null = null;

async function loadTenantCache(): Promise<Map<string, string>> {
  if (_tenantCache) return _tenantCache;
  const rows = await queryDB(DB.tenants, undefined, []);
  const map = new Map<string, string>();
  for (const p of rows) {
    const slug = p.properties['Slug']?.rich_text?.[0]?.plain_text ?? '';
    if (slug) map.set(slug, p.id.replace(/-/g, ''));
  }
  _tenantCache = map;
  return map;
}

async function getTenantPageId(slug: string): Promise<string | null> {
  const cache = await loadTenantCache();
  return cache.get(slug) ?? null;
}

async function getSlugByPageId(pageId: string): Promise<string | null> {
  const cache = await loadTenantCache();
  const norm = pageId.replace(/-/g, '');
  for (const [slug, id] of cache) if (id === norm) return slug;
  return null;
}

// ─── Auth (users live in the Notion "Usuarios del Sistema" DB) ───────────────

export type AuthUser = {
  display: string;
  role:    'admin' | 'client';
  tenant:  string | null;
  dest:    string;
};

export async function verifyUser(usuario: string, pin: string): Promise<AuthUser | null> {
  const key = usuario.trim().toLowerCase();
  if (!key || !pin) return null;
  const rows = await queryDB(DB.usuarios, {
    and: [
      { property: 'Usuario', rich_text: { equals: key } },
      { property: 'Activo',  checkbox:  { equals: true } },
    ],
  });
  const row = rows[0];
  if (!row) return null;
  const realPin = row.properties['PIN']?.rich_text?.[0]?.plain_text ?? '';
  if (realPin !== pin) return null;

  const display = row.properties['Nombre']?.title?.[0]?.plain_text ?? usuario;
  const isAdmin = row.properties['Rol']?.select?.name === 'Super Admin';
  const tenantRelId = row.properties['Tenant']?.relation?.[0]?.id ?? null;
  const tenant = tenantRelId ? await getSlugByPageId(tenantRelId) : null;
  const dest = isAdmin ? '/admin' : tenant ? `/${tenant}/dashboard` : '/admin';

  // Best-effort: stamp last access (don't fail login if it errors).
  patchPage(row.id, { 'Último Acceso': { date: { start: new Date().toISOString() } } }).catch(() => {});

  return { display, role: isAdmin ? 'admin' : 'client', tenant, dest };
}

// ─── Client type & getClients ────────────────────────────────────────────────

export type NotionClient = {
  id:        string;
  slug:      string;
  name:      string;
  industry:  string;
  emoji:     string;
  color:     string;
  colorBg:   string;
  website:   string;
  phone:     string;
  email:     string;
  address:   string;
  instagram: string;
  plan:      string;
  active:    boolean;
  since:     string;
};

const EMOJI_MAP: Record<string, string> = {
  cafe: '☕', cafeteria: '☕', barbershop: '✂️', bar: '🍸',
  rooftop: '🌆', heladeria: '🍦', restaurante: '🍽️', salon: '💇',
  tienda: '🛍️', boutique: '👗',
};
function industryEmoji(industry: string) {
  const key = (industry ?? '').toLowerCase().split(/[\s·,/]+/)[0];
  return EMOJI_MAP[key] ?? '🏪';
}
function hexToRgba(hex: string, a: number) {
  const c = hex.replace('#', '');
  return `rgba(${parseInt(c.slice(0,2),16)},${parseInt(c.slice(2,4),16)},${parseInt(c.slice(4,6),16)},${a})`;
}
// First URL from a Notion "Files & media" property (handles uploaded + external files).
// Note: Notion-hosted file URLs are signed and expire (~1h); only safe with no-store reads.
function notionFileUrl(prop: any): string | null {
  const f = prop?.files?.[0];
  if (!f) return null;
  return f.type === 'external' ? (f.external?.url ?? null) : (f.file?.url ?? null);
}

export async function getClients(): Promise<NotionClient[]> {
  const rows = await queryDB(DB.tenants, undefined, [{ property: 'Nombre', direction: 'ascending' }]);
  return rows.map((p: any) => {
    const color    = p.properties['Color Principal']?.rich_text?.[0]?.plain_text ?? '#6366f1';
    const industry = p.properties['Industria']?.select?.name ?? '';
    return {
      id:        p.id.replace(/-/g, ''),
      slug:      p.properties['Slug']?.rich_text?.[0]?.plain_text ?? '',
      name:      p.properties['Nombre']?.title?.[0]?.plain_text ?? '',
      industry,
      emoji:     industryEmoji(industry),
      color,
      colorBg:   hexToRgba(color, 0.14),
      website:   p.properties['URL Website']?.url ?? '',
      phone:     p.properties['Teléfono']?.phone_number ?? '',
      email:     p.properties['Email']?.email ?? '',
      address:   p.properties['Dirección']?.rich_text?.[0]?.plain_text ?? '',
      instagram: p.properties['Instagram']?.rich_text?.[0]?.plain_text ?? '',
      plan:      'Standard',
      active:    p.properties['Estado']?.select?.name === 'activo',
      since:     (p.properties['Desde']?.date?.start ?? '').slice(0, 7),
    };
  });
}

function notionHeaders() {
  return {
    Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };
}

async function fetchWithTimeout(url: string, options: RequestInit, ms = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

async function queryDB(dbId: string, filter?: object, sorts?: object[]) {
  const all: any[] = [];
  let cursor: string | undefined;
  do {
    const res = await fetchWithTimeout(
      `https://api.notion.com/v1/databases/${dbId}/query`,
      {
        method: 'POST',
        headers: notionHeaders(),
        body: JSON.stringify({ filter, sorts, page_size: 100, start_cursor: cursor }),
        cache: 'no-store',
      },
    );
    if (!res.ok) throw new Error(`Notion query failed: ${res.status}`);
    const data = await res.json();
    all.push(...(data.results ?? []));
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return all;
}

async function patchPage(pageId: string, properties: object) {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: notionHeaders(),
    body: JSON.stringify({ properties }),
  });
  if (!res.ok) throw new Error(`Notion patch failed: ${res.status}`);
  return res.json();
}

async function createPage(dbId: string, properties: object) {
  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: notionHeaders(),
    body: JSON.stringify({ parent: { database_id: dbId }, properties }),
  });
  if (!res.ok) throw new Error(`Notion create failed: ${res.status}`);
  return res.json();
}

// Upload a file to Notion (Direct Upload API) and return the file_upload id,
// which can be attached to a "Files & media" property via { type:'file_upload' }.
export async function uploadFileToNotion(
  bytes: ArrayBuffer, filename: string, contentType: string,
): Promise<string> {
  const createRes = await fetch('https://api.notion.com/v1/file_uploads', {
    method: 'POST', headers: notionHeaders(), body: JSON.stringify({}),
  });
  if (!createRes.ok) throw new Error(`Notion file_upload create failed: ${createRes.status}`);
  const { id, upload_url } = await createRes.json();

  const form = new FormData();
  form.append('file', new Blob([bytes], { type: contentType }), filename);
  const sendRes = await fetch(upload_url, {
    method: 'POST',
    // No Content-Type: let fetch set the multipart boundary.
    headers: { Authorization: `Bearer ${process.env.NOTION_TOKEN}`, 'Notion-Version': NOTION_VERSION },
    body: form,
  });
  if (!sendRes.ok) throw new Error(`Notion file send failed: ${sendRes.status}`);
  return id;
}

function fotoProp(fotoUploadId: string, filename = 'foto.jpg') {
  return { files: [{ type: 'file_upload', file_upload: { id: fotoUploadId }, name: filename }] };
}

async function archivePage(pageId: string) {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: notionHeaders(),
    body: JSON.stringify({ archived: true }),
  });
  if (!res.ok) throw new Error(`Notion archive failed: ${res.status}`);
  return res.json();
}

// ─── Types ──────────────────────────────────────────────────────────────────

export type NotionMenuItem = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  orden: number;
  activo: boolean;
  destacado: boolean;
  platoDelDia: boolean;
  categoriaId: string | null;
  subcategoriaId: string | null;
  imagenUrl: string | null;
  alergenos: string[];
};

export type NotionSubCategory = {
  id: string;
  nombre: string;
  icono: string;
  orden: number;
  activo: boolean;
  categoriaId: string | null;
};

export type NotionCategory = {
  id: string;
  nombre: string;
  icono: string;
  orden: number;
  activo: boolean;
  modoVista: boolean; // true = mostrar imagen, false = mostrar icono
};

export type NotionReservation = {
  id: string;
  resumen: string;
  nombreCliente: string;
  email: string;
  telefono: string;
  estado: string;
  fecha: string;
  hora: string;
  notas: string;
};

// ─── Menu ────────────────────────────────────────────────────────────────────

export async function getMenuItems(tenant: string): Promise<NotionMenuItem[]> {
  const tenantId = await getTenantPageId(tenant);
  if (!tenantId) return [];
  const rows = await queryDB(
    DB.menu,
    { property: 'Tenant', relation: { contains: tenantId } },
    [{ property: 'Orden', direction: 'ascending' }],
  );
  return rows.map((p: any) => ({
    id: p.id,
    nombre:         p.properties['Nombre']?.title?.[0]?.plain_text ?? '',
    descripcion:    p.properties['Descripción']?.rich_text?.[0]?.plain_text ?? '',
    precio:         p.properties['Precio']?.number ?? 0,
    orden:          p.properties['Orden']?.number ?? 0,
    activo:         p.properties['Activo']?.checkbox ?? false,
    destacado:      p.properties['Destacado']?.checkbox ?? false,
    platoDelDia:    (p.properties['Plato del Día']?.checkbox ?? false) || (p.properties['Destacado']?.checkbox ?? false),
    categoriaId:    p.properties['Categoría']?.relation?.[0]?.id ?? null,
    subcategoriaId: p.properties['Subcategoria']?.relation?.[0]?.id ?? null,
    imagenUrl:      notionFileUrl(p.properties['Foto']) ?? p.properties['Imagen URL']?.url ?? null,
    alergenos:      p.properties['Alérgenos']?.multi_select?.map((a: any) => a.name) ?? [],
  }));
}

export async function getCategories(tenant: string): Promise<NotionCategory[]> {
  const tenantId = await getTenantPageId(tenant);
  if (!tenantId) return [];
  const rows = await queryDB(
    DB.categories,
    { property: 'Tenant', relation: { contains: tenantId } },
    [{ property: 'Orden', direction: 'ascending' }],
  );
  return rows.map((p: any) => ({
    id:        p.id,
    nombre:    p.properties['Nombre']?.title?.[0]?.plain_text ?? '',
    icono:     p.properties['Ícono']?.rich_text?.[0]?.plain_text ?? '🍽️',
    orden:     p.properties['Orden']?.number ?? 0,
    activo:    p.properties['Activo']?.checkbox ?? false,
    modoVista: p.properties['Modo Vista']?.checkbox ?? false,
  }));
}

export async function createCategory(tenant: string, data: {
  nombre: string; icono: string;
}) {
  const tenantId = await getTenantPageId(tenant);
  if (!tenantId) throw new Error('Unknown tenant');
  return createPage(DB.categories, {
    'Nombre': { title: [{ text: { content: data.nombre } }] },
    'Ícono':  { rich_text: [{ text: { content: data.icono } }] },
    'Activo': { checkbox: true },
    'Modo Vista': { checkbox: false },
    'Tenant': { relation: [{ id: tenantId }] },
  });
}

export async function updateCategory(pageId: string, fields: Partial<{
  nombre: string; icono: string; activo: boolean; modoVista: boolean;
}>) {
  const props: Record<string, unknown> = {};
  if (fields.nombre    !== undefined) props['Nombre']     = { title: [{ text: { content: fields.nombre } }] };
  if (fields.icono     !== undefined) props['Ícono']      = { rich_text: [{ text: { content: fields.icono } }] };
  if (fields.activo    !== undefined) props['Activo']     = { checkbox: fields.activo };
  if (fields.modoVista !== undefined) props['Modo Vista'] = { checkbox: fields.modoVista };
  return patchPage(pageId, props);
}

export async function deleteCategory(pageId: string) {
  return archivePage(pageId);
}

// ─── SubCategories ────────────────────────────────────────────────────────────

export async function getSubCategories(tenant: string): Promise<NotionSubCategory[]> {
  const tenantId = await getTenantPageId(tenant);
  if (!tenantId) return [];
  const rows = await queryDB(
    DB.subcategories,
    { property: 'Tenant', relation: { contains: tenantId } },
    [{ property: 'Orden', direction: 'ascending' }],
  );
  return rows.map((p: any) => ({
    id:          p.id,
    nombre:      p.properties['Nombre']?.title?.[0]?.plain_text ?? '',
    icono:       p.properties['Icono']?.rich_text?.[0]?.plain_text ?? '',
    orden:       p.properties['Orden']?.number ?? 0,
    activo:      p.properties['Activo']?.checkbox ?? false,
    categoriaId: p.properties['Categoria']?.relation?.[0]?.id ?? null,
  }));
}

export async function createSubCategory(tenant: string, data: {
  nombre: string; icono?: string; categoriaId: string; orden?: number;
}) {
  const tenantId = await getTenantPageId(tenant);
  if (!tenantId) throw new Error('Unknown tenant');
  return createPage(DB.subcategories, {
    'Nombre':   { title: [{ text: { content: data.nombre } }] },
    'Icono':    { rich_text: [{ text: { content: data.icono ?? '' } }] },
    'Activo':   { checkbox: true },
    'Orden':    { number: data.orden ?? 0 },
    'Categoria': { relation: [{ id: data.categoriaId }] },
    'Tenant':   { relation: [{ id: tenantId }] },
  });
}

export async function updateSubCategory(pageId: string, fields: Partial<{
  nombre: string; icono: string; activo: boolean; orden: number;
}>) {
  const props: Record<string, unknown> = {};
  if (fields.nombre  !== undefined) props['Nombre'] = { title: [{ text: { content: fields.nombre } }] };
  if (fields.icono   !== undefined) props['Icono']  = { rich_text: [{ text: { content: fields.icono } }] };
  if (fields.activo  !== undefined) props['Activo'] = { checkbox: fields.activo };
  if (fields.orden   !== undefined) props['Orden']  = { number: fields.orden };
  return patchPage(pageId, props);
}

export async function deleteSubCategory(pageId: string) {
  return archivePage(pageId);
}

export async function updateMenuItem(pageId: string, fields: Partial<{
  nombre: string; descripcion: string; precio: number;
  activo: boolean; destacado: boolean; platoDelDia: boolean; imagenUrl: string;
  subcategoriaId: string | null; fotoUploadId: string; fotoFilename: string;
}>) {
  const props: Record<string, unknown> = {};
  if (fields.nombre         !== undefined) props['Nombre']       = { title: [{ text: { content: fields.nombre } }] };
  if (fields.descripcion    !== undefined) props['Descripción']  = { rich_text: [{ text: { content: fields.descripcion } }] };
  if (fields.precio         !== undefined) props['Precio']       = { number: fields.precio };
  if (fields.activo         !== undefined) props['Activo']       = { checkbox: fields.activo };
  if (fields.destacado      !== undefined) props['Destacado']    = { checkbox: fields.destacado };
  if (fields.platoDelDia    !== undefined) props['Plato del Día'] = { checkbox: fields.platoDelDia };
  if (fields.imagenUrl      !== undefined) props['Imagen URL']   = { url: fields.imagenUrl || null };
  if (fields.fotoUploadId)                 props['Foto']         = fotoProp(fields.fotoUploadId, fields.fotoFilename);
  if (fields.subcategoriaId !== undefined) props['Subcategoria'] = fields.subcategoriaId
    ? { relation: [{ id: fields.subcategoriaId }] }
    : { relation: [] };
  return patchPage(pageId, props);
}

export async function createMenuItem(tenant: string, data: {
  nombre: string; descripcion: string; precio: number; categoriaId: string;
  subcategoriaId?: string | null; imagenUrl?: string | null;
  fotoUploadId?: string; fotoFilename?: string; destacado?: boolean;
}) {
  const tenantId = await getTenantPageId(tenant);
  if (!tenantId) throw new Error('Unknown tenant');
  const props: Record<string, unknown> = {
    'Nombre':        { title: [{ text: { content: data.nombre } }] },
    'Descripción':   { rich_text: [{ text: { content: data.descripcion } }] },
    'Precio':        { number: data.precio },
    'Activo':        { checkbox: true },
    'Destacado':     { checkbox: data.destacado ?? false },
    'Plato del Día': { checkbox: false },
    'Categoría':     { relation: [{ id: data.categoriaId }] },
    'Tenant':        { relation: [{ id: tenantId }] },
  };
  if (data.subcategoriaId) props['Subcategoria'] = { relation: [{ id: data.subcategoriaId }] };
  if (data.imagenUrl)      props['Imagen URL']   = { url: data.imagenUrl };
  if (data.fotoUploadId)   props['Foto']         = fotoProp(data.fotoUploadId, data.fotoFilename);
  return createPage(DB.menu, props);
}

export async function deleteMenuItem(pageId: string) {
  return archivePage(pageId);
}

// ─── Reservations ────────────────────────────────────────────────────────────

export async function getReservations(tenant: string): Promise<NotionReservation[]> {
  const tenantId = await getTenantPageId(tenant);
  if (!tenantId) return [];
  const rows = await queryDB(
    DB.reservas,
    { property: 'Tenant', relation: { contains: tenantId } },
    [{ property: 'Fecha y Hora', direction: 'descending' }],
  );
  return rows.map((p: any) => {
    const dateRaw = p.properties['Fecha y Hora']?.date?.start ?? '';
    const [fecha, timeRaw] = dateRaw.includes('T') ? dateRaw.split('T') : [dateRaw, '00:00'];
    return {
      id:            p.id,
      resumen:       p.properties['Resumen']?.title?.[0]?.plain_text ?? '',
      nombreCliente: p.properties['Nombre Cliente']?.rich_text?.[0]?.plain_text ?? '',
      email:         p.properties['Email']?.email ?? '',
      telefono:      p.properties['Teléfono']?.phone_number ?? '',
      estado:        p.properties['Estado']?.select?.name ?? 'Pendiente',
      fecha,
      hora:          (timeRaw ?? '').substring(0, 5),
      notas:         p.properties['Notas']?.rich_text?.[0]?.plain_text ?? '',
    };
  });
}

export async function updateReservationStatus(pageId: string, estado: string) {
  return patchPage(pageId, { 'Estado': { select: { name: estado } } });
}

export async function createReservation(tenant: string, data: {
  nombre: string; email: string; telefono: string;
  fecha: string; hora: string; notas?: string;
}) {
  const tenantId = await getTenantPageId(tenant);
  if (!tenantId) throw new Error('Unknown tenant');
  return createPage(DB.reservas, {
    'Resumen':        { title: [{ text: { content: `Reserva — ${data.nombre}` } }] },
    'Nombre Cliente': { rich_text: [{ text: { content: data.nombre } }] },
    'Email':          { email: data.email || null },
    'Teléfono':       { phone_number: data.telefono || null },
    'Estado':         { select: { name: 'Pendiente' } },
    'Fecha y Hora':   { date: { start: `${data.fecha}T${data.hora}:00` } },
    'Notas':          { rich_text: [{ text: { content: data.notas ?? '' } }] },
    'Tenant':         { relation: [{ id: tenantId }] },
  });
}

// ─── Horarios ─────────────────────────────────────────────────────────────────

export type NotionHorario = {
  id: string;
  dia: string;
  horaApertura: string;
  horaCierre: string;
  cerrado: boolean;
  nota: string;
  orden: number;
};

export async function getHorarios(tenant: string): Promise<NotionHorario[]> {
  const tenantId = await getTenantPageId(tenant);
  if (!tenantId) return [];
  const rows = await queryDB(
    DB.horarios,
    { property: 'Tenant', relation: { contains: tenantId } },
    [{ property: 'Orden', direction: 'ascending' }],
  );
  return rows.map((p: any) => ({
    id:           p.id,
    dia:          p.properties['Día']?.title?.[0]?.plain_text ?? '',
    horaApertura: p.properties['Hora Apertura']?.rich_text?.[0]?.plain_text ?? '',
    horaCierre:   p.properties['Hora Cierre']?.rich_text?.[0]?.plain_text ?? '',
    cerrado:      p.properties['Cerrado']?.checkbox ?? false,
    nota:         p.properties['Nota']?.rich_text?.[0]?.plain_text ?? '',
    orden:        p.properties['Orden']?.number ?? 0,
  }));
}

export async function createHorario(tenant: string, data: {
  dia: string; horaApertura: string; horaCierre: string;
  cerrado?: boolean; nota?: string; orden?: number;
}) {
  const tenantId = await getTenantPageId(tenant);
  if (!tenantId) throw new Error('Unknown tenant');
  return createPage(DB.horarios, {
    'Día':           { title: [{ text: { content: data.dia } }] },
    'Hora Apertura': { rich_text: [{ text: { content: data.horaApertura } }] },
    'Hora Cierre':   { rich_text: [{ text: { content: data.horaCierre } }] },
    'Cerrado':       { checkbox: data.cerrado ?? false },
    'Nota':          { rich_text: [{ text: { content: data.nota ?? '' } }] },
    'Orden':         { number: data.orden ?? 0 },
    'Tenant':        { relation: [{ id: tenantId }] },
  });
}

export async function updateHorario(pageId: string, fields: Partial<{
  dia: string; horaApertura: string; horaCierre: string; cerrado: boolean; nota: string;
}>) {
  const props: Record<string, unknown> = {};
  if (fields.dia          !== undefined) props['Día']           = { title: [{ text: { content: fields.dia } }] };
  if (fields.horaApertura !== undefined) props['Hora Apertura'] = { rich_text: [{ text: { content: fields.horaApertura } }] };
  if (fields.horaCierre   !== undefined) props['Hora Cierre']   = { rich_text: [{ text: { content: fields.horaCierre } }] };
  if (fields.cerrado      !== undefined) props['Cerrado']       = { checkbox: fields.cerrado };
  if (fields.nota         !== undefined) props['Nota']          = { rich_text: [{ text: { content: fields.nota } }] };
  return patchPage(pageId, props);
}

export async function deleteHorario(pageId: string) {
  return archivePage(pageId);
}

// ─── Galería ──────────────────────────────────────────────────────────────────

export type NotionGaleriaItem = {
  id: string;
  titulo: string;
  urlImagen: string;
  altText: string;
  seccion: string;
  activo: boolean;
  orden: number;
};

export async function getGaleria(tenant: string): Promise<NotionGaleriaItem[]> {
  const tenantId = await getTenantPageId(tenant);
  if (!tenantId) return [];
  const rows = await queryDB(
    DB.galeria,
    { property: 'Tenant', relation: { contains: tenantId } },
    [{ property: 'Orden', direction: 'ascending' }],
  );
  return rows.map((p: any) => ({
    id:        p.id,
    titulo:    p.properties['Título']?.title?.[0]?.plain_text ?? '',
    urlImagen: p.properties['URL Imagen']?.url ?? '',
    altText:   p.properties['Alt Text']?.rich_text?.[0]?.plain_text ?? '',
    seccion:   p.properties['Sección']?.select?.name ?? 'Galería',
    activo:    p.properties['Activo']?.checkbox ?? false,
    orden:     p.properties['Orden']?.number ?? 0,
  }));
}

export async function createGaleriaItem(tenant: string, data: {
  titulo: string; urlImagen: string; altText?: string;
  seccion?: string; orden?: number;
}) {
  const tenantId = await getTenantPageId(tenant);
  if (!tenantId) throw new Error('Unknown tenant');
  return createPage(DB.galeria, {
    'Título':     { title: [{ text: { content: data.titulo } }] },
    'URL Imagen': { url: data.urlImagen || null },
    'Alt Text':   { rich_text: [{ text: { content: data.altText ?? '' } }] },
    'Sección':    { select: { name: data.seccion ?? 'Galería' } },
    'Activo':     { checkbox: true },
    'Orden':      { number: data.orden ?? 0 },
    'Tenant':     { relation: [{ id: tenantId }] },
  });
}

export async function updateGaleriaItem(pageId: string, fields: Partial<{
  titulo: string; urlImagen: string; altText: string;
  seccion: string; activo: boolean; orden: number;
}>) {
  const props: Record<string, unknown> = {};
  if (fields.titulo     !== undefined) props['Título']     = { title: [{ text: { content: fields.titulo } }] };
  if (fields.urlImagen  !== undefined) props['URL Imagen'] = { url: fields.urlImagen || null };
  if (fields.altText    !== undefined) props['Alt Text']   = { rich_text: [{ text: { content: fields.altText } }] };
  if (fields.seccion    !== undefined) props['Sección']    = { select: { name: fields.seccion } };
  if (fields.activo     !== undefined) props['Activo']     = { checkbox: fields.activo };
  if (fields.orden      !== undefined) props['Orden']      = { number: fields.orden };
  return patchPage(pageId, props);
}

export async function deleteGaleriaItem(pageId: string) {
  return archivePage(pageId);
}

// ─── Testimonios ──────────────────────────────────────────────────────────────

export type NotionTestimonio = {
  id: string;
  nombre: string;
  testimonio: string;
  calificacion: number;
  contexto: string;
  plataforma: string;
  activo: boolean;
};

export async function getTestimonios(tenant: string): Promise<NotionTestimonio[]> {
  const tenantId = await getTenantPageId(tenant);
  if (!tenantId) return [];
  const rows = await queryDB(
    DB.testimonios,
    {
      and: [
        { property: 'Tenant', relation: { contains: tenantId } },
        { property: 'Activo', checkbox: { equals: true } },
      ],
    },
  );
  return rows.map((p: any) => ({
    id:           p.id,
    nombre:       p.properties['Nombre']?.title?.[0]?.plain_text ?? '',
    testimonio:   p.properties['Testimonio']?.rich_text?.[0]?.plain_text ?? '',
    calificacion: p.properties['Calificación']?.number ?? 5,
    contexto:     p.properties['Cargo o contexto']?.rich_text?.[0]?.plain_text ?? '',
    plataforma:   p.properties['Plataforma']?.select?.name ?? 'Google',
    activo:       p.properties['Activo']?.checkbox ?? false,
  }));
}

export async function getTestimoniosAll(tenant: string): Promise<NotionTestimonio[]> {
  const tenantId = await getTenantPageId(tenant);
  if (!tenantId) return [];
  const rows = await queryDB(
    DB.testimonios,
    { property: 'Tenant', relation: { contains: tenantId } },
  );
  return rows.map((p: any) => ({
    id:           p.id,
    nombre:       p.properties['Nombre']?.title?.[0]?.plain_text ?? '',
    testimonio:   p.properties['Testimonio']?.rich_text?.[0]?.plain_text ?? '',
    calificacion: p.properties['Calificación']?.number ?? 5,
    contexto:     p.properties['Cargo o contexto']?.rich_text?.[0]?.plain_text ?? '',
    plataforma:   p.properties['Plataforma']?.select?.name ?? 'Google',
    activo:       p.properties['Activo']?.checkbox ?? false,
  }));
}

export async function createTestimonio(tenant: string, data: {
  nombre: string; testimonio: string; calificacion?: number;
  contexto?: string; plataforma?: string;
}) {
  const tenantId = await getTenantPageId(tenant);
  if (!tenantId) throw new Error('Unknown tenant');
  return createPage(DB.testimonios, {
    'Nombre':           { title: [{ text: { content: data.nombre } }] },
    'Testimonio':       { rich_text: [{ text: { content: data.testimonio } }] },
    'Calificación':     { number: data.calificacion ?? 5 },
    'Cargo o contexto': { rich_text: [{ text: { content: data.contexto ?? '' } }] },
    'Plataforma':       { select: { name: data.plataforma ?? 'Google' } },
    'Activo':           { checkbox: true },
    'Tenant':           { relation: [{ id: tenantId }] },
  });
}

export async function updateTestimonio(pageId: string, fields: Partial<{
  nombre: string; testimonio: string; calificacion: number;
  contexto: string; plataforma: string; activo: boolean;
}>) {
  const props: Record<string, unknown> = {};
  if (fields.nombre       !== undefined) props['Nombre']           = { title: [{ text: { content: fields.nombre } }] };
  if (fields.testimonio   !== undefined) props['Testimonio']       = { rich_text: [{ text: { content: fields.testimonio } }] };
  if (fields.calificacion !== undefined) props['Calificación']     = { number: fields.calificacion };
  if (fields.contexto     !== undefined) props['Cargo o contexto'] = { rich_text: [{ text: { content: fields.contexto } }] };
  if (fields.plataforma   !== undefined) props['Plataforma']       = { select: { name: fields.plataforma } };
  if (fields.activo       !== undefined) props['Activo']           = { checkbox: fields.activo };
  return patchPage(pageId, props);
}

export async function deleteTestimonio(pageId: string) {
  return archivePage(pageId);
}

// ─── Promociones ──────────────────────────────────────────────────────────────

export type NotionPromocion = {
  id: string;
  titulo: string;
  descripcion: string;
  descuento: number;
  tipo: string;
  imagenUrl: string;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
};

export async function getPromociones(tenant: string): Promise<NotionPromocion[]> {
  const tenantId = await getTenantPageId(tenant);
  if (!tenantId) return [];
  const rows = await queryDB(
    DB.promociones,
    { property: 'Tenant', relation: { contains: tenantId } },
  );
  return rows.map((p: any) => ({
    id:          p.id,
    titulo:      p.properties['Título']?.title?.[0]?.plain_text ?? '',
    descripcion: p.properties['Descripción']?.rich_text?.[0]?.plain_text ?? '',
    descuento:   p.properties['Descuento']?.number ?? 0,
    tipo:        p.properties['Tipo']?.select?.name ?? 'Especial',
    imagenUrl:   p.properties['Imagen URL']?.url ?? '',
    fechaInicio: p.properties['Fecha Inicio']?.date?.start ?? '',
    fechaFin:    p.properties['Fecha Fin']?.date?.start ?? '',
    activo:      p.properties['Activo']?.checkbox ?? false,
  }));
}

export async function createPromocion(tenant: string, data: {
  titulo: string; descripcion: string; descuento?: number;
  tipo?: string; imagenUrl?: string; fechaInicio?: string; fechaFin?: string;
}) {
  const tenantId = await getTenantPageId(tenant);
  if (!tenantId) throw new Error('Unknown tenant');
  return createPage(DB.promociones, {
    'Título':       { title: [{ text: { content: data.titulo } }] },
    'Descripción':  { rich_text: [{ text: { content: data.descripcion } }] },
    'Descuento':    { number: data.descuento ?? 0 },
    'Tipo':         { select: { name: data.tipo ?? 'Especial' } },
    'Imagen URL':   { url: data.imagenUrl || null },
    'Fecha Inicio': data.fechaInicio ? { date: { start: data.fechaInicio } } : { date: null },
    'Fecha Fin':    data.fechaFin    ? { date: { start: data.fechaFin    } } : { date: null },
    'Activo':       { checkbox: true },
    'Tenant':       { relation: [{ id: tenantId }] },
  });
}

export async function updatePromocion(pageId: string, fields: Partial<{
  titulo: string; descripcion: string; descuento: number;
  tipo: string; imagenUrl: string; fechaInicio: string; fechaFin: string; activo: boolean;
}>) {
  const props: Record<string, unknown> = {};
  if (fields.titulo       !== undefined) props['Título']       = { title: [{ text: { content: fields.titulo } }] };
  if (fields.descripcion  !== undefined) props['Descripción']  = { rich_text: [{ text: { content: fields.descripcion } }] };
  if (fields.descuento    !== undefined) props['Descuento']    = { number: fields.descuento };
  if (fields.tipo         !== undefined) props['Tipo']         = { select: { name: fields.tipo } };
  if (fields.imagenUrl    !== undefined) props['Imagen URL']   = { url: fields.imagenUrl || null };
  if (fields.fechaInicio  !== undefined) props['Fecha Inicio'] = fields.fechaInicio ? { date: { start: fields.fechaInicio } } : { date: null };
  if (fields.fechaFin     !== undefined) props['Fecha Fin']    = fields.fechaFin    ? { date: { start: fields.fechaFin    } } : { date: null };
  if (fields.activo       !== undefined) props['Activo']       = { checkbox: fields.activo };
  return patchPage(pageId, props);
}

export async function deletePromocion(pageId: string) {
  return archivePage(pageId);
}

// ─── Instagram Links ──────────────────────────────────────────────────────────

export type NotionInstagramLink = {
  id: string;
  titulo: string;
  urlPost: string;
  activo: boolean;
  orden: number;
  tipo: string;
};

export async function getInstagramLinks(tenant: string): Promise<NotionInstagramLink[]> {
  const tenantId = await getTenantPageId(tenant);
  if (!tenantId) return [];
  const rows = await queryDB(
    DB.instagram,
    { property: 'Tenant', relation: { contains: tenantId } },
    [{ property: 'Orden', direction: 'ascending' }],
  );
  return rows.map((p: any) => ({
    id:      p.id,
    titulo:  p.properties['Descripción']?.title?.[0]?.plain_text ?? '',
    urlPost: p.properties['Enlace']?.url ?? '',
    activo:  p.properties['Activo']?.checkbox ?? false,
    orden:   p.properties['Orden']?.number ?? 0,
    tipo:    p.properties['Tipo']?.select?.name ?? 'Post',
  }));
}

export async function createInstagramLink(tenant: string, data: {
  titulo: string; urlPost: string; orden?: number; tipo?: string;
}) {
  const tenantId = await getTenantPageId(tenant);
  if (!tenantId) throw new Error('Unknown tenant');
  return createPage(DB.instagram, {
    'Descripción': { title: [{ text: { content: data.titulo } }] },
    'Enlace':      { url: data.urlPost || null },
    'Activo':      { checkbox: true },
    'Orden':       { number: data.orden ?? 0 },
    'Tipo':        { select: { name: data.tipo ?? 'Post' } },
    'Tenant':      { relation: [{ id: tenantId }] },
  });
}

export async function updateInstagramLink(pageId: string, fields: Partial<{
  titulo: string; urlPost: string; activo: boolean; orden: number; tipo: string;
}>) {
  const props: Record<string, unknown> = {};
  if (fields.titulo  !== undefined) props['Descripción'] = { title: [{ text: { content: fields.titulo } }] };
  if (fields.urlPost !== undefined) props['Enlace']      = { url: fields.urlPost || null };
  if (fields.activo  !== undefined) props['Activo']      = { checkbox: fields.activo };
  if (fields.orden   !== undefined) props['Orden']       = { number: fields.orden };
  if (fields.tipo    !== undefined) props['Tipo']        = { select: { name: fields.tipo } };
  return patchPage(pageId, props);
}

export async function deleteInstagramLink(pageId: string) {
  return archivePage(pageId);
}

// ─── Contactos CRM ────────────────────────────────────────────────────────────

export type NotionContacto = {
  id:          string;
  nombre:      string;
  email:       string;
  telefono:    string;
  notas:       string;
  etiquetas:   string[];
  totalVisitas: number;
  ultimaVisita: string;
  primeraVisita: string;
};

export async function getContactos(tenant: string): Promise<NotionContacto[]> {
  const tenantId = await getTenantPageId(tenant);
  if (!tenantId) return [];
  const rows = await queryDB(
    DB.contactos,
    { property: 'Tenant', relation: { contains: tenantId } },
    [{ property: 'Última Visita', direction: 'descending' }],
  );
  return rows.map((p: any) => ({
    id:           p.id,
    nombre:       p.properties['Nombre']?.title?.[0]?.plain_text ?? '',
    email:        p.properties['Email']?.email ?? '',
    telefono:     p.properties['Teléfono']?.phone_number ?? '',
    notas:        p.properties['Notas']?.rich_text?.[0]?.plain_text ?? '',
    etiquetas:    (p.properties['Etiquetas']?.multi_select ?? []).map((e: any) => e.name),
    totalVisitas: p.properties['Total Visitas']?.number ?? 0,
    ultimaVisita: p.properties['Última Visita']?.date?.start ?? '',
    primeraVisita: p.properties['Primera Visita']?.date?.start ?? '',
  }));
}

export async function createContacto(tenant: string, data: {
  nombre: string; email?: string; telefono?: string;
  notas?: string; etiquetas?: string[];
}) {
  const tenantId = await getTenantPageId(tenant);
  if (!tenantId) throw new Error('Unknown tenant');
  return createPage(DB.contactos, {
    'Nombre':         { title: [{ text: { content: data.nombre } }] },
    'Email':          { email: data.email || null },
    'Teléfono':       { phone_number: data.telefono || null },
    'Notas':          { rich_text: [{ text: { content: data.notas ?? '' } }] },
    'Etiquetas':      { multi_select: (data.etiquetas ?? []).map(n => ({ name: n })) },
    'Total Visitas':  { number: 1 },
    'Primera Visita': { date: { start: new Date().toISOString().slice(0, 10) } },
    'Última Visita':  { date: { start: new Date().toISOString().slice(0, 10) } },
    'Tenant':         { relation: [{ id: tenantId }] },
  });
}

export async function updateContacto(pageId: string, fields: Partial<{
  nombre: string; email: string; telefono: string;
  notas: string; etiquetas: string[]; totalVisitas: number; ultimaVisita: string;
}>) {
  const props: Record<string, unknown> = {};
  if (fields.nombre       !== undefined) props['Nombre']        = { title: [{ text: { content: fields.nombre } }] };
  if (fields.email        !== undefined) props['Email']         = { email: fields.email || null };
  if (fields.telefono     !== undefined) props['Teléfono']      = { phone_number: fields.telefono || null };
  if (fields.notas        !== undefined) props['Notas']         = { rich_text: [{ text: { content: fields.notas } }] };
  if (fields.etiquetas    !== undefined) props['Etiquetas']     = { multi_select: fields.etiquetas.map(n => ({ name: n })) };
  if (fields.totalVisitas !== undefined) props['Total Visitas'] = { number: fields.totalVisitas };
  if (fields.ultimaVisita !== undefined) props['Última Visita'] = { date: { start: fields.ultimaVisita } };
  return patchPage(pageId, props);
}

export async function deleteContacto(pageId: string) {
  return archivePage(pageId);
}

// ─── Tenant contact read / update ────────────────────────────────────────────

export async function getTenantContacto(tenant: string) {
  const rows = await queryDB(DB.tenants, { property: 'Slug', rich_text: { equals: tenant } }, []);
  if (!rows.length) return null;
  const p = rows[0];
  return {
    nombre:    p.properties['Nombre']?.title?.[0]?.plain_text ?? '',
    telefono:  p.properties['Teléfono']?.phone_number ?? '',
    email:     p.properties['Email']?.email ?? '',
    direccion: p.properties['Dirección']?.rich_text?.[0]?.plain_text ?? '',
    instagram: p.properties['Instagram']?.rich_text?.[0]?.plain_text ?? '',
    website:   p.properties['URL Website']?.url ?? '',
  };
}

export async function updateTenantContacto(tenant: string, fields: Partial<{
  telefono: string; email: string; direccion: string; instagram: string; website: string;
}>) {
  const tenantId = await getTenantPageId(tenant);
  if (!tenantId) throw new Error('Unknown tenant');
  const props: Record<string, unknown> = {};
  if (fields.telefono  !== undefined) props['Teléfono']      = { phone_number: fields.telefono || null };
  if (fields.email     !== undefined) props['Email']         = { email: fields.email || null };
  if (fields.direccion !== undefined) props['Dirección']     = { rich_text: [{ text: { content: fields.direccion } }] };
  if (fields.instagram !== undefined) props['Instagram']     = { rich_text: [{ text: { content: fields.instagram } }] };
  if (fields.website   !== undefined) props['URL Website']   = { url: fields.website || null };
  return patchPage(tenantId, props);
}

// ─── PIN update ───────────────────────────────────────────────────────────────

export async function updateUserPin(tenant: string, currentPin: string, newPin: string): Promise<{ ok: boolean; error?: string }> {
  const rows = await queryDB(DB.usuarios, {
    and: [
      { property: 'Usuario', rich_text: { equals: tenant } },
      { property: 'Activo',  checkbox:  { equals: true } },
    ],
  });
  const row = rows[0];
  if (!row) return { ok: false, error: 'Usuario no encontrado' };
  const realPin = row.properties['PIN']?.rich_text?.[0]?.plain_text ?? '';
  if (realPin !== currentPin) return { ok: false, error: 'PIN actual incorrecto' };
  if (newPin.length < 4) return { ok: false, error: 'El PIN debe tener al menos 4 dígitos' };
  await patchPage(row.id, { 'PIN': { rich_text: [{ text: { content: newPin } }] } });
  return { ok: true };
}
