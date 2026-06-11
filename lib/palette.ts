// Paletas de acento por tenant. Se persisten en localStorage (por dispositivo)
// y se aplican como CSS custom properties: todo el vidrio se tiñe solo.

export type Palette = { id: string; name: string; c1: string; c2: string };

export const PALETTES: Palette[] = [
  { id: 'indigo',    name: 'Índigo',    c1: '#6366f1', c2: '#8b5cf6' },
  { id: 'esmeralda', name: 'Esmeralda', c1: '#10b981', c2: '#34d399' },
  { id: 'cielo',     name: 'Cielo',     c1: '#0ea5e9', c2: '#38bdf8' },
  { id: 'rosa',      name: 'Rosa',      c1: '#ec4899', c2: '#f472b6' },
  { id: 'ambar',     name: 'Ámbar',     c1: '#f59e0b', c2: '#fbbf24' },
  { id: 'grafito',   name: 'Grafito',   c1: '#94a3b8', c2: '#cbd5e1' },
];

const DEFAULT_ID = 'indigo';
const storageKey = (tenant: string) => `esm-palette-${tenant}`;

export function getPaletteId(tenant: string): string {
  if (typeof window === 'undefined') return DEFAULT_ID;
  return localStorage.getItem(storageKey(tenant)) ?? DEFAULT_ID;
}

export function applyPalette(tenant: string, id?: string) {
  const pal = PALETTES.find(p => p.id === (id ?? getPaletteId(tenant))) ?? PALETTES[0];
  const root = document.documentElement;
  root.style.setProperty('--accent-1', pal.c1);
  root.style.setProperty('--accent-2', pal.c2);
}

export function savePalette(tenant: string, id: string) {
  localStorage.setItem(storageKey(tenant), id);
  applyPalette(tenant, id);
}

export function resetPalette() {
  const root = document.documentElement;
  root.style.removeProperty('--accent-1');
  root.style.removeProperty('--accent-2');
}
