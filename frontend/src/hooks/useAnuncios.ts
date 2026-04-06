import { useState, useCallback } from "react";
import * as anuncioService from "../services/anuncioService";
import type { Anuncio } from "../types/anuncio.types";

export const useAnuncios = () => {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [paginacao, setPaginacao] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
  });

  const listar = useCallback(async (page = 0, size = 10) => {
    setLoading(true);
    setErro(null);
    try {
      const resposta = await anuncioService.listarAnuncios(page, size);
      setAnuncios(resposta.content);
      setPaginacao({
        currentPage: resposta.currentPage || page,
        totalPages: resposta.totalPages || 1,
        totalElements: resposta.totalElements || 0,
      });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao listar anúncios");
    } finally {
      setLoading(false);
    }
  }, []);

  const buscar = useCallback(async (termo: string, page = 0) => {
    setLoading(true);
    setErro(null);
    try {
      const resposta = await anuncioService.buscarAnuncios(termo, page);
      setAnuncios(resposta.content);
      setPaginacao({
        currentPage: resposta.currentPage || page,
        totalPages: resposta.totalPages || 1,
        totalElements: resposta.totalElements || 0,
      });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao buscar");
    } finally {
      setLoading(false);
    }
  }, []);

  const filtrarCategoria = useCallback(
    async (categoriaId: number, page = 0) => {
      setLoading(true);
      setErro(null);
      try {
        const resposta = await anuncioService.filtrarPorCategoria(
          categoriaId,
          page,
        );
        setAnuncios(resposta.content);
        setPaginacao({
          currentPage: resposta.currentPage || page,
          totalPages: resposta.totalPages || 1,
          totalElements: resposta.totalElements || 0,
        });
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Erro ao filtrar");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const filtrarTipo = useCallback(
    async (tipo: "DOACAO" | "TROCA", page = 0) => {
      setLoading(true);
      setErro(null);
      try {
        const resposta = await anuncioService.filtrarPorTipo(tipo, page);
        setAnuncios(resposta.content);
        setPaginacao({
          currentPage: resposta.currentPage || page,
          totalPages: resposta.totalPages || 1,
          totalElements: resposta.totalElements || 0,
        });
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Erro ao filtrar");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    anuncios,
    loading,
    erro,
    paginacao,
    listar,
    buscar,
    filtrarCategoria,
    filtrarTipo,
  };
};
