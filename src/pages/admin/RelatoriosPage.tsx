import React, { useEffect, useState } from 'react';
import { api } from '../../utils/apiClient';
import type { Catequista } from '../../types';
import { exportRelatorioPDF, calcAnosInatividade } from '../../utils/exportPDF';
import { exportRelatorioExcel } from '../../utils/exportExcel';

const EXP_OPTIONS = [
  { key: 'ehProfessor', label: 'Professor' },
  { key: 'temFormacaoPedagogia', label: 'Formação Pedagogia' },
  { key: 'expCriancasEspeciais', label: 'Crianças Especiais' },
  { key: 'expAlfabetizacaoAdultos', label: 'Alf. Adultos' },
  { key: 'expAlfabetizacaoCriancas', label: 'Alf. Crianças' },
] as const;

type ExpKey = typeof EXP_OPTIONS[number]['key'];

const thStyle: React.CSSProperties = {
  background: '#1e3a5f', color: '#fff', padding: '10px 10px',
  fontSize: 11, fontWeight: 700, textAlign: 'left', whiteSpace: 'nowrap',
};
const tdStyle: React.CSSProperties = {
  padding: '9px 10px', fontSize: 12, borderBottom: '1px solid #f0f0f0', verticalAlign: 'top',
};

function buildTitle(
  dispFilter: string,
  expFilters: Set<ExpKey>,
  inativoActive: boolean,
  xAnos: number,
): string {
  const parts: string[] = [];
  if (dispFilter === 'Sim') parts.push('Disponíveis');
  else if (dispFilter === 'Não') parts.push('Não disponíveis');
  else parts.push('Todos');
  expFilters.forEach(k => {
    const opt = EXP_OPTIONS.find(o => o.key === k);
    if (opt) parts.push(opt.label);
  });
  if (inativoActive) parts.push(`Inativos ≥${xAnos} anos`);
  return parts.join(' + ');
}

export default function RelatoriosPage() {
  const [all, setAll] = useState<Catequista[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dispFilter, setDispFilter] = useState<'' | 'Sim' | 'Não'>('');
  const [expFilters, setExpFilters] = useState<Set<ExpKey>>(new Set());
  const [inativoActive, setInativoActive] = useState(false);
  const [xAnos, setXAnos] = useState(5);
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');

  useEffect(() => {
    api.getAll().then(res => {
      if (res.ok) setAll(res.records);
    }).finally(() => setLoading(false));
  }, []);

  const toggleExp = (key: ExpKey) => {
    setExpFilters(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filtered = all.filter(c => {
    // Availability
    if (dispFilter && c.disponivel !== dispFilter) return false;
    // Experience (each checked = AND)
    for (const key of expFilters) {
      if ((c[key as keyof Catequista] as string) !== 'Sim') return false;
    }
    // Inactivity
    if (inativoActive) {
      const ano = parseInt(String(c.anoUltimaCatequese));
      if (isNaN(ano) || (new Date().getFullYear() - ano) < xAnos) return false;
    }
    // Name search
    if (searchName.trim()) {
      const q = searchName.trim().toLowerCase();
      if (
        !c.primeiroNome.toLowerCase().includes(q) &&
        !c.ultimoNome.toLowerCase().includes(q)
      ) return false;
    }
    // Phone search
    if (searchPhone.trim()) {
      if (!String(c.telefone || '').includes(searchPhone.trim())) return false;
    }
    return true;
  });

  const hasExpFilters = expFilters.size > 0;
  const title = buildTitle(dispFilter, expFilters, inativoActive, xAnos);
  const showExtra = dispFilter !== 'Não' || hasExpFilters || inativoActive;

  const resetFilters = () => {
    setDispFilter('');
    setExpFilters(new Set());
    setInativoActive(false);
    setXAnos(5);
    setSearchName('');
    setSearchPhone('');
  };

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#777' }}>A carregar registos…</div>
  );

  const filterCard = (children: React.ReactNode, label: string) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  );

  const chipBtn = (active: boolean, onClick: () => void, label: string, color = '#1e3a5f') => (
    <button
      onClick={onClick}
      style={{
        padding: '6px 13px', borderRadius: 6, border: `2px solid ${active ? color : '#dde3ea'}`,
        background: active ? color : '#fff',
        color: active ? '#fff' : '#555',
        fontSize: 12, fontWeight: 600, cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ padding: '24px 16px', maxWidth: 1050, margin: '0 auto' }}>
      <h2 style={{ color: '#1e3a5f', fontSize: 18, marginBottom: 16 }}>Relatórios</h2>

      {/* Painel de filtros */}
      <div style={{ background: '#fff', borderRadius: 10, padding: '20px 22px', marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>

        {/* Disponibilidade */}
        {filterCard(
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {chipBtn(dispFilter === '', () => setDispFilter(''), 'Todos')}
            {chipBtn(dispFilter === 'Sim', () => setDispFilter(dispFilter === 'Sim' ? '' : 'Sim'), 'Disponíveis', '#1e8a5e')}
            {chipBtn(dispFilter === 'Não', () => setDispFilter(dispFilter === 'Não' ? '' : 'Não'), 'Não disponíveis', '#c0392b')}
          </div>,
          'Disponibilidade'
        )}

        {/* Experiências (multi) */}
        {filterCard(
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {EXP_OPTIONS.map(opt => (
              <label
                key={opt.key}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 13px', borderRadius: 6,
                  border: `2px solid ${expFilters.has(opt.key) ? '#7c3aed' : '#dde3ea'}`,
                  background: expFilters.has(opt.key) ? '#f5f3ff' : '#fff',
                  cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  color: expFilters.has(opt.key) ? '#5b21b6' : '#555',
                  transition: 'all 0.15s',
                }}
              >
                <input
                  type="checkbox"
                  checked={expFilters.has(opt.key)}
                  onChange={() => toggleExp(opt.key)}
                  style={{ accentColor: '#7c3aed', width: 14, height: 14 }}
                />
                {opt.label}
              </label>
            ))}
          </div>,
          'Experiências (AND — todos os seleccionados)'
        )}

        {/* Inatividade */}
        {filterCard(
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={inativoActive}
                onChange={e => setInativoActive(e.target.checked)}
                style={{ accentColor: '#c0392b', width: 15, height: 15 }}
              />
              Inativos há
            </label>
            <input
              type="number"
              value={xAnos}
              onChange={e => setXAnos(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              disabled={!inativoActive}
              style={{
                width: 65, padding: '6px 10px', fontSize: 14,
                border: '1.5px solid #c5cdd7', borderRadius: 6,
                opacity: inativoActive ? 1 : 0.4,
              }}
            />
            <span style={{ fontSize: 13, color: '#555' }}>ou mais anos sem ministrar</span>
          </div>,
          'Inatividade'
        )}

        {/* Pesquisa */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 180px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              Nome / Sobrenome
            </div>
            <input
              type="search"
              placeholder="Pesquisar nome…"
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', fontSize: 13,
                border: '1.5px solid #c5cdd7', borderRadius: 7,
              }}
            />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              Telefone
            </div>
            <input
              type="search"
              placeholder="Pesquisar telefone…"
              value={searchPhone}
              onChange={e => setSearchPhone(e.target.value)}
              inputMode="numeric"
              style={{
                width: '100%', padding: '8px 12px', fontSize: 13,
                border: '1.5px solid #c5cdd7', borderRadius: 7,
              }}
            />
          </div>
        </div>

        {/* Reset */}
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={resetFilters}
            style={{
              background: 'none', border: '1px solid #c5cdd7', borderRadius: 6,
              padding: '6px 14px', fontSize: 12, color: '#777', cursor: 'pointer',
            }}
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {/* Preview + Exportar */}
      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 18px', borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap', gap: 8,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e3a5f' }}>
            {title} — <span style={{ color: '#2d6a9f' }}>{filtered.length} registos</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => exportRelatorioPDF(title, filtered, showExtra)}
              style={{
                background: '#c0392b', color: '#fff', border: 'none',
                borderRadius: 6, padding: '8px 12px', fontSize: 12,
                cursor: 'pointer', fontWeight: 600,
              }}
            >
              📥 PDF
            </button>
            <button
              onClick={() => exportRelatorioExcel(title, filtered, showExtra)}
              style={{
                background: '#1e8a5e', color: '#fff', border: 'none',
                borderRadius: 6, padding: '8px 12px', fontSize: 12,
                cursor: 'pointer', fontWeight: 600,
              }}
            >
              📊 Excel
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#aaa', fontSize: 14 }}>
              Nenhum registo corresponde aos filtros seleccionados.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Nome</th>
                  <th style={thStyle}>Sobrenome</th>
                  <th style={thStyle}>Telefone</th>
                  <th style={thStyle}>Disponível</th>
                  {showExtra && <>
                    <th style={thStyle}>Últ. Cat.</th>
                    <th style={thStyle}>Anos Inat.</th>
                    <th style={thStyle}>Prof.</th>
                    <th style={thStyle}>Ped.</th>
                    <th style={thStyle}>Cr. Esp.</th>
                    <th style={thStyle}>Alf. Adu.</th>
                    <th style={thStyle}>Alf. Cri.</th>
                  </>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                    <td style={tdStyle}>{c.primeiroNome}</td>
                    <td style={tdStyle}>{c.ultimoNome}</td>
                    <td style={tdStyle}>{c.telefone}</td>
                    <td style={{ ...tdStyle, color: c.disponivel === 'Sim' ? '#1e8a5e' : '#c0392b', fontWeight: 600 }}>
                      {c.disponivel}
                    </td>
                    {showExtra && <>
                      <td style={tdStyle}>{c.anoUltimaCatequese || '—'}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{calcAnosInatividade(c.anoUltimaCatequese)}</td>
                      <td style={tdStyle}>{c.ehProfessor || '—'}</td>
                      <td style={tdStyle}>{c.temFormacaoPedagogia || '—'}</td>
                      <td style={tdStyle}>{c.expCriancasEspeciais || '—'}</td>
                      <td style={tdStyle}>{c.expAlfabetizacaoAdultos || '—'}</td>
                      <td style={tdStyle}>{c.expAlfabetizacaoCriancas || '—'}</td>
                    </>}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
