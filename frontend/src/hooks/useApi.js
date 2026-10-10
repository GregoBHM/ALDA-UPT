import { useState, useEffect, useCallback } from 'react';

/**
 * Hook reutilizable para llamadas a la API.
 * Maneja loading, error y refresco automático opcional.
 *
 * @param {Function} apiFn   - Función async que retorna la data
 * @param {Array}    deps    - Dependencias del useEffect (default [])
 * @param {Object}   options - { interval: ms para polling, initialData }
 */
export function useApi(apiFn, deps = [], { interval = null, initialData = null } = {}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      const result = await apiFn();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetch();
    if (interval) {
      const id = setInterval(fetch, interval);
      return () => clearInterval(id);
    }
  }, [fetch, interval]);

  return { data, loading, error, refresh: fetch };
}
