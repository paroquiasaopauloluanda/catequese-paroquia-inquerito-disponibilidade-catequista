import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import AdminNav from './components/AdminNav';
import PrivateRoute from './components/PrivateRoute';
import InqueritoPage from './pages/InqueritoPage';
import AgradecimentoPage from './pages/AgradecimentoPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import RelatoriosPage from './pages/admin/RelatoriosPage';
import RegistosPage from './pages/admin/RegistosPage';
import ConfiguracaoPage from './pages/admin/ConfiguracaoPage';

function AdminLayout({ onLogout, children }: { onLogout: () => void; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', background: '#f5f7fa', display: 'flex', flexDirection: 'column' }}>
      <Header subtitle="Painel de Administração" />
      <AdminNav onLogout={onLogout} />
      <div style={{ flex: 1, overflowX: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const [isAuth, setIsAuth] = useState(() => !!sessionStorage.getItem('admin_token'));

  const handleLogin = () => setIsAuth(true);
  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    setIsAuth(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InqueritoPage />} />
        <Route path="/obrigado" element={<AgradecimentoPage />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />

        <Route
          path="/admin"
          element={
            <PrivateRoute isAuth={isAuth}>
              <AdminLayout onLogout={handleLogout}>
                <DashboardPage />
              </AdminLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/relatorios"
          element={
            <PrivateRoute isAuth={isAuth}>
              <AdminLayout onLogout={handleLogout}>
                <RelatoriosPage />
              </AdminLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/registos"
          element={
            <PrivateRoute isAuth={isAuth}>
              <AdminLayout onLogout={handleLogout}>
                <RegistosPage />
              </AdminLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/configuracao"
          element={
            <PrivateRoute isAuth={isAuth}>
              <AdminLayout onLogout={handleLogout}>
                <ConfiguracaoPage />
              </AdminLayout>
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
