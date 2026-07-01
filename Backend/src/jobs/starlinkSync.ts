import { desc, eq, and, gt } from 'drizzle-orm';
import { db } from '../db/client.js';
import { starlinkDataUsage } from '../db/starlink-schema.js';
import { getAllStarlinkAccounts } from '../services/starlink/accounts.js';
import { syncUserTerminals, getTerminalsForAccount } from '../services/starlink/terminals.js';
import { fetchAndPersistDataUsage } from '../services/starlink/dataUsage.js';
import { upsertAntenna } from '../db/repositories/antenna.repo.js';
import { insertConsumptionLog } from '../db/repositories/consumption.repo.js';
import type { StarlinkUserTerminalRow } from '../db/starlink-schema.js';

/**
 * Mapea terminales y consumo Starlink al modelo principal (antennas + consumption_logs)
 * para que el UI existente los muestre sin cambios.
 */
async function bridgeToMainTables(obraId: number | null, terminals: StarlinkUserTerminalRow[]): Promise<void> {
  const now = new Date();

  for (const terminal of terminals) {
    if (!terminal.serviceLineNumber) continue;

    const antenna = await upsertAntenna({
      code:    terminal.serviceLineNumber,
      obraId,
      name:    terminal.nickname ?? terminal.userTerminalId,
      limitGb: 2000,
    });

    // Filtrar por starlinkAccountId, no obraId — obraId puede ser null
    // (cuenta sin obra asignada todavía) y no identifica la cuenta de forma única.
    const [usage] = await db.select()
      .from(starlinkDataUsage)
      .where(and(
        eq(starlinkDataUsage.serviceLineNumber, terminal.serviceLineNumber),
        eq(starlinkDataUsage.starlinkAccountId, terminal.starlinkAccountId),
        gt(starlinkDataUsage.billingCycleEnd, new Date()),
      ))
      .orderBy(desc(starlinkDataUsage.billingCycleStart))
      .limit(1);

    if (!usage || !usage.billingCycleStart || !usage.billingCycleEnd) continue;

    const cycleStart = usage.billingCycleStart.toISOString().slice(0, 10);
    const cycleEnd   = usage.billingCycleEnd.toISOString().slice(0, 10);
    const limitGb    = antenna.limitGb;
    const usagePct   = limitGb > 0 ? (usage.dataAmountGb / limitGb) * 100 : 0;

    await insertConsumptionLog({
      antennaId:  antenna.id,
      sampledAt:  now,
      cycleStart,
      cycleEnd,
      consumedGb: usage.dataAmountGb,
      limitGb,
      usagePct,
    });
  }
}

/**
 * Sincroniza terminales y consumo para todas las cuentas Starlink configuradas.
 * Un tenant fallando no detiene el sync de los demás.
 */
export async function runStarlinkSyncForAllAccounts(): Promise<{ synced: number; failed: number }> {
  const accounts = await getAllStarlinkAccounts();
  let synced = 0;
  let failed = 0;

  if (accounts.length === 0) {
    console.warn('[StarlinkSync] 0 cuentas Starlink en DB — revisar STARLINK_ACCOUNTS/STARLINK_ENCRYPTION_KEY en el entorno.');
    return { synced, failed };
  }

  for (const account of accounts) {
    try {
      await syncUserTerminals(account.obraId, account);

      const terminals = await getTerminalsForAccount(account.id);
      const serviceLineNumbers = terminals
        .map((t) => t.serviceLineNumber)
        .filter((s): s is string => s !== null);

      await fetchAndPersistDataUsage(account.obraId, account, serviceLineNumbers);
      await bridgeToMainTables(account.obraId, terminals);

      synced++;
    } catch (err) {
      console.error(`[StarlinkSync] Falló sync para cuenta ${account.id} (obraId ${account.obraId}):`, err);
      failed++;
    }
  }

  return { synced, failed };
}
