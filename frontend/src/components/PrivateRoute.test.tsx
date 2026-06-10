import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { PrivateRoute } from "./PrivateRoute";
import {
  renderizarGuard,
  definirTokenSemUsuario,
  ConteudoProtegido,
} from "../test/routeTestUtils";

describe("PrivateRoute", () => {
  it("redireciona visitante sem token para /login", () => {
    renderizarGuard(
      <PrivateRoute>
        <ConteudoProtegido />
      </PrivateRoute>,
    );

    expect(screen.getByText("Pagina de Login")).toBeInTheDocument();
    expect(screen.queryByText("Conteudo Protegido")).not.toBeInTheDocument();
  });

  it("libera o conteudo quando ha token", () => {
    definirTokenSemUsuario();

    renderizarGuard(
      <PrivateRoute>
        <ConteudoProtegido />
      </PrivateRoute>,
    );

    expect(screen.getByText("Conteudo Protegido")).toBeInTheDocument();
    expect(screen.queryByText("Pagina de Login")).not.toBeInTheDocument();
  });
});
