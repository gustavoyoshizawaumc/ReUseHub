import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductSection } from "../../src/components/ProductSection";

const navigateMock = vi.fn();
const alternarFavoritoMock = vi.fn();
const notifyMock = vi.fn();
const ehFavoritoMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../../src/hooks/useFavoritos", () => ({
  useFavoritos: () => ({
    ehFavorito: ehFavoritoMock,
    alternarFavorito: alternarFavoritoMock,
    possuiUsuarioAutenticado: true,
  }),
}));

vi.mock("../../src/components/feedback/feedbackContext", () => ({
  useFeedback: () => ({
    notify: notifyMock,
  }),
}));

const anuncio = {
  id: "a1",
  titulo: "Notebook gamer",
  descricao: "Bom estado",
  tipo: "DOACAO",
  condicao: "USADO",
  nomeUsuario: "Ana Silva",
  notaReputacaoUsuario: 4.5,
  cidade: "Suzano",
  uf: "SP",
  imagensUrls: ["capa.png"],
} as never;

describe("ProductSection", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    alternarFavoritoMock.mockReset();
    notifyMock.mockReset();
    ehFavoritoMock.mockReset();
    ehFavoritoMock.mockReturnValue(false);
  });

  it("nao renderiza quando nao ha anuncios", () => {
    const { container } = render(
      <ProductSection titulo="Vitrine" anuncios={[]} linkVerTodos={null} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renderiza cards e navega para ver todos e detalhes", () => {
    render(
      <ProductSection
        titulo="Vitrine"
        subtitulo="Subtitulo"
        anuncios={[{ anuncio, scoreDestaque: null }]}
        linkVerTodos="/anuncios"
        variante="destaque"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /ver todos/i }));
    expect(navigateMock).toHaveBeenCalledWith("/anuncios");

    fireEvent.click(screen.getByRole("button", { name: /adicionar aos favoritos/i }).closest("div[role='button']")!);
    expect(navigateMock).toHaveBeenCalledWith("/anuncios/a1", { state: { origem: "CARD_HOME" } });
  });

  it("manda para login quando o usuario nao esta autenticado", async () => {
    vi.doMock("../../src/hooks/useFavoritos", () => ({
      useFavoritos: () => ({
        ehFavorito: () => false,
        alternarFavorito: alternarFavoritoMock,
        possuiUsuarioAutenticado: false,
      }),
    }));
    vi.resetModules();
    const { ProductSection: Section } = await import("../../src/components/ProductSection");

    render(<Section titulo="Vitrine" anuncios={[{ anuncio, scoreDestaque: null }]} linkVerTodos={null} />);

    fireEvent.click(screen.getByRole("button", { name: /adicionar aos favoritos/i }));
    expect(navigateMock).toHaveBeenCalledWith("/login");
  });

  it("notifica quando falha ao alternar favorito", async () => {
    alternarFavoritoMock.mockRejectedValueOnce(new Error("Falhou nos favoritos"));

    render(
      <ProductSection titulo="Vitrine" anuncios={[{ anuncio, scoreDestaque: null }]} linkVerTodos={null} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /adicionar aos favoritos/i }));

    await waitFor(() => {
      expect(notifyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "error",
          message: "Falhou nos favoritos",
        }),
      );
    });
  });
});
