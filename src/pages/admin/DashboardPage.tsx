import React, { useEffect, useState } from 'react';
import { api } from '../../utils/apiClient';
import type { Stats } from '../../types';
import PieChart from '../../components/charts/PieChart';
import BarChart from '../../components/charts/BarChart';
import { exportStatsPDF } from '../../utils/exportPDF';
import {
  PROFESSOR_OPTIONS, PEDAGOGIA_OPTIONS, CRIANCAS_ESPECIAIS_OPTIONS,
  ALFABETIZACAO_OPTIONS, FAIXA_ETARIA_OPTIONS,
  PROFESSOR_CHART_LABELS, PEDAGOGIA_CHART_LABELS,
} from '../../constants/inqueritoOptions';

const COLORS = ['#1e8a5e', '#c0392b', '#2d6a9f', '#d4af37', '#7c3aed', '#e67e22'];

function card(label: string, value: string | number, sub?: string, color = '#1e3a5f') {
  return (
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
}

function DistSection({
  title, dist, options, chartLabels, max,
}: {
  title: string;
  dist: Record<string, number>;
  options: readonly string[];
  chartLabels?: Record<string, string>;
  max: number;
}) {
  const bars = options.map((opt, i) => ({
    label: (chartLabels?.[opt] ?? opt).slice(0, 12),
    value: dist[opt] || 0,
    max,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '18px 20px', marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <h3 style={{ color: '#1e3a5f', fontSize: 14, fontWeight: 700, marginBottom: 14 }}>{title}</h3>
      <BarChart bars={bars} height={130} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '4px 12px', marginTop: 12 }}>
        {options.map((opt, i) => (
          <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#555' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
            <span><strong>{dist[opt] || 0}</strong> — {opt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

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

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#777' }}>A carregar estatísticas…</div>;
  if (error || !stats) return <div style={{ padding: 40, textAlign: 'center', color: '#b91c1c' }}>{error || 'Sem dados'}</div>;

  const faixas = stats.faixasInatividade;
  const faixaBars = [
    { label: 'Ativo', value: faixas['0'] || 0, max: stats.disponiveis, color: '#1e8a5e' },
    { label: '1-2 anos', value: faixas['1-2'] || 0, max: stats.disponiveis, color: '#2d6a9f' },
    { label: '3-5 anos', value: faixas['3-5'] || 0, max: stats.disponiveis, color: '#d4af37' },
    { label: '6-10 anos', value: faixas['6-10'] || 0, max: stats.disponiveis, color: '#c0392b' },
    { label: '10+ anos', value: faixas['10+'] || 0, max: stats.disponiveis, color: '#555' },
  ];

  const totalPct = (n: number) => stats.total > 0 ? `${Math.round((n / stats.total) * 100)}%` : '0%';

  return (
    <div style={{ padding: '24px 16px', maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: '#1e3a5f', fontSize: 18, margin: 0 }}>Estatísticas — {config.anoLetivo}</h2>
        <button
          onClick={() => exportStatsPDF(stats, config.anoLetivo)}
          style={{ background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 7, padding: '9px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
        >
          📥 PDF
        </button>
      </div>

      {/* Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {card('Total de inscritos', stats.total, undefined, '#1e3a5f')}
        {card('Disponíveis', stats.disponiveis, totalPct(stats.disponiveis), '#1e8a5e')}
        {card('Não disponíveis', stats.naoDisponiveis, totalPct(stats.naoDisponiveis), '#c0392b')}
      </div>

      {/* Disponibilidade */}
      <div style={{ background: '#fff', borderRadius: 10, padding: '18px 20px', marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h3 style={{ color: '#1e3a5f', fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Disponibilidade</h3>
        <PieChart slices={[
          { label: 'Disponíveis', value: stats.disponiveis, color: '#1e8a5e' },
          { label: 'Não disponíveis', value: stats.naoDisponiveis, color: '#c0392b' },
        ]} />
      </div>

      <p style={{ fontSize: 12, color: '#888', marginBottom: 14, fontStyle: 'italic' }}>
        Indicadores abaixo calculados sobre {stats.disponiveis} disponíveis.
      </p>

      {/* Distribuições */}
      <DistSection
        title="É Professor?"
        dist={stats.ehProfessorDist}
        options={PROFESSOR_OPTIONS}
        chartLabels={PROFESSOR_CHART_LABELS}
        max={stats.disponiveis}
      />

      <DistSection
        title="Formação em Pedagogia"
        dist={stats.pedagogiaDist}
        options={PEDAGOGIA_OPTIONS}
        chartLabels={PEDAGOGIA_CHART_LABELS}
        max={stats.disponiveis}
      />

      <DistSection
        title="Experiência com Crianças Especiais"
        dist={stats.criancasEspeciaisDist}
        options={CRIANCAS_ESPECIAIS_OPTIONS}
        max={stats.disponiveis}
      />

      <DistSection
        title="Experiência em Alfabetização (multi-resposta)"
        dist={stats.alfabetizacaoDist}
        options={ALFABETIZACAO_OPTIONS}
        max={stats.disponiveis}
      />

      <DistSection
        title="Faixa Etária de Conforto (multi-resposta)"
        dist={stats.faixaEtariaDist}
        options={FAIXA_ETARIA_OPTIONS}
        max={stats.disponiveis}
      />

      {/* Inatividade */}
      <div style={{ background: '#fff', borderRadius: 10, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h3 style={{ color: '#1e3a5f', fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
          Distribuição por Anos de Inatividade (disponíveis)
        </h3>
        <BarChart bars={faixaBars} height={130} />
      </div>
    </div>
  );
}
