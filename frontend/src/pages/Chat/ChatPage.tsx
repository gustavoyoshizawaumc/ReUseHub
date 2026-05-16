import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import JanelaChat from '../../components/chat/JanelaChat';
import ListaConversas from '../../components/chat/ListaConversas';
import { Header } from '../../components/Header';
import { listarConversas, iniciarConversa } from '../../services/chatService';
import type { Conversa } from '../../types/chat.types';

type ChatLocationState = {
  destinatarioId?: string;
  destinatarioNome?: string;
  anuncioId?: string;
  anuncioTitulo?: string;
  conversaId?: string;
};

export const ChatPage: React.FC = () => {
  const location = useLocation();
  const state = (location.state as ChatLocationState) || null;

  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaAtiva, setConversaAtiva] = useState<Conversa | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        let conversaInicialId = state?.conversaId;

        if (!conversaInicialId && state?.anuncioId && state?.destinatarioId) {
          const conversaCriada = await iniciarConversa({
            anuncioId: state.anuncioId,
            destinatarioId: state.destinatarioId,
          });

          conversaInicialId = conversaCriada?.id;
        }

        const lista = await listarConversas();
        setConversas(lista);

        if (conversaInicialId) {
          const encontrada = lista.find((c) => c.id === conversaInicialId);
          if (encontrada) {
            setConversaAtiva(encontrada);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar conversas:', error);
      } finally {
        setCarregando(false);
      }
    };

    carregar();
  }, [state?.anuncioId, state?.destinatarioId, state?.conversaId]);

  if (carregando) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-slate-500">Carregando chat...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      <Header />

      <main className="flex-1 min-h-0 flex overflow-hidden">
        <ListaConversas
          conversas={conversas}
          conversaAtiva={conversaAtiva}
          onSelecionarConversa={setConversaAtiva}
        />

        <div className="flex-1 min-h-0">
          <JanelaChat conversaAtiva={conversaAtiva} />
        </div>
      </main>
    </div>
  );
};