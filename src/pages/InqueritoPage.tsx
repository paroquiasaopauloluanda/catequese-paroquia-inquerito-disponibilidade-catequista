import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { api } from '../utils/apiClient';
import type { Config, InqueritoForm } from '../types';
import {
  PROFESSOR_OPTIONS,
  PEDAGOGIA_OPTIONS,
  CRIANCAS_ESPECIAIS_OPTIONS,
  ALFABETIZACAO_OPTIONS,
  ALFABETIZACAO_EXCLUSIVE,
  FAIXA_ETARIA_OPTIONS,
} from '../constants/inqueritoOptions';

const empty: InqueritoForm = {
  primeiroNome: '', ultimoNome: '', telefone: '',
  disponivel: '', anoUltimaCatequese: '',
  ehProfessor: '', temFormacaoPedagogia: '', expCriancasEspeciais: '',
  expAlfabetizacao: [], faixaEtariaConforto: [],
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', fontSize: 16,
  border: '1.5px solid #c5cdd7', borderRadius: 8,
  boxSizing: 'border-box', background: '#fff',
  outline: 'none', WebkitAppearance: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: 6, fontWeight: 600,
  fontSize: 14, color: '#1e3a5f',
};

const fieldStyle: React.CSSProperties = { marginBottom: 20 };

// Single-select radio with N options, vertical layout
function RadioGroup({
  name, value, onChange, options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
      {options.map(opt => (
        <label
          key={opt}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            fontSize: 14, cursor: 'pointer',
            padding: '10px 14px',
            border: `2px solid ${value === opt ? '#1e3a5f' : '#c5cdd7'}`,
            borderRadius: 8,
            background: value === opt ? '#eef2f8' : '#fff',
            lineHeight: 1.4,
          }}
        >
          <input
            type="radio"
            name={name}
            value={opt}
            checked={value === opt}
            onChange={() => onChange(opt)}
            style={{ accentColor: '#1e3a5f', width: 16, height: 16, marginTop: 2, flexShrink: 0 }}
          />
          {opt}
        </label>
      ))}
    </div>
  );
}

// Multi-select checkboxes with optional exclusive option
function CheckboxGroup({
  values, onChange, options, exclusive,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  options: readonly string[];
  exclusive?: string; // value that is mutually exclusive with others
}) {
  const toggle = (opt: string) => {
    if (exclusive && opt === exclusive) {
      onChange(values.includes(opt) ? [] : [opt]);
      return;
    }
    let next = values.includes(opt)
      ? values.filter(v => v !== opt)
      : [...values.filter(v => v !== exclusive), opt];
    onChange(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
      {options.map(opt => {
        const checked = values.includes(opt);
        return (
          <label
            key={opt}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              fontSize: 14, cursor: 'pointer',
              padding: '10px 14px',
              border: `2px solid ${checked ? '#1e3a5f' : '#c5cdd7'}`,
              borderRadius: 8,
              background: checked ? '#eef2f8' : '#fff',
              lineHeight: 1.4,
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(opt)}
              style={{ accentColor: '#1e3a5f', width: 16, height: 16, marginTop: 2, flexShrink: 0 }}
            />
            {opt}
          </label>
        );
      })}
    </div>
  );
}

// Simple Sim/Não radio (for disponibilidade)
function SimNaoGroup({ name, value, onChange }: { name: string; value: string; onChange: (v: 'Sim' | 'Não') => void }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
      {(['Sim', 'Não'] as const).map(opt => (
        <label
          key={opt}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 15, cursor: 'pointer',
            padding: '10px 24px',
            border: `2px solid ${value === opt ? '#1e3a5f' : '#c5cdd7'}`,
            borderRadius: 8,
            background: value === opt ? '#eef2f8' : '#fff',
            flex: 1, justifyContent: 'center',
          }}
        >
          <input
            type="radio"
            name={name}
            value={opt}
            checked={value === opt}
            onChange={() => onChange(opt)}
            style={{ accentColor: '#1e3a5f', width: 16, height: 16 }}
          />
          {opt}
        </label>
      ))}
    </div>
  );
}

export default function InqueritoPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<InqueritoForm>(empty);
  const [config, setConfig] = useState<Config>({ anoLetivo: '2026/2027', dataAbertura: '', dataFecho: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    api.getConfig().then(res => {
      if (res.ok) {
        setConfig(res.config);
        const now = new Date();
        if (res.config.dataAbertura && new Date(res.config.dataAbertura) > now) setClosed(true);
        if (res.config.dataFecho && new Date(res.config.dataFecho) < now) setClosed(true);
      }
    }).catch(() => {});
  }, []);

  const set = <K extends keyof InqueritoForm>(k: K, v: InqueritoForm[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const validate = (): string => {
    if (!form.primeiroNome.trim()) return 'Primeiro nome é obrigatório.';
    if (!form.ultimoNome.trim()) return 'Sobrenome é obrigatório.';
    const tel = form.telefone.replace(/\s/g, '');
    if (!/^\d{9}$/.test(tel)) return 'Telefone deve ter 9 dígitos (ex: 912 345 678).';
    if (!form.disponivel) return 'Indique a sua disponibilidade.';
    if (form.disponivel === 'Sim') {
      if (!form.anoUltimaCatequese) return 'Indique o ano em que ministrou catequese pela última vez.';
      const ano = parseInt(form.anoUltimaCatequese);
      if (isNaN(ano) || ano > new Date().getFullYear()) return 'O ano não pode ser superior ao ano atual.';
      if (ano < 1950) return 'Ano inválido.';
      if (!form.ehProfessor) return 'Indique o seu perfil profissional.';
      if (!form.temFormacaoPedagogia) return 'Indique a sua formação em pedagogia.';
      if (!form.expCriancasEspeciais) return 'Indique a sua experiência com crianças especiais.';
      if (form.expAlfabetizacao.length === 0) return 'Indique a sua experiência em alfabetização.';
      if (form.faixaEtariaConforto.length === 0) return 'Indique com que faixas etárias se sente mais confortável.';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setSubmitting(true);

    try {
      const dupRes = await api.checkDuplicate(form.primeiroNome.trim(), form.ultimoNome.trim());
      if (dupRes.exists) {
        setError('Já existe uma resposta com este nome e sobrenome. Contacte a Comissão de Catequese se precisar de corrigir os seus dados.');
        setSubmitting(false);
        return;
      }

      const eDisp = form.disponivel === 'Sim';
      const payload = {
        primeiroNome: form.primeiroNome.trim(),
        ultimoNome: form.ultimoNome.trim(),
        telefone: form.telefone.replace(/\s/g, ''),
        anoLetivo: config.anoLetivo,
        disponivel: eDisp,
        anoUltimaCatequese: eDisp ? parseInt(form.anoUltimaCatequese) : null,
        ehProfessor: eDisp ? form.ehProfessor : '',
        temFormacaoPedagogia: eDisp ? form.temFormacaoPedagogia : '',
        expCriancasEspeciais: eDisp ? form.expCriancasEspeciais : '',
        expAlfabetizacao: eDisp ? form.expAlfabetizacao.join(', ') : '',
        faixaEtariaConforto: eDisp ? form.faixaEtariaConforto.join(', ') : '',
      };

      const res = await api.submit(payload);
      if (res.ok) {
        navigate('/obrigado');
      } else if (res.error === 'duplicado') {
        setError('Já existe uma resposta com este nome e sobrenome. Contacte a Comissão de Catequese se precisar de corrigir os seus dados.');
      } else {
        setError('Ocorreu um erro ao enviar. Tente novamente.');
      }
    } catch {
      setError('Erro de ligação. Verifique a sua ligação à internet e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (closed) {
    return (
      <div style={{ minHeight: '100dvh', background: '#f5f7fa' }}>
        <Header subtitle="Inquérito de Disponibilidade" />
        <div style={{ padding: 24, textAlign: 'center', maxWidth: 480, margin: '40px auto' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ color: '#1e3a5f' }}>Período de inscrição encerrado</h2>
          <p style={{ color: '#555', lineHeight: 1.6 }}>
            O período de inscrição para o inquérito de disponibilidade não está disponível de momento.
            Contacte a Comissão de Catequese para mais informações.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#f5f7fa', display: 'flex', flexDirection: 'column' }}>
      <Header subtitle="Inquérito de Disponibilidade" />

      <div style={{ padding: '24px 16px 40px', maxWidth: 560, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{
          background: '#fff', borderRadius: 12, padding: '28px 24px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}>
          <p style={{ color: '#555', lineHeight: 1.6, marginBottom: 28, fontSize: 14 }}>
            Preencha o formulário abaixo para indicar a sua disponibilidade para o ano letivo{' '}
            <strong style={{ color: '#1e3a5f' }}>{config.anoLetivo}</strong>.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Parte 1 */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Primeiro nome *</label>
              <input style={inputStyle} type="text" value={form.primeiroNome}
                onChange={e => set('primeiroNome', e.target.value)}
                placeholder="O seu primeiro nome" autoComplete="given-name" />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Sobrenome *</label>
              <input style={inputStyle} type="text" value={form.ultimoNome}
                onChange={e => set('ultimoNome', e.target.value)}
                placeholder="O seu último nome" autoComplete="family-name" />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Telefone *</label>
              <input style={inputStyle} type="tel" value={form.telefone}
                onChange={e => set('telefone', e.target.value)}
                placeholder="912 345 678" inputMode="numeric" autoComplete="tel" />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>
                Está disponível para ministrar catequese no ano letivo {config.anoLetivo}? *
              </label>
              <SimNaoGroup name="disponivel" value={form.disponivel} onChange={v => set('disponivel', v)} />
            </div>

            {/* Parte 2 — só se disponível */}
            {form.disponivel === 'Sim' && (
              <>
                <hr style={{ border: 'none', borderTop: '1px solid #e8ecf0', margin: '8px 0 24px' }} />
                <p style={{ fontSize: 13, color: '#777', marginBottom: 20 }}>
                  Por favor responda às perguntas seguintes sobre o seu perfil.
                </p>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Ano em que ministrou catequese pela última vez *</label>
                  <input style={inputStyle} type="number" value={form.anoUltimaCatequese}
                    onChange={e => set('anoUltimaCatequese', e.target.value)}
                    placeholder={String(new Date().getFullYear())}
                    min={1950} max={new Date().getFullYear()} inputMode="numeric" />
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>É Professor? *</label>
                  <RadioGroup
                    name="ehProfessor"
                    value={form.ehProfessor}
                    onChange={v => set('ehProfessor', v)}
                    options={PROFESSOR_OPTIONS}
                  />
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Tem Formação em Pedagogia? *</label>
                  <RadioGroup
                    name="temFormacaoPedagogia"
                    value={form.temFormacaoPedagogia}
                    onChange={v => set('temFormacaoPedagogia', v)}
                    options={PEDAGOGIA_OPTIONS}
                  />
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Tem Experiência com Crianças Especiais? *</label>
                  <RadioGroup
                    name="expCriancasEspeciais"
                    value={form.expCriancasEspeciais}
                    onChange={v => set('expCriancasEspeciais', v)}
                    options={CRIANCAS_ESPECIAIS_OPTIONS}
                  />
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Experiência em Alfabetização? *</label>
                  <p style={{ fontSize: 12, color: '#777', marginBottom: 6, marginTop: -2 }}>
                    Seleccione todas as que se aplicam.
                  </p>
                  <CheckboxGroup
                    values={form.expAlfabetizacao}
                    onChange={v => set('expAlfabetizacao', v)}
                    options={ALFABETIZACAO_OPTIONS}
                    exclusive={ALFABETIZACAO_EXCLUSIVE}
                  />
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Com que faixa etária se sente mais confortável? *</label>
                  <p style={{ fontSize: 12, color: '#777', marginBottom: 6, marginTop: -2 }}>
                    Seleccione todas as que se aplicam.
                  </p>
                  <CheckboxGroup
                    values={form.faixaEtariaConforto}
                    onChange={v => set('faixaEtariaConforto', v)}
                    options={FAIXA_ETARIA_OPTIONS}
                  />
                </div>
              </>
            )}

            {error && (
              <div style={{
                background: '#fff5f5', border: '1px solid #fca5a5',
                borderRadius: 8, padding: '12px 14px', marginBottom: 16,
                fontSize: 13, color: '#b91c1c', lineHeight: 1.5,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !form.disponivel}
              style={{
                width: '100%', padding: '14px',
                background: submitting || !form.disponivel ? '#9bb3cc' : '#1e3a5f',
                color: '#fff', border: 'none', borderRadius: 8,
                fontSize: 16, fontWeight: 700,
                cursor: submitting || !form.disponivel ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'A enviar…' : 'Submeter'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/login" style={{ color: '#9bb3cc', fontSize: 12, textDecoration: 'none' }}>
            Área da Comissão
          </a>
        </div>
      </div>
    </div>
  );
}
