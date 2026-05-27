const API_URL = "http://localhost:8080/api/denuncias";

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface DenunciaAnuncioPayload {
  anuncioId: string;
  motivo: string;
  descricao?: string;
}

export const denunciarAnuncio = async (payload: DenunciaAnuncioPayload) => {
  const response = await fetch(`${API_URL}/anuncios`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || error?.mensagem || "Erro ao enviar denuncia");
  }

  return response.json();
};
