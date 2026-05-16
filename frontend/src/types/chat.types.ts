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
  tituloAnuncio: string;
  ultimaMensagem?: string;
  dataUltimaAtualizacao?: string;
  dataCriacao?: string;
  naoLidas?: number;
}

export interface ConversaDetalhe {
  id: string;
  outroUsuarioId: string;
  nomeOutroUsuario: string;
  tituloAnuncio: string;
  mensagens: Mensagem[];
}

export interface ListaConversasResponse {
  conversas: Conversa[];
}