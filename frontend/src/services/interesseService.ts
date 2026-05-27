import type { InteresseCriacaoPayload, InteresseResposta } from "../types/interesse.types";

const BASE_URL = import.meta.env.VITE_API_URL;

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function criarInteresse(
  payload: InteresseCriacaoPayload
): Promise<InteresseResposta> {
  const response = await fetch(`${BASE_URL}/api/interesses`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const erro = await response.text();
    throw new Error(erro || "Erro ao enviar interesse");
  }

  return response.json();
}

export async function listarInteressesRecebidos(): Promise<InteresseResposta[]> {
  const response = await fetch(`${BASE_URL}/api/interesses/recebidos`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Erro ao carregar interesses recebidos");
  }

  return response.json();
}

export async function listarInteressesEnviados(): Promise<InteresseResposta[]> {
  const response = await fetch(`${BASE_URL}/api/interesses/enviados`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Erro ao carregar interesses enviados");
  }

  return response.json();
}

export async function aceitarInteresse(id: string): Promise<InteresseResposta> {
  const response = await fetch(`${BASE_URL}/api/interesses/${id}/aceitar`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const erro = await response.text();
    throw new Error(erro || "Erro ao aceitar interesse");
  }

  return response.json();
}

export async function recusarInteresse(id: string): Promise<InteresseResposta> {
  const response = await fetch(`${BASE_URL}/api/interesses/${id}/recusar`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const erro = await response.text();
    throw new Error(erro || "Erro ao recusar interesse");
  }

  return response.json();
}

export async function marcarInteresseComoEntregue(id: string): Promise<InteresseResposta> {
  const response = await fetch(`${BASE_URL}/api/interesses/${id}/marcar-entregue`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const erro = await response.text();
    throw new Error(erro || "Erro ao marcar como entregue");
  }

  return response.json();
}

export async function confirmarRecebimentoInteresse(id: string): Promise<InteresseResposta> {
  const response = await fetch(`${BASE_URL}/api/interesses/${id}/confirmar-recebimento`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const erro = await response.text();
    throw new Error(erro || "Erro ao confirmar recebimento");
  }

  return response.json();
}
