import { useEffect, useState } from "react";
import { listarCategorias } from "../services/categoriaService";
import type { Categoria } from "../types/categoria.types";

let categoriasEmCache: Categoria[] | null = null;
let promessaEmAndamento: Promise<Categoria[]> | null = null;

const buscarCategoriasComCache = async (): Promise<Categoria[]> => {
  if (categoriasEmCache) {
    return categoriasEmCache;
  }

  if (promessaEmAndamento) {
    return promessaEmAndamento;
  }

  promessaEmAndamento = listarCategorias()
    .then((categorias) => {
      categoriasEmCache = categorias;
      return categorias;
    })
    .finally(() => {
      promessaEmAndamento = null;
    });

  return promessaEmAndamento;
};

interface EstadoCategorias {
  categorias: Categoria[];
  carregando: boolean;
  erro: string | null;
}

export const useCategorias = (): EstadoCategorias => {
  const [categorias, setCategorias] = useState<Categoria[]>(categoriasEmCache ?? []);
  const [carregando, setCarregando] = useState(categoriasEmCache === null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (categoriasEmCache) {
      return;
    }

    let ativo = true;

    buscarCategoriasComCache()
      .then((dados) => {
        if (ativo) {
          setCategorias(dados);
        }
      })
      .catch((e: unknown) => {
        if (ativo) {
          const mensagem = e instanceof Error ? e.message : "Erro ao carregar categorias.";
          setErro(mensagem);
        }
      })
      .finally(() => {
        if (ativo) {
          setCarregando(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, []);

  return { categorias, carregando, erro };
};
