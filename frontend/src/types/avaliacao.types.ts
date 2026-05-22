export type AvaliacaoCriacaoPayload = {
  anuncioId: string;
  avaliadoId: string;
  nota: number;
  comentario?: string;
};

export type AvaliacaoResposta = {
  id: string;
  avaliadorId: string;
  avaliadorNome: string;
  avaliadoId: string;
  avaliadoNome: string;
  anuncioId: string;
  anuncioTitulo: string;
  nota: number;
  comentario?: string | null;
  criadoEm: string;
};
