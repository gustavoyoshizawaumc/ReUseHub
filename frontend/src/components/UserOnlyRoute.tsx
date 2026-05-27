import React from "react";
import { Navigate } from "react-router-dom";
import { authService } from "../services/authService";
import { isUsuarioOperacional } from "../utils/perfil";

interface UserOnlyRouteProps {
  children: React.ReactNode;
}

export const UserOnlyRoute: React.FC<UserOnlyRouteProps> = ({ children }) => {
  const token = authService.getToken();
  const user = authService.getUser();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (isUsuarioOperacional(user)) {
    return <Navigate to="/moderacao" replace />;
  }

  return <>{children}</>;
};
