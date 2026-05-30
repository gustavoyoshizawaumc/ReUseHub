export interface Categoria {
  id: number;
  nome: string;
  slug: string;
  urlIcone: string | null;
  categoriaPaiId: number | null;
}
