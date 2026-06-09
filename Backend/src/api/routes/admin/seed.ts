import type { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../../middleware/auth.js';
import { db } from '../../../db/client.js';
import { obras, antennas } from '../../../db/schema.js';

const SEED_DATA = [
  { key: 'SALAR-CLIENTES',   prefix: 'SAL', label: 'Salar',        email: 'alertas@excon.cl', codes: ['10000697951', '10000697963', '10000698005', '10000698006', '10000698012', '10000698009'] },
  { key: 'LOPINTO-CLIENTES', prefix: 'LOP', label: 'Lo Pinto',     email: 'alertas@excon.cl', codes: ['10000698019', '10000698003', '10000698018'] },
  { key: 'QB-CLIENTES',      prefix: 'QB',  label: 'Quebrada B.',   email: 'alertas@excon.cl', codes: ['10000697942'] },
  { key: 'ZALD-CLIENTES',    prefix: 'ZAL', label: 'Zaldívar',     email: 'alertas@excon.cl', codes: ['10000697998', '10000697999', '10000697944'] },
  { key: 'NEGR-CLIENTES',    prefix: 'NEG', label: 'La Negra',      email: 'alertas@excon.cl', codes: ['10000697973'] },
  { key: 'ALB-CLIENTES',     prefix: 'ALB', label: 'Albemarle',     email: 'alertas@excon.cl', codes: ['10000698022'] },
];

const seedRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', requireAuth);

  fastify.post('/', async (_req, reply) => {
    let obrasCreated = 0;
    let antennasCreated = 0;
    let skipped = 0;

    for (const { codes, ...obraData } of SEED_DATA) {
      const existing = await db
        .select({ id: obras.id })
        .from(obras)
        .where(eq(obras.key, obraData.key))
        .limit(1);

      let obraId: number;
      if (existing.length > 0) {
        obraId = existing[0].id;
        skipped++;
      } else {
        const [created] = await db.insert(obras).values(obraData).returning({ id: obras.id });
        obraId = created.id;
        obrasCreated++;
      }

      for (const code of codes) {
        const existingAntenna = await db
          .select({ id: antennas.id })
          .from(antennas)
          .where(eq(antennas.code, code))
          .limit(1);

        if (existingAntenna.length > 0) {
          skipped++;
          continue;
        }

        await db.insert(antennas).values({ code, obraId, limitGb: 2000 });
        antennasCreated++;
      }
    }

    return reply.send({ ok: true, obrasCreated, antennasCreated, skipped });
  });
};

export default seedRoutes;
