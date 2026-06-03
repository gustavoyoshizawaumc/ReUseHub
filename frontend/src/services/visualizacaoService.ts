import axios from "axios";
import { apiUrl } from "../config/api";
import { obterTokenValidoOuNull } from "../utils/sessao";
import { obterOuCriarAnonId } from "../utils/anonId";

/**
 * Tracking de visualizacoes de anuncios (PR D.2).
 *
 * Caracteristicas:
 *  - Fire-and-forget: erros sao engolidos (tracking nao bloqueia UX).
 *  - Aceita usuario logado ou anonimo (endpoint backend e permitAll).
 *  - Sempre envia o header {@code X-Anon-Id}, por consistencia e para
 *    reaproveitar a chave caso o JWT seja invalidado entre clicks.
 *  - Usa {@code obterTokenValidoOuNull} (sem efeito colateral) em vez de
 *    {@code obterTokenAtivoOuEncerrarSessao}: derrubar sessao por causa de
 *    tracking expirado seria invasivo - aqui simplesmente vai anonimo.
 */

export type OrigemVisualizacao =
  | "CARD_HOME"
  | "BUSCA_RESULTADO"
  | "LINK_DIRETO"
  | "FAVORITO"
  | "DETALHE_DIRETO";

const api = axios.create({
  baseURL: apiUrl("/api/anuncios"),
  headers: { "Content-Type": "application/json" },
});

export async function registrarVisualizacao(
  anuncioId: string,
  origem: OrigemVisualizacao
): Promise<void> {
  const headers: Record<string, string> = {};

  const anonId = obterOuCriarAnonId();
  if (anonId !== null) {
    headers["X-Anon-Id"] = anonId;
  }

  const token = obterTokenValidoOuNull();
  if (token !== null) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    await api.post(`/${anuncioId}/visualizacao`, { origem }, { headers });
  } catch {
    // Tracking nao deve bloquear/falhar a UX. Erros sao engolidos
    // intencionalmente: rede caiu, backend fora, anuncio inexistente, etc.
  }
}
