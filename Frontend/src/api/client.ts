const BASE = '/api';
const TOKEN_KEY = 'starlink_token';

export const token = {
  get:   (): string | null => localStorage.getItem(TOKEN_KEY),
  set:   (t: string): void => localStorage.setItem(TOKEN_KEY, t),
  clear: (): void           => localStorage.removeItem(TOKEN_KEY),
};

interface TokenPayload { sub: number; email: string; role: string }

/** Decodifica los claims del JWT actual (sin verificar firma) para mostrar datos de cuenta en la UI. */
export function getTokenPayload(): TokenPayload | null {
  const t = token.get();
  if (!t) return null;
  try {
    const [, payload] = t.split('.');
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as TokenPayload;
  } catch {
    return null;
  }
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const t = token.get();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, (body as { error?: string }).error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get:    <T>(path: string)                   => request<T>(path),
  post:   <T>(path: string, body: unknown)    => request<T>(path, { method: 'POST',  body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown)    => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string)                   => request<T>(path, { method: 'DELETE' }),
};
