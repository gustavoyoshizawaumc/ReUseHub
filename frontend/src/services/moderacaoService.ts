import type { Anuncio, PaginacaoResponse } from '../types/anuncio.types';

const ANUNCIOS_URL = 'http://localhost:8080/api/anuncios';
const MODERACAO_URL = 'http://localhost:8080/api/moderacao';
const ADMIN_URL = 'http://localhost:8080/api/admin';

const getAuthHeaders = (): Record<string, string> => {
  const raw = localStorage.getItem('token');
  const token = raw ? raw.replace(/"/g, '').trim() : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function parseResponse<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.mensagem || payload?.message || fallback);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export type StatusDenuncia = 'ABERTA' | 'ANALISADA' | 'DESCARTADA';

export interface DenunciaModeracao {
  id: string;
  anuncioId: string;
  tituloAnuncio: string;
  imagensUrls: string[];
  denuncianteId: string;
  nomeDenunciante: string;
  motivo: string;
  descricao?: string;
  status: StatusDenuncia;
  criadoEm: string;
  denunciasAbertasDoAnuncio: number;
}

export interface AnuncioSuspeito {
  anuncioId: string;
  titulo: string;
  nomeUsuario: string;
  status: Anuncio['status'];
  denunciasAbertas: number;
  imagensUrls: string[];
}

export interface HistoricoModeracao {
  id: string;
  moderadorId: string;
  nomeModerador: string;
  acao: string;
  alvoTipo: string;
  alvoId?: string;
  detalhes?: string;
  criadoEm: string;
}

export interface AdminUsuario {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone?: string;
  perfil: 'USUARIO' | 'MODERADOR' | 'ADMIN';
  ativo: boolean;
  banido: boolean;
  notaReputacao: number;
  criadoEm: string;
}

export interface AdminDashboard {
  totalUsuarios: number;
  usuariosAtivos: number;
  usuariosBanidos: number;
  totalAnuncios: number;
  anunciosAtivos: number;
  anunciosPendentes: number;
  anunciosReprovados: number;
  anunciosConcluidos: number;
  anunciosDoacao: number;
  anunciosTroca: number;
  denunciasAbertas: number;
  denunciasResolvidas: number;
  usuariosPorMes: { label: string; valor: number }[];
  concluidosPorMes: { label: string; valor: number }[];
  anunciosMaisVisualizados: { id: string; label: string; valor: number }[];
  usuariosMelhorReputacao: { id: string; label: string; valor: number }[];
}

export async function listarAnunciosPendentes(page = 0, size = 10): Promise<PaginacaoResponse<Anuncio>> {
  const response = await fetch(`${ANUNCIOS_URL}/moderacao/pendentes?page=${page}&size=${size}`, {
    headers: getAuthHeaders(),
  });
  return parseResponse(response, 'Erro ao listar anuncios pendentes');
}

export async function aprovarAnuncio(id: string): Promise<Anuncio> {
  const response = await fetch(`${ANUNCIOS_URL}/moderacao/${id}/aprovar`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  return parseResponse(response, 'Erro ao aprovar anuncio');
}

export async function reprovarAnuncio(id: string): Promise<Anuncio> {
  const response = await fetch(`${ANUNCIOS_URL}/moderacao/${id}/reprovar`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  return parseResponse(response, 'Erro ao reprovar anuncio');
}

export async function listarDenuncias(status: StatusDenuncia, page = 0, size = 10): Promise<PaginacaoResponse<DenunciaModeracao>> {
  const response = await fetch(`${MODERACAO_URL}/denuncias?status=${status}&page=${page}&size=${size}`, {
    headers: getAuthHeaders(),
  });
  return parseResponse(response, 'Erro ao listar denuncias');
}

export async function analisarDenuncia(id: string, justificativa?: string): Promise<DenunciaModeracao> {
  const response = await fetch(`${MODERACAO_URL}/denuncias/${id}/analisar`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ justificativa }),
  });
  return parseResponse(response, 'Erro ao analisar denuncia');
}

export async function descartarDenuncia(id: string, justificativa?: string): Promise<DenunciaModeracao> {
  const response = await fetch(`${MODERACAO_URL}/denuncias/${id}/descartar`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ justificativa }),
  });
  return parseResponse(response, 'Erro ao descartar denuncia');
}

export async function listarSuspeitos(minimoDenuncias = 2): Promise<AnuncioSuspeito[]> {
  const response = await fetch(`${MODERACAO_URL}/suspeitos?minimoDenuncias=${minimoDenuncias}`, {
    headers: getAuthHeaders(),
  });
  return parseResponse(response, 'Erro ao listar suspeitos');
}

export async function suspenderAnuncio(id: string, justificativa?: string): Promise<AnuncioSuspeito> {
  const response = await fetch(`${MODERACAO_URL}/anuncios/${id}/suspender`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ justificativa }),
  });
  return parseResponse(response, 'Erro ao suspender anuncio');
}

export async function reativarAnuncio(id: string, justificativa?: string): Promise<AnuncioSuspeito> {
  const response = await fetch(`${MODERACAO_URL}/anuncios/${id}/reativar`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ justificativa }),
  });
  return parseResponse(response, 'Erro ao reativar anuncio');
}

export async function reprovarSuspeito(id: string, justificativa?: string): Promise<AnuncioSuspeito> {
  const response = await fetch(`${MODERACAO_URL}/anuncios/${id}/reprovar`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ justificativa }),
  });
  return parseResponse(response, 'Erro ao reprovar anuncio');
}

export async function listarMeuHistorico(page = 0, size = 12): Promise<PaginacaoResponse<HistoricoModeracao>> {
  const response = await fetch(`${MODERACAO_URL}/historico/me?page=${page}&size=${size}`, {
    headers: getAuthHeaders(),
  });
  return parseResponse(response, 'Erro ao listar historico');
}

export async function removerAvaliacaoModeracao(id: string, justificativa?: string): Promise<void> {
  const response = await fetch(`${MODERACAO_URL}/avaliacoes/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    body: JSON.stringify({ justificativa }),
  });
  return parseResponse(response, 'Erro ao remover avaliacao');
}

export async function listarUsuariosAdmin(page = 0, size = 10, termo = ''): Promise<PaginacaoResponse<AdminUsuario>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (termo.trim()) params.set('termo', termo.trim());
  const response = await fetch(`${ADMIN_URL}/usuarios?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return parseResponse(response, 'Erro ao listar usuarios');
}

export async function obterDashboardAdmin(): Promise<AdminDashboard> {
  const response = await fetch(`${ADMIN_URL}/dashboard`, { headers: getAuthHeaders() });
  return parseResponse(response, 'Erro ao carregar dashboard');
}

export async function criarModerador(data: {
  name: string;
  email: string;
  password: string;
}): Promise<AdminUsuario> {
  const response = await fetch(`${ADMIN_URL}/moderadores`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return parseResponse(response, 'Erro ao criar moderador');
}

export async function criarAdministrador(data: {
  name: string;
  email: string;
  password: string;
}): Promise<AdminUsuario> {
  const response = await fetch(`${ADMIN_URL}/administradores`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return parseResponse(response, 'Erro ao criar administrador');
}

export async function alterarUsuarioAdmin(id: string, acao: 'ativar' | 'desativar' | 'banir'): Promise<AdminUsuario> {
  const response = await fetch(`${ADMIN_URL}/usuarios/${id}/${acao}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  return parseResponse(response, 'Erro ao alterar usuario');
}

export async function listarAuditoria(page = 0, size = 12): Promise<PaginacaoResponse<HistoricoModeracao>> {
  const response = await fetch(`${ADMIN_URL}/auditoria?page=${page}&size=${size}`, {
    headers: getAuthHeaders(),
  });
  return parseResponse(response, 'Erro ao listar auditoria');
}
