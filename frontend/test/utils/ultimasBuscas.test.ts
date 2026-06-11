import { describe, expect, it, vi } from "vitest";
import { limparUltimasBuscas, lerUltimasBuscas, registrarBusca } from "../../src/utils/ultimasBuscas";

describe("ultimasBuscas", () => {
  it("ignora termos curtos e deduplica mantendo a busca mais recente", () => {
    const agora = vi.spyOn(Date, "now");
    agora.mockReturnValue(1_000);
    registrarBusca("a");

    agora.mockReturnValue(2_000);
    registrarBusca("Notebook", 1);

    agora.mockReturnValue(3_000);
    registrarBusca(" notebook ", 1);

    expect(lerUltimasBuscas()).toEqual([
      { termo: "notebook", categoriaId: 1, buscadoEm: 3_000 },
    ]);

    agora.mockRestore();
  });

  it("mantem no maximo cinco entradas ordenadas da mais nova para a mais antiga", () => {
    const agora = vi.spyOn(Date, "now");

    for (let indice = 0; indice < 6; indice += 1) {
      agora.mockReturnValue(indice + 1);
      registrarBusca(`item ${indice}`, indice);
    }

    const buscas = lerUltimasBuscas();

    expect(buscas).toHaveLength(5);
    expect(buscas[0].termo).toBe("item 5");
    expect(buscas.at(-1)?.termo).toBe("item 1");

    agora.mockRestore();
  });

  it("remove entradas expiradas e limpa o storage", () => {
    const agora = vi.spyOn(Date, "now").mockReturnValue(31 * 24 * 60 * 60 * 1000);

    localStorage.setItem(
      "reusehub:ultimas-buscas",
      JSON.stringify([
        { termo: "valida", categoriaId: null, buscadoEm: 2 * 24 * 60 * 60 * 1000 },
        { termo: "expirada", categoriaId: null, buscadoEm: 0 },
      ]),
    );

    expect(lerUltimasBuscas()).toEqual([
      { termo: "valida", categoriaId: null, buscadoEm: 2 * 24 * 60 * 60 * 1000 },
    ]);

    limparUltimasBuscas();
    expect(localStorage.getItem("reusehub:ultimas-buscas")).toBeNull();

    agora.mockRestore();
  });
});
