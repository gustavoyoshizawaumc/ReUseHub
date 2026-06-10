import axios from "axios";
import { apiUrl } from "../config/api";
import { obterTokenValidoOuNull } from "../utils/sessao";
import { obterOuCriarAnonId } from "../utils/anonId";

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
    // tracking best-effort: ignora falhas
  }
}
