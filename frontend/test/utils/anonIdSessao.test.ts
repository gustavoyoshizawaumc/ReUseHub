import { describe, expect, it, vi } from "vitest";
import { obterOuCriarAnonId } from "../../src/utils/anonId";
import { encerrarSessao, obterTokenAtivoOuEncerrarSessao, obterTokenValidoOuNull } from "../../src/utils/sessao";

describe("anonId", () => {
  it("reutiliza anon id existente e gera um novo quando necessario", () => {
    localStorage.setItem("reusehub:anon-id", JSON.stringify("anon-existente"));
    expect(obterOuCriarAnonId()).toBe("anon-existente");

    localStorage.removeItem("reusehub:anon-id");
    const randomUUID = vi.fn(() => "uuid-gerado");
    Object.defineProperty(globalThis, "crypto", {
      value: { randomUUID },
      configurable: true,
    });

    expect(obterOuCriarAnonId()).toBe("uuid-gerado");
    expect(JSON.parse(localStorage.getItem("reusehub:anon-id") ?? "null")).toBe("uuid-gerado");
  });

  it("usa getRandomValues quando randomUUID nao existe", () => {
    Object.defineProperty(globalThis, "crypto", {
      value: {
        getRandomValues: (array: Uint8Array) => {
          array.set([1, 35, 69, 103, 137, 171, 205, 239, 16, 50, 84, 118, 152, 186, 220, 254]);
          return array;
        },
      },
      configurable: true,
    });

    const anonId = obterOuCriarAnonId();

    expect(anonId).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe("sessao", () => {
  const criarToken = (exp: number) => {
    const payload = btoa(JSON.stringify({ exp }));
    return `header.${payload}.signature`;
  };

  it("retorna token valido e encerra sessao quando o token esta expirado", () => {
    const agora = vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    localStorage.setItem("token", criarToken(2_000));
    expect(obterTokenValidoOuNull()).toBeTruthy();

    localStorage.setItem("token", criarToken(1));
    localStorage.setItem("user", JSON.stringify({ perfil: "USUARIO" }));
    localStorage.setItem("reusehub:ultimas-buscas", JSON.stringify([{ termo: "item" }]));

    window.history.pushState({}, "", "/login");
    expect(obterTokenAtivoOuEncerrarSessao()).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("reusehub:ultimas-buscas")).toBeNull();

    agora.mockRestore();
  });

  it("nao redireciona nem quebra ao encerrar sessao repetidamente", () => {
    window.history.pushState({}, "", "/login");
    localStorage.setItem("token", "qualquer");

    expect(() => encerrarSessao()).not.toThrow();
    expect(() => encerrarSessao()).not.toThrow();
  });
});
