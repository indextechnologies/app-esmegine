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
};

// Module-level singleton: one fetch across all components
let _cache: Client[] | null = null;
let _promise: Promise<Client[]> | null = null;

function fetchClients(): Promise<Client[]> {
  if (!_promise) {
    _promise = fetch('/api/clients')
      .then(r => r.json())
      .then((data: Client[]) => { _cache = data; return data; })
      .catch(() => { _promise = null; return []; });
  }
  return _promise;
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>(_cache ?? []);
  const [loading, setLoading] = useState(_cache === null);

  useEffect(() => {
    if (_cache !== null) return;
    fetchClients().then(data => {
      setClients(data);
      setLoading(false);
    });
  }, []);

  return { clients, loading };
}

export function useClient(slug: string) {
  const { clients, loading } = useClients();
  return {
    client: clients.find(c => c.slug === slug) ?? null,
    loading,
  };
}
