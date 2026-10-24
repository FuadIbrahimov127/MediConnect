import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiClientError } from './client';

// Kiçik server-state hook-ları (ağır kitabxana yoxdur).

export interface QueryState<T> {
  data: T | undefined;
  error: ApiClientError | null;
  loading: boolean;
  reload: () => void;
  setData: (updater: T | ((prev: T | undefined) => T)) => void;
}

/** Komponent açılanda və `deps` dəyişəndə sorğu göndərir. `enabled: false` → gözləyir. */
export function useApi<T>(fetcher: (signal: AbortSignal) => Promise<T>, deps: unknown[], opts: { enabled?: boolean } = {}): QueryState<T> {
  const enabled = opts.enabled ?? true;
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<ApiClientError | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [nonce, setNonce] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) return;
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    fetcherRef
      .current(ctrl.signal)
      .then((d) => !ctrl.signal.aborted && setData(d))
      .catch((e: unknown) => {
        if (ctrl.signal.aborted || (e as Error).name === 'AbortError') return;
        setError(e instanceof ApiClientError ? e : new ApiClientError(0, 'ServerError', String(e)));
      })
      .finally(() => !ctrl.signal.aborted && setLoading(false));
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce, enabled]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const set = useCallback((u: T | ((prev: T | undefined) => T)) => setData((prev) => (typeof u === 'function' ? (u as (p: T | undefined) => T)(prev) : u)), []);
  return { data, error, loading, reload, setData: set };
}

export interface MutationState<A extends unknown[], R> {
  run: (...args: A) => Promise<R>;
  pending: boolean;
  error: ApiClientError | null;
  reset: () => void;
}

/** Əməliyyat (POST/PATCH...) — xətanı state-də saxlayır və yenidən atır ki, çağıran da reaksiya verə bilsin. */
export function useMutation<A extends unknown[], R>(fn: (...args: A) => Promise<R>): MutationState<A, R> {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ApiClientError | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async (...args: A) => {
    setPending(true);
    setError(null);
    try {
      return await fnRef.current(...args);
    } catch (e) {
      const err = e instanceof ApiClientError ? e : new ApiClientError(0, 'ServerError', String(e));
      setError(err);
      throw err;
    } finally {
      setPending(false);
    }
  }, []);
  return { run, pending, error, reset: () => setError(null) };
}
