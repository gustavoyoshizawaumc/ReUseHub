import "@testing-library/jest-dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Garante DOM limpo e localStorage zerado entre os testes,
// evitando que um teste "vaze" estado (token/usuario) para o proximo.
afterEach(() => {
  cleanup();
  localStorage.clear();
});
