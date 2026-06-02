import { useEffect, useState } from "react";
import { lerUltimasBuscas } from "../utils/ultimasBuscas";
import { buscarAnuncios, listarDestaques } from "../services/anuncioService";
import type { AnuncioDestaque } from "../types/anuncio.types";

/**
 * Hook que monta o conteudo da secao "Baseado em suas ultimas buscas" da home.
 *
 * Combina as 5 ultimas buscas do localStorage com chamadas paralelas ao backend:
 *  - Buscas com categoria definida usam o ranqueamento de destaques
 *    (mesmo motor de MAIS_PROCURADOS, sem afinidade).
 *  - Buscas apenas com termo usam o full-text search padrao de anuncios.
 *
 * Apos receber as listas, deduplica por anuncio.id (anuncio pode aparecer em
 * mais de uma busca) e limita a 6 itens (mesma densidade visual da home).
 *
 * Estado:
 *  - dados: lista pronta pra renderizar (ou [] enquanto carrega/sem buscas)
 *  - carregando: true ate todas as requisicoes resolverem
 *  - existemBuscas: false quando o localStorage esta vazio (UI esconde a secao)
 */

const QUANTIDADE_POR_BUSCA = 3;
const TOTAL_MAXIMO_NA_SECAO = 6;

export interface EstadoUltimasBuscasComAnuncios {
  dados: AnuncioDestaque[];
  carregando: boolean;
  existemBuscas: boolean;
}

export function useUltimasBuscasComAnuncios(): EstadoUltimasBuscasComAnuncios {
  // Snapshot do localStorage no momento do mount via lazy initializer.
  // Mantemos imutavel: o hook nao reage a mudancas posteriores (uma nova busca
  // so aparece no proximo carregamento da home), evitando re-fetches em loop.
  const [buscasIniciais] = useState(() => lerUltimasBuscas());

  const [dados, setDados] = useState<AnuncioDestaque[]>([]);
  const [carregando, setCarregando] = useState<boolean>(buscasIniciais.length > 0);

  useEffect(() => {
    if (buscasIniciais.length === 0) {
      return;
    }

    let ativo = true;

    Promise.all(buscasIniciais.map(buscarDestaquesParaBusca))
      .then((listas) => {
        if (!ativo) return;
        setDados(deduplicarELimitar(listas.flat()));
      })
      .catch(() => {
        // Se alguma busca falhar, deixamos a secao vazia (esconde no render).
        if (ativo) setDados([]);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [buscasIniciais]);

  return {
    dados,
    carregando,
    existemBuscas: buscasIniciais.length > 0,
  };
}

async function buscarDestaquesParaBusca(
  busca: { termo: string; categoriaId: number | null }
): Promise<AnuncioDestaque[]> {
  try {
    if (busca.categoriaId !== null) {
      return await listarDestaques("MAIS_PROCURADOS", QUANTIDADE_POR_BUSCA, busca.categoriaId);
    }
    return await converterBuscaTextualEmDestaques(busca.termo);
  } catch {
    return [];
  }
}

async function converterBuscaTextualEmDestaques(termo: string): Promise<AnuncioDestaque[]> {
  const resultado = await buscarAnuncios(termo, 0, QUANTIDADE_POR_BUSCA);
  return resultado.content.map((anuncio) => ({ anuncio, scoreDestaque: null }));
}

function deduplicarELimitar(itens: AnuncioDestaque[]): AnuncioDestaque[] {
  const idsJaVistos = new Set<string>();
  const unicos: AnuncioDestaque[] = [];

  for (const item of itens) {
    if (idsJaVistos.has(item.anuncio.id)) {
      continue;
    }
    idsJaVistos.add(item.anuncio.id);
    unicos.push(item);
    if (unicos.length >= TOTAL_MAXIMO_NA_SECAO) {
      break;
    }
  }

  return unicos;
}
