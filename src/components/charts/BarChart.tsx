import React from 'react';

interface Bar {
  label: string;
  value: number;
  max: number;
  color?: string;
}

interface Props {
  bars: Bar[];
  height?: number;
}

const TOP_PAD = 22; // space above bars for value labels

export default function BarChart({ bars, height = 160 }: Props) {
  if (bars.length === 0) return <div style={{ color: '#999', fontSize: 13 }}>Sem dados</div>;

  const barW = Math.min(48, Math.floor(260 / bars.length) - 8);
  const gap = 10;
  const totalW = bars.length * (barW + gap) + gap;
  const svgH = TOP_PAD + height + 30; // top pad + bars + label area

  return (
    <svg
      viewBox={`0 0 ${totalW} ${svgH}`}
      style={{ width: '100%', maxWidth: totalW, display: 'block', overflow: 'visible' }}
    >
      {bars.map((bar, i) => {
        const value = Number(bar.value) || 0;
        const max = Number(bar.max) || 0;
        const pct = max > 0 ? value / max : 0;
        const barH = Math.max(0, Math.round(pct * height));
        const x = gap + i * (barW + gap);
        // y is from TOP_PAD baseline down
        const barY = TOP_PAD + (height - barH);
        const color = bar.color || '#2d6a9f';

        return (
          <g key={i}>
            {barH > 0 && (
              <rect x={x} y={barY} width={barW} height={barH} fill={color} rx={3} />
            )}
            {/* Value label — always rendered, inside viewBox thanks to TOP_PAD */}
            <text
              x={x + barW / 2}
              y={barY - 5}
              textAnchor="middle"
              fontSize={11}
              fontWeight="bold"
              fill={color}
            >
              {value}
            </text>
            {/* Category label at bottom */}
            <text
              x={x + barW / 2}
              y={TOP_PAD + height + 16}
              textAnchor="middle"
              fontSize={9}
              fill="#555"
            >
              {bar.label.length > 10 ? bar.label.slice(0, 10) + '…' : bar.label}
            </text>
          </g>
        );
      })}
      <line
        x1={0}
        y1={TOP_PAD + height}
        x2={totalW}
        y2={TOP_PAD + height}
        stroke="#dde"
        strokeWidth={1}
      />
    </svg>
  );
}
