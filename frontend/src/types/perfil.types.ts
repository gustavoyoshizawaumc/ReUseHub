import type { Anuncio } from "./anuncio.types";
import type { AvaliacaoResposta } from "./avaliacao.types";

export type PerfilPublico = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  bio?: string | null;
  reputationScore: number;
  anunciosAtivos: Anuncio[];
  avaliacoesRecebidas: AvaliacaoResposta[];
};
