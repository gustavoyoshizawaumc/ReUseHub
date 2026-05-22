const FAVORITOS_STORAGE_PREFIX = "reusehub:favoritos";
export const FAVORITOS_ATUALIZADOS_EVENTO = "reusehub:favoritos-atualizados";

const montarChaveFavoritos = (usuarioId: string) =>
  `${FAVORITOS_STORAGE_PREFIX}:${usuarioId}`;

const normalizarFavoritos = (favoritos: unknown): string[] => {
  if (!Array.isArray(favoritos)) {
    return [];
  }

  return [...new Set(favoritos.filter((item): item is string => typeof item === "string"))];
};

const emitirAtualizacaoFavoritos = (usuarioId: string) => {
  window.dispatchEvent(
    new CustomEvent(FAVORITOS_ATUALIZADOS_EVENTO, {
      detail: { usuarioId },
    })
  );
};

export const favoritosService = {
  listar(usuarioId: string): string[] {
    const favoritosSalvos = localStorage.getItem(montarChaveFavoritos(usuarioId));

    if (!favoritosSalvos) {
      return [];
    }

    try {
      return normalizarFavoritos(JSON.parse(favoritosSalvos));
    } catch {
      return [];
    }
  },

  salvar(usuarioId: string, favoritos: string[]) {
    localStorage.setItem(
      montarChaveFavoritos(usuarioId),
      JSON.stringify(normalizarFavoritos(favoritos))
    );
    emitirAtualizacaoFavoritos(usuarioId);
  },

  favoritar(usuarioId: string, anuncioId: string) {
    const favoritos = favoritosService.listar(usuarioId);

    if (favoritos.includes(anuncioId)) {
      return favoritos;
    }

    const proximoEstado = [...favoritos, anuncioId];
    favoritosService.salvar(usuarioId, proximoEstado);
    return proximoEstado;
  },

  desfavoritar(usuarioId: string, anuncioId: string) {
    const proximoEstado = favoritosService
      .listar(usuarioId)
      .filter((id) => id !== anuncioId);

    favoritosService.salvar(usuarioId, proximoEstado);
    return proximoEstado;
  },

  alternar(usuarioId: string, anuncioId: string) {
    const favoritos = favoritosService.listar(usuarioId);

    if (favoritos.includes(anuncioId)) {
      return favoritosService.desfavoritar(usuarioId, anuncioId);
    }

    return favoritosService.favoritar(usuarioId, anuncioId);
  },

  ehFavorito(usuarioId: string, anuncioId: string) {
    return favoritosService.listar(usuarioId).includes(anuncioId);
  },
};
