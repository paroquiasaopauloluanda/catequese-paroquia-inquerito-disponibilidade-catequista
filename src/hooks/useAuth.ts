import { useState, useCallback } from 'react';
import { api } from '../utils/apiClient';

export function useAuth() {
  const [isAuth, setIsAuth] = useState(() => !!sessionStorage.getItem('admin_token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.login(username, password);
      if (res.ok) {
        setIsAuth(true);
        return true;
      } else {
        setError(res.error || 'Credenciais inválidas');
        return false;
      }
    } catch {
      setError('Erro de ligação. Verifique a sua ligação e tente novamente.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('admin_token');
    setIsAuth(false);
  }, []);

  return { isAuth, login, logout, loading, error };
}
