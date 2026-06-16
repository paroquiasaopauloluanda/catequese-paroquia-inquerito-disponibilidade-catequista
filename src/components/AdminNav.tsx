import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

interface Props {
  onLogout: () => void;
}

const links = [
  { to: '/admin', label: 'Estatísticas', icon: '📊' },
  { to: '/admin/relatorios', label: 'Relatórios', icon: '📄' },
  { to: '/admin/registos', label: 'Registos', icon: '📋' },
  { to: '/admin/configuracao', label: 'Configuração', icon: '⚙️' },
];

export default function AdminNav({ onLogout }: Props) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav style={{
      background: '#f0f4f8',
      borderBottom: '1px solid #dde3ea',
      display: 'flex',
      alignItems: 'center',
      overflowX: 'auto',
      padding: '0 8px',
    }}>
      {links.map(l => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.to === '/admin'}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '12px 14px',
            fontSize: 13,
            fontWeight: isActive ? 700 : 400,
            color: isActive ? '#1e3a5f' : '#555',
            borderBottom: isActive ? '3px solid #1e3a5f' : '3px solid transparent',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          })}
        >
          <span>{l.icon}</span>
          <span>{l.label}</span>
        </NavLink>
      ))}
      <button
        onClick={handleLogout}
        style={{
          marginLeft: 'auto',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '12px 14px',
          fontSize: 13,
          color: '#c0392b',
          whiteSpace: 'nowrap',
        }}
      >
        Sair
      </button>
    </nav>
  );
}
