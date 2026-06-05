const nf0 = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const fmtGB  = (n: number): string => nf0.format(Math.round(n)) + ' GB';
export const fmtGB1 = (n: number): string => nf1.format(n) + ' GB';
export const fmtPct = (n: number): string => nf1.format(n) + '%';
export const fmt0   = (n: number): string => nf0.format(n);

export function fmtDateShort(iso: string): string {
  const d = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso);
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
}
