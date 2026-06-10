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

export function useBootstrapHome(): EstadoBootstrapHome {
  const [dados, setDados] = useState<BootstrapHome | null>(
    () => readSessionStorage<BootstrapHome>(CHAVE_CACHE)
  );
  const [carregando, setCarregando] = useState<boolean>(() => dados === null);
  const [erro, setErro] = useState<string | null>(null);

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
