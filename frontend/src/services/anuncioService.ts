import axios from "axios";
import type {
  Anuncio,
  AnuncioCriacao,
  AnuncioAtualizacao,
  PaginacaoResponse,
} from "../types/anuncio.types";

const API_URL = "http://localhost:8080/api/anuncios";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (!(config.data instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
  }
  return config;
});

export const criarAnuncio = async (
  dados: AnuncioCriacao,
  imagens: File[]
): Promise<Anuncio> => {
  const formData = new FormData();

  formData.append(
    "dados",
    new Blob([JSON.stringify(dados)], { type: "application/json" })
  );

  imagens.forEach((imagem) => {
    formData.append("imagens", imagem);
  });

  const response = await api.post("", formData);
  return response.data;
};

export const listarAnuncios = async (
  page: number = 0,
  size: number = 10,
  sort: string = "criadoEm,desc",
): Promise<PaginacaoResponse<Anuncio>> => {
  const response = await api.get("", {
    params: { page, size, sort },
  });
  return response.data;
};

export const obterAnuncio = async (id: string): Promise<Anuncio> => {
  const response = await api.get(`/${id}`);
  return response.data;
};

export const listarMeusAnuncios = async (
  page: number = 0,
  size: number = 10,
): Promise<PaginacaoResponse<Anuncio>> => {
  const response = await api.get("/meus", {
    params: { page, size },
  });
  return response.data;
};

export const buscarAnuncios = async (
  termo: string,
  page: number = 0,
  size: number = 10,
): Promise<PaginacaoResponse<Anuncio>> => {
  const response = await api.get("/buscar", {
    params: { termo, page, size },
  });
  return response.data;
};

export const filtrarPorCategoria = async (
  categoriaId: number,
  page: number = 0,
  size: number = 10,
): Promise<PaginacaoResponse<Anuncio>> => {
  const response = await api.get(`/categoria/${categoriaId}`, {
    params: { page, size },
  });
  return response.data;
};

export const filtrarPorTipo = async (
  tipo: "DOACAO" | "TROCA",
  page: number = 0,
  size: number = 10,
): Promise<PaginacaoResponse<Anuncio>> => {
  const response = await api.get(`/tipo/${tipo}`, {
    params: { page, size },
  });
  return response.data;
};

export const atualizarAnuncio = async (
  id: string,
  dados: AnuncioAtualizacao,
): Promise<Anuncio> => {
  const response = await api.put(`/${id}`, dados);
  return response.data;
};

export const alterarStatus = async (
  id: string,
  status: "RESERVADO" | "CONCLUIDO" | "CANCELADO",
): Promise<Anuncio> => {
  const response = await api.patch(`/${id}/status`, null, {
    params: { status },
  });
  return response.data;
};

export const deletarAnuncio = async (id: string): Promise<void> => {
  const response = await api.delete(`/${id}`);
  return response.data;
};

export default api;