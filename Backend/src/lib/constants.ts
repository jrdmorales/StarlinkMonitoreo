/** Porcentaje de uso a partir del cual una antena está en riesgo (rojo) */
export const RISK_THRESHOLD = 85;

/** Porcentaje de uso a partir del cual una antena está en advertencia (amarillo) */
export const WARN_THRESHOLD = 75;

/** Tamaño estándar de bolsa de datos adicional en GB */
export const BAG_SIZE_GB = 50;

/**
 * Mapeo estático obra → códigos de antenas.
 * Fuente de verdad inicial, reemplazable por admin UI (Fase 3).
 * Migrado directamente del script n8n original.
 */
export const GROUP_MAPPING: Record<string, {
  label:  string;
  prefix: string;
  email:  string;
  codes:  string[];
}> = {
  'SALAR-CLIENTES': {
    label:  'Salar',
    prefix: 'SAL',
    email:  'jmorales@excon.cl',
    codes:  ['10000697951','10000697963','10000698005','10000698006','10000698012','10000698009'],
  },
  'LOPINTO-CLIENTES': {
    label:  'Lo Pinto',
    prefix: 'LOP',
    email:  'jmorales@excon.cl',
    codes:  ['10000698019','10000698003','10000698018'],
  },
  'QB-CLIENTES': {
    label:  'Quebrada B.',
    prefix: 'QB',
    email:  'jmorales@excon.cl',
    codes:  ['10000697942','10000731350','10000698000'],
  },
  'ZALD-CLIENTES': {
    label:  'Zaldívar',
    prefix: 'ZAL',
    email:  'jmorales@excon.cl',
    codes:  ['10000697998','10000697999','10000697944','10000731349','10000731261'],
  },
  'NEGR-CLIENTES': {
    label:  'El Negro',
    prefix: 'NEG',
    email:  'jmorales@excon.cl',
    codes:  ['10000697973','10000732149'],
  },
  'ALB-CLIENTES': {
    label:  'Albemarle',
    prefix: 'ALB',
    email:  'jmorales@excon.cl',
    codes:  ['10000698022'],
  },
  'BRONC-CLIENTES': {
    label:  'Los Bronces',
    prefix: 'BRN',
    email:  'jmorales@excon.cl',
    codes:  ['10000733580'],
  },
  'TORT-CLIENTES': {
    label:  'Tórtolas',
    prefix: 'TRT',
    email:  'jmorales@excon.cl',
    codes:  ['10000731262'],
  },
  'TOCON-CLIENTES': {
    label:  'Toconao',
    prefix: 'TCN',
    email:  'jmorales@excon.cl',
    codes:  ['10000697940'],
  },
};
