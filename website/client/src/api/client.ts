import type { ApiErrorBody, ApiResponse, ErrorType } from '@mediconnect/shared';
import { currentLanguage, t } from '../i18n';

// Bütün API çağırışları buradan keçir. Zərfi açır: uğurda `data`, xətada ApiClientError atır.
// Base URL boşdursa Vite proxy (lokal mock) istifadə olunur; real backend üçün VITE_API_BASE_URL.

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const TOKEN_KEY = 'mc.token';

export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly errorType: ErrorType | 'NetworkError',
    message: string,
    readonly details?: ApiErrorBody['details'],
  ) {
    super(message);
  }
  get fieldErrors(): Record<string, string> {
    return this.details?.fields ?? {};
  }
}

/** Server saatı ilə brauzer saatı arasındakı fərq (ms). Dev panel saatı irəli çəkəndə taymerlər düzgün qalır. */
let serverSkewMs = 0;
export const serverNow = () => Date.now() + serverSkewMs;

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string | null) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* private rejim — sessiya yalnız yaddaşda qalır */
    }
  },
};

/** Sessiya bitəndə AuthContext bunu dinləyir və login-ə yönləndirir. */
export const UNAUTHORIZED_EVENT = 'mc:unauthorized';

type Query = Record<string, string | number | boolean | string[] | null | undefined>;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Query;
  signal?: AbortSignal;
  /** 401-də qlobal "sessiya bitdi" hadisəsini yayma (məs. login formunun özü). */
  silentUnauthorized?: boolean;
}

export function buildQuery(query?: Query): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) continue;
    params.set(k, Array.isArray(v) ? v.join(',') : String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Accept-Language': currentLanguage() };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (opts.body instanceof FormData) body = opts.body;
  else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}${buildQuery(opts.query)}`, { method: opts.method ?? 'GET', headers, body, signal: opts.signal });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ApiClientError(0, 'NetworkError', t('net.offline'));
  }

  const serverTime = res.headers.get('X-Server-Time');
  if (serverTime) serverSkewMs = new Date(serverTime).getTime() - Date.now();

  let json: ApiResponse<T> | null = null;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    /* boş və ya JSON olmayan cavab */
  }
  if (res.ok && json?.status === 'SUCCESS') return json.data;

  const err = json && json.status === 'ERROR' ? json : null;
  if (res.status === 401 && token && !opts.silentUnauthorized) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  throw new ApiClientError(res.status, err?.errorType ?? 'ServerError', err?.message ?? t('net.unexpected'), err?.details);
}

export const api = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) => request<T>(path, { query, signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  del: <T>(path: string, body?: unknown) => request<T>(path, { method: 'DELETE', body }),
};
