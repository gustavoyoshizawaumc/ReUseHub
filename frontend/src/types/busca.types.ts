export type TipoOrdenacao = "RELEVANCIA" | "DISTANCIA" | "RECENTES" | "POPULARES";

export interface BuscaFiltro {
  termo?: string;
  categoriaId?: number;
  tipo?: "DOACAO" | "TROCA";
  condicao?: "NOVO" | "BOM" | "REGULAR" | "RUIM";
  latitude?: number;
  longitude?: number;
  raioKm?: number;
  cep?: string;
  ordenacao?: TipoOrdenacao;
}
