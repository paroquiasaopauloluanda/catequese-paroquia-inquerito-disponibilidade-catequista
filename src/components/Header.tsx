import React from 'react';

interface Props {
  subtitle?: string;
}

export default function Header({ subtitle }: Props) {
  return (
    <header style={{
      background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%)',
      color: '#fff',
      textAlign: 'center',
      padding: '24px 16px 20px',
      borderBottom: '3px solid #d4af37',
    }}>
      <div style={{ fontSize: 11, letterSpacing: 1, opacity: 0.85, marginBottom: 4 }}>
        VIGARARIA DE FÁTIMA
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 0.5, marginBottom: 2 }}>
        Paróquia de São Paulo
      </div>
      <div style={{ fontSize: 12, opacity: 0.9, marginBottom: subtitle ? 8 : 0 }}>
        Comissão de Catequese
      </div>
      {subtitle && (
        <div style={{
          fontSize: 13,
          background: 'rgba(255,255,255,0.15)',
          borderRadius: 6,
          padding: '4px 12px',
          display: 'inline-block',
          marginTop: 4,
        }}>
          {subtitle}
        </div>
      )}
    </header>
  );
}
