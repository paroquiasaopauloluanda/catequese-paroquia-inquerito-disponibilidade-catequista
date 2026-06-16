import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

export default function AgradecimentoPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100dvh', background: '#f5f7fa', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 16px',
      }}>
        <div style={{
          background: '#fff', borderRadius: 16, padding: '40px 28px',
          maxWidth: 440, width: '100%', textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🙏</div>
          <h1 style={{ color: '#1e3a5f', fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
            Obrigado pela sua resposta!
          </h1>
          <p style={{ color: '#555', lineHeight: 1.7, fontSize: 15, marginBottom: 24 }}>
            A sua resposta foi registada com sucesso. A{' '}
            <strong>Comissão de Catequese</strong> da Paróquia de São Paulo
            agradece a sua participação e entrará em contacto brevemente.
          </p>
          <div style={{
            background: '#f0f4f8', borderRadius: 8, padding: '14px 16px',
            fontSize: 13, color: '#1e3a5f', marginBottom: 24,
          }}>
            Que Deus abençoe o vosso serviço na catequese!
          </div>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none', border: '2px solid #c5cdd7',
              borderRadius: 8, padding: '10px 24px',
              fontSize: 14, color: '#555', cursor: 'pointer',
            }}
          >
            Voltar ao início
          </button>
        </div>
      </div>
    </div>
  );
}
