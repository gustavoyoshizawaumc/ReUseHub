export interface Usuario {
  id: string;
  nome: string;
  email?: string;
  fotoPerfil?: string;
}

export interface Mensagem {
  id?: string;
  conteudo: string;
  remetente: string;
  timestamp: string;
}

export interface Conversa {
  id: string;
  outroUsuarioId: string;
  nomeOutroUsuario: string;
  avatarOutroUsuario?: string | null;
  anuncioId?: string;
  tituloAnuncio: string;
  imagemAnuncio?: string | null;
  anuncioOferecidoId?: string | null;
  tituloAnuncioOferecido?: string | null;
  imagemAnuncioOferecido?: string | null;
  interesseId?: string | null;
  statusAnuncio?: string | null;
  entreguePeloDonoEm?: string | null;
  recebimentoConfirmadoEm?: string | null;
  canceladoEm?: string | null;
  podeMarcarEntregue?: boolean;
  podeConfirmarRecebimento?: boolean;
  podeCancelarNegociacao?: boolean;
  podeAvaliarOutroUsuario?: boolean;
  usuarioJaAvaliou?: boolean;
  negociacaoCancelada?: boolean;
  chatFechado?: boolean;
  ultimaMensagem?: string;
  dataUltimaAtualizacao?: string;
  dataCriacao?: string;
  naoLidas?: number;
  mensagensNaoLidas?: number;
}

export interface ConversaDetalhe {
  id: string;
  outroUsuarioId: string;
  nomeOutroUsuario: string;
  avatarOutroUsuario?: string | null;
  anuncioId?: string;
  tituloAnuncio: string;
  imagemAnuncio?: string | null;
  anuncioOferecidoId?: string | null;
  tituloAnuncioOferecido?: string | null;
  imagemAnuncioOferecido?: string | null;
  interesseId?: string | null;
  statusAnuncio?: string | null;
  entreguePeloDonoEm?: string | null;
  recebimentoConfirmadoEm?: string | null;
  canceladoEm?: string | null;
  podeMarcarEntregue?: boolean;
  podeConfirmarRecebimento?: boolean;
  podeCancelarNegociacao?: boolean;
  podeAvaliarOutroUsuario?: boolean;
  usuarioJaAvaliou?: boolean;
  negociacaoCancelada?: boolean;
  chatFechado?: boolean;
  mensagens: Mensagem[];
}

export interface ListaConversasResponse {
  conversas: Conversa[];
}
