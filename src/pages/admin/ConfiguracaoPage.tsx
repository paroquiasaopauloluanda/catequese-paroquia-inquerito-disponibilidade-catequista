import React, { useEffect, useState } from 'react';
import { api } from '../../utils/apiClient';
import type { Config } from '../../types';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', fontSize: 15,
  border: '1.5px solid #c5cdd7', borderRadius: 8,
  boxSizing: 'border-box', background: '#fff',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontWeight: 600, fontSize: 13,
  color: '#1e3a5f', marginBottom: 6,
};

export default function ConfiguracaoPage() {
  const [config, setConfig] = useState<Config>({ anoLetivo: '', dataAbertura: '', dataFecho: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getConfig().then(res => {
      if (res.ok) setConfig(res.config);
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.anoLetivo.trim()) { setError('O ano letivo é obrigatório.'); return; }
    setError('');
    setSaving(true);
    try {
      const res = await api.setConfig(config);
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
      else setError('Erro ao guardar configuração.');
    } catch {
      setError('Erro de ligação.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#777' }}>A carregar…</div>
  );

  return (
    <div style={{ padding: '24px 16px', maxWidth: 520, margin: '0 auto' }}>
      <h2 style={{ color: '#1e3a5f', fontSize: 18, marginBottom: 20 }}>Configuração</h2>

      <div style={{ background: '#fff', borderRadius: 10, padding: '28px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Ano letivo do inquérito *</label>
            <input
              style={inputStyle}
              type="text"
              value={config.anoLetivo}
              onChange={e => setConfig(c => ({ ...c, anoLetivo: e.target.value }))}
              placeholder="ex: 2026/2027"
            />
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
              Apresentado dinamicamente na pergunta de disponibilidade do formulário público.
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Data de abertura do inquérito (opcional)</label>
            <input
              style={inputStyle}
              type="date"
              value={config.dataAbertura}
              onChange={e => setConfig(c => ({ ...c, dataAbertura: e.target.value }))}
            />
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
              Deixe em branco para abrir imediatamente.
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={labelStyle}>Data de fecho do inquérito (opcional)</label>
            <input
              style={inputStyle}
              type="date"
              value={config.dataFecho}
              onChange={e => setConfig(c => ({ ...c, dataFecho: e.target.value }))}
            />
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
              Deixe em branco para manter aberto indefinidamente.
            </div>
          </div>

          {error && (
            <div style={{
              background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 8,
              padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#b91c1c',
            }}>
              {error}
            </div>
          )}

          {saved && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8,
              padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#166534',
            }}>
              ✓ Configuração guardada com sucesso.
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              width: '100%', padding: '13px',
              background: saving ? '#9bb3cc' : '#1e3a5f',
              color: '#fff', border: 'none', borderRadius: 8,
              fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'A guardar…' : 'Guardar configuração'}
          </button>
        </form>
      </div>

      <div style={{ marginTop: 20, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '16px 18px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>⚠️ Nota de segurança</div>
        <div style={{ fontSize: 12, color: '#78350f', lineHeight: 1.6 }}>
          As credenciais de acesso (root / rootroot) são validadas no Google Apps Script.
          Para maior segurança, altere a constante <code>ADMIN_PASS</code> directamente no código do Apps Script
          após o primeiro acesso.
        </div>
      </div>
    </div>
  );
}
