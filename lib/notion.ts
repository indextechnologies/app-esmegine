const NOTION_VERSION = '2022-06-28';

const DB = {
  menu:       'f969629d-8e8c-41c7-bbb9-e16ed6160ea4',
  categories: '1b2a0b1e-6263-4f4d-b485-95bce0ddfb84',
  reservas:   'cf9602fd-2c75-4aa7-84d8-2d68a13ea130',
  tenants:    'e2572655-0b8f-49d4-8ba1-7ffb16d9500e',
};

// slug → Notion page ID for tenant record
const TENANT_PAGE: Record<string, string> = {
  'bom-pain': '36b1d5510e648197bc24e487ebaa79a5',
};

function notionHeaders() {
  return {
    Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };
}

async function queryDB(dbId: string, filter?: object, sorts?: object[]) {
  const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
    method: 'POST',
    headers: notionHeaders(),
    body: JSON.stringify({ filter, sorts, page_size: 100 }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Notion query failed: ${res.status}`);
  const data = await res.json();
  return data.results ?? [];
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
  imagenUrl: string | null;
  alergenos: string[];
};

export type NotionCategory = {
  id: string;
  nombre: string;
  icono: string;
  orden: number;
  activo: boolean;
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
  const tenantId = TENANT_PAGE[tenant];
  if (!tenantId) return [];
  const rows = await queryDB(
    DB.menu,
    { property: 'Tenant', relation: { contains: tenantId } },
    [{ property: 'Orden', direction: 'ascending' }],
  );
  return rows.map((p: any) => ({
    id: p.id,
    nombre:      p.properties['Nombre']?.title?.[0]?.plain_text ?? '',
    descripcion: p.properties['Descripción']?.rich_text?.[0]?.plain_text ?? '',
    precio:      p.properties['Precio']?.number ?? 0,
    orden:       p.properties['Orden']?.number ?? 0,
    activo:      p.properties['Activo']?.checkbox ?? false,
    destacado:   p.properties['Destacado']?.checkbox ?? false,
    platoDelDia: p.properties['Plato del Día']?.checkbox ?? false,
    categoriaId: p.properties['Categoría']?.relation?.[0]?.id ?? null,
    imagenUrl:   p.properties['Imagen URL']?.url ?? null,
    alergenos:   p.properties['Alérgenos']?.multi_select?.map((a: any) => a.name) ?? [],
  }));
}

export async function getCategories(tenant: string): Promise<NotionCategory[]> {
  const tenantId = TENANT_PAGE[tenant];
  if (!tenantId) return [];
  const rows = await queryDB(
    DB.categories,
    { property: 'Tenant', relation: { contains: tenantId } },
    [{ property: 'Orden', direction: 'ascending' }],
  );
  return rows.map((p: any) => ({
    id:     p.id,
    nombre: p.properties['Nombre']?.title?.[0]?.plain_text ?? '',
    icono:  p.properties['Ícono']?.rich_text?.[0]?.plain_text ?? '🍽️',
    orden:  p.properties['Orden']?.number ?? 0,
    activo: p.properties['Activo']?.checkbox ?? false,
  }));
}

export async function updateMenuItem(pageId: string, fields: Partial<{
  nombre: string; descripcion: string; precio: number;
  activo: boolean; destacado: boolean; platoDelDia: boolean; imagenUrl: string;
}>) {
  const props: Record<string, unknown> = {};
  if (fields.nombre      !== undefined) props['Nombre']       = { title: [{ text: { content: fields.nombre } }] };
  if (fields.descripcion !== undefined) props['Descripción']  = { rich_text: [{ text: { content: fields.descripcion } }] };
  if (fields.precio      !== undefined) props['Precio']       = { number: fields.precio };
  if (fields.activo      !== undefined) props['Activo']       = { checkbox: fields.activo };
  if (fields.destacado   !== undefined) props['Destacado']    = { checkbox: fields.destacado };
  if (fields.platoDelDia !== undefined) props['Plato del Día'] = { checkbox: fields.platoDelDia };
  if (fields.imagenUrl   !== undefined) props['Imagen URL']   = { url: fields.imagenUrl || null };
  return patchPage(pageId, props);
}

export async function createMenuItem(tenant: string, data: {
  nombre: string; descripcion: string; precio: number; categoriaId: string;
}) {
  const tenantId = TENANT_PAGE[tenant];
  if (!tenantId) throw new Error('Unknown tenant');
  return createPage(DB.menu, {
    'Nombre':       { title: [{ text: { content: data.nombre } }] },
    'Descripción':  { rich_text: [{ text: { content: data.descripcion } }] },
    'Precio':       { number: data.precio },
    'Activo':       { checkbox: true },
    'Destacado':    { checkbox: false },
    'Plato del Día': { checkbox: false },
    'Categoría':    { relation: [{ id: data.categoriaId }] },
    'Tenant':       { relation: [{ id: tenantId }] },
  });
}

export async function deleteMenuItem(pageId: string) {
  return archivePage(pageId);
}

// ─── Reservations ────────────────────────────────────────────────────────────

export async function getReservations(tenant: string): Promise<NotionReservation[]> {
  const tenantId = TENANT_PAGE[tenant];
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
  const tenantId = TENANT_PAGE[tenant];
  if (!tenantId) throw new Error('Unknown tenant');
  return createPage(DB.reservas, {
    'Resumen':       { title: [{ text: { content: `Reserva — ${data.nombre}` } }] },
    'Nombre Cliente': { rich_text: [{ text: { content: data.nombre } }] },
    'Email':         { email: data.email },
    'Teléfono':      { phone_number: data.telefono },
    'Estado':        { select: { name: 'Pendiente' } },
    'Fecha y Hora':  { date: { start: `${data.fecha}T${data.hora}:00`, is_datetime: true } },
    'Notas':         { rich_text: [{ text: { content: data.notas ?? '' } }] },
    'Tenant':        { relation: [{ id: tenantId }] },
  });
}
