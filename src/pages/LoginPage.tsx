import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../hooks/useAuth';

interface Props {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: Props) {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(username, password);
    if (ok) {
      onLogin();
      navigate('/admin');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 14px', fontSize: 16,
    border: '1.5px solid #c5cdd7', borderRadius: 8,
    boxSizing: 'border-box', background: '#fff',
    outline: 'none',
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#f5f7fa', display: 'flex', flexDirection: 'column' }}>
      <Header subtitle="Área Restrita" />
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '24px 16px',
      }}>
        <div style={{
          background: '#fff', borderRadius: 12, padding: '36px 28px',
          maxWidth: 380, width: '100%',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{ color: '#1e3a5f', marginBottom: 6, fontSize: 20 }}>Entrar</h2>
          <p style={{ color: '#777', fontSize: 13, marginBottom: 28 }}>
            Acesso exclusivo para membros da Comissão de Catequese.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#1e3a5f', marginBottom: 6 }}>
                Nome de utilizador
              </label>
              <input
                style={inputStyle}
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#1e3a5f', marginBottom: 6 }}>
                Palavra-passe
              </label>
              <input
                style={inputStyle}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{
                background: '#fff5f5', border: '1px solid #fca5a5',
                borderRadius: 8, padding: '10px 14px', marginBottom: 16,
                fontSize: 13, color: '#b91c1c',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                background: loading ? '#9bb3cc' : '#1e3a5f',
                color: '#fff', border: 'none', borderRadius: 8,
                fontSize: 15, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'A verificar…' : 'Entrar'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <a href="/" style={{ color: '#9bb3cc', fontSize: 12, textDecoration: 'none' }}>
              ← Voltar ao inquérito
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
