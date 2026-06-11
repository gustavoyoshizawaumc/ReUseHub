import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAnuncios } from "../../src/hooks/useAnuncios";

const listarAnunciosMock = vi.fn();
const listarMeusAnunciosMock = vi.fn();
const buscarAnunciosMock = vi.fn();
const buscarComFiltrosMock = vi.fn();
const filtrarPorCategoriaMock = vi.fn();
const filtrarPorTipoMock = vi.fn();

vi.mock("../../src/services/anuncioService", () => ({
  listarAnuncios: (...args: unknown[]) => listarAnunciosMock(...args),
  listarMeusAnuncios: (...args: unknown[]) => listarMeusAnunciosMock(...args),
  buscarAnuncios: (...args: unknown[]) => buscarAnunciosMock(...args),
  buscarComFiltros: (...args: unknown[]) => buscarComFiltrosMock(...args),
  filtrarPorCategoria: (...args: unknown[]) => filtrarPorCategoriaMock(...args),
  filtrarPorTipo: (...args: unknown[]) => filtrarPorTipoMock(...args),
}));

const resposta = {
  content: [{ id: "1", titulo: "Mesa" }],
  currentPage: 1,
  totalPages: 3,
  totalElements: 9,
};

describe("useAnuncios", () => {
  beforeEach(() => {
    listarAnunciosMock.mockReset();
    listarMeusAnunciosMock.mockReset();
    buscarAnunciosMock.mockReset();
    buscarComFiltrosMock.mockReset();
    filtrarPorCategoriaMock.mockReset();
    filtrarPorTipoMock.mockReset();
  });

  it("carrega listagens e filtros com sucesso", async () => {
    listarAnunciosMock.mockResolvedValue(resposta);
    listarMeusAnunciosMock.mockResolvedValue(resposta);
    buscarAnunciosMock.mockResolvedValue(resposta);
    buscarComFiltrosMock.mockResolvedValue(resposta);
    filtrarPorCategoriaMock.mockResolvedValue(resposta);
    filtrarPorTipoMock.mockResolvedValue(resposta);

    const { result } = renderHook(() => useAnuncios());

    await act(async () => {
      await result.current.listar(1, 10);
      await result.current.listarMeus(1, 10);
      await result.current.buscar("mesa", 1);
      await result.current.buscarComFiltros({ termo: "cadeira" }, 2);
      await result.current.filtrarCategoria(2, 1);
      await result.current.filtrarTipo("DOACAO", 1);
    });

    await act(async () => {
      await result.current.paginarFiltros(3);
    });

    expect(result.current.anuncios).toEqual(resposta.content);
    expect(result.current.paginacao).toEqual({
      currentPage: 1,
      totalPages: 3,
      totalElements: 9,
    });
    expect(result.current.filtroAtual).toEqual({ termo: "cadeira" });
    expect(buscarComFiltrosMock).toHaveBeenLastCalledWith({ termo: "cadeira" }, 3);
  });

  it("guarda mensagem de erro quando requisicao falha", async () => {
    listarAnunciosMock.mockRejectedValue(new Error("quebrou"));

    const { result } = renderHook(() => useAnuncios());

    await act(async () => {
      await result.current.listar();
    });

    await waitFor(() => expect(result.current.erro).toBe("quebrou"));
    expect(result.current.loading).toBe(false);
  });
});
