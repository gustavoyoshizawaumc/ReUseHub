import { useCallback, useEffect, useMemo, useState } from "react";
import * as anuncioService from "../services/anuncioService";
import { authService } from "../services/authService";

const carregarUsuarioAtual = () => authService.getUser();

export const useFavoritos = () => {
  const [usuario] = useState(carregarUsuarioAtual);
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const usuarioId = usuario?.id;

  const carregarFavoritos = useCallback(async () => {
    if (!usuarioId) {
      setFavoritos([]);
      return;
    }

    setLoading(true);
    setErro(null);

    try {
      const favoritosIds = await anuncioService.listarIdsFavoritos();
      setFavoritos(favoritosIds);
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Erro ao carregar favoritos."
      );
    } finally {
      setLoading(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    carregarFavoritos();
  }, [carregarFavoritos]);

  const alternarFavorito = useCallback(
    async (anuncioId: string) => {
      if (!usuarioId) {
        return false;
      }

      const anuncioJaFavoritado = favoritos.includes(anuncioId);

      try {
        if (anuncioJaFavoritado) {
          await anuncioService.desfavoritarAnuncio(anuncioId);
          setFavoritos((estadoAtual) => estadoAtual.filter((id) => id !== anuncioId));
          return false;
        }

        await anuncioService.favoritarAnuncio(anuncioId);
        setFavoritos((estadoAtual) => [...estadoAtual, anuncioId]);
        return true;
      } catch (error) {
        setErro(
          error instanceof Error ? error.message : "Erro ao atualizar favoritos."
        );
        throw error;
      }
    },
    [favoritos, usuarioId]
  );

  const favoritosSet = useMemo(() => new Set(favoritos), [favoritos]);

  return {
    favoritos,
    favoritosSet,
    loading,
    erro,
    carregarFavoritos,
    possuiUsuarioAutenticado: Boolean(usuarioId),
    alternarFavorito,
    ehFavorito: (anuncioId: string) => favoritosSet.has(anuncioId),
  };
};
