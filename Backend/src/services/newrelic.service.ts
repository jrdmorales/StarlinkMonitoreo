import type { NormalizedReading, NewRelicResult } from '../types/index.js';
import { config } from '../lib/config.js';

const NR_GRAPHQL_URL = 'https://api.newrelic.com/graphql';

/** Extracts the terminal code (trailing digits) from the service name */
function extractCode(serviceName: string): string | null {
  return serviceName.match(/(\d+)$/)?.[1] ?? null;
}

/**
 * Filtra resultados de New Relic al ciclo más reciente.
 *
 * NR devuelve hasta 5 días de datos por FACET. Para cada terminal,
 * tomamos la entrada con la fecha de ciclo más reciente. Luego filtramos
 * al ciclo global más nuevo del dataset.
 *
 * Lógica conservada del script n8n original.
 */
function filterToLatestCycle(results: NewRelicResult[]): NewRelicResult[] {
  const grouped: Record<string, NewRelicResult> = {};

  for (const item of results) {
    const code  = extractCode(item.facet[0]);
    const fecha = item.facet[2];
    if (!code || !fecha) continue;
    if (!grouped[code] || fecha > grouped[code].facet[2]) {
      grouped[code] = item;
    }
  }

  const latestDate = Object.values(grouped).reduce(
    (max, item) => (item.facet[2] > max ? item.facet[2] : max),
    '',
  );

  return Object.values(grouped).filter((i) => i.facet[2] === latestDate);
}

function normalizeResult(item: NewRelicResult): NormalizedReading {
  return {
    code:        extractCode(item.facet[0])!,
    serviceName: item.facet[0],
    consumedGb:  Number(item['Consumo Gigas']),
    limitGb:     Number(item['Limite uso GB']),
    usagePct:    Number(item['% Uso']),
    cycleStart:  item.facet[2].slice(0, 10),
    cycleEnd:    item['Fecha Termino'].slice(0, 10),
  };
}

/** Consulta New Relic y retorna lecturas normalizadas del ciclo activo */
export async function fetchStarlinkReadings(): Promise<NormalizedReading[]> {
  const nrql = [
    'FROM consumoStarlink',
    "SELECT latest(ConsumoGigas) AS 'Consumo Gigas',",
    "latest(UsageLimitGB) AS 'Limite uso GB',",
    "100 * latest(ConsumoGigas) / latest(UsageLimitGB) AS '% Uso',",
    "latest(EndDate) AS 'Fecha Termino'",
    "FACET Nickname AS 'Dispositivo', ProductId, StartDate AS 'Fecha de inicio'",
    'SINCE 5 days ago LIMIT MAX',
  ].join(' ');

  const query = `{
    actor {
      account(id: ${config.NEWRELIC_ACCOUNT_ID}) {
        nrql(query: "${nrql}") {
          results
        }
      }
    }
  }`;

  const res = await fetch(NR_GRAPHQL_URL, {
    method:  'POST',
    headers: {
      'API-Key':      config.NEWRELIC_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`New Relic API error ${res.status}: ${body}`);
  }

  const json = await res.json() as {
    data?: {
      actor?: {
        account?: {
          nrql?: { results?: NewRelicResult[] };
        };
      };
    };
    errors?: Array<{ message: string }>;
  };

  if (json.errors?.length) {
    throw new Error(`New Relic GraphQL errors: ${json.errors.map((e) => e.message).join(', ')}`);
  }

  const raw = json.data?.actor?.account?.nrql?.results ?? [];
  return filterToLatestCycle(raw).map(normalizeResult);
}
