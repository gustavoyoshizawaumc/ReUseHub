import React from 'react';
import { Inbox, User2 } from 'lucide-react';
import type { Conversa } from '../../types/chat.types';

const BASE_URL = 'http://localhost:8080';

const montarUrlImagem = (url?: string | null) => {
  if (!url) return null;
  return url.startsWith('http') ? url : `${BASE_URL}${url}`;
};

interface ListaConversasProps {
  conversas: Conversa[];
  conversaAtiva: Conversa | null;
  onSelecionarConversa: (conversa: Conversa) => void;
}

const ListaConversas: React.FC<ListaConversasProps> = ({
  conversas,
  conversaAtiva,
  onSelecionarConversa,
}) => {
  const sortedConversas = React.useMemo(() => {
    return [...conversas].sort((a, b) => {
      const da = a.dataUltimaAtualizacao || a.dataCriacao || '';
      const db = b.dataUltimaAtualizacao || b.dataCriacao || '';
      return new Date(db).getTime() - new Date(da).getTime();
    });
  }, [conversas]);

  const formatarData = (dataStr?: string) => {
    if (!dataStr) return '';
    const data = new Date(dataStr);
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);

    if (data.toDateString() === hoje.toDateString()) {
      return data.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (data.toDateString() === ontem.toDateString()) return 'Ontem';
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  return (
    <aside className={`h-full w-full flex-shrink-0 flex-col border-r border-zinc-200 bg-white md:w-80 xl:w-[23rem] ${
      conversaAtiva ? 'hidden md:flex' : 'flex'
    }`}>
      <div className="border-b border-zinc-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-5">
        <h2 className="text-base font-semibold tracking-tight text-zinc-900">
          Mensagens
        </h2>
        <p className="mt-1 text-xs text-zinc-500">Suas conversas recentes</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sortedConversas.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 shadow-sm">
              <Inbox size={22} className="text-zinc-500" />
            </div>
            <p className="text-sm font-medium text-zinc-800">Nenhuma conversa</p>
            <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-zinc-500">
              Suas mensagens aparecerão aqui
            </p>
          </div>
        ) : (
          sortedConversas.map((conversa) => {
            const isAtiva = conversaAtiva?.id === conversa.id;
            const nome = conversa.nomeOutroUsuario || 'Usuário';
            const tituloAnuncio = conversa.tituloAnuncio || 'Anúncio';
            const avatarUrl = montarUrlImagem(conversa.avatarOutroUsuario);
            const ultimaMsg = conversa.ultimaMensagem || 'Sem mensagens';
            const data = formatarData(
              conversa.dataUltimaAtualizacao || conversa.dataCriacao
            );
            const temNaoLidas = (conversa.naoLidas ?? 0) > 0;

            return (
              <button
                type="button"
                key={conversa.id}
                onClick={() => onSelecionarConversa(conversa)}
                className={`w-full border-b border-zinc-100 px-4 py-3.5 text-left transition-colors duration-200 sm:px-5 ${
                  isAtiva
                    ? 'bg-blue-50/70'
                    : 'bg-white hover:bg-zinc-50 active:bg-zinc-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border transition-colors ${
                      isAtiva
                        ? 'border-blue-200 bg-blue-50 text-blue-600'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-500'
                    }`}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={nome}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <User2 size={17} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={`truncate pr-2 text-sm ${
                          temNaoLidas
                            ? 'font-semibold text-zinc-900'
                            : 'font-medium text-zinc-800'
                        }`}
                      >
                        {nome}
                      </span>

                      <span className="flex-shrink-0 pt-0.5 text-[11px] text-zinc-400">
                        {data}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-[11px] font-medium uppercase tracking-wide text-blue-600/90">
                      {tituloAnuncio}
                    </p>

                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <p
                        className={`truncate text-xs ${
                          temNaoLidas
                            ? 'font-medium text-zinc-700'
                            : 'text-zinc-400'
                        }`}
                      >
                        {ultimaMsg}
                      </p>

                      {temNaoLidas && (
                        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-semibold text-white">
                          {conversa.naoLidas}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};

export default ListaConversas;
