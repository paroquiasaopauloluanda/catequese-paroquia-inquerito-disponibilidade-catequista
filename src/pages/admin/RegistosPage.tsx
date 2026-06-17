import React, { useEffect, useState } from 'react';
import { api } from '../../utils/apiClient';
import type { Catequista } from '../../types';
import { exportRelatorioExcel } from '../../utils/exportExcel';
import { exportRelatorioPDF, calcAnosInatividade } from '../../utils/exportPDF';
import {
  PROFESSOR_OPTIONS, PEDAGOGIA_OPTIONS, CRIANCAS_ESPECIAIS_OPTIONS,
  ALFABETIZACAO_OPTIONS, ALFABETIZACAO_EXCLUSIVE, FAIXA_ETARIA_OPTIONS,
} from '../../constants/inqueritoOptions';

const thS: React.CSSProperties = {
  background: '#1e3a5f', color: '#fff', padding: '9px 8px',
  fontSize: 10, fontWeight: 700, textAlign: 'left',
  whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none',
};
const tdS: React.CSSProperties = {
  padding: '8px 8px', fontSize: 11, borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle',
};

type SortKey = keyof Catequista;
const ANO_ATUAL = new Date().getFullYear();

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 9);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

// ---- Edit modal subcomponents ----

function RadioGroupEdit({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: readonly string[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {options.map(opt => (
        <label key={opt} style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          padding: '8px 12px', borderRadius: 7, cursor: 'pointer',
          border: `1.5px solid ${value === opt ? '#1e3a5f' : '#c5cdd7'}`,
          background: value === opt ? '#eef2f8' : '#fff',
          fontSize: 13, lineHeight: 1.4,
        }}>
          <input type="radio" checked={value === opt} onChange={() => onChange(opt)}
            style={{ accentColor: '#1e3a5f', width: 14, height: 14, marginTop: 2, flexShrink: 0 }} />
          {opt}
        </label>
      ))}
    </div>
  );
}

function CheckboxGroupEdit({ values, onChange, options, exclusive }: {
  values: string[]; onChange: (v: string[]) => void;
  options: readonly string[]; exclusive?: string;
}) {
  const toggle = (opt: string) => {
    if (exclusive && opt === exclusive) { onChange(values.includes(opt) ? [] : [opt]); return; }
    const next = values.includes(opt)
      ? values.filter(v => v !== opt)
      : [...values.filter(v => v !== exclusive), opt];
    onChange(next);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {options.map(opt => {
        const checked = values.includes(opt);
        return (
          <label key={opt} style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '8px 12px', borderRadius: 7, cursor: 'pointer',
            border: `1.5px solid ${checked ? '#1e3a5f' : '#c5cdd7'}`,
            background: checked ? '#eef2f8' : '#fff',
            fontSize: 13, lineHeight: 1.4,
          }}>
            <input type="checkbox" checked={checked} onChange={() => toggle(opt)}
              style={{ accentColor: '#1e3a5f', width: 14, height: 14, marginTop: 2, flexShrink: 0 }} />
            {opt}
          </label>
        );
      })}
    </div>
  );
}

interface EditState { record: Catequista; error: string }

function parseMulti(val: string): string[] {
  if (!val) return [];
  return val.split(',').map(v => v.trim()).filter(Boolean);
}

export default function RegistosPage() {
  const [all, setAll] = useState<Catequista[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDisp, setFilterDisp] = useState<'todos' | 'Sim' | 'Não'>('todos');
  const [sortKey, setSortKey] = useState<SortKey>('dataRegisto');
  const [sortAsc, setSortAsc] = useState(false);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Multi-select edit state (arrays for UI)
  const [editAlf, setEditAlf] = useState<string[]>([]);
  const [editFaixa, setEditFaixa] = useState<string[]>([]);

  const load = () => {
    setLoading(true);
    api.getAll().then(res => { if (res.ok) setAll(res.records); }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openEdit = (c: Catequista) => {
    setEditState({ record: { ...c }, error: '' });
    setEditAlf(parseMulti(c.expAlfabetizacao));
    setEditFaixa(parseMulti(c.faixaEtariaConforto));
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(true); }
  };

  const filtered = all
    .filter(c => {
      if (filterDisp !== 'todos' && c.disponivel !== filterDisp) return false;
      const q = search.toLowerCase();
      if (!q) return true;
      return (
        c.primeiroNome.toLowerCase().includes(q) ||
        c.ultimoNome.toLowerCase().includes(q) ||
        String(c.telefone || '').includes(q)
      );
    })
    .sort((a, b) => {
      const va = String(a[sortKey] ?? '').toLowerCase();
      const vb = String(b[sortKey] ?? '').toLowerCase();
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  const validateEdit = (): string => {
    if (!editState) return '';
    const r = editState.record;
    if (!r.primeiroNome.trim()) return 'Primeiro nome é obrigatório.';
    if (!r.ultimoNome.trim()) return 'Sobrenome é obrigatório.';
    const tel = String(r.telefone || '').replace(/\s/g, '');
    if (!/^\d{9}$/.test(tel)) return 'Telefone deve ter 9 dígitos (formato: 999 999 999).';
    if (r.disponivel === 'Sim') {
      const ano = parseInt(String(r.anoUltimaCatequese));
      if (!r.anoUltimaCatequese || isNaN(ano)) return 'Ano última catequese é obrigatório.';
      if (ano > ANO_ATUAL) return `Ano não pode ser superior a ${ANO_ATUAL}.`;
      if (ano < 1950) return 'Ano inválido.';
      if (!r.ehProfessor) return 'Seleccione o perfil de professor.';
      if (!r.temFormacaoPedagogia) return 'Seleccione a formação em pedagogia.';
      if (!r.expCriancasEspeciais) return 'Seleccione a experiência com crianças especiais.';
      if (editAlf.length === 0) return 'Seleccione a experiência em alfabetização.';
      if (editFaixa.length === 0) return 'Seleccione a faixa etária de conforto.';
    }
    return '';
  };

  const handleSave = async () => {
    if (!editState) return;
    const err = validateEdit();
    if (err) { setEditState({ ...editState, error: err }); return; }
    setSaving(true);
    const { id, ...data } = {
      ...editState.record,
      expAlfabetizacao: editAlf.join(', '),
      faixaEtariaConforto: editFaixa.join(', '),
    };
    await api.updateRecord(id, data);
    setSaving(false);
    setEditState(null);
    load();
  };

  const setField = (key: keyof Catequista, value: string) => {
    if (!editState) return;
    setEditState({ record: { ...editState.record, [key]: value }, error: '' });
  };

  const handleDelete = async (id: string) => {
    await api.deleteRecord(id);
    setConfirmDelete(null);
    load();
  };

  const sortArrow = (key: SortKey) => sortKey === key ? (sortAsc ? ' ▲' : ' ▼') : '';

  const labelS: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#1e3a5f', marginBottom: 6 };
  const inputS: React.CSSProperties = { width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid #c5cdd7', borderRadius: 7, boxSizing: 'border-box' };
  const subLabel: React.CSSProperties = { fontSize: 11, color: '#888', marginBottom: 5 };

  return (
    <div style={{ padding: '24px 16px', maxWidth: 1150, margin: '0 auto' }}>
      <h2 style={{ color: '#1e3a5f', fontSize: 18, marginBottom: 16 }}>Gestão de Registos</h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <input type="search" placeholder="Pesquisar nome ou telefone…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '9px 12px', fontSize: 14, borderRadius: 7, border: '1.5px solid #c5cdd7', flex: '1 1 200px', minWidth: 160 }} />
        <select value={filterDisp} onChange={e => setFilterDisp(e.target.value as typeof filterDisp)}
          style={{ padding: '9px 12px', fontSize: 14, borderRadius: 7, border: '1.5px solid #c5cdd7', background: '#fff' }}>
          <option value="todos">Todos</option>
          <option value="Sim">Disponíveis</option>
          <option value="Não">Não disponíveis</option>
        </select>
        <button onClick={() => exportRelatorioPDF('Todos os Registos', filtered, true)}
          style={{ background: '#c0392b', color: '#fff', border: 'none', borderRadius: 7, padding: '9px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
          📥 PDF
        </button>
        <button onClick={() => exportRelatorioExcel('Todos os Registos', filtered, true)}
          style={{ background: '#1e8a5e', color: '#fff', border: 'none', borderRadius: 7, padding: '9px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
          📊 Excel
        </button>
        <button onClick={load}
          style={{ background: '#f0f4f8', border: '1px solid #c5cdd7', borderRadius: 7, padding: '9px 14px', fontSize: 13, cursor: 'pointer' }}>
          🔄
        </button>
      </div>

      <div style={{ fontSize: 12, color: '#777', marginBottom: 10 }}>{filtered.length} de {all.length} registos</div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#777' }}>A carregar…</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 850 }}>
            <thead>
              <tr>
                {([
                  ['primeiroNome', 'Nome'], ['ultimoNome', 'Sobrenome'], ['telefone', 'Telefone'],
                  ['anoLetivo', 'Ano Let.'], ['disponivel', 'Disponível'],
                  ['anoUltimaCatequese', 'Últ. Cat.'], ['dataRegisto', 'Registo'],
                ] as [SortKey, string][]).map(([key, label]) => (
                  <th key={key} style={thS} onClick={() => handleSort(key)}>{label}{sortArrow(key)}</th>
                ))}
                <th style={{ ...thS, cursor: 'default' }}>Anos Inat.</th>
                <th style={{ ...thS, cursor: 'default' }}>Professor</th>
                <th style={{ ...thS, cursor: 'default' }}>Pedagogia</th>
                <th style={{ ...thS, cursor: 'default' }}>Cr. Espec.</th>
                <th style={{ ...thS, cursor: 'default' }}>Alfabetiz.</th>
                <th style={{ ...thS, cursor: 'default' }}>Faixa Etária</th>
                <th style={{ ...thS, cursor: 'default' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={14} style={{ ...tdS, textAlign: 'center', color: '#aaa', padding: 32 }}>Nenhum registo encontrado.</td></tr>
              ) : filtered.map((c, i) => (
                <tr key={c.id} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                  <td style={tdS}>{c.primeiroNome}</td>
                  <td style={tdS}>{c.ultimoNome}</td>
                  <td style={tdS}>{c.telefone}</td>
                  <td style={tdS}>{c.anoLetivo}</td>
                  <td style={{ ...tdS, color: c.disponivel === 'Sim' ? '#1e8a5e' : '#c0392b', fontWeight: 600 }}>{c.disponivel}</td>
                  <td style={tdS}>{c.anoUltimaCatequese || '—'}</td>
                  <td style={tdS}>{c.dataRegisto ? new Date(c.dataRegisto).toLocaleDateString('pt-PT') : '—'}</td>
                  <td style={{ ...tdS, textAlign: 'center', fontWeight: 600 }}>{calcAnosInatividade(c.anoUltimaCatequese)}</td>
                  <td style={tdS}>{c.ehProfessor || '—'}</td>
                  <td style={tdS}>{c.temFormacaoPedagogia || '—'}</td>
                  <td style={tdS}>{c.expCriancasEspeciais || '—'}</td>
                  <td style={tdS}>{c.expAlfabetizacao || '—'}</td>
                  <td style={tdS}>{c.faixaEtariaConforto || '—'}</td>
                  <td style={tdS}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button onClick={() => openEdit(c)}
                        style={{ background: '#f0f4f8', border: '1px solid #c5cdd7', borderRadius: 5, padding: '4px 7px', fontSize: 11, cursor: 'pointer' }}>
                        ✏️
                      </button>
                      <button onClick={() => setConfirmDelete(c.id)}
                        style={{ background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 5, padding: '4px 7px', fontSize: 11, cursor: 'pointer', color: '#b91c1c' }}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Edição */}
      {editState && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 480, width: '100%', maxHeight: '92dvh', overflowY: 'auto' }}>
            <h3 style={{ color: '#1e3a5f', marginBottom: 18 }}>Editar Registo</h3>

            <div style={{ marginBottom: 14 }}>
              <label style={labelS}>Primeiro nome *</label>
              <input style={inputS} type="text" value={editState.record.primeiroNome}
                onChange={e => setField('primeiroNome', e.target.value)} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelS}>Sobrenome *</label>
              <input style={inputS} type="text" value={editState.record.ultimoNome}
                onChange={e => setField('ultimoNome', e.target.value)} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelS}>Telefone * (999 999 999)</label>
              <input style={inputS} type="tel" inputMode="numeric" maxLength={11}
                value={String(editState.record.telefone || '')}
                onChange={e => setField('telefone', formatPhone(e.target.value))}
                placeholder="912 345 678" />
            </div>

            {editState.record.disponivel === 'Sim' && (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelS}>Ano última catequese * (máx. {ANO_ATUAL})</label>
                  <input style={inputS} type="number" inputMode="numeric"
                    min={1950} max={ANO_ATUAL}
                    value={String(editState.record.anoUltimaCatequese || '')}
                    onChange={e => setField('anoUltimaCatequese', e.target.value.replace(/\D/g, ''))}
                    onKeyDown={e => { if (!/[\dBackspaceArrowLeftArrowRightDeleteTab]/.test(e.key) && !e.ctrlKey && !e.metaKey) e.preventDefault(); }}
                    placeholder={String(ANO_ATUAL)} />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelS}>É Professor? *</label>
                  <RadioGroupEdit value={editState.record.ehProfessor} onChange={v => setField('ehProfessor', v)} options={PROFESSOR_OPTIONS} />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelS}>Tem Formação em Pedagogia? *</label>
                  <RadioGroupEdit value={editState.record.temFormacaoPedagogia} onChange={v => setField('temFormacaoPedagogia', v)} options={PEDAGOGIA_OPTIONS} />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelS}>Experiência com Crianças Especiais? *</label>
                  <RadioGroupEdit value={editState.record.expCriancasEspeciais} onChange={v => setField('expCriancasEspeciais', v)} options={CRIANCAS_ESPECIAIS_OPTIONS} />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelS}>Experiência em Alfabetização? *</label>
                  <p style={subLabel}>Seleccione todas as que se aplicam.</p>
                  <CheckboxGroupEdit values={editAlf} onChange={setEditAlf}
                    options={ALFABETIZACAO_OPTIONS} exclusive={ALFABETIZACAO_EXCLUSIVE} />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelS}>Faixa etária de conforto? *</label>
                  <p style={subLabel}>Seleccione todas as que se aplicam.</p>
                  <CheckboxGroupEdit values={editFaixa} onChange={setEditFaixa} options={FAIXA_ETARIA_OPTIONS} />
                </div>
              </>
            )}

            {editState.error && (
              <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#b91c1c' }}>
                {editState.error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 1, background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 7, padding: '11px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {saving ? 'A guardar…' : 'Guardar'}
              </button>
              <button onClick={() => setEditState(null)}
                style={{ flex: 1, background: '#f0f4f8', border: '1px solid #c5cdd7', borderRadius: 7, padding: '11px', fontSize: 14, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, maxWidth: 360, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ color: '#b91c1c', marginBottom: 10 }}>Remover registo?</h3>
            <p style={{ color: '#555', fontSize: 14, marginBottom: 24 }}>Esta acção é irreversível.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => handleDelete(confirmDelete)}
                style={{ flex: 1, background: '#b91c1c', color: '#fff', border: 'none', borderRadius: 7, padding: '11px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Remover
              </button>
              <button onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, background: '#f0f4f8', border: '1px solid #c5cdd7', borderRadius: 7, padding: '11px', fontSize: 14, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
