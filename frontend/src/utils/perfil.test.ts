import { describe, it, expect } from "vitest";
import { isPerfilOperacional, isUsuarioOperacional } from "./perfil";

describe("isPerfilOperacional", () => {
  it("retorna true para MODERADOR e ADMIN", () => {
    expect(isPerfilOperacional("MODERADOR")).toBe(true);
    expect(isPerfilOperacional("ADMIN")).toBe(true);
  });

  it("retorna false para USUARIO comum", () => {
    expect(isPerfilOperacional("USUARIO")).toBe(false);
  });

  it("retorna false para perfil ausente (null/undefined)", () => {
    expect(isPerfilOperacional(null)).toBe(false);
    expect(isPerfilOperacional(undefined)).toBe(false);
  });
});

describe("isUsuarioOperacional", () => {
  it("considera operacional um usuario MODERADOR", () => {
    expect(isUsuarioOperacional({ perfil: "MODERADOR" })).toBe(true);
  });

  it("nao considera operacional um usuario comum", () => {
    expect(isUsuarioOperacional({ perfil: "USUARIO" })).toBe(false);
  });

  it("trata usuario nulo como nao-operacional", () => {
    expect(isUsuarioOperacional(null)).toBe(false);
  });
});
