import type {
  AvaliacaoCriacaoPayload,
  AvaliacaoResposta,
} from "../types/avaliacao.types";

const BASE_URL = "http://localhost:8080/api/avaliacoes";

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
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
