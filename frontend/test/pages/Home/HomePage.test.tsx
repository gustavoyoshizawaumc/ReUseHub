import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomePage } from "../../../src/pages/Home/HomePage";

const useBootstrapHomeMock = vi.fn();
const useUltimasBuscasMock = vi.fn();
const buscarComFiltrosMock = vi.fn();
const obterFiltroLocalizacaoSessaoMock = vi.fn();

vi.mock("../../../src/components/Header", () => ({ Header: () => <div>Header</div> }));
vi.mock("../../../src/components/HeroBanner", () => ({ HeroBanner: () => <div>Banner</div> }));
vi.mock("../../../src/components/Footer", () => ({ Footer: () => <div>Footer</div> }));
vi.mock("../../../src/components/EmptyStateHome", () => ({ EmptyStateHome: () => <div>EmptyState</div> }));
vi.mock("../../../src/components/HomeSkeleton", () => ({ HomeSkeleton: () => <div>Skeleton</div> }));
vi.mock("../../../src/components/ErroAoCarregarHome", () => ({
  ErroAoCarregarHome: ({ mensagem }: { mensagem: string }) => <div>Erro:{mensagem}</div>,
}));
vi.mock("../../../src/components/ProductSection", () => ({
  ProductSection: ({ titulo, subtitulo, anuncios, variante }: { titulo: string; subtitulo?: string; anuncios: unknown[]; variante?: string }) => (
    <div data-testid="product-section">
      {titulo}|{subtitulo}|{anuncios.length}|{variante}
    </div>
  ),
}));
vi.mock("../../../src/hooks/useBootstrapHome", () => ({
  useBootstrapHome: () => useBootstrapHomeMock(),
}));
vi.mock("../../../src/hooks/useUltimasBuscasComAnuncios", () => ({
  useUltimasBuscasComAnuncios: () => useUltimasBuscasMock(),
}));
vi.mock("../../../src/services/anuncioService", () => ({
  buscarComFiltros: (...args: unknown[]) => buscarComFiltrosMock(...args),
}));
vi.mock("../../../src/utils/filtroLocalizacao", async () => {
  const actual = await vi.importActual<typeof import("../../../src/utils/filtroLocalizacao")>("../../../src/utils/filtroLocalizacao");
  return {
    ...actual,
    obterFiltroLocalizacaoSessao: () => obterFiltroLocalizacaoSessaoMock(),
  };
});

const secao = (contexto: string, id: string) => ({
  contexto,
  categoriaId: null,
  titulo: `${contexto}-${id}`,
  linkVerTodos: null,
  anuncios: [{
    anuncio: { id, titulo: `Anuncio ${id}` },
    scoreDestaque: null,
  }],
});

describe("HomePage", () => {
  beforeEach(() => {
    useBootstrapHomeMock.mockReset();
    useUltimasBuscasMock.mockReset();
    buscarComFiltrosMock.mockReset();
    obterFiltroLocalizacaoSessaoMock.mockReset();
    obterFiltroLocalizacaoSessaoMock.mockReturnValue(null);
    useUltimasBuscasMock.mockReturnValue({ dados: [] });
  });

  it("renderiza loading, erro, vazio e secoes normais", () => {
    useBootstrapHomeMock.mockReturnValueOnce({ dados: null, carregando: true, erro: null });
    const { rerender } = render(<HomePage />);
    expect(screen.getByText("Skeleton")).toBeInTheDocument();

    useBootstrapHomeMock.mockReturnValueOnce({ dados: null, carregando: false, erro: "Falhou" });
    rerender(<HomePage />);
    expect(screen.getByText("Erro:Falhou")).toBeInTheDocument();

    useBootstrapHomeMock.mockReturnValueOnce({ dados: { secoes: [] }, carregando: false, erro: null });
    rerender(<HomePage />);
    expect(screen.getByText("EmptyState")).toBeInTheDocument();

    useBootstrapHomeMock.mockReturnValueOnce({
      dados: { secoes: [secao("RECOMENDADOS_PARA_VOCE", "1"), secao("POPULARES", "2")] },
      carregando: false,
      erro: null,
    });
    useUltimasBuscasMock.mockReturnValueOnce({
      dados: [{ anuncio: { id: "3", titulo: "Busca" }, scoreDestaque: null }],
    });
    rerender(<HomePage />);

    const secoes = screen.getAllByTestId("product-section");
    expect(secoes.length).toBe(3);
    expect(secoes.some((item) => item.textContent?.includes("Baseado em suas"))).toBe(true);
  });

  it("filtra por CEP com sucesso e erro", async () => {
    obterFiltroLocalizacaoSessaoMock.mockReturnValue({ cep: "08613565", raioKm: 25 });
    useBootstrapHomeMock.mockReturnValue({
      dados: { secoes: [secao("POPULARES", "1"), secao("RECOMENDADOS_PARA_VOCE", "2")] },
      carregando: false,
      erro: null,
    });

    buscarComFiltrosMock.mockResolvedValueOnce({
      content: [{ id: "1", titulo: "Permitido" }],
    });

    const { unmount } = render(<HomePage />);

    await waitFor(() => {
      expect(buscarComFiltrosMock).toHaveBeenCalledWith(
        { cep: "08613565", raioKm: 25, ordenacao: "DISTANCIA" },
        0,
        120,
      );
    });

    expect(screen.getByTestId("product-section")).toHaveTextContent("1");

    unmount();
    buscarComFiltrosMock.mockRejectedValueOnce({
      response: { data: { mensagem: "Erro de localizacao" } },
    });
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText("Erro:Erro de localizacao")).toBeInTheDocument();
    });
  });
});
