import type { BuscaFiltro } from "../types/busca.types";
import { readSessionStorage, writeSessionStorage } from "./sessionStorage";

const CHAVE_FILTRO_LOCALIZACAO = "reusehub:filtro-localizacao";

export const EVENTO_FILTRO_LOCALIZACAO = "reusehub:filtro-localizacao";
export const RAIOS_BUSCA_CEP = [5, 10, 25, 50, 100] as const;

export interface FiltroLocalizacaoSessao {
  cep: string;
  raioKm: number;
}

export function normalizarCep(cep: string): string {
  return cep.replace(/\D/g, "").slice(0, 8);
}

export function obterFiltroLocalizacaoSessao(): FiltroLocalizacaoSessao | null {
  const filtro = readSessionStorage<FiltroLocalizacaoSessao>(CHAVE_FILTRO_LOCALIZACAO);
  if (!filtro) return null;

  const cep = normalizarCep(filtro.cep);
  const raioKm = normalizarRaio(filtro.raioKm);

  return cep.length === 8 ? { cep, raioKm } : null;
}

export function obterBuscaLocalizacaoSessao(): BuscaFiltro {
  const filtro = obterFiltroLocalizacaoSessao();
  if (!filtro) return {};

  // Apenas cep + raio. Nao forcamos ordenacao aqui: como este objeto e espalhado por
  // ultimo na montagem do filtro, forcar "DISTANCIA" sobrescreveria a ordenacao escolhida
  // na sidebar (Recentes/Relevantes/Populares). Sem ordenacao explicita e com coordenadas,
  // o backend ja assume DISTANCIA por padrao (AnuncioService#determinarOrdenacaoPadrao).
  return {
    cep: filtro.cep,
    raioKm: filtro.raioKm,
  };
}

export function salvarFiltroLocalizacaoSessao(cepInformado: string, raioInformado: number): void {
  const cep = normalizarCep(cepInformado);

  if (cep.length !== 8) {
    limparFiltroLocalizacaoSessao();
    return;
  }

  const filtro = { cep, raioKm: normalizarRaio(raioInformado) };
  writeSessionStorage(CHAVE_FILTRO_LOCALIZACAO, filtro);
  emitirEventoFiltroLocalizacao(filtro);
}

export function limparFiltroLocalizacaoSessao(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(CHAVE_FILTRO_LOCALIZACAO);
  }
  emitirEventoFiltroLocalizacao(null);
}

function normalizarRaio(raioKm: number): number {
  return RAIOS_BUSCA_CEP.includes(raioKm as (typeof RAIOS_BUSCA_CEP)[number])
    ? raioKm
    : 10;
}

function emitirEventoFiltroLocalizacao(filtro: FiltroLocalizacaoSessao | null): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENTO_FILTRO_LOCALIZACAO, { detail: filtro }));
}
