import type { PerfilPublico } from "../types/perfil.types";

const BASE_URL = "http://localhost:8080/api/perfis";

export async function obterPerfilPublico(usuarioId: string): Promise<PerfilPublico> {
  const response = await fetch(`${BASE_URL}/${usuarioId}`);

  if (!response.ok) {
    const erro = await response.text();
    throw new Error(erro || "Erro ao carregar perfil público");
  }

  return response.json();
}
