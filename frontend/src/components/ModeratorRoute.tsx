import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

interface ModeratorRouteProps {
  children: React.ReactNode;
}

export const ModeratorRoute: React.FC<ModeratorRouteProps> = ({ children }) => {
  const user = authService.getUser();

  if (!user) return <Navigate to="/login" replace />;

  const perfil = user.perfil as string;
  if (perfil !== 'MODERADOR' && perfil !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};