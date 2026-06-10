import { API_BASE_URL } from "../config/api";

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
