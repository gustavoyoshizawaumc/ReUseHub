import React from "react";
import { Navigate } from "react-router-dom";
import { authService } from "../services/authService";
import { isUsuarioOperacional } from "../utils/perfil";

interface MarketplaceOnlyRouteProps {
  children: React.ReactNode;
}

export const MarketplaceOnlyRoute: React.FC<MarketplaceOnlyRouteProps> = ({ children }) => {
  const user = authService.getUser();

  if (isUsuarioOperacional(user)) {
    return <Navigate to="/moderacao" replace />;
  }

  return <>{children}</>;
};
