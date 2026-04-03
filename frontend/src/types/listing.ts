export interface Listing {
  id: string;
  titulo: string;
  tipo: "DOACAO" | "TROCA";
  condicao: "NOVO" | "BOM" | "USADO" | "AVARIADO";
  url_imagem_capa: string;
  endereco: {
    cidade: string;
    estado: string;
  };
  usuario: {
    nome: string;
    nota_reputacao: number;
  };
}
