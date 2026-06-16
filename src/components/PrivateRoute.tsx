import React from 'react';
import { Navigate } from 'react-router-dom';

interface Props {
  isAuth: boolean;
  children: React.ReactNode;
}

export default function PrivateRoute({ isAuth, children }: Props) {
  if (!isAuth) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
