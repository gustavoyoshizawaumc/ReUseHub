import axios from "axios";
import type {
  Anuncio,
  AnuncioCriacao,
  AnuncioAtualizacao,
  AnuncioDestaque,
  BootstrapHome,
  ContextoDestaque,
  PaginacaoResponse,
} from "../types/anuncio.types";
import type { BuscaFiltro } from "../types/busca.types";
import { apiUrl } from "../config/api";
import { obterTokenAtivoOuEncerrarSessao } from "../utils/sessao";

const API_URL = apiUrl("/api/anuncios");

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = obterTokenAtivoOuEncerrarSessao();
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
  imagens.forEach((imagem) => formData.append("imagens", imagem));
  const response = await api.post("", formData);
  return response.data;
};

export const listarAnuncios = async (
  page = 0,
  size = 10,
  sort = "criadoEm,desc"
): Promise<PaginacaoResponse<Anuncio>> => {
  const response = await api.get("", { params: { page, size, sort } });
  return response.data;
};

export const obterAnuncio = async (id: string): Promise<Anuncio> => {
  const response = await api.get(`/${id}`);
  return response.data;
};

export const listarMeusAnuncios = async (
  page = 0,
  size = 10
): Promise<PaginacaoResponse<Anuncio>> => {
  const response = await api.get("/meus", { params: { page, size } });
  return response.data;
};

export const buscarAnuncios = async (
  termo: string,
  page = 0,
  size = 10
): Promise<PaginacaoResponse<Anuncio>> => {
  const response = await api.get("/buscar", { params: { termo, page, size } });
  return response.data;
};

export const buscarComFiltros = async (
  filtro: BuscaFiltro,
  page = 0,
  size = 10
): Promise<PaginacaoResponse<Anuncio>> => {
  const params = removerParametrosVazios({ ...filtro, page, size });
  const response = await api.get("/filtrar", { params });
  return response.data;
};

export const filtrarPorCategoria = async (
  categoriaId: number,
  page = 0,
  size = 10
): Promise<PaginacaoResponse<Anuncio>> => {
  const response = await api.get(`/categoria/${categoriaId}`, {
    params: { page, size },
  });
  return response.data;
};

export const filtrarPorTipo = async (
  tipo: "DOACAO" | "TROCA",
  page = 0,
  size = 10
): Promise<PaginacaoResponse<Anuncio>> => {
  const response = await api.get(`/tipo/${tipo}`, { params: { page, size } });
  return response.data;
};

export const atualizarAnuncio = async (
  id: string,
  dados: AnuncioAtualizacao
): Promise<Anuncio> => {
  const response = await api.put(`/${id}`, dados);
  return response.data;
};

export const atualizarImagensDoAnuncio = async (
  id: string,
  idsParaManter: string[],
  novasImagens: File[]
): Promise<Anuncio> => {
  const formData = new FormData();
  formData.append(
    "dados",
    new Blob([JSON.stringify({ idsParaManter })], { type: "application/json" })
  );
  novasImagens.forEach((imagem) => formData.append("novasImagens", imagem));
  const response = await api.put(`/${id}/imagens`, formData);
  return response.data;
};

export const alterarStatus = async (
  id: string,
  status: "ATIVO" | "CONCLUIDO" | "CANCELADO"
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

export const listarFavoritos = async (): Promise<Anuncio[]> => {
  const response = await api.get("/favoritos");
  return response.data;
};

export const listarIdsFavoritos = async (): Promise<string[]> => {
  const response = await api.get("/favoritos/ids");
  return response.data;
};

export const favoritarAnuncio = async (id: string): Promise<void> => {
  await api.post(`/${id}/favoritos`);
};

export const desfavoritarAnuncio = async (id: string): Promise<void> => {
  await api.delete(`/${id}/favoritos`);
};

export const bootstrapHome = async (): Promise<BootstrapHome> => {
  const response = await api.get<BootstrapHome>("/destaques/bootstrap-home");
  return response.data;
};

export const listarDestaques = async (
  contexto: ContextoDestaque,
  size?: number,
  categoriaId?: number
): Promise<AnuncioDestaque[]> => {
  const params: Record<string, string | number> = { contexto };
  if (size !== undefined) params.size = size;
  if (categoriaId !== undefined) params.categoriaId = categoriaId;
  const response = await api.get<AnuncioDestaque[]>("/destaques", { params });
  return response.data;
};

const removerParametrosVazios = (
  params: Record<string, unknown>
): Record<string, unknown> => {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, valor]) => valor !== undefined && valor !== null && valor !== ""
    )
  );
};

export default api;
