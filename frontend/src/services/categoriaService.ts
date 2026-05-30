import axios from "axios";
import { apiUrl } from "../config/api";
import type { Categoria } from "../types/categoria.types";

const URL_CATEGORIAS = apiUrl("/api/categorias");

export const listarCategorias = async (): Promise<Categoria[]> => {
  const resposta = await axios.get<Categoria[]>(URL_CATEGORIAS);
  return resposta.data;
};
