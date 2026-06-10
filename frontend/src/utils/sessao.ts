import { tokenExpirado } from "./jwt";
import { limparUltimasBuscas } from "./ultimasBuscas";

const CHAVE_TOKEN = "token";
const CHAVE_USUARIO = "user";
const ROTA_LOGIN = "/login";

const guardaContraRedirecionamentosConcorrentes = {
  emAndamento: false,
};

export function encerrarSessao(): void {
  if (typeof window === "undefined") {
    return;
  }
  if (guardaContraRedirecionamentosConcorrentes.emAndamento) {
    return;
  }
  guardaContraRedirecionamentosConcorrentes.emAndamento = true;

  window.localStorage.removeItem(CHAVE_TOKEN);
  window.localStorage.removeItem(CHAVE_USUARIO);

  limparUltimasBuscas();

  if (window.location.pathname !== ROTA_LOGIN) {
    window.location.assign(ROTA_LOGIN);
  }
}

export function obterTokenValidoOuNull(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const token = window.localStorage.getItem(CHAVE_TOKEN);
  if (token === null || tokenExpirado(token)) {
    return null;
  }
  return token;
}

export function obterTokenAtivoOuEncerrarSessao(): string | null {
  const token = obterTokenValidoOuNull();
  if (token !== null) {
    return token;
  }
  if (typeof window !== "undefined" && window.localStorage.getItem(CHAVE_TOKEN) !== null) {
    encerrarSessao();
  }
  return null;
}
