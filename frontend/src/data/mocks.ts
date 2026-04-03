import type { Listing } from "../types/listing";

export const mockFurniture: Listing[] = [
  {
    id: "f-1",
    titulo: "Sofá Retrátil Cinza 3 Lugares",
    tipo: "DOACAO",
    condicao: "BOM",
    url_imagem_capa:
      "https://via.placeholder.com/400x300/CCCCCC/FFFFFF?text=Sofa+Cinza",
    endereco: { cidade: "Suzano", estado: "SP" },
    usuario: { nome: "Aline Silva", nota_reputacao: 4.8 },
  },
  {
    id: "f-2",
    titulo: "Mesa de Jantar Madeira",
    tipo: "TROCA",
    condicao: "NOVO",
    url_imagem_capa:
      "https://via.placeholder.com/400x300/D1D5DB/FFFFFF?text=Mesa+Madeira",
    endereco: { cidade: "Mogi das Cruzes", estado: "SP" },
    usuario: { nome: "Marcos Oliveira", nota_reputacao: 4.5 },
  },
  {
    id: "f-3",
    titulo: "Cadeira Ergonômica Preta",
    tipo: "TROCA",
    condicao: "BOM",
    url_imagem_capa:
      "https://via.placeholder.com/400x300/9CA3AF/FFFFFF?text=Cadeira",
    endereco: { cidade: "Itaim Bibi", estado: "SP" },
    usuario: { nome: "Julia L.", nota_reputacao: 5.0 },
  },
  {
    id: "f-4",
    titulo: "Estante Rústica Pinus",
    tipo: "DOACAO",
    condicao: "USADO",
    url_imagem_capa:
      "https://via.placeholder.com/400x300/E5E7EB/FFFFFF?text=Estante",
    endereco: { cidade: "Suzano", estado: "SP" },
    usuario: { nome: "Ricardo M.", nota_reputacao: 4.2 },
  },
  {
    id: "f-5",
    titulo: "Cama Solteiro com Colchão",
    tipo: "TROCA",
    condicao: "BOM",
    url_imagem_capa:
      "https://via.placeholder.com/400x300/D1D5DB/FFFFFF?text=Cama",
    endereco: { cidade: "Tatuapé", estado: "SP" },
    usuario: { nome: "Fernando G.", nota_reputacao: 4.7 },
  },
  {
    id: "f-6",
    titulo: "Vaso Decorativo Cerâmica",
    tipo: "DOACAO",
    condicao: "NOVO",
    url_imagem_capa:
      "https://via.placeholder.com/400x300/9CA3AF/FFFFFF?text=Vaso",
    endereco: { cidade: "Guarulhos", estado: "SP" },
    usuario: { nome: "Carla D.", nota_reputacao: 4.9 },
  },
];

export const mockBooks: Listing[] = [
  {
    id: "b-1",
    titulo: "Coleção Harry Potter - 7 Vols",
    tipo: "DOACAO",
    condicao: "NOVO",
    url_imagem_capa:
      "https://via.placeholder.com/400x300/A7F3D0/FFFFFF?text=Harry+Potter",
    endereco: { cidade: "Suzano", estado: "SP" },
    usuario: { nome: "Beatriz N.", nota_reputacao: 5.0 },
  },
  {
    id: "b-2",
    titulo: "Engenharia Civil - ABNT 2024",
    tipo: "TROCA",
    condicao: "BOM",
    url_imagem_capa:
      "https://via.placeholder.com/400x300/FDE68A/FFFFFF?text=Engenharia",
    endereco: { cidade: "São Paulo", estado: "SP" },
    usuario: { nome: "Lucas O.", nota_reputacao: 4.5 },
  },
  {
    id: "b-3",
    titulo: "O Hobbit - Edição Luxo",
    tipo: "TROCA",
    condicao: "NOVO",
    url_imagem_capa:
      "https://via.placeholder.com/400x300/BFDBFE/FFFFFF?text=O+Hobbit",
    endereco: { cidade: "Mogi das Cruzes", estado: "SP" },
    usuario: { nome: "Pedro H.", nota_reputacao: 4.8 },
  },
  {
    id: "b-4",
    titulo: "Apostila ENEM 2023 Completa",
    tipo: "DOACAO",
    condicao: "USADO",
    url_imagem_capa:
      "https://via.placeholder.com/400x300/DDD6FE/FFFFFF?text=ENEM",
    endereco: { cidade: "Poá", estado: "SP" },
    usuario: { nome: "Mariana F.", nota_reputacao: 4.6 },
  },
  {
    id: "b-5",
    titulo: "Livro de Receitas AirFryer",
    tipo: "DOACAO",
    condicao: "BOM",
    url_imagem_capa:
      "https://via.placeholder.com/400x300/FBCFE8/FFFFFF?text=Receitas",
    endereco: { cidade: "Suzano", estado: "SP" },
    usuario: { nome: "Dona Sônia", nota_reputacao: 5.0 },
  },
  {
    id: "b-6",
    titulo: "Kit Aquarela Profissional",
    tipo: "TROCA",
    condicao: "NOVO",
    url_imagem_capa:
      "https://via.placeholder.com/400x300/FECACA/FFFFFF?text=Artes",
    endereco: { cidade: "Pinheiros", estado: "SP" },
    usuario: { nome: "Gabriel B.", nota_reputacao: 4.9 },
  },
];
