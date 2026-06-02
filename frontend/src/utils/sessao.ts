import { tokenExpirado } from "./jwt";
import { limparUltimasBuscas } from "./ultimasBuscas";

/**
 * Side effect isolado de "encerrar sessao": limpa credenciais locais
 * e redireciona para a tela de login. Mantido em utility separada para:
 *  - permitir uso em qualquer service sem importar React/Router
 *  - facilitar mock em testes (substituir a funcao quando necessario)
 */

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

  // Evita vazamento de historico de buscas entre contas no mesmo browser.
  limparUltimasBuscas();

  // Evita "loop" se o usuario ja estiver na tela de login.
  if (window.location.pathname !== ROTA_LOGIN) {
    window.location.assign(ROTA_LOGIN);
  }
}

/**
 * Obtem o token de autenticacao se ele estiver presente e valido.
 * Se estiver expirado/corrompido, encerra a sessao automaticamente
 * antes de devolver null (evita enviar requests fadadas a 401/403).
 *
 * Use este helper em todos os services que anexam Authorization,
 * no lugar de ler localStorage.getItem diretamente.
 */
export function obterTokenAtivoOuEncerrarSessao(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const token = window.localStorage.getItem(CHAVE_TOKEN);
  if (token === null) {
    return null;
  }
  if (tokenExpirado(token)) {
    encerrarSessao();
    return null;
  }
  return token;
}
