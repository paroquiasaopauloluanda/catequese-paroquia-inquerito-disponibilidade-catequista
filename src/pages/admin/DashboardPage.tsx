import React, { useEffect, useState } from 'react';
import { api } from '../../utils/apiClient';
import type { Stats } from '../../types';
import PieChart from '../../components/charts/PieChart';
import BarChart from '../../components/charts/BarChart';
import { exportStatsPDF } from '../../utils/exportPDF';

const card = (label: string, value: string | number, sub?: string, color = '#1e3a5f'): React.ReactNode => (
  <div style={{
    background: '#fff', borderRadius: 10, padding: '20px 18px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)', textAlign: 'center',
    borderTop: `4px solid ${color}`,
  }}>
    <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
    <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [config, setConfig] = useState<{ anoLetivo: string }>({ anoLetivo: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.getStats(), api.getConfig()])
      .then(([sr, cr]) => {
        if (sr.ok) setStats(sr.stats);
        if (cr.ok) setConfig(cr.config);
      })
      .catch(() => setError('Erro ao carregar estatísticas.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#777' }}>A carregar estatísticas…</div>
  );

  if (error || !stats) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#b91c1c' }}>{error || 'Sem dados'}</div>
  );

  const expBars = [
    { label: 'Professores', value: stats.professores, max: stats.disponiveis, color: '#2d6a9f' },
    { label: 'Pedagogia', value: stats.pedagogia, max: stats.disponiveis, color: '#1e8a5e' },
    { label: 'Cri. Especiais', value: stats.criancasEspeciais, max: stats.disponiveis, color: '#7c3aed' },
    { label: 'Alf. Adultos', value: stats.alfAdultos, max: stats.disponiveis, color: '#c0392b' },
    { label: 'Alf. Crianças', value: stats.alfCriancas, max: stats.disponiveis, color: '#d4af37' },
  ];

  const faixas = stats.faixasInatividade;
  const faixaBars = [
    { label: 'Ativo', value: faixas['0'] || 0, max: stats.disponiveis, color: '#1e8a5e' },
    { label: '1-2 anos', value: faixas['1-2'] || 0, max: stats.disponiveis, color: '#2d6a9f' },
    { label: '3-5 anos', value: faixas['3-5'] || 0, max: stats.disponiveis, color: '#d4af37' },
    { label: '6-10 anos', value: faixas['6-10'] || 0, max: stats.disponiveis, color: '#c0392b' },
    { label: '10+ anos', value: faixas['10+'] || 0, max: stats.disponiveis, color: '#555' },
  ];

  const section = (title: string) => (
    <h3 style={{ color: '#1e3a5f', fontSize: 15, fontWeight: 700, marginBottom: 14, marginTop: 0 }}>{title}</h3>
  );

  return (
    <div style={{ padding: '24px 16px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: '#1e3a5f', fontSize: 18, margin: 0 }}>
          Estatísticas — {config.anoLetivo}
        </h2>
        <button
          onClick={() => exportStatsPDF(stats, config.anoLetivo)}
          style={{
            background: '#1e3a5f', color: '#fff', border: 'none',
            borderRadius: 7, padding: '9px 14px', fontSize: 13,
            cursor: 'pointer', fontWeight: 600,
          }}
        >
          📥 PDF
        </button>
      </div>

      {/* Cards resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        {card('Total de inscritos', stats.total, undefined, '#1e3a5f')}
        {card('Disponíveis', stats.disponiveis, `${Math.round((stats.disponiveis / stats.total) * 100) || 0}%`, '#1e8a5e')}
        {card('Não disponíveis', stats.naoDisponiveis, `${Math.round((stats.naoDisponiveis / stats.total) * 100) || 0}%`, '#c0392b')}
      </div>

      {/* Disponíveis vs Não */}
      <div style={{ background: '#fff', borderRadius: 10, padding: '20px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        {section('Disponibilidade')}
        <PieChart slices={[
          { label: 'Disponíveis', value: stats.disponiveis, color: '#1e8a5e' },
          { label: 'Não disponíveis', value: stats.naoDisponiveis, color: '#c0392b' },
        ]} />
      </div>

      {/* Experiência */}
      <div style={{ background: '#fff', borderRadius: 10, padding: '20px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        {section('Indicadores de Experiência (sobre disponíveis)')}
        <BarChart bars={expBars} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 16 }}>
          {[
            { label: 'Professores', v: stats.professores, pct: stats.professorePct },
            { label: 'Pedagogia', v: stats.pedagogia, pct: stats.pedagogiaPct },
            { label: 'Crianças especiais', v: stats.criancasEspeciais, pct: stats.criancasEspeciaisPct },
            { label: 'Alf. adultos', v: stats.alfAdultos, pct: stats.alfAdultosPct },
            { label: 'Alf. crianças', v: stats.alfCriancas, pct: stats.alfCriancasPct },
          ].map(item => (
            <div key={item.label} style={{ fontSize: 12, color: '#555' }}>
              <strong>{item.label}:</strong> {item.v} ({item.pct}%)
            </div>
          ))}
        </div>
      </div>

      {/* Inatividade */}
      <div style={{ background: '#fff', borderRadius: 10, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        {section('Distribuição por Anos de Inatividade (disponíveis)')}
        <BarChart bars={faixaBars} />
      </div>
    </div>
  );
}
