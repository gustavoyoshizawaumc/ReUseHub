import type { Anuncio, PaginacaoResponse } from '../types/anuncio.types';

const BASE_URL = 'http://localhost:8080/api/anuncios';

const getAuthHeaders = (): Record<string, string> => {
  const raw = localStorage.getItem('token');
  const token = raw ? raw.replace(/"/g, '').trim() : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export async function listarAnunciosPendentes(
  page = 0,
  size = 10
): Promise<PaginacaoResponse<Anuncio>> {
  const response = await fetch(
    `${BASE_URL}/moderacao/pendentes?page=${page}&size=${size}`,
    { headers: getAuthHeaders() }
  );

  if (!response.ok) throw new Error('Erro ao listar anúncios pendentes');
  return response.json();
}

export async function aprovarAnuncio(id: string): Promise<Anuncio> {
  const response = await fetch(`${BASE_URL}/moderacao/${id}/aprovar`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  if (!response.ok) throw new Error('Erro ao aprovar anúncio');
  return response.json();
}

export async function reprovarAnuncio(id: string): Promise<Anuncio> {
  const response = await fetch(`${BASE_URL}/moderacao/${id}/reprovar`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  if (!response.ok) throw new Error('Erro ao reprovar anúncio');
  return response.json();
}