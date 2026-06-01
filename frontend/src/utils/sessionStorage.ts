/**
 * Helpers tipados para acesso ao sessionStorage. Cobrem o caso de ambientes
 * sem `window` (SSR, testes), quotas estouradas e payload corrompido.
 */

export function readSessionStorage<T>(chave: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const bruto = window.sessionStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : null;
  } catch {
    return null;
  }
}

export function writeSessionStorage<T>(chave: string, valor: T): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // Storage cheio, modo privado ou desabilitado pelo usuario.
    // Falha silenciosa: cache e otimizacao, nao requisito.
  }
}
