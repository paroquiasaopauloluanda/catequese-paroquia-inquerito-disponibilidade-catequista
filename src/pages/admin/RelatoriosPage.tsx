import React, { useEffect, useState } from 'react';
import { api } from '../../utils/apiClient';
import type { Catequista } from '../../types';
import { exportRelatorioPDF, calcAnosInatividade } from '../../utils/exportPDF';
import { exportRelatorioExcel } from '../../utils/exportExcel';
import {
  PROFESSOR_OPTIONS, PEDAGOGIA_OPTIONS, CRIANCAS_ESPECIAIS_OPTIONS,
  ALFABETIZACAO_OPTIONS, FAIXA_ETARIA_OPTIONS,
} from '../../constants/inqueritoOptions';

const thStyle: React.CSSProperties = {
  background: '#1e3a5f', color: '#fff', padding: '9px 8px',
  fontSize: 10, fontWeight: 700, textAlign: 'left', whiteSpace: 'nowrap',
};
const tdStyle: React.CSSProperties = {
  padding: '8px 8px', fontSize: 11, borderBottom: '1px solid #f0f0f0', verticalAlign: 'top',
};

// Match a record field against a set of selected filter values (OR within set)
function matchField(fieldValue: string, selected: Set<string>): boolean {
  if (selected.size === 0) return true; // no filter = all pass
  // For comma-separated multi-select fields
  const parts = fieldValue.split(',').map(v => v.trim()).filter(Boolean);
  for (const sel of selected) {
    if (parts.includes(sel) || fieldValue === sel) return true;
  }
  return false;
}

// Build a human-readable title from active filters
function buildTitle(
  dispFilter: string,
  filters: Record<string, Set<string>>,
  inativoActive: boolean, xAnos: number,
): string {
  const parts: string[] = [];
  if (dispFilter === 'Sim') parts.push('Disponíveis');
  else if (dispFilter === 'Não') parts.push('Não disponíveis');
  else parts.push('Todos');

  Object.entries(filters).forEach(([, set]) => {
    if (set.size > 0) parts.push([...set].join('/'));
  });
  if (inativoActive) parts.push(`Inativos ≥${xAnos}a`);
  return parts.join(' + ');
}

type FilterKey = 'professor' | 'pedagogia' | 'criancasEspeciais' | 'alfabetizacao' | 'faixaEtaria';

const FILTER_DEFS: { key: FilterKey; label: string; catKey: keyof Catequista; options: readonly string[] }[] = [
  { key: 'professor', label: 'Professor', catKey: 'ehProfessor', options: PROFESSOR_OPTIONS },
  { key: 'pedagogia', label: 'Pedagogia', catKey: 'temFormacaoPedagogia', options: PEDAGOGIA_OPTIONS },
  { key: 'criancasEspeciais', label: 'Crianças Especiais', catKey: 'expCriancasEspeciais', options: CRIANCAS_ESPECIAIS_OPTIONS },
  { key: 'alfabetizacao', label: 'Alfabetização', catKey: 'expAlfabetizacao', options: ALFABETIZACAO_OPTIONS },
  { key: 'faixaEtaria', label: 'Faixa Etária Conforto', catKey: 'faixaEtariaConforto', options: FAIXA_ETARIA_OPTIONS },
];

function emptyFilters(): Record<FilterKey, Set<string>> {
  return { professor: new Set(), pedagogia: new Set(), criancasEspeciais: new Set(), alfabetizacao: new Set(), faixaEtaria: new Set() };
}

export default function RelatoriosPage() {
  const [all, setAll] = useState<Catequista[]>([]);
  const [loading, setLoading] = useState(true);

  const [dispFilter, setDispFilter] = useState<'' | 'Sim' | 'Não'>('');
  const [catFilters, setCatFilters] = useState<Record<FilterKey, Set<string>>>(emptyFilters);
  const [inativoActive, setInativoActive] = useState(false);
  const [xAnos, setXAnos] = useState(5);
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [openSection, setOpenSection] = useState<FilterKey | null>(null);

  useEffect(() => {
    api.getAll().then(res => { if (res.ok) setAll(res.records); }).finally(() => setLoading(false));
  }, []);

  const toggleCatFilter = (key: FilterKey, value: string) => {
    setCatFilters(prev => {
      const next = { ...prev, [key]: new Set(prev[key]) };
      if (next[key].has(value)) next[key].delete(value);
      else next[key].add(value);
      return next;
    });
  };

  const filtered = all.filter(c => {
    if (dispFilter && c.disponivel !== dispFilter) return false;
    for (const def of FILTER_DEFS) {
      if (!matchField(String(c[def.catKey] || ''), catFilters[def.key])) return false;
    }
    if (inativoActive) {
      const ano = parseInt(String(c.anoUltimaCatequese));
      if (isNaN(ano) || (new Date().getFullYear() - ano) < xAnos) return false;
    }
    if (searchName.trim()) {
      const q = searchName.trim().toLowerCase();
      if (!c.primeiroNome.toLowerCase().includes(q) && !c.ultimoNome.toLowerCase().includes(q)) return false;
    }
    if (searchPhone.trim()) {
      if (!String(c.telefone || '').includes(searchPhone.trim())) return false;
    }
    return true;
  });

  const hasAnyFilter = catFilters.professor.size > 0 || catFilters.pedagogia.size > 0 ||
    catFilters.criancasEspeciais.size > 0 || catFilters.alfabetizacao.size > 0 ||
    catFilters.faixaEtaria.size > 0;
  const showExtra = dispFilter !== 'Não' || hasAnyFilter || inativoActive;
  const title = buildTitle(dispFilter, catFilters, inativoActive, xAnos);

  const resetAll = () => {
    setDispFilter('');
    setCatFilters(emptyFilters());
    setInativoActive(false); setXAnos(5);
    setSearchName(''); setSearchPhone('');
    setOpenSection(null);
  };

  const chipBtn = (active: boolean, onClick: () => void, label: string, color = '#1e3a5f') => (
    <button onClick={onClick} style={{
      padding: '6px 13px', borderRadius: 6,
      border: `2px solid ${active ? color : '#dde3ea'}`,
      background: active ? color : '#fff',
      color: active ? '#fff' : '#555',
      fontSize: 12, fontWeight: 600, cursor: 'pointer',
    }}>{label}</button>
  );

  const sectionLabel = (def: typeof FILTER_DEFS[number]) => {
    const sel = catFilters[def.key];
    return sel.size > 0 ? `${def.label} (${sel.size})` : def.label;
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#777' }}>A carregar registos…</div>;

  return (
    <div style={{ padding: '24px 16px', maxWidth: 1100, margin: '0 auto' }}>
      <h2 style={{ color: '#1e3a5f', fontSize: 18, marginBottom: 16 }}>Relatórios</h2>

      <div style={{ background: '#fff', borderRadius: 10, padding: '18px 20px', marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>

        {/* Disponibilidade */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Disponibilidade</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {chipBtn(dispFilter === '', () => setDispFilter(''), 'Todos')}
            {chipBtn(dispFilter === 'Sim', () => setDispFilter(dispFilter === 'Sim' ? '' : 'Sim'), 'Disponíveis', '#1e8a5e')}
            {chipBtn(dispFilter === 'Não', () => setDispFilter(dispFilter === 'Não' ? '' : 'Não'), 'Não disponíveis', '#c0392b')}
          </div>
        </div>

        {/* Filtros categoriais — acordeão */}
        {FILTER_DEFS.map(def => (
          <div key={def.key} style={{ marginBottom: 10, border: '1px solid #e8ecf0', borderRadius: 8, overflow: 'hidden' }}>
            <button
              onClick={() => setOpenSection(openSection === def.key ? null : def.key)}
              style={{
                width: '100%', padding: '10px 14px', background: catFilters[def.key].size > 0 ? '#eef2f8' : '#f8fafc',
                border: 'none', textAlign: 'left', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: 13, fontWeight: 600, color: '#1e3a5f',
              }}
            >
              <span>{sectionLabel(def)}</span>
              <span style={{ fontSize: 10, color: '#999' }}>{openSection === def.key ? '▲' : '▼'}</span>
            </button>
            {openSection === def.key && (
              <div style={{ padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: 8, background: '#fff' }}>
                {def.options.map(opt => {
                  const active = catFilters[def.key].has(opt);
                  return (
                    <label key={opt} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
                      border: `2px solid ${active ? '#7c3aed' : '#dde3ea'}`,
                      background: active ? '#f5f3ff' : '#fff',
                      fontSize: 12, fontWeight: 600,
                      color: active ? '#5b21b6' : '#555',
                    }}>
                      <input type="checkbox" checked={active}
                        onChange={() => toggleCatFilter(def.key, opt)}
                        style={{ accentColor: '#7c3aed', width: 13, height: 13 }} />
                      {opt}
                    </label>
                  );
                })}
                {catFilters[def.key].size > 0 && (
                  <button onClick={() => setCatFilters(prev => ({ ...prev, [def.key]: new Set() }))}
                    style={{ fontSize: 11, color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                    Limpar
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Inatividade */}
        <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={inativoActive} onChange={e => setInativoActive(e.target.checked)}
              style={{ accentColor: '#c0392b', width: 15, height: 15 }} />
            Inativos há
          </label>
          <input type="number" value={xAnos} onChange={e => setXAnos(Math.max(1, parseInt(e.target.value) || 1))}
            min={1} disabled={!inativoActive}
            style={{ width: 65, padding: '6px 10px', fontSize: 14, border: '1.5px solid #c5cdd7', borderRadius: 6, opacity: inativoActive ? 1 : 0.4 }} />
          <span style={{ fontSize: 13, color: '#555' }}>ou mais anos sem ministrar</span>
        </div>

        {/* Pesquisa */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <input type="search" placeholder="Nome ou sobrenome…" value={searchName}
            onChange={e => setSearchName(e.target.value)}
            style={{ flex: '1 1 160px', padding: '8px 12px', fontSize: 13, border: '1.5px solid #c5cdd7', borderRadius: 7 }} />
          <input type="search" placeholder="Telefone…" value={searchPhone}
            onChange={e => setSearchPhone(e.target.value)} inputMode="numeric"
            style={{ flex: '1 1 120px', padding: '8px 12px', fontSize: 13, border: '1.5px solid #c5cdd7', borderRadius: 7 }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={resetAll}
            style={{ background: 'none', border: '1px solid #c5cdd7', borderRadius: 6, padding: '6px 14px', fontSize: 12, color: '#777', cursor: 'pointer' }}>
            Limpar tudo
          </button>
        </div>
      </div>

      {/* Tabela resultado */}
      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e3a5f' }}>
            {title} — <span style={{ color: '#2d6a9f' }}>{filtered.length} registos</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => exportRelatorioPDF(title, filtered, showExtra)}
              style={{ background: '#c0392b', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              📥 PDF
            </button>
            <button onClick={() => exportRelatorioExcel(title, filtered, showExtra)}
              style={{ background: '#1e8a5e', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              📊 Excel
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#aaa', fontSize: 14 }}>
              Nenhum registo corresponde aos filtros seleccionados.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Nome</th>
                  <th style={thStyle}>Sobrenome</th>
                  <th style={thStyle}>Telefone</th>
                  <th style={thStyle}>Disponível</th>
                  {showExtra && <>
                    <th style={thStyle}>Últ. Cat.</th>
                    <th style={thStyle}>Anos Inat.</th>
                    <th style={thStyle}>Professor</th>
                    <th style={thStyle}>Pedagogia</th>
                    <th style={thStyle}>Cr. Especiais</th>
                    <th style={thStyle}>Alfabetização</th>
                    <th style={thStyle}>Faixa Etária</th>
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
                      <td style={tdStyle}>{c.expAlfabetizacao || '—'}</td>
                      <td style={tdStyle}>{c.faixaEtariaConforto || '—'}</td>
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
