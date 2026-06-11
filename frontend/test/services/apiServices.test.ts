import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosGet = vi.fn();
const axiosCreate = vi.fn();
const apiGet = vi.fn();
const apiPost = vi.fn();
const apiPut = vi.fn();
const apiPatch = vi.fn();
const apiDelete = vi.fn();
const requestUse = vi.fn();

vi.mock("axios", () => ({
  default: {
    get: axiosGet,
    create: axiosCreate,
  },
}));

beforeEach(() => {
  axiosGet.mockReset();
  axiosCreate.mockReset();
  apiGet.mockReset();
  apiPost.mockReset();
  apiPut.mockReset();
  apiPatch.mockReset();
  apiDelete.mockReset();
  requestUse.mockReset();

  axiosCreate.mockReturnValue({
    get: apiGet,
    post: apiPost,
    put: apiPut,
    patch: apiPatch,
    delete: apiDelete,
    interceptors: {
      request: {
        use: requestUse,
      },
    },
  });
});

describe("anuncioService", () => {
  it("encaminha operacoes CRUD, filtros, favoritos e destaques", async () => {
    const modulo = await import("../../src/services/anuncioService");
    const arquivo = new File(["img"], "foto.png", { type: "image/png" });

    apiPost.mockResolvedValueOnce({ data: { id: "a1" } });
    apiGet
      .mockResolvedValueOnce({ data: { content: [] } })
      .mockResolvedValueOnce({ data: { id: "a1" } })
      .mockResolvedValueOnce({ data: { content: [] } })
      .mockResolvedValueOnce({ data: { content: [] } })
      .mockResolvedValueOnce({ data: { content: [] } })
      .mockResolvedValueOnce({ data: { content: [] } })
      .mockResolvedValueOnce({ data: { content: [] } })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: ["a1"] })
      .mockResolvedValueOnce({ data: { secoes: [] } })
      .mockResolvedValueOnce({ data: [{ id: "d1" }] });
    apiPut.mockResolvedValueOnce({ data: { id: "a1", titulo: "Editado" } });
    apiPut.mockResolvedValueOnce({ data: { id: "a1", imagens: [] } });
    apiPatch.mockResolvedValueOnce({ data: { id: "a1", status: "ATIVO" } });
    apiDelete.mockResolvedValueOnce({ data: undefined });
    apiPost.mockResolvedValueOnce({ data: undefined });
    apiDelete.mockResolvedValueOnce({ data: undefined });

    await expect(modulo.criarAnuncio({ titulo: "Notebook" } as never, [arquivo])).resolves.toEqual({ id: "a1" });
    await expect(modulo.listarAnuncios()).resolves.toEqual({ content: [] });
    await expect(modulo.obterAnuncio("a1")).resolves.toEqual({ id: "a1" });
    await expect(modulo.listarMeusAnuncios()).resolves.toEqual({ content: [] });
    await expect(modulo.buscarAnuncios("note")).resolves.toEqual({ content: [] });
    await expect(modulo.buscarComFiltros({ termo: "abc", cep: "", categoriaId: null } as never)).resolves.toEqual({ content: [] });
    await expect(modulo.filtrarPorCategoria(3)).resolves.toEqual({ content: [] });
    await expect(modulo.filtrarPorTipo("DOACAO")).resolves.toEqual({ content: [] });
    await expect(modulo.atualizarAnuncio("a1", { titulo: "Editado" } as never)).resolves.toEqual({ id: "a1", titulo: "Editado" });
    await expect(modulo.atualizarImagensDoAnuncio("a1", ["img-1"], [arquivo])).resolves.toEqual({ id: "a1", imagens: [] });
    await expect(modulo.alterarStatus("a1", "ATIVO")).resolves.toEqual({ id: "a1", status: "ATIVO" });
    await expect(modulo.deletarAnuncio("a1")).resolves.toBeUndefined();
    await expect(modulo.listarFavoritos()).resolves.toEqual([]);
    await expect(modulo.listarIdsFavoritos()).resolves.toEqual(["a1"]);
    await expect(modulo.favoritarAnuncio("a1")).resolves.toBeUndefined();
    await expect(modulo.desfavoritarAnuncio("a1")).resolves.toBeUndefined();
    await expect(modulo.bootstrapHome()).resolves.toEqual({ secoes: [] });
    await expect(modulo.listarDestaques("HOME" as never, 8, 2)).resolves.toEqual([{ id: "d1" }]);

    expect(requestUse).toHaveBeenCalledTimes(1);
    expect(apiGet).toHaveBeenCalledWith("/filtrar", {
      params: { termo: "abc", page: 0, size: 10 },
    });
  });
});

describe("categoriaService", () => {
  it("lista categorias via axios", async () => {
    axiosGet.mockResolvedValueOnce({ data: [{ id: 1, nome: "Eletronicos" }] });

    const { listarCategorias } = await import("../../src/services/categoriaService");

    await expect(listarCategorias()).resolves.toEqual([{ id: 1, nome: "Eletronicos" }]);
    expect(axiosGet).toHaveBeenCalledTimes(1);
  });
});

describe("visualizacaoService", () => {
  it("envia visualizacao com anon id e token quando disponiveis", async () => {
    vi.doMock("../../src/utils/anonId", () => ({
      obterOuCriarAnonId: () => "anon-1",
    }));
    vi.doMock("../../src/utils/sessao", () => ({
      obterTokenValidoOuNull: () => "token-1",
    }));

    const { registrarVisualizacao } = await import("../../src/services/visualizacaoService");
    apiPost.mockResolvedValueOnce({ data: undefined });

    await expect(registrarVisualizacao("a1", "CARD_HOME")).resolves.toBeUndefined();
    expect(apiPost).toHaveBeenCalledWith(
      "/a1/visualizacao",
      { origem: "CARD_HOME" },
      { headers: { "X-Anon-Id": "anon-1", Authorization: "Bearer token-1" } },
    );
  });

  it("engole falhas e aceita headers vazios", async () => {
    vi.resetModules();
    axiosCreate.mockReturnValue({
      post: apiPost,
      interceptors: { request: { use: requestUse } },
    });
    vi.doMock("../../src/utils/anonId", () => ({
      obterOuCriarAnonId: () => null,
    }));
    vi.doMock("../../src/utils/sessao", () => ({
      obterTokenValidoOuNull: () => null,
    }));

    const { registrarVisualizacao } = await import("../../src/services/visualizacaoService");
    apiPost.mockRejectedValueOnce(new Error("falhou"));

    await expect(registrarVisualizacao("a2", "LINK_DIRETO")).resolves.toBeUndefined();
    expect(apiPost).toHaveBeenCalledWith(
      "/a2/visualizacao",
      { origem: "LINK_DIRETO" },
      { headers: {} },
    );
  });
});
