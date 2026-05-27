import type { UsuarioRespostaDTO } from "../types/auth.types";

export type PerfilUsuario = "USUARIO" | "MODERADOR" | "ADMIN";

export const isPerfilOperacional = (perfil?: string | null) =>
  perfil === "MODERADOR" || perfil === "ADMIN";

export const isUsuarioOperacional = (user?: Pick<UsuarioRespostaDTO, "perfil"> | null) =>
  isPerfilOperacional(user?.perfil);
