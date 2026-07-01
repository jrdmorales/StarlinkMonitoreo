import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { starlinkUserTerminals } from '../../db/starlink-schema.js';
import { starlinkFetch, type StarlinkAccountCreds } from './client.js';

interface UserTerminalResponse {
  content: {
    totalCount: number;
    isLastPage: boolean;
    results: Array<{
      userTerminalId:    string;
      dishSerialNumber:  string;
      kitSerialNumber:   string;
      serviceLineNumber: string;
      nickname:          string | null;
    }>;
  };
}

export async function syncUserTerminals(
  obraId:  number,
  account: StarlinkAccountCreds,
): Promise<number> {
  const data = await starlinkFetch<UserTerminalResponse>(account, '/user-terminals');

  // upsert por terminal — evita huecos si el sync falla a medio camino
  for (const t of data.content.results) {
    await db.insert(starlinkUserTerminals)
      .values({
        obraId,
        starlinkAccountId: account.id,
        userTerminalId:    t.userTerminalId,
        dishSerialNumber:  t.dishSerialNumber,
        kitSerialNumber:   t.kitSerialNumber,
        serviceLineNumber: t.serviceLineNumber,
        nickname:          t.nickname,
        syncedAt:          new Date(),
      })
      .onConflictDoUpdate({
        target: [starlinkUserTerminals.starlinkAccountId, starlinkUserTerminals.userTerminalId],
        set:    {
          dishSerialNumber:  t.dishSerialNumber,
          serviceLineNumber: t.serviceLineNumber,
          nickname:          t.nickname,
          syncedAt:          new Date(),
        },
      });
  }

  return data.content.totalCount;
}

export async function getTerminalsForAccount(starlinkAccountId: string) {
  return db.select()
    .from(starlinkUserTerminals)
    .where(eq(starlinkUserTerminals.starlinkAccountId, starlinkAccountId));
}
