import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { ObrasResponse } from '../types/index';

export function useObras() {
  return useQuery({
    queryKey:        ['obras'],
    queryFn:         () => api.get<ObrasResponse>('/obras'),
    staleTime:       5 * 60 * 1000,   // considerar fresco por 5 minutos
    refetchInterval: 10 * 60 * 1000,  // re-fetch automático cada 10 minutos
  });
}
