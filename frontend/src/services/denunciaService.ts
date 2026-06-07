import { obterTokenAtivoOuEncerrarSessao } from "../utils/sessao";
import { apiUrl } from "../config/api";

const API_URL = apiUrl("/api/denuncias");

const getAuthHeaders = (): Record<string, string> => {
  const token = obterTokenAtivoOuEncerrarSessao();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface DenunciaAnuncioPayload {
  anuncioId: string;
  motivo: string;
  descricao?: string;
}

export const denunciarAnuncio = async (payload: DenunciaAnuncioPayload) => {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/anuncios`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Nao foi possivel conectar ao servidor para enviar a denuncia.");
  }

  if (!response.ok) {
    const texto = await response.text().catch(() => "");
    let error: { message?: string; mensagem?: string } | null = null;

    try {
      error = texto ? JSON.parse(texto) : null;
    } catch {
      error = null;
    }

    throw new Error(error?.message || error?.mensagem || "Erro ao enviar denuncia");
  }

  return response.json();
};
