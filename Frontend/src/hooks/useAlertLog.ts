import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { AlertLogResponse } from '../types/index';

export function useAlertLog() {
  return useQuery({
    queryKey: ['alert-log'],
    queryFn:  () => api.get<AlertLogResponse>('/alerts'),
    staleTime: 60 * 1000,
  });
}

export function useAlertPreview(obraKey: string | null, threshold: number | null) {
  return useQuery({
    queryKey: ['alert-preview', obraKey, threshold],
    queryFn:  () => api.get<{ html: string; isDemo: boolean }>(
      `/alerts/preview?obraKey=${obraKey}&threshold=${threshold}`,
    ),
    enabled:   !!obraKey && !!threshold,
    staleTime: 2 * 60 * 1000,
  });
}
