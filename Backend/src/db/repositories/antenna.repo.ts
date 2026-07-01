import { eq } from 'drizzle-orm';
import { db } from '../client.js';
import { antennas, type AntennaRow } from '../schema.js';

export async function findAntennaByCode(code: string): Promise<AntennaRow | null> {
  const [row] = await db
    .select()
    .from(antennas)
    .where(eq(antennas.code, code))
    .limit(1);
  return row ?? null;
}

export async function findAntennaById(id: number): Promise<AntennaRow | null> {
  const [row] = await db
    .select()
    .from(antennas)
    .where(eq(antennas.id, id))
    .limit(1);
  return row ?? null;
}

/**
 * Inserta una antena si no existe. Si ya existe, actualiza nombre y obraId.
 * NO actualiza limitGb para preservar valores seteados por el admin.
 */
export async function upsertAntenna(data: {
  code:    string;
  obraId?: number | null;
  name?:   string;
  limitGb: number;
}): Promise<AntennaRow> {
  const [row] = await db
    .insert(antennas)
    .values({
      code:    data.code,
      obraId:  data.obraId,
      name:    data.name,
      limitGb: data.limitGb,
    })
    .onConflictDoUpdate({
      target: antennas.code,
      set: {
        name:      data.name,
        updatedAt: new Date(),
        // limitGb y obraId excluidos: el admin puede haberlos modificado
      },
    })
    .returning();
  return row;
}

export async function updateAntennaLimit(id: number, limitGb: number): Promise<AntennaRow | null> {
  const [row] = await db
    .update(antennas)
    .set({ limitGb, updatedAt: new Date() })
    .where(eq(antennas.id, id))
    .returning();
  return row ?? null;
}

export async function deactivateAntenna(id: number): Promise<void> {
  await db
    .update(antennas)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(antennas.id, id));
}
