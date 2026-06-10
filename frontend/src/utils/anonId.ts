import { readLocalStorage, writeLocalStorage } from "./localStorage";

const CHAVE_ANON_ID = "reusehub:anon-id";

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

function gerarUuid(): string | null {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return null;
}
