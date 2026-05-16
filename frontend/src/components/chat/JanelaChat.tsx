import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  obterConversaPorId,
  enviarMensagem,
  marcarComoLido,
} from '../../services/chatService';
import type { Conversa, Mensagem } from '../../types/chat.types';
import { ArrowLeft, Send } from 'lucide-react';

interface JanelaChatProps {
  conversaAtiva: Conversa | null;
  onVoltar: () => void;
}

const JanelaChat: React.FC<JanelaChatProps> = ({ conversaAtiva, onVoltar }) => {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [carregandoMensagens, setCarregandoMensagens] = useState(false);
  const [enviandoMensagem, setEnviandoMensagem] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const usuarioLogado = useMemo(() => {
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
  }, []);

  const carregarMensagens = async () => {
    if (!conversaAtiva?.id) {
      setMensagens([]);
      return;
    }

    setCarregandoMensagens(true);
    try {
      const conversaDetalhe = await obterConversaPorId(conversaAtiva.id);
      setMensagens(conversaDetalhe?.mensagens ?? []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      setMensagens([]);
    } finally {
      setCarregandoMensagens(false);
    }

    try {
      await marcarComoLido(conversaAtiva.id);
    } catch (error) {
      console.warn('Não foi possível marcar a conversa como lida:', error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  useEffect(() => {
    carregarMensagens();
  }, [conversaAtiva?.id]);

  const handleEnviarMensagem = async () => {
    if (!conversaAtiva?.id || !novaMensagem.trim()) return;

    setEnviandoMensagem(true);
    try {
      await enviarMensagem(conversaAtiva.id, novaMensagem.trim());
      setNovaMensagem('');
      await carregarMensagens();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setEnviandoMensagem(false);
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

          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.7}
                d="M15 19a4 4 0 0 0-8 0m4-8a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
              />
            </svg>
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-zinc-900 sm:text-lg">
              {nomeExibicaoHeader}
            </h2>
            <p className="mt-0.5 truncate text-xs text-zinc-500 sm:text-sm font-medium">
              {conversaAtiva.tituloAnuncio || 'Anúncio'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-zinc-50 px-3 py-4 sm:px-5 lg:px-6">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
          {carregandoMensagens ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-blue-600" />
            </div>
          ) : mensagens.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white px-6 text-center text-zinc-500">
              <p className="text-sm font-medium text-zinc-700">Nenhuma mensagem ainda.</p>
              <p className="mt-1 text-xs text-zinc-500">
                Inicie a conversa enviando a primeira mensagem.
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
                    className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[78%] lg:max-w-[68%] shadow-sm ${
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
          <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all sm:gap-3 sm:rounded-2xl">
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
        </div>
      </div>
    </div>
  );
};

export default JanelaChat;