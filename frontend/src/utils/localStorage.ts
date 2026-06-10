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
    // ignora indisponibilidade do storage
  }
}

export function removeLocalStorage(chave: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(chave);
  } catch {
    // ignora indisponibilidade do storage
  }
}
