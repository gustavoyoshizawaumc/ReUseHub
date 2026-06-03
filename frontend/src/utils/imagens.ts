/**
 * Constroi a URL final de uma imagem armazenada pelo backend.
 *
 * Lida com os 3 formatos que o backend pode devolver no mesmo campo:
 *  - URL absoluta `http(s)://...` (ex: S3, CDN, gravatar) -> retorna inalterada
 *  - Path relativo `/uploads/abc.png` -> prefixa {@link API_BASE_URL}
 *  - Data URL `data:image/...;base64,...` -> retorna inalterada (preview local)
 *
 * Centralizar essa logica em um lugar so evita o bug classico de
 * `${API_BASE_URL}${urlS3Absoluta}`, que produz `api.reusehub.mehttps://...`
 * e quebra com `ERR_NAME_NOT_RESOLVED`.
 */

import { API_BASE_URL } from "../config/api";

/**
 * @param path     Caminho ou URL recebida do backend.
 * @param fallback Valor devolvido quando {@code path} e null, undefined ou vazio.
 *                 Default {@code null} - caller decide o que mostrar quando ausente.
 */
export function obterUrlImagem(
  path: string | null | undefined,
  fallback: string | null = null
): string | null {
  if (!path) {
    return fallback;
  }
  if (path.startsWith("http") || path.startsWith("data:")) {
    return path;
  }
  const separador = path.startsWith("/") ? "" : "/";
  return `${API_BASE_URL}${separador}${path}`;
}
