import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { UserOnlyRoute } from "./UserOnlyRoute";
import { renderizarGuard, logarComo, ConteudoProtegido } from "../test/routeTestUtils";

describe("UserOnlyRoute", () => {
  it("manda visitante sem token para /login", () => {
    renderizarGuard(
      <UserOnlyRoute>
        <ConteudoProtegido />
      </UserOnlyRoute>,
    );

    expect(screen.getByText("Pagina de Login")).toBeInTheDocument();
  });

  it("desvia moderador (usuario operacional) para /moderacao", () => {
    logarComo("MODERADOR");

    renderizarGuard(
      <UserOnlyRoute>
        <ConteudoProtegido />
      </UserOnlyRoute>,
    );

    expect(screen.getByText("Painel de Moderacao")).toBeInTheDocument();
    expect(screen.queryByText("Conteudo Protegido")).not.toBeInTheDocument();
  });

  it("libera area do marketplace para usuario comum logado", () => {
    logarComo("USUARIO");

    renderizarGuard(
      <UserOnlyRoute>
        <ConteudoProtegido />
      </UserOnlyRoute>,
    );

    expect(screen.getByText("Conteudo Protegido")).toBeInTheDocument();
  });
});
