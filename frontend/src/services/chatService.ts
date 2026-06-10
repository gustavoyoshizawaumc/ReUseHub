import type { Conversa, ConversaDetalhe, Mensagem } from '../types/chat.types';

import { apiUrl } from '../config/api';
import { obterTokenAtivoOuEncerrarSessao } from '../utils/sessao';

const BASE_URL = apiUrl('/api/chat');

const getAuthHeaders = (): Record<string, string> => {
  const token = obterTokenAtivoOuEncerrarSessao();
  const headers: Record<string, string> = {};

  if (token) {
    const cleanToken = token.replace(/"/g, '').trim();
    headers['Authorization'] = `Bearer ${cleanToken}`;
  }

  return headers;
};

const parseJsonSafely = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get('content-type') || '';
  const raw = await response.text();

  if (!response.ok) {
    throw new Error(`Erro ${response.status}: ${raw}`);
  }

  if (!raw) {
    return null as T;
  }

  if (!contentType.includes('application/json')) {
    throw new Error(`Resposta inesperada da API: ${raw.substring(0, 200)}`);
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`Falha ao interpretar JSON da API: ${raw.substring(0, 200)}`);
  }
};

async function listarConversas(): Promise<Conversa[]> {
  console.log('Listando conversas...');

  const response = await fetch(`${BASE_URL}/minhas-conversas`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await parseJsonSafely<{ conversas?: Conversa[] } | Conversa[]>(response);

  const conversas = Array.isArray(data)
    ? data
    : Array.isArray(data?.conversas)
      ? data.conversas
      : [];

  return conversas.map((conversa) => ({
    ...conversa,
    naoLidas: conversa.naoLidas ?? conversa.mensagensNaoLidas ?? 0,
  }));
}

async function obterConversaPorId(conversaId: string): Promise<ConversaDetalhe> {
  if (!conversaId) {
    throw new Error('ID da conversa não informado');
  }

  console.log('Obtendo conversa por ID:', conversaId);

  const response = await fetch(`${BASE_URL}/${conversaId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return await parseJsonSafely<ConversaDetalhe>(response);
}

async function obterMensagens(conversaId: string): Promise<Mensagem[]> {
  const conversa = await obterConversaPorId(conversaId);
  return Array.isArray(conversa?.mensagens) ? conversa.mensagens : [];
}

async function iniciarConversa(payload: {
  anuncioId: string;
  destinatarioId: string;
}): Promise<ConversaDetalhe> {
  console.log('Iniciando conversa...', payload);

  const response = await fetch(`${BASE_URL}/iniciar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  return await parseJsonSafely<ConversaDetalhe>(response);
}

async function enviarMensagem(conversaId: string, conteudo: string): Promise<void> {
  console.log('Enviando mensagem para a conversa:', conversaId);

  const response = await fetch(`${BASE_URL}/enviar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ conversaId, conteudo }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao enviar mensagem: ${errorText}`);
  }
}

async function marcarComoLido(conversaId: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/${conversaId}/lido`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  if (response.status === 403) {
    return;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao marcar como lido: ${errorText}`);
  }
}

export {
  listarConversas,
  obterMensagens,
  obterConversaPorId,
  iniciarConversa,
  enviarMensagem,
  marcarComoLido,
};
