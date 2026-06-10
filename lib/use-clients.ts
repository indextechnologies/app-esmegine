'use client';
import { useState, useEffect } from 'react';

export type Client = {
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
  modules:   string[];
};

// Module-level singleton: one fetch across all components
let _cache: Client[] | null = null;
let _promise: Promise<Client[]> | null = null;

function fetchClients(): Promise<Client[]> {
  if (_promise) return _promise;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  _promise = fetch('/api/clients', { signal: controller.signal })
    .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
    .then((data: Client[]) => {
      clearTimeout(timeout);
      if (Array.isArray(data) && data.length > 0) _cache = data;
      return Array.isArray(data) ? data : [];
    })
    .catch(() => {
      clearTimeout(timeout);
      _promise = null;
      return [];
    });
  return _promise;
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>(_cache ?? []);
  const [loading, setLoading] = useState(_cache === null);

  useEffect(() => {
    if (_cache !== null) { setClients(_cache); setLoading(false); return; }
    fetchClients().then(data => {
      setClients(data);
      setLoading(false);
      if (data.length === 0) {
        // Retry once after 3s in case of transient Notion error
        setTimeout(() => {
          fetchClients().then(retry => {
            if (retry.length > 0) setClients(retry);
          });
        }, 3000);
      }
    });
  }, []);

  return { clients, loading };
}

// Keep the shared cache in sync after an admin edits a client's modules,
// so navigating to the tenant panel reflects the change without a refetch.
export function setCachedClientModules(slug: string, modules: string[]) {
  if (_cache) _cache = _cache.map(c => (c.slug === slug ? { ...c, modules } : c));
}

export function useClient(slug: string) {
  const { clients, loading } = useClients();
  return {
    client: clients.find(c => c.slug === slug) ?? null,
    loading,
  };
}
