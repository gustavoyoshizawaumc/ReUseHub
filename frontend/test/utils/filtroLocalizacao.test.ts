import { describe, expect, it, vi } from "vitest";
import {
  EVENTO_FILTRO_LOCALIZACAO,
  limparFiltroLocalizacaoSessao,
  normalizarCep,
  obterBuscaLocalizacaoSessao,
  obterFiltroLocalizacaoSessao,
  salvarFiltroLocalizacaoSessao,
} from "../../src/utils/filtroLocalizacao";

describe("filtroLocalizacao", () => {
  it("normaliza o CEP e recupera filtro valido da sessao", () => {
    sessionStorage.setItem(
      "reusehub:filtro-localizacao",
      JSON.stringify({ cep: "08613-565", raioKm: 25 }),
    );

    expect(normalizarCep("08.613-565")).toBe("08613565");
    expect(obterFiltroLocalizacaoSessao()).toEqual({ cep: "08613565", raioKm: 25 });
    expect(obterBuscaLocalizacaoSessao()).toEqual({ cep: "08613565", raioKm: 25 });
  });

  it("normaliza raio invalido, emite evento e limpa CEP invalido", () => {
    const listener = vi.fn();
    window.addEventListener(EVENTO_FILTRO_LOCALIZACAO, listener);

    salvarFiltroLocalizacaoSessao("08613-565", 999);

    expect(obterFiltroLocalizacaoSessao()).toEqual({ cep: "08613565", raioKm: 10 });
    expect(listener).toHaveBeenCalledTimes(1);

    salvarFiltroLocalizacaoSessao("123", 25);

    expect(obterFiltroLocalizacaoSessao()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);

    window.removeEventListener(EVENTO_FILTRO_LOCALIZACAO, listener);
  });

  it("limpa o filtro e emite evento nulo", () => {
    const listener = vi.fn();
    window.addEventListener(EVENTO_FILTRO_LOCALIZACAO, listener);

    salvarFiltroLocalizacaoSessao("08613565", 5);
    limparFiltroLocalizacaoSessao();

    expect(sessionStorage.getItem("reusehub:filtro-localizacao")).toBeNull();
    expect(listener.mock.calls.at(-1)?.[0]).toBeInstanceOf(CustomEvent);
    expect((listener.mock.calls.at(-1)?.[0] as CustomEvent).detail).toBeNull();

    window.removeEventListener(EVENTO_FILTRO_LOCALIZACAO, listener);
  });
});
