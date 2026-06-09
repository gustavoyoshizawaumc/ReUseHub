import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { ModeratorRoute } from "./ModeratorRoute";
import { renderizarGuard, logarComo, ConteudoProtegido } from "../test/routeTestUtils";

describe("ModeratorRoute", () => {
  it("manda visitante sem usuario para /login", () => {
    renderizarGuard(
      <ModeratorRoute>
        <ConteudoProtegido />
      </ModeratorRoute>,
    );

    expect(screen.getByText("Pagina de Login")).toBeInTheDocument();
  });

  it("bloqueia usuario comum, redirecionando para a home", () => {
    logarComo("USUARIO");

    renderizarGuard(
      <ModeratorRoute>
        <ConteudoProtegido />
      </ModeratorRoute>,
    );

    expect(screen.getByText("Home Marketplace")).toBeInTheDocument();
    expect(screen.queryByText("Conteudo Protegido")).not.toBeInTheDocument();
  });

  it("libera o painel para MODERADOR", () => {
    logarComo("MODERADOR");

    renderizarGuard(
      <ModeratorRoute>
        <ConteudoProtegido />
      </ModeratorRoute>,
    );

    expect(screen.getByText("Conteudo Protegido")).toBeInTheDocument();
  });

  it("libera o painel para ADMIN", () => {
    logarComo("ADMIN");

    renderizarGuard(
      <ModeratorRoute>
        <ConteudoProtegido />
      </ModeratorRoute>,
    );

    expect(screen.getByText("Conteudo Protegido")).toBeInTheDocument();
  });
});
