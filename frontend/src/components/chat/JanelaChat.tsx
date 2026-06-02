import React, { useState, useEffect, useRef } from 'react';
import { useCallback } from 'react';
import {
  obterConversaPorId,
  enviarMensagem,
  marcarComoLido,
} from '../../services/chatService';
import type { Conversa, ConversaDetalhe, Mensagem } from '../../types/chat.types';
import { ArrowLeft, CheckCircle2, CircleX, ImageIcon, PackageCheck, Send, Star, User2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  confirmarRecebimentoInteresse,
  cancelarNegociacaoInteresse,
  marcarInteresseComoEntregue,
} from '../../services/interesseService';
import { AvaliacaoModal } from '../avaliacao/AvaliacaoModal';

import { API_BASE_URL } from '../../config/api';

const BASE_URL = API_BASE_URL;
const INTERVALO_ATUALIZACAO_MENSAGENS_MS = 2500;

const montarUrlImagem = (url?: string | null) => {
  if (!url) return null;
  return url.startsWith('http') ? url : `${BASE_URL}${url}`;
};

interface JanelaChatProps {
  conversaAtiva: Conversa | null;
  onVoltar: () => void;
}

const JanelaChat: React.FC<JanelaChatProps> = ({ conversaAtiva, onVoltar }) => {
  const navigate = useNavigate();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [conversaDetalhe, setConversaDetalhe] = useState<ConversaDetalhe | null>(null);
  const [carregandoMensagens, setCarregandoMensagens] = useState(false);
  const [enviandoMensagem, setEnviandoMensagem] = useState(false);
  const [processandoFechamento, setProcessandoFechamento] = useState(false);
  const [modalAvaliacaoAberto, setModalAvaliacaoAberto] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversaAtivaId = conversaAtiva?.id;

  const [usuarioLogado] = useState(() => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const userData = JSON.parse(userJson);
        return {
          id: userData.id || userData.usuarioId || '',
          email: userData.email || '',
          username: userData.username || '',
        };
      } catch (e) {
        console.error('Erro ao ler dados do localStorage:', e);
      }
    }
    return { id: '', email: '', username: '' };
  });

  const carregarMensagens = useCallback(async (silencioso = false) => {
    if (!conversaAtivaId) {
      setMensagens([]);
      setConversaDetalhe(null);
      return;
    }

    if (!silencioso) setCarregandoMensagens(true);
    try {
      const conversaDetalhe = await obterConversaPorId(conversaAtivaId);
      setConversaDetalhe(conversaDetalhe);
      setMensagens(conversaDetalhe?.mensagens ?? []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      if (!silencioso) setCarregandoMensagens(false);
    }

    try {
      await marcarComoLido(conversaAtivaId);
    } catch (error) {
      console.warn('Não foi possível marcar a conversa como lida:', error);
    }
  }, [conversaAtivaId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  useEffect(() => {
    // Sincroniza a conversa selecionada com o historico salvo na API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregarMensagens();
  }, [carregarMensagens]);

  useEffect(() => {
    if (!conversaAtivaId) return;

    const atualizarSeVisivel = () => {
      if (document.visibilityState === 'visible') {
        carregarMensagens(true);
      }
    };

    const interval = window.setInterval(atualizarSeVisivel, INTERVALO_ATUALIZACAO_MENSAGENS_MS);
    document.addEventListener('visibilitychange', atualizarSeVisivel);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', atualizarSeVisivel);
    };
  }, [carregarMensagens, conversaAtivaId]);

  const handleEnviarMensagem = async () => {
    if (!conversaAtiva?.id || !novaMensagem.trim() || conversaInfo.chatFechado) return;

    setEnviandoMensagem(true);
    try {
      await enviarMensagem(conversaAtiva.id, novaMensagem.trim());
      setNovaMensagem('');
      await carregarMensagens(true);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setEnviandoMensagem(false);
    }
  };

  const handleMarcarEntregue = async () => {
    if (!conversaInfo.interesseId) return;

    try {
      setProcessandoFechamento(true);
      await marcarInteresseComoEntregue(conversaInfo.interesseId);
      await carregarMensagens(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao marcar como entregue');
    } finally {
      setProcessandoFechamento(false);
    }
  };

  const handleConfirmarRecebimento = async () => {
    if (!conversaInfo.interesseId) return;

    try {
      setProcessandoFechamento(true);
      await confirmarRecebimentoInteresse(conversaInfo.interesseId);
      await carregarMensagens(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao confirmar recebimento');
    } finally {
      setProcessandoFechamento(false);
    }
  };

  const handleCancelarNegociacao = async () => {
    if (!conversaInfo.interesseId) return;
    if (!window.confirm('Deseja cancelar esta negociacao? O historico continuara visivel.')) return;

    try {
      setProcessandoFechamento(true);
      await cancelarNegociacaoInteresse(conversaInfo.interesseId);
      await carregarMensagens(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao cancelar negociacao');
    } finally {
      setProcessandoFechamento(false);
    }
  };

  if (!conversaAtiva) {
    return (
      <div className="hidden flex-1 md:flex md:flex-col md:items-center md:justify-center md:bg-zinc-50 md:text-zinc-500">
        Selecione uma conversa para começar o chat.
      </div>
    );
  }

  const nomeExibicaoHeader = conversaAtiva.nomeOutroUsuario || 'Usuário';
  const conversaInfo = conversaDetalhe ?? conversaAtiva;
  const avatarUrl = montarUrlImagem(conversaInfo.avatarOutroUsuario);
  const imagemAnuncio = montarUrlImagem(conversaInfo.imagemAnuncio);
  const imagemAnuncioOferecido = montarUrlImagem(conversaInfo.imagemAnuncioOferecido);
  const statusFechamento = conversaInfo.usuarioJaAvaliou
    ? 'Você já avaliou esta negociação'
    : conversaInfo.negociacaoCancelada
      ? 'Negociação cancelada'
    : conversaInfo.chatFechado
      ? 'Chat fechado após avaliação'
      : conversaInfo.statusAnuncio === 'RESERVADO'
        ? 'Aguardando confirmação de recebimento'
        : conversaInfo.statusAnuncio === 'CONCLUIDO'
          ? 'Negócio concluído'
          : conversaInfo.interesseId
            ? 'Negociação aceita'
            : null;

  return (
    <div className={`flex h-full min-w-0 flex-1 flex-col bg-zinc-50 ${
      conversaAtiva ? 'flex' : 'hidden md:flex'
    }`}>
      <div className="border-b border-zinc-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onVoltar}
            className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 md:hidden hover:bg-zinc-50 transition-colors"
            aria-label="Voltar para conversas"
          >
            <ArrowLeft size={18} />
          </button>

          <button
            type="button"
            onClick={() => navigate(`/perfil/${conversaAtiva.outroUsuarioId}`)}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-blue-200 hover:text-blue-600 transition-colors"
            aria-label={`Abrir perfil de ${nomeExibicaoHeader}`}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={nomeExibicaoHeader}
                className="h-full w-full object-cover"
              />
            ) : (
              <User2 size={20} />
            )}
          </button>

          <div className="min-w-0">
            <button
              type="button"
              onClick={() => navigate(`/perfil/${conversaAtiva.outroUsuarioId}`)}
              className="block max-w-full truncate text-base font-semibold text-zinc-900 hover:text-blue-600 sm:text-lg transition-colors"
            >
              {nomeExibicaoHeader}
            </button>
            <p className="mt-0.5 truncate text-xs text-zinc-500 sm:text-sm font-medium">
              {conversaInfo.tituloAnuncioOferecido
                ? 'Negociação de troca'
                : conversaInfo.tituloAnuncio || 'Anúncio'}
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-zinc-200 bg-white px-4 py-3 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white text-zinc-300">
              {imagemAnuncio ? (
                <img src={imagemAnuncio} alt={conversaInfo.tituloAnuncio} className="h-full w-full object-cover" />
              ) : (
                <ImageIcon size={20} />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-blue-600">Anúncio</p>
              <p className="truncate text-sm font-semibold text-zinc-900">{conversaInfo.tituloAnuncio}</p>
            </div>
          </div>

          {conversaInfo.tituloAnuncioOferecido && (
            <div className="flex items-center gap-3 rounded-lg border border-orange-100 bg-orange-50 p-3">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white text-orange-300">
                {imagemAnuncioOferecido ? (
                  <img
                    src={imagemAnuncioOferecido}
                    alt={conversaInfo.tituloAnuncioOferecido}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon size={20} />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-orange-600">Oferta</p>
                <p className="truncate text-sm font-semibold text-zinc-900">
                  {conversaInfo.tituloAnuncioOferecido}
                </p>
              </div>
            </div>
          )}
        </div>

        {conversaInfo.interesseId && (
          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                  Fechamento
                </p>
                <p className="mt-1 text-sm font-medium text-blue-950">
                  {statusFechamento}
                </p>
                {conversaInfo.entreguePeloDonoEm && !conversaInfo.recebimentoConfirmadoEm && (
                  <p className="mt-1 text-xs text-blue-700/70">
                    Item marcado como entregue. Falta o interessado confirmar.
                  </p>
                )}
                {conversaInfo.usuarioJaAvaliou && (
                  <p className="mt-1 text-xs text-blue-700/70">
                    Obrigado pela avaliação. O chat desta negociação foi fechado.
                  </p>
                )}
                {conversaInfo.negociacaoCancelada && (
                  <p className="mt-1 text-xs text-blue-700/70">
                    A negociação foi cancelada. O histórico continua disponível para consulta.
                  </p>
                )}
                {!conversaInfo.usuarioJaAvaliou && conversaInfo.recebimentoConfirmadoEm && (
                  <p className="mt-1 text-xs text-blue-700/70">
                    Avaliações liberadas para os dois participantes.
                  </p>
                )}
              </div>

              {conversaInfo.podeMarcarEntregue && (
                <button
                  type="button"
                  onClick={handleMarcarEntregue}
                  disabled={processandoFechamento}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
                >
                  <PackageCheck size={16} />
                  {processandoFechamento ? 'Salvando...' : 'Marcar como entregue'}
                </button>
              )}

              {conversaInfo.podeConfirmarRecebimento && (
                <button
                  type="button"
                  onClick={handleConfirmarRecebimento}
                  disabled={processandoFechamento}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60 sm:w-auto"
                >
                  <CheckCircle2 size={16} />
                  {processandoFechamento ? 'Salvando...' : 'Confirmar recebimento'}
                </button>
              )}

              {conversaInfo.podeAvaliarOutroUsuario && !conversaInfo.usuarioJaAvaliou && (
                <button
                  type="button"
                  onClick={() => setModalAvaliacaoAberto(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600 sm:w-auto"
                >
                  <Star size={16} />
                  Avaliar usuário
                </button>
              )}

              {conversaInfo.podeCancelarNegociacao && (
                <button
                  type="button"
                  onClick={handleCancelarNegociacao}
                  disabled={processandoFechamento}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 sm:w-auto"
                >
                  <CircleX size={16} />
                  {processandoFechamento ? 'Salvando...' : 'Cancelar negociação'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto bg-zinc-50 px-3 py-4 sm:px-5 lg:px-6">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
          {carregandoMensagens ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-blue-600" />
            </div>
          ) : mensagens.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white px-6 text-center text-zinc-500">
              <p className="text-sm font-medium text-zinc-700">Nenhuma mensagem registrada.</p>
              <p className="mt-1 text-xs text-zinc-500">
                {conversaInfo.chatFechado
                  ? 'Esta negociação foi encerrada sem mensagens no histórico.'
                  : 'Inicie a conversa enviando a primeira mensagem.'}
              </p>
            </div>
          ) : (
            mensagens.map((mensagem, index) => {
              const isMe =
                mensagem.remetente === usuarioLogado.id ||
                mensagem.remetente === usuarioLogado.email ||
                mensagem.remetente === usuarioLogado.username;

              return (
                <div
                  key={mensagem.id || `${mensagem.timestamp}-${index}`}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-3 sm:max-w-[78%] lg:max-w-[68%] shadow-sm ${
                      isMe
                        ? 'rounded-br-md bg-blue-600 text-white'
                        : 'rounded-bl-md border border-zinc-200 bg-white text-zinc-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed sm:text-[15px]">
                      {mensagem.conteudo}
                    </p>
                    <p
                      className={`mt-1.5 text-[10px] text-right ${
                        isMe ? 'text-blue-200' : 'text-zinc-400'
                      }`}
                    >
                      {mensagem.timestamp
                        ? new Date(mensagem.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input flutuante moderno */}
      <div className="border-t border-zinc-200 bg-white px-4 py-4 sm:px-5 lg:px-6">
        <div className="mx-auto w-full max-w-4xl">
          {conversaInfo.chatFechado ? (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-center text-sm font-medium text-zinc-500">
              {conversaInfo.negociacaoCancelada
                ? 'Chat fechado após o cancelamento desta negociação.'
                : 'Chat fechado após a avaliação desta negociação.'}
            </div>
          ) : (
          <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all sm:gap-3 sm:rounded-lg">
            <input
              type="text"
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleEnviarMensagem();
                }
              }}
              placeholder="Digite sua mensagem..."
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 sm:px-4 sm:text-[15px]"
              disabled={enviandoMensagem}
            />

            <button
              type="button"
              onClick={handleEnviarMensagem}
              disabled={!novaMensagem.trim() || enviandoMensagem}
              className={`inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-200 active:scale-95 ${
                !novaMensagem.trim() || enviandoMensagem
                  ? 'cursor-not-allowed bg-zinc-100 text-zinc-300'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
              }`}
            >
              {enviandoMensagem ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
          )}
        </div>
      </div>

      {conversaInfo.podeAvaliarOutroUsuario && !conversaInfo.usuarioJaAvaliou && conversaInfo.anuncioId && (
        <AvaliacaoModal
          open={modalAvaliacaoAberto}
          onClose={() => setModalAvaliacaoAberto(false)}
          anuncioId={conversaInfo.anuncioId}
          avaliadoId={conversaAtiva.outroUsuarioId}
          avaliadoNome={nomeExibicaoHeader}
          onSuccess={carregarMensagens}
        />
      )}
    </div>
  );
};

export default JanelaChat;
