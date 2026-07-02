import { useState } from 'react';
import { api, token } from '../api/client';

interface LoginResponse { token: string; email: string }

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState<string | null>(null);

  async function login(email: string, password: string): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<LoginResponse>('/auth/login', { email, password });
      token.set(res.token);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación');
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { login, loading, error };
}
