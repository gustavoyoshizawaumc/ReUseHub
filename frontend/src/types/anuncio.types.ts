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

export interface Anuncio {
  id: string;
  titulo: string;
  descricao: string;
  tipo: "DOACAO" | "TROCA";
  condicao: "NOVO" | "BOM" | "REGULAR" | "RUIM";
  status: "PENDENTE" | "ATIVO" | "REPROVADO" | "RESERVADO" | "CONCLUIDO" | "CANCELADO";
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