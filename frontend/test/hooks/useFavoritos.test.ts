import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFavoritos } from "../../src/hooks/useFavoritos";

const getUserMock = vi.fn();
const listarIdsFavoritosMock = vi.fn();
const favoritarAnuncioMock = vi.fn();
const desfavoritarAnuncioMock = vi.fn();

vi.mock("../../src/services/authService", () => ({
  authService: {
    getUser: () => getUserMock(),
  },
}));

vi.mock("../../src/services/anuncioService", () => ({
  listarIdsFavoritos: (...args: unknown[]) => listarIdsFavoritosMock(...args),
  favoritarAnuncio: (...args: unknown[]) => favoritarAnuncioMock(...args),
  desfavoritarAnuncio: (...args: unknown[]) => desfavoritarAnuncioMock(...args),
}));

describe("useFavoritos", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    listarIdsFavoritosMock.mockReset();
    favoritarAnuncioMock.mockReset();
    desfavoritarAnuncioMock.mockReset();
  });

  it("carrega favoritos e alterna estado autenticado", async () => {
    getUserMock.mockReturnValue({ id: "u1" });
    listarIdsFavoritosMock.mockResolvedValue(["a1"]);

    const { result } = renderHook(() => useFavoritos());

    await waitFor(() => expect(result.current.favoritos).toEqual(["a1"]));
    expect(result.current.ehFavorito("a1")).toBe(true);

    favoritarAnuncioMock.mockResolvedValue(undefined);
    desfavoritarAnuncioMock.mockResolvedValue(undefined);

    await act(async () => {
      await result.current.alternarFavorito("a2");
    });
    expect(result.current.ehFavorito("a2")).toBe(true);

    await act(async () => {
      await result.current.alternarFavorito("a1");
    });
    expect(result.current.ehFavorito("a1")).toBe(false);
  });

  it("trata usuario anonimo e erros do backend", async () => {
    getUserMock.mockReturnValue(null);

    const anonimo = renderHook(() => useFavoritos());
    await waitFor(() => expect(anonimo.result.current.possuiUsuarioAutenticado).toBe(false));
    await expect(anonimo.result.current.alternarFavorito("a1")).resolves.toBe(false);

    getUserMock.mockReturnValue({ id: "u2" });
    listarIdsFavoritosMock.mockRejectedValue(new Error("falhou favoritos"));

    const autenticado = renderHook(() => useFavoritos());
    await waitFor(() => expect(autenticado.result.current.erro).toBe("falhou favoritos"));

    favoritarAnuncioMock.mockRejectedValueOnce(new Error("falhou atualizar"));
    await expect(autenticado.result.current.alternarFavorito("a9")).rejects.toThrow("falhou atualizar");
  });
});
