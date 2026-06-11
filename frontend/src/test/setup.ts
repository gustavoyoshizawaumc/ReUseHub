import "@testing-library/jest-dom";
import { afterEach, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";

function criarStorage(): Storage {
  const dados = new Map<string, string>();

  return {
    get length() {
      return dados.size;
    },
    clear() {
      dados.clear();
    },
    getItem(chave: string) {
      return dados.has(chave) ? dados.get(chave) ?? null : null;
    },
    key(indice: number) {
      return Array.from(dados.keys())[indice] ?? null;
    },
    removeItem(chave: string) {
      dados.delete(chave);
    },
    setItem(chave: string, valor: string) {
      dados.set(chave, String(valor));
    },
  };
}

beforeEach(() => {
  Object.defineProperty(globalThis, "localStorage", {
    value: criarStorage(),
    configurable: true,
  });
  Object.defineProperty(globalThis, "sessionStorage", {
    value: criarStorage(),
    configurable: true,
  });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});
