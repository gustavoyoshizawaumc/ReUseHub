import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnunciosPageBase } from "../../../src/pages/Anuncios/AnunciosPageBase";

const navigateMock = vi.fn();
const notifyMock = vi.fn();
const confirmMock = vi.fn();
const alternarFavoritoMock = vi.fn();
const deletarAnuncioMock = vi.fn();
const listarMock = vi.fn();
const listarMeusMock = vi.fn();
const buscarComFiltrosMock = vi.fn();
const paginarFiltrosMock = vi.fn();
const obterBuscaLocalizacaoSessaoMock = vi.fn();

const state = {
  anuncios: [] as Array<Record<string, unknown>>,
  loading: false,
  erro: null as string | null,
  paginacao: { currentPage: 0, totalPages: 3 },
};

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../../../src/components/Header", () => ({ Header: () => <div>Header</div> }));
vi.mock("../../../src/components/Footer", () => ({ Footer: () => <div>Footer</div> }));
vi.mock("../../../src/components/feedback/feedbackContext", () => ({
  useFeedback: () => ({
    notify: notifyMock,
    confirm: confirmMock,
  }),
}));
vi.mock("../../../src/hooks/useFavoritos", () => ({
  useFavoritos: () => ({
    ehFavorito: () => false,
    possuiUsuarioAutenticado: false,
    alternarFavorito: alternarFavoritoMock,
  }),
}));
vi.mock("../../../src/hooks/useAnuncios", () => ({
  useAnuncios: () => ({
    ...state,
    listar: listarMock,
    listarMeus: listarMeusMock,
    buscarComFiltros: buscarComFiltrosMock,
    paginarFiltros: paginarFiltrosMock,
  }),
}));
vi.mock("../../../src/components/anuncios/CardAnuncio", () => ({
  CardAnuncio: ({
    anuncio,
    onDelete,
    onToggleFavorito,
  }: {
    anuncio: { id: string; titulo: string };
    onDelete?: (id: string) => void;
    onToggleFavorito?: (id: string) => void;
  }) => (
    <div>
      <span>{anuncio.titulo}</span>
      {onDelete ? <button onClick={() => onDelete(anuncio.id)}>Excluir {anuncio.titulo}</button> : null}
      {onToggleFavorito ? <button onClick={() => onToggleFavorito(anuncio.id)}>Favoritar {anuncio.titulo}</button> : null}
    </div>
  ),
}));
vi.mock("../../../src/components/anuncios/FiltrosAnuncios", () => ({
  FiltrosAnuncios: ({
    onFiltrar,
    onLimpar,
  }: {
    onFiltrar: (filtro: Record<string, unknown>) => void;
    onLimpar: () => void;
  }) => (
    <div>
      <button onClick={() => onFiltrar({ termo: "mesa" })}>Aplicar filtro</button>
      <button onClick={onLimpar}>Limpar filtros mock</button>
    </div>
  ),
}));
vi.mock("../../../src/services/anuncioService", () => ({
  deletarAnuncio: (...args: unknown[]) => deletarAnuncioMock(...args),
}));
vi.mock("../../../src/utils/filtroLocalizacao", async () => {
  const actual = await vi.importActual<typeof import("../../../src/utils/filtroLocalizacao")>("../../../src/utils/filtroLocalizacao");
  return {
    ...actual,
    obterBuscaLocalizacaoSessao: (...args: unknown[]) => obterBuscaLocalizacaoSessaoMock(...args),
  };
});

const criarAnuncio = (id: string, extras: Record<string, unknown> = {}) => ({
  id,
  titulo: `Anuncio ${id}`,
  descricao: `Descricao ${id}`,
  status: "ATIVO",
  ...extras,
});

const renderPagina = (modo: "publico" | "privado", rota = "/anuncios") =>
  render(
    <MemoryRouter initialEntries={[rota]}>
      <Routes>
        <Route path="/anuncios" element={<AnunciosPageBase modo={modo} />} />
        <Route path="/meus-anuncios" element={<AnunciosPageBase modo={modo} />} />
      </Routes>
    </MemoryRouter>,
  );

describe("AnunciosPageBase", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    notifyMock.mockReset();
    confirmMock.mockReset();
    alternarFavoritoMock.mockReset();
    deletarAnuncioMock.mockReset();
    listarMock.mockReset();
    listarMeusMock.mockReset();
    buscarComFiltrosMock.mockReset();
    paginarFiltrosMock.mockReset();
    obterBuscaLocalizacaoSessaoMock.mockReset();
    obterBuscaLocalizacaoSessaoMock.mockReturnValue({});
    state.anuncios = [];
    state.loading = false;
    state.erro = null;
    state.paginacao = { currentPage: 0, totalPages: 3 };
  });

  it("renderiza modo publico com filtros, erro, vazio e paginacao", async () => {
    state.loading = true;
    const { rerender } = renderPagina("publico", "/anuncios?termo=cadeira&ordenacao=RECENTES");
    expect(screen.getByText(/buscando anúncios/i)).toBeInTheDocument();
    expect(buscarComFiltrosMock).toHaveBeenCalled();

    state.loading = false;
    state.erro = "Falhou na busca";
    rerender(
      <MemoryRouter initialEntries={["/anuncios?termo=cadeira&ordenacao=RECENTES"]}>
        <Routes>
          <Route path="/anuncios" element={<AnunciosPageBase modo="publico" />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText(/falhou na busca/i)).toBeInTheDocument();

    state.erro = null;
    state.anuncios = [criarAnuncio("1"), criarAnuncio("2")];
    rerender(
      <MemoryRouter initialEntries={["/anuncios?termo=cadeira&ordenacao=RECENTES"]}>
        <Routes>
          <Route path="/anuncios" element={<AnunciosPageBase modo="publico" />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /filtros da busca/i }));
    fireEvent.click(screen.getByRole("button", { name: /aplicar filtro/i }));
    fireEvent.click(screen.getByRole("button", { name: /limpar filtros mock/i }));
    fireEvent.click(screen.getByRole("button", { name: /favoritar anuncio 1/i }));
    fireEvent.click(screen.getByRole("button", { name: /anterior/i }));
    fireEvent.click(screen.getByRole("button", { name: /próxima/i }));

    await waitFor(() => {
      expect(listarMock).toHaveBeenCalled();
      expect(buscarComFiltrosMock).toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalledWith("/login");
      expect(listarMock).toHaveBeenCalledWith(1);
    });
  });

  it("renderiza modo privado com feedback, filtros e exclusao", async () => {
    state.anuncios = [
      criarAnuncio("1", { status: "PENDENTE" }),
      criarAnuncio("2", { status: "CONCLUIDO" }),
    ];
    confirmMock.mockResolvedValueOnce(true);
    deletarAnuncioMock.mockResolvedValueOnce(undefined);

    renderPagina("privado", "/meus-anuncios?status=pendente-criado&termo=anuncio");

    await waitFor(() => expect(listarMeusMock).toHaveBeenCalledWith(0, 2000));

    expect(screen.getByText(/meus anúncios/i)).toBeInTheDocument();
    expect(screen.getByText(/anúncio enviado com sucesso/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /novo anúncio/i }));
    fireEvent.click(screen.getByRole("button", { name: /limpar/i }));
    fireEvent.click(screen.getByRole("button", { name: /pendentes/i }));
    fireEvent.click(screen.getByRole("button", { name: /excluir anuncio 1/i }));

    await waitFor(() => {
      expect(deletarAnuncioMock).toHaveBeenCalledWith("1");
      expect(navigateMock).toHaveBeenCalledWith("/create-listing");
    });
  });
});
