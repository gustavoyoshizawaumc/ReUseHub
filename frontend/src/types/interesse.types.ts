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
  interessadoId: string;
  interessadoNome: string;
  anuncioOferecidoId?: string | null;
  anuncioOferecidoTitulo?: string | null;
  mensagem: string;
  status: InteresseStatus;
  criadoEm: string;
  conversaId?: string | null;
};