import { describe, expect, it, vi } from "vitest";
import { readLocalStorage, removeLocalStorage, writeLocalStorage } from "../../src/utils/localStorage";
import { readSessionStorage, writeSessionStorage } from "../../src/utils/sessionStorage";
import { tokenExpirado } from "../../src/utils/jwt";
import { obterUrlImagem } from "../../src/utils/imagens";

describe("storage utils", () => {
  it("grava, le e remove valores do localStorage", () => {
    writeLocalStorage("chave", { valor: 123 });

    expect(readLocalStorage<{ valor: number }>("chave")).toEqual({ valor: 123 });

    removeLocalStorage("chave");

    expect(readLocalStorage("chave")).toBeNull();
  });

  it("retorna null para json invalido e escreve/le sessionStorage", () => {
    localStorage.setItem("quebrado", "{");
    writeSessionStorage("sessao", ["a", "b"]);

    expect(readLocalStorage("quebrado")).toBeNull();
    expect(readSessionStorage<string[]>("sessao")).toEqual(["a", "b"]);
  });

  it("engole erros de escrita sem explodir o teste", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("falhou");
    });

    expect(() => writeLocalStorage("x", { ok: true })).not.toThrow();
    expect(() => writeSessionStorage("x", { ok: true })).not.toThrow();

    setItemSpy.mockRestore();
  });
});

describe("jwt e imagens", () => {
  const criarToken = (payload: unknown) => {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = btoa(JSON.stringify(payload));
    return `${header}.${body}.assinatura`;
  };

  it("identifica token valido, expirado e malformado", () => {
    const agora = vi.spyOn(Date, "now").mockReturnValue(1_000_000);

    expect(tokenExpirado(criarToken({ exp: 1_200 }))).toBe(false);
    expect(tokenExpirado(criarToken({ exp: 1_020 }))).toBe(true);
    expect(tokenExpirado("token-invalido")).toBe(true);
    expect(tokenExpirado(criarToken({ semExp: true }))).toBe(true);

    agora.mockRestore();
  });

  it("resolve urls absolutas, data urls e caminhos relativos com fallback", () => {
    expect(obterUrlImagem("https://cdn.exemplo/imagem.png")).toBe("https://cdn.exemplo/imagem.png");
    expect(obterUrlImagem("data:image/png;base64,abc")).toBe("data:image/png;base64,abc");
    expect(obterUrlImagem("uploads/imagem.png")).toContain("/uploads/imagem.png");
    expect(obterUrlImagem("/uploads/imagem.png")).toContain("/uploads/imagem.png");
    expect(obterUrlImagem(null, "fallback.png")).toBe("fallback.png");
  });
});
