/**
 * Identificador anonimo persistente do device.
 *
 * Gerado na primeira visita ao site (UUID v4 via crypto.randomUUID) e
 * persistido em localStorage. Sobrevive a logout, refresh e fechamento do
 * browser, mas e zerado quando o usuario limpa storage (e.g., modo privado
 * descartado, browser reset). Este custo conhecido e aceitavel: o anon_id
 * existe como uma das tres camadas do dedupe de visualizacao (PR D.2),
 * e nao ha garantia de identidade forte sem login.
 *
 * Importante: NUNCA limpar no logout. O anon_id e identidade de device,
 * nao de conta - reaproveita-lo entre sessoes anonimas e o comportamento
 * desejado.
 */

import { readLocalStorage, writeLocalStorage } from "./localStorage";

const CHAVE_ANON_ID = "reusehub:anon-id";

/**
 * Lazy: cria na primeira chamada e reusa nas seguintes. SSR-safe; em
 * ambiente sem `window` (SSR/teste) devolve {@code null} e o caller decide
 * o que fazer (o tracking simplesmente cai pra camada de IP no backend).
 */
export function obterOuCriarAnonId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const existente = readLocalStorage<string>(CHAVE_ANON_ID);
  if (existente && typeof existente === "string" && existente.trim().length > 0) {
    return existente;
  }

  const novo = gerarUuid();
  if (novo === null) {
    return null;
  }

  writeLocalStorage(CHAVE_ANON_ID, novo);
  return novo;
}

/**
 * Encapsula a obtencao de UUID v4 com fallback para ambientes sem
 * {@code crypto.randomUUID} (browsers muito antigos ou contexto inseguro http).
 */
function gerarUuid(): string | null {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback simples baseado em Math.random; aceitavel para um id de tracking
  // que nao tem requisito de seguranca criptografica.
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // versao 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return null;
}
