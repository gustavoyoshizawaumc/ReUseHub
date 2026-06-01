export interface PaginacaoResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface Endereco {
  id: string;
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface DadosCEP {
  cep: string;
  rua: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface ImagemAnuncio {
  id: string;
  urlImagem: string;
  ordemExibicao: number;
  capa: boolean;
}

export interface Anuncio {
  id: string;
  titulo: string;
  descricao: string;
  tipo: "DOACAO" | "TROCA";
  condicao: "NOVO" | "BOM" | "REGULAR" | "RUIM";
  status: "PENDENTE" | "ATIVO" | "REPROVADO" | "SUSPENSO" | "RESERVADO" | "CONCLUIDO" | "CANCELADO";
  totalVisualizacoes: number;
  notaRelevancia: number | null;
  expiraEm: string;
  criadoEm: string;
  atualizadoEm: string;
  usuarioId: string;
  nomeUsuario: string;
  categoriaId: number;
  nomeCategoria: string;
  enderecoId: string;
  endereco?: Endereco;
  imagensUrls?: string[];
  imagens?: ImagemAnuncio[];
  cep?: string;
  numero?: string;
  complemento?: string;
  rua?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
}

export interface AnuncioCriacao {
  titulo: string;
  descricao: string;
  tipo: "DOACAO" | "TROCA";
  condicao: "NOVO" | "BOM" | "REGULAR" | "RUIM";
  categoriaId: number;
  expiraEm: string;
  cep: string;
  numero: string;
  complemento?: string;
}

export interface AnuncioAtualizacao {
  titulo: string;
  descricao: string;
  condicao: "NOVO" | "BOM" | "REGULAR" | "RUIM";
  categoriaId: number;
  expiraEm: string;
  cep: string;
  numero: string;
  complemento?: string;
  enderecoId: string;
}

// Tipos do modulo de destaque da home (PR D)

export type ContextoDestaque =
  | "RECOMENDADOS_PARA_VOCE"
  | "MAIS_PROCURADOS"
  | "POPULARES"
  | "RECENTES";

export type CenarioHome = "HISTORICO_USUARIO" | "SEM_HISTORICO" | "ANONIMO";

export type TipoSelecaoCategoria = "INTERESSE_USUARIO" | "ROTATIVA";

export interface CategoriaEmDestaque {
  id: number;
  nome: string;
  slug: string;
  tipoSelecao: TipoSelecaoCategoria;
}

export interface AnuncioDestaque {
  anuncio: Anuncio;
  scoreDestaque: number | null;
}

export interface SecaoHome {
  contexto: ContextoDestaque;
  categoriaId: number | null;
  titulo: string;
  linkVerTodos: string | null;
  anuncios: AnuncioDestaque[];
}

export interface BootstrapHome {
  cenario: CenarioHome;
  categoriaEmDestaque: CategoriaEmDestaque | null;
  secoes: SecaoHome[];
  geradoEm: string;
  dataRotacao: string;
}
