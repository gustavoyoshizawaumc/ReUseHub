import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { MarketplaceOnlyRoute } from "./MarketplaceOnlyRoute";
import { renderizarGuard, logarComo, ConteudoProtegido } from "../test/routeTestUtils";

describe("MarketplaceOnlyRoute", () => {
  it("desvia usuario operacional para /moderacao", () => {
    logarComo("ADMIN");

    renderizarGuard(
      <MarketplaceOnlyRoute>
        <ConteudoProtegido />
      </MarketplaceOnlyRoute>,
    );

    expect(screen.getByText("Painel de Moderacao")).toBeInTheDocument();
    expect(screen.queryByText("Conteudo Protegido")).not.toBeInTheDocument();
  });

  it("libera o marketplace para usuario comum", () => {
    logarComo("USUARIO");

    renderizarGuard(
      <MarketplaceOnlyRoute>
        <ConteudoProtegido />
      </MarketplaceOnlyRoute>,
    );

    expect(screen.getByText("Conteudo Protegido")).toBeInTheDocument();
  });

  it("libera o marketplace para visitante nao logado", () => {
    renderizarGuard(
      <MarketplaceOnlyRoute>
        <ConteudoProtegido />
      </MarketplaceOnlyRoute>,
    );

    expect(screen.getByText("Conteudo Protegido")).toBeInTheDocument();
  });
});
