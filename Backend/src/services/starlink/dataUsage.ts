import { db } from '../../db/client.js';
import { starlinkDataUsage } from '../../db/starlink-schema.js';
import { starlinkFetch, type StarlinkAccountCreds } from './client.js';

export interface BillingCycle {
  startDate:           string;
  endDate:             string;
  totalPriorityGB:     number;
  totalStandardGB:     number;
  totalNonBillableGB:  number;
  dailyDataUsage:      Array<{ date: string; priorityGB: number; standardGB: number }>;
  dataPoolUsage:       unknown[];
}

interface DataUsageResponse {
  content: {
    results: Array<{
      serviceLineNumber: string;
      billingCycles:     BillingCycle[];
    }>;
  };
}

export async function fetchAndPersistDataUsage(
  obraId:             number,
  account:            StarlinkAccountCreds,
  serviceLineNumbers: string[],
): Promise<number> {
  if (serviceLineNumbers.length === 0) return 0;

  const data = await starlinkFetch<DataUsageResponse>(
    account,
    '/data-usage/query?page=0&limit=250',
    {
      method: 'POST',
      body:   JSON.stringify({
        serviceLineNumbers,
        previousBillingCycles: 1,
        activeServiceLinesOnly: true,
      }),
    },
  );

  const rows = data.content.results.flatMap((sl) =>
    sl.billingCycles.map((cycle) => ({
      obraId,
      starlinkAccountId: account.id,
      serviceLineNumber: sl.serviceLineNumber,
      billingCycleStart: new Date(cycle.startDate),
      billingCycleEnd:   new Date(cycle.endDate),
      dataAmountGb:      cycle.dailyDataUsage.reduce((sum, d) => sum + d.priorityGB + d.standardGB, 0),
      rawResponse:       cycle as unknown as Record<string, unknown>,
      fetchedAt:         new Date(),
    })),
  );

  if (rows.length > 0) {
    await db.insert(starlinkDataUsage).values(rows);
  }

  return rows.length;
}
