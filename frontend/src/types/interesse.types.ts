export type AnuncioStatus = "PENDENTE" | "ATIVO" | "REPROVADO" | "SUSPENSO" | "CONCLUIDO" | "CANCELADO";

export type InteresseStatus = "PENDENTE" | "ACEITO" | "REJEITADO" | "CANCELADO";

export type InteresseCriacaoPayload = {
  anuncioDesejadoId: string;
  anuncioOferecidoId?: string | null;
  mensagem: string;
};

export type InteresseResposta = {
  id: string;
  anuncioDesejadoId: string;
  anuncioDesejadoTitulo: string;
  anuncioDesejadoImagemUrl?: string | null;
  anuncioDesejadoStatus: AnuncioStatus;
  interessadoId: string;
  interessadoNome: string;
  interessadoAvatarUrl?: string | null;
  interessadoNotaReputacao?: number | null;
  anuncioOferecidoId?: string | null;
  anuncioOferecidoTitulo?: string | null;
  anuncioOferecidoImagemUrl?: string | null;
  mensagem: string;
  status: InteresseStatus;
  criadoEm: string;
  entreguePeloDonoEm?: string | null;
  recebimentoConfirmadoEm?: string | null;
  canceladoEm?: string | null;
  donoJaAvaliou?: boolean;
  conversaId?: string | null;
};
