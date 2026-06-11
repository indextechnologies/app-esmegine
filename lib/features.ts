// Tenants que no manejan "Plato del Día" en su operación.
const SIN_PLATO_DEL_DIA = new Set(['fkn-finger']);

export function tieneMenuDelDia(tenant: string): boolean {
  return !SIN_PLATO_DEL_DIA.has(tenant);
}
