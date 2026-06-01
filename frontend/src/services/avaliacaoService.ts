import type {
  AvaliacaoCriacaoPayload,
  AvaliacaoResposta,
} from "../types/avaliacao.types";
import { apiUrl } from "../config/api";
import { obterTokenAtivoOuEncerrarSessao } from "../utils/sessao";

const BASE_URL = apiUrl("/api/avaliacoes");

function getAuthHeaders(): Record<string, string> {
  const token = obterTokenAtivoOuEncerrarSessao();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function criarAvaliacao(
  payload: AvaliacaoCriacaoPayload
): Promise<AvaliacaoResposta> {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const erro = await response.text();
    throw new Error(erro || "Erro ao enviar avaliação");
  }

  return response.json();
}

export async function listarAvaliacoesRecebidas(
  usuarioId: string
): Promise<AvaliacaoResposta[]> {
  const response = await fetch(`${BASE_URL}/usuario/${usuarioId}`);

  if (!response.ok) {
    throw new Error("Erro ao carregar avaliações");
  }

  return response.json();
}
