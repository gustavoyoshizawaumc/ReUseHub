interface JwtPayload {
  exp?: number;
  [chaveExtra: string]: unknown;
}

const TOLERANCIA_EXPIRACAO_MS = 30_000;

const SEGUNDOS_PARA_MS = 1_000;

export function tokenExpirado(token: string): boolean {
  const payload = decodificarPayload(token);
  if (payload === null || typeof payload.exp !== "number") {
    return true;
  }
  const instanteDeExpiracaoEmMs = payload.exp * SEGUNDOS_PARA_MS;
  return instanteDeExpiracaoEmMs <= Date.now() + TOLERANCIA_EXPIRACAO_MS;
}

function decodificarPayload(token: string): JwtPayload | null {
  const partes = token.split(".");
  if (partes.length !== 3) {
    return null;
  }
  try {
    const payloadJson = decodificarBase64Url(partes[1]);
    return JSON.parse(payloadJson) as JwtPayload;
  } catch {
    return null;
  }
}

function decodificarBase64Url(segmentoBase64Url: string): string {
  const base64 = segmentoBase64Url
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(segmentoBase64Url.length + ((4 - (segmentoBase64Url.length % 4)) % 4), "=");
  return atob(base64);
}
