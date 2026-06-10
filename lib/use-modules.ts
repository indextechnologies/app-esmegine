'use client';
import { useEffect, useState } from 'react';

export type ModuleDef = {
  id:           string;
  key:          string;
  nombre:       string;
  icono:        string;
  ruta:         string;
  orden:        number;
  activoGlobal: boolean;
};

let _cache: ModuleDef[] | null = null;
let _promise: Promise<ModuleDef[]> | null = null;

function fetchModules(): Promise<ModuleDef[]> {
  if (_promise) return _promise;
  _promise = fetch('/api/modules')
    .then(r => (r.ok ? r.json() : []))
    .then((data: ModuleDef[]) => {
      if (Array.isArray(data) && data.length > 0) _cache = data;
      return Array.isArray(data) ? data : [];
    })
    .catch(() => { _promise = null; return []; });
  return _promise;
}

export function useModules() {
  const [modules, setModules] = useState<ModuleDef[]>(_cache ?? []);
  const [loading, setLoading] = useState(_cache === null);

  useEffect(() => {
    if (_cache !== null) { setModules(_cache); setLoading(false); return; }
    fetchModules().then(data => { setModules(data); setLoading(false); });
  }, []);

  return { modules, loading };
}
