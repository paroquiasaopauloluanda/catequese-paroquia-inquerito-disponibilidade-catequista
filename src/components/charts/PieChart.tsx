import React from 'react';

interface Slice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  slices: Slice[];
  size?: number;
}

export default function PieChart({ slices, size = 180 }: Props) {
  // Ensure numeric values
  const normalized = slices.map(s => ({ ...s, value: Number(s.value) || 0 }));
  const total = normalized.reduce((s, sl) => s + sl.value, 0);

  if (total === 0) return (
    <div>
      <div style={{ color: '#999', fontSize: 13 }}>Sem dados</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {slices.map((sl, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: sl.color }} />
            <span>{sl.label} (0)</span>
          </div>
        ))}
      </div>
    </div>
  );

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 10;

  const nonZero = normalized.filter(sl => sl.value > 0);

  const svgContent: React.ReactNode[] = [];

  if (nonZero.length === 1) {
    // Full circle — SVG arc with same start/end renders nothing; use <circle>
    const sl = nonZero[0];
    svgContent.push(
      <circle key="c" cx={cx} cy={cy} r={r} fill={sl.color} />,
      <text
        key="t"
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={14}
        fontWeight="bold"
        fill="#fff"
      >
        {sl.value}
      </text>
    );
  } else {
    let cumAngle = -Math.PI / 2;
    nonZero.forEach((sl, i) => {
      const angle = (sl.value / total) * 2 * Math.PI;
      const startAngle = cumAngle;
      const endAngle = cumAngle + angle;

      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const largeArc = angle > Math.PI ? 1 : 0;

      const midAngle = startAngle + angle / 2;
      const lx = cx + r * 0.65 * Math.cos(midAngle);
      const ly = cy + r * 0.65 * Math.sin(midAngle);

      svgContent.push(
        <path
          key={`p${i}`}
          d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
          fill={sl.color}
          stroke="#fff"
          strokeWidth={2}
        />,
        <text
          key={`t${i}`}
          x={lx}
          y={ly}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={12}
          fontWeight="bold"
          fill="#fff"
        >
          {sl.value}
        </text>
      );

      cumAngle = endAngle;
    });
  }

  return (
    <div>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: 'visible', display: 'block' }}
      >
        {svgContent}
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {normalized.map((sl, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: sl.color }} />
            <span>{sl.label} ({sl.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
