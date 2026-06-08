import type { Anuncio, PaginacaoResponse } from '../types/anuncio.types';

import { apiUrl } from '../config/api';
import { obterTokenAtivoOuEncerrarSessao } from '../utils/sessao';

const ANUNCIOS_URL = apiUrl('/api/anuncios');
const MODERACAO_URL = apiUrl('/api/moderacao');
const ADMIN_URL = apiUrl('/api/admin');

const getAuthHeaders = (): Record<string, string> => {
  const tokenAtivo = obterTokenAtivoOuEncerrarSessao();
  const token = tokenAtivo ? tokenAtivo.replace(/"/g, '').trim() : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function parseResponse<T>(response: Response, fallback: string): Promise<T> {
  if (response.status === 204) return undefined as T;

  const texto = await response.text();
  let payload: { mensagem?: string; message?: string } | T | null = null;

  if (texto) {
    try {
      payload = JSON.parse(texto) as { mensagem?: string; message?: string } | T;
    } catch {
      throw new Error(fallback);
    }
  }

  if (!response.ok) {
    const erro = payload as { mensagem?: string; message?: string } | null;
    throw new Error(erro?.mensagem || erro?.message || fallback);
  }

  if (!payload) throw new Error(fallback);
  return payload as T;
}

export type StatusDenuncia = 'ABERTA' | 'ANALISADA' | 'DESCARTADA';

export interface DenunciaModeracao {
  id: string;
  anuncioId: string;
  tituloAnuncio: string;
  imagensUrls: string[];
  nomeAnunciante?: string;
  statusAnuncio?: Anuncio['status'];
  tipoAnuncio?: Anuncio['tipo'];
  categoriaAnuncio?: string;
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

export interface AvaliacaoModeracao {
  id: string;
  avaliadorId: string;
  avaliadorNome: string;
  avaliadoId: string;
  avaliadoNome: string;
  anuncioId: string;
  anuncioTitulo: string;
  nota: number;
  comentario?: string;
  criadoEm: string;
}

export interface UsuarioAdminFiltros {
  termo?: string;
  perfil?: 'USUARIO' | 'MODERADOR' | 'ADMIN' | '';
  ativo?: boolean | '';
  banido?: boolean | '';
  criadoDe?: string;
  criadoAte?: string;
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
  anunciosCriadosPorMes: { label: string; primeiroValor: number; segundoValor: number }[];
  denunciasPorMes: { label: string; primeiroValor: number; segundoValor: number }[];
  anunciosMaisVisualizados: { id: string; label: string; valor: number }[];
  usuariosMelhorReputacao: { id: string; label: string; valor: number }[];
  categoriasComMaisAnuncios: { id: string; label: string; valor: number }[];
}

export interface DashboardAdminFiltros {
  criadoDe?: string;
  criadoAte?: string;
  tipo?: '' | 'DOACAO' | 'TROCA';
  status?: '' | Anuncio['status'];
  categoriaId?: number | '';
}

export interface AnuncioModeracaoFiltros {
  termo?: string;
  status?: '' | Anuncio['status'];
}

export interface DenunciaModeracaoFiltros {
  termo?: string;
  status?: '' | StatusDenuncia;
}

export interface SuspeitoModeracaoFiltros {
  termo?: string;
  status?: '' | Anuncio['status'];
  minimoDenuncias?: number;
}

export interface AvaliacaoModeracaoFiltros {
  termo?: string;
  nota?: number | '';
  criadoDe?: string;
  criadoAte?: string;
}

export interface HistoricoModeracaoFiltros {
  termo?: string;
  acao?: string;
  criadoDe?: string;
  criadoAte?: string;
}

const adicionarParametro = (params: URLSearchParams, nome: string, valor?: string | number) => {
  if (valor !== undefined && valor !== '') params.set(nome, String(valor));
};

export async function listarAnunciosPendentes(page = 0, size = 10): Promise<PaginacaoResponse<Anuncio>> {
  const response = await fetch(`${ANUNCIOS_URL}/moderacao/pendentes?page=${page}&size=${size}`, {
    headers: getAuthHeaders(),
  });
  return parseResponse(response, 'Erro ao listar anuncios pendentes');
}

export async function listarAnunciosModeracao(
  filtros: AnuncioModeracaoFiltros = {},
  page = 0,
  size = 100
): Promise<PaginacaoResponse<Anuncio>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  adicionarParametro(params, 'termo', filtros.termo?.trim());
  adicionarParametro(params, 'status', filtros.status);
  const response = await fetch(`${ANUNCIOS_URL}/moderacao?${params.toString()}`, { headers: getAuthHeaders() });
  return parseResponse(response, 'Erro ao listar anuncios');
}

export async function aprovarAnuncio(id: string): Promise<Anuncio> {
  const response = await fetch(`${ANUNCIOS_URL}/moderacao/${id}/aprovar`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  return parseResponse(response, 'Erro ao aprovar anuncio');
}

export async function reprovarAnuncio(id: string, justificativa: string): Promise<Anuncio> {
  const response = await fetch(`${ANUNCIOS_URL}/moderacao/${id}/reprovar`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ justificativa }),
  });
  return parseResponse(response, 'Erro ao reprovar anuncio');
}

export async function listarDenuncias(
  filtros: DenunciaModeracaoFiltros | StatusDenuncia = {},
  page = 0,
  size = 100
): Promise<PaginacaoResponse<DenunciaModeracao>> {
  const normalizados = typeof filtros === 'string' ? { status: filtros } : filtros;
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  adicionarParametro(params, 'termo', normalizados.termo?.trim());
  adicionarParametro(params, 'status', normalizados.status);
  const response = await fetch(`${MODERACAO_URL}/denuncias?${params.toString()}`, {
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

export async function suspenderAnuncioPorDenuncia(id: string, justificativa: string): Promise<DenunciaModeracao> {
  const response = await fetch(`${MODERACAO_URL}/denuncias/${id}/suspender-anuncio`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ justificativa }),
  });
  return parseResponse(response, 'Erro ao suspender anuncio pela denuncia');
}

export async function listarSuspeitos(filtros: SuspeitoModeracaoFiltros | number = {}): Promise<AnuncioSuspeito[]> {
  const normalizados = typeof filtros === 'number' ? { minimoDenuncias: filtros } : filtros;
  const params = new URLSearchParams();
  adicionarParametro(params, 'minimoDenuncias', normalizados.minimoDenuncias ?? 2);
  adicionarParametro(params, 'termo', normalizados.termo?.trim());
  adicionarParametro(params, 'status', normalizados.status);
  const response = await fetch(`${MODERACAO_URL}/suspeitos?${params.toString()}`, {
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

export async function listarMeuHistorico(
  filtros: HistoricoModeracaoFiltros = {},
  page = 0,
  size = 100
): Promise<PaginacaoResponse<HistoricoModeracao>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  adicionarParametro(params, 'termo', filtros.termo?.trim());
  adicionarParametro(params, 'acao', filtros.acao?.trim());
  adicionarParametro(params, 'criadoDe', filtros.criadoDe);
  adicionarParametro(params, 'criadoAte', filtros.criadoAte);
  const response = await fetch(`${MODERACAO_URL}/historico/me?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return parseResponse(response, 'Erro ao listar historico');
}

export async function listarAvaliacoesModeracao(
  filtros: AvaliacaoModeracaoFiltros = {},
  page = 0,
  size = 100
): Promise<PaginacaoResponse<AvaliacaoModeracao>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  adicionarParametro(params, 'termo', filtros.termo?.trim());
  adicionarParametro(params, 'nota', filtros.nota);
  adicionarParametro(params, 'criadoDe', filtros.criadoDe);
  adicionarParametro(params, 'criadoAte', filtros.criadoAte);
  const response = await fetch(`${MODERACAO_URL}/avaliacoes?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return parseResponse(response, 'Erro ao listar avaliacoes');
}

export async function removerAvaliacaoModeracao(id: string, justificativa?: string): Promise<void> {
  const response = await fetch(`${MODERACAO_URL}/avaliacoes/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    body: JSON.stringify({ justificativa }),
  });
  return parseResponse(response, 'Erro ao remover avaliacao');
}

export async function listarUsuariosAdmin(
  page = 0,
  size = 10,
  filtros: UsuarioAdminFiltros | string = ''
): Promise<PaginacaoResponse<AdminUsuario>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  const filtroNormalizado: UsuarioAdminFiltros =
    typeof filtros === 'string' ? { termo: filtros } : filtros;

  if (filtroNormalizado.termo?.trim()) params.set('termo', filtroNormalizado.termo.trim());
  if (filtroNormalizado.perfil) params.set('perfil', filtroNormalizado.perfil);
  if (filtroNormalizado.ativo !== '' && filtroNormalizado.ativo !== undefined) params.set('ativo', String(filtroNormalizado.ativo));
  if (filtroNormalizado.banido !== '' && filtroNormalizado.banido !== undefined) params.set('banido', String(filtroNormalizado.banido));
  if (filtroNormalizado.criadoDe) params.set('criadoDe', filtroNormalizado.criadoDe);
  if (filtroNormalizado.criadoAte) params.set('criadoAte', filtroNormalizado.criadoAte);

  const response = await fetch(`${ADMIN_URL}/usuarios?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return parseResponse(response, 'Erro ao listar usuarios');
}

export async function obterDashboardAdmin(filtros: DashboardAdminFiltros = {}): Promise<AdminDashboard> {
  const params = new URLSearchParams();
  if (filtros.criadoDe) params.set('criadoDe', filtros.criadoDe);
  if (filtros.criadoAte) params.set('criadoAte', filtros.criadoAte);
  if (filtros.tipo) params.set('tipo', filtros.tipo);
  if (filtros.status) params.set('status', filtros.status);
  if (filtros.categoriaId !== '' && filtros.categoriaId !== undefined) params.set('categoriaId', String(filtros.categoriaId));

  const query = params.toString();
  const response = await fetch(`${ADMIN_URL}/dashboard${query ? `?${query}` : ''}`, { headers: getAuthHeaders() });
  const dashboard = await parseResponse<AdminDashboard>(response, 'Erro ao carregar dashboard');
  return {
    ...dashboard,
    usuariosPorMes: dashboard.usuariosPorMes ?? [],
    concluidosPorMes: dashboard.concluidosPorMes ?? [],
    anunciosCriadosPorMes: dashboard.anunciosCriadosPorMes ?? [],
    denunciasPorMes: dashboard.denunciasPorMes ?? [],
    anunciosMaisVisualizados: dashboard.anunciosMaisVisualizados ?? [],
    usuariosMelhorReputacao: dashboard.usuariosMelhorReputacao ?? [],
    categoriasComMaisAnuncios: dashboard.categoriasComMaisAnuncios ?? [],
  };
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

export async function listarAuditoria(
  filtros: HistoricoModeracaoFiltros = {},
  page = 0,
  size = 100
): Promise<PaginacaoResponse<HistoricoModeracao>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  adicionarParametro(params, 'termo', filtros.termo?.trim());
  adicionarParametro(params, 'acao', filtros.acao?.trim());
  adicionarParametro(params, 'criadoDe', filtros.criadoDe);
  adicionarParametro(params, 'criadoAte', filtros.criadoAte);
  const response = await fetch(`${ADMIN_URL}/auditoria?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return parseResponse(response, 'Erro ao listar auditoria');
}
