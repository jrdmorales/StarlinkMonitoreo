import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { starlinkTokens } from '../../db/starlink-schema.js';
import { decrypt } from '../../lib/crypto.js';

const TOKEN_URL = 'https://api.starlink.com/auth/connect/token';
const BASE_URL  = 'https://web-api.starlink.com/public/v2';
const SAFETY_MARGIN_MS = 30_000;

export interface StarlinkAccountCreds {
  id:                    string;
  clientId:              string;
  clientSecretEncrypted: string;
}

async function refreshToken(account: StarlinkAccountCreds): Promise<string> {
  const clientSecret = decrypt(account.clientSecretEncrypted);

  const res = await fetch(TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     account.clientId,
      client_secret: clientSecret,
      grant_type:    'client_credentials',
    }),
  });

  if (!res.ok) {
    throw new StarlinkAuthError(`Token refresh failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  await db.insert(starlinkTokens)
    .values({ starlinkAccountId: account.id, accessToken: data.access_token, expiresAt })
    .onConflictDoUpdate({
      target: starlinkTokens.starlinkAccountId,
      set:    { accessToken: data.access_token, expiresAt, updatedAt: new Date() },
    });

  return data.access_token;
}

async function getValidToken(account: StarlinkAccountCreds): Promise<string> {
  const [cached] = await db.select()
    .from(starlinkTokens)
    .where(eq(starlinkTokens.starlinkAccountId, account.id))
    .limit(1);

  if (cached && cached.expiresAt.getTime() - SAFETY_MARGIN_MS > Date.now()) {
    return cached.accessToken;
  }

  return refreshToken(account);
}

export class StarlinkAuthError extends Error {}
export class StarlinkApiError extends Error {
  constructor(message: string, public status: number, public body: unknown) {
    super(message);
  }
}

/**
 * Ejecuta un request autenticado a la API de Starlink.
 * Maneja token caching, refresh automático y un único retry en 401.
 */
export async function starlinkFetch<T>(
  account: StarlinkAccountCreds,
  path:    string,
  init:    RequestInit = {},
): Promise<T> {
  const token = await getValidToken(account);

  const makeRequest = async (bearer: string): Promise<Response> =>
    fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        Authorization:  `Bearer ${bearer}`,
        'Content-Type': 'application/json',
      },
    });

  let res = await makeRequest(token);

  if (res.status === 401) {
    // token pudo ser revocado del lado de Starlink pese a no haber expirado localmente
    const freshToken = await refreshToken(account);
    res = await makeRequest(freshToken);
  }

  if (!res.ok) {
    throw new StarlinkApiError(
      `Starlink API error ${res.status}`,
      res.status,
      await res.json().catch(() => null),
    );
  }

  return res.json() as Promise<T>;
}
