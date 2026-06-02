/**
 * Helpers tipados para acesso ao localStorage. Cobrem o caso de ambientes
 * sem `window` (SSR, testes), quotas estouradas e payload corrompido.
 *
 * Analogo ao utils/sessionStorage.ts, mas para dados persistentes
 * (sobrevivem ao fechamento do browser).
 */

export function readLocalStorage<T>(chave: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const bruto = window.localStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : null;
  } catch {
    return null;
  }
}

export function writeLocalStorage<T>(chave: string, valor: T): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // Storage cheio, modo privado ou desabilitado pelo usuario.
    // Falha silenciosa: cache e otimizacao, nao requisito.
  }
}

export function removeLocalStorage(chave: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(chave);
  } catch {
    // Falha silenciosa: mesma motivacao das funcoes acima.
  }
}
