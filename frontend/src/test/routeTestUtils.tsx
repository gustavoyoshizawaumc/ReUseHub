import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

export const logarComo = (perfil: "USUARIO" | "MODERADOR" | "ADMIN") => {
  localStorage.setItem("token", "token.jwt.fake");
  localStorage.setItem("user", JSON.stringify({ perfil }));
};

export const definirTokenSemUsuario = () => {
  localStorage.setItem("token", "token.jwt.fake");
};

export const renderizarGuard = (guard: ReactNode) =>
  render(
    <MemoryRouter initialEntries={["/protegido"]}>
      <Routes>
        <Route path="/protegido" element={guard} />
        <Route path="/login" element={<div>Pagina de Login</div>} />
        <Route path="/" element={<div>Home Marketplace</div>} />
        <Route path="/moderacao" element={<div>Painel de Moderacao</div>} />
      </Routes>
    </MemoryRouter>,
  );

export const ConteudoProtegido = () => <div>Conteudo Protegido</div>;
