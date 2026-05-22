import { useCallback, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";
import {
  FAVORITOS_ATUALIZADOS_EVENTO,
  favoritosService,
} from "../services/favoritosService";

const carregarUsuarioAtual = () => authService.getUser();

export const useFavoritos = () => {
  const [usuario, setUsuario] = useState(carregarUsuarioAtual);
  const [favoritos, setFavoritos] = useState<string[]>(() => {
    const usuarioAtual = carregarUsuarioAtual();
    return usuarioAtual?.id ? favoritosService.listar(usuarioAtual.id) : [];
  });

  const usuarioId = usuario?.id;

  const sincronizarFavoritos = useCallback(() => {
    const usuarioAtual = carregarUsuarioAtual();
    setUsuario(usuarioAtual);

    if (!usuarioAtual?.id) {
      setFavoritos([]);
      return;
    }

    setFavoritos(favoritosService.listar(usuarioAtual.id));
  }, []);

  useEffect(() => {
    sincronizarFavoritos();

    const handleStorage = () => sincronizarFavoritos();
    const handleFavoritosAtualizados = (event: Event) => {
      const customEvent = event as CustomEvent<{ usuarioId?: string }>;

      if (!customEvent.detail?.usuarioId || customEvent.detail.usuarioId === usuarioId) {
        sincronizarFavoritos();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(FAVORITOS_ATUALIZADOS_EVENTO, handleFavoritosAtualizados);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(FAVORITOS_ATUALIZADOS_EVENTO, handleFavoritosAtualizados);
    };
  }, [sincronizarFavoritos, usuarioId]);

  const alternarFavorito = useCallback(
    (anuncioId: string) => {
      if (!usuarioId) {
        return false;
      }

      const proximoEstado = favoritosService.alternar(usuarioId, anuncioId);
      setFavoritos(proximoEstado);
      return proximoEstado.includes(anuncioId);
    },
    [usuarioId]
  );

  const favoritosSet = useMemo(() => new Set(favoritos), [favoritos]);

  return {
    favoritos,
    favoritosSet,
    possuiUsuarioAutenticado: Boolean(usuarioId),
    alternarFavorito,
    ehFavorito: (anuncioId: string) => favoritosSet.has(anuncioId),
  };
};
