import { useEffect, useRef, useState } from "react";
import { bootstrapHome } from "../services/anuncioService";
import type { BootstrapHome } from "../types/anuncio.types";
import { readSessionStorage, writeSessionStorage } from "../utils/sessionStorage";

const CHAVE_CACHE = "reusehub:home-bootstrap";

export interface EstadoBootstrapHome {
  dados: BootstrapHome | null;
  carregando: boolean;
  erro: string | null;
}

/**
 * Carrega a receita da home com padrao stale-while-revalidate:
 *
 *  1. Se ha cache em sessionStorage, renderiza imediatamente.
 *  2. SEMPRE dispara um refetch em background no mount.
 *  3. Quando a resposta nova chega com sucesso, substitui o estado e
 *     atualiza o cache (sem comparacao por fingerprint - a fonte da verdade
 *     e sempre a resposta nova do backend).
 *  4. Se o refetch falhar:
 *     - com cache: erro silenciado (degradacao graciosa)
 *     - sem cache: erro propagado para a UI tratar
 */
export function useBootstrapHome(): EstadoBootstrapHome {
  // Lazy initializer: readSessionStorage roda uma unica vez no mount.
  const [dados, setDados] = useState<BootstrapHome | null>(
    () => readSessionStorage<BootstrapHome>(CHAVE_CACHE)
  );
  const [carregando, setCarregando] = useState<boolean>(() => dados === null);
  const [erro, setErro] = useState<string | null>(null);

  // Snapshot do momento do mount: usado para silenciar erro quando ja
  // temos algo renderizado (SWR graceful degradation).
  const haviaCacheNoMountRef = useRef<boolean>(dados !== null);

  useEffect(() => {
    let ativo = true;

    bootstrapHome()
      .then((fresh) => {
        if (!ativo) return;
        setDados(fresh);
        setErro(null);
        writeSessionStorage(CHAVE_CACHE, fresh);
      })
      .catch((e: unknown) => {
        if (!ativo) return;
        if (!haviaCacheNoMountRef.current) {
          const mensagem = e instanceof Error ? e.message : "Erro ao carregar home";
          setErro(mensagem);
        }
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  return { dados, carregando, erro };
}
