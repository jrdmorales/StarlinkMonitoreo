import { eq } from 'drizzle-orm';
import { db } from '../client.js';
import { obras, antennas, type ObraRow, type AntennaRow } from '../schema.js';

export type ObraWithAntennas = ObraRow & { antennas: AntennaRow[] };

/** Retorna todas las obras activas con sus antenas activas */
export async function findAllObras(): Promise<ObraWithAntennas[]> {
  const [obraRows, antennaRows] = await Promise.all([
    db.select().from(obras).where(eq(obras.active, true)),
    db.select().from(antennas).where(eq(antennas.active, true)),
  ]);

  return obraRows.map((obra) => ({
    ...obra,
    antennas: antennaRows.filter((a) => a.obraId === obra.id),
  }));
}

export async function findObraByKey(key: string): Promise<ObraWithAntennas | null> {
  const all = await findAllObras();
  return all.find((o) => o.key === key) ?? null;
}
