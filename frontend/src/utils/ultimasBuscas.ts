import { readLocalStorage, writeLocalStorage, removeLocalStorage } from "./localStorage";

const CHAVE_ULTIMAS_BUSCAS = "reusehub:ultimas-buscas";

const QUANTIDADE_MAXIMA_BUSCAS = 5;
const TAMANHO_MINIMO_TERMO = 2;
const TTL_DIAS = 30;
const TTL_MS = TTL_DIAS * 24 * 60 * 60 * 1000;

export interface BuscaSalva {
  termo: string;
  categoriaId: number | null;
  buscadoEm: number;
}

export function lerUltimasBuscas(): BuscaSalva[] {
  const todas = readLocalStorage<BuscaSalva[]>(CHAVE_ULTIMAS_BUSCAS) ?? [];
  if (!Array.isArray(todas)) {
    return [];
  }

  const agora = Date.now();
  const validas = todas.filter((busca) => agora - busca.buscadoEm <= TTL_MS);

  if (validas.length !== todas.length) {
    writeLocalStorage(CHAVE_ULTIMAS_BUSCAS, validas);
  }

  return validas.sort((a, b) => b.buscadoEm - a.buscadoEm);
}

export function registrarBusca(termo: string, categoriaId: number | null = null): void {
  const termoNormalizado = termo.trim();
  if (termoNormalizado.length < TAMANHO_MINIMO_TERMO) {
    return;
  }

  const buscas = lerUltimasBuscas();
  const semDuplicada = buscas.filter(
    (busca) => !mesmoConteudo(busca, termoNormalizado, categoriaId)
  );

  const novaBusca: BuscaSalva = {
    termo: termoNormalizado,
    categoriaId,
    buscadoEm: Date.now(),
  };

  const atualizadas = [novaBusca, ...semDuplicada].slice(0, QUANTIDADE_MAXIMA_BUSCAS);
  writeLocalStorage(CHAVE_ULTIMAS_BUSCAS, atualizadas);
}

export function limparUltimasBuscas(): void {
  removeLocalStorage(CHAVE_ULTIMAS_BUSCAS);
}

function mesmoConteudo(
  busca: BuscaSalva,
  termoNormalizado: string,
  categoriaId: number | null
): boolean {
  return (
    busca.termo.toLowerCase() === termoNormalizado.toLowerCase() &&
    busca.categoriaId === categoriaId
  );
}
