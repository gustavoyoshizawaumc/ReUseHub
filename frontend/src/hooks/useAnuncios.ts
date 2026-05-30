import { useState, useCallback } from "react";
import * as anuncioService from "../services/anuncioService";
import type { Anuncio } from "../types/anuncio.types";
import type { BuscaFiltro } from "../types/busca.types";

interface Paginacao {
  currentPage: number;
  totalPages: number;
  totalElements: number;
}

interface RespostaPaginada<T> {
  content: T[];
  currentPage?: number;
  totalPages?: number;
  totalElements?: number;
}

const PAGINACAO_INICIAL: Paginacao = {
  currentPage: 0,
  totalPages: 0,
  totalElements: 0,
};

const extrairPaginacao = <T>(resposta: RespostaPaginada<T>, page: number): Paginacao => ({
  currentPage: resposta.currentPage ?? page,
  totalPages: resposta.totalPages ?? 1,
  totalElements: resposta.totalElements ?? 0,
});

export const useAnuncios = () => {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [paginacao, setPaginacao] = useState<Paginacao>(PAGINACAO_INICIAL);
  const [filtroAtual, setFiltroAtual] = useState<BuscaFiltro>({});

  const executarRequisicao = useCallback(
    async (fn: () => Promise<RespostaPaginada<Anuncio>>, page: number) => {
      setLoading(true);
      setErro(null);
      try {
        const resposta = await fn();
        setAnuncios(resposta.content);
        setPaginacao(extrairPaginacao(resposta, page));
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Erro ao carregar anúncios");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const listar = useCallback(
    (page = 0, size = 10) => {
      return executarRequisicao(
        () => anuncioService.listarAnuncios(page, size),
        page
      );
    },
    [executarRequisicao]
  );

  const listarMeus = useCallback(
    (page = 0, size = 10) => {
      return executarRequisicao(
        () => anuncioService.listarMeusAnuncios(page, size),
        page
      );
    },
    [executarRequisicao]
  );

  const buscar = useCallback(
    (termo: string, page = 0) => {
      return executarRequisicao(
        () => anuncioService.buscarAnuncios(termo, page),
        page
      );
    },
    [executarRequisicao]
  );

  const buscarComFiltros = useCallback(
    (filtro: BuscaFiltro, page = 0) => {
      setFiltroAtual(filtro);
      return executarRequisicao(
        () => anuncioService.buscarComFiltros(filtro, page),
        page
      );
    },
    [executarRequisicao]
  );

  const paginarFiltros = useCallback(
    (page: number) => {
      return executarRequisicao(
        () => anuncioService.buscarComFiltros(filtroAtual, page),
        page
      );
    },
    [executarRequisicao, filtroAtual]
  );

  const filtrarCategoria = useCallback(
    (categoriaId: number, page = 0) => {
      return executarRequisicao(
        () => anuncioService.filtrarPorCategoria(categoriaId, page),
        page
      );
    },
    [executarRequisicao]
  );

  const filtrarTipo = useCallback(
    (tipo: "DOACAO" | "TROCA", page = 0) => {
      return executarRequisicao(
        () => anuncioService.filtrarPorTipo(tipo, page),
        page
      );
    },
    [executarRequisicao]
  );

  return {
    anuncios,
    loading,
    erro,
    paginacao,
    filtroAtual,
    listar,
    listarMeus,
    buscar,
    buscarComFiltros,
    paginarFiltros,
    filtrarCategoria,
    filtrarTipo,
  };
};
