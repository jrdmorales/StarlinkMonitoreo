import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { HistoryResponse } from '../types/index';

/** Historial de consumo agregado del ciclo activo. Sin `obraKey`, suma la flota completa. */
export function useAggregateHistory(obraKey?: string) {
  return useQuery({
    queryKey: ['aggregate-history', obraKey ?? 'all'],
    queryFn:  () => api.get<HistoryResponse>(`/consumption/history${obraKey ? `?obraKey=${obraKey}` : ''}`),
    staleTime: 5 * 60 * 1000,
  });
}
