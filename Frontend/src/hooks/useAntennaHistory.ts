import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { HistoryResponse } from '../types/index';

export function useAntennaHistory(code: string | null) {
  return useQuery({
    queryKey: ['antenna-history', code],
    queryFn:  () => api.get<HistoryResponse>(`/antennas/${code}/history`),
    enabled:  !!code,
    staleTime: 5 * 60 * 1000,
  });
}
