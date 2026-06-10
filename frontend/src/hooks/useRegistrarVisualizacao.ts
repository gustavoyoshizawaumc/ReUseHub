import { useEffect, useRef } from "react";
import {
  registrarVisualizacao,
  type OrigemVisualizacao,
} from "../services/visualizacaoService";

export function useRegistrarVisualizacao(
  anuncioId: string | undefined,
  origem: OrigemVisualizacao
): void {
  const ultimoIdRegistradoRef = useRef<string | null>(null);

  useEffect(() => {
    if (!anuncioId) {
      return;
    }
    if (ultimoIdRegistradoRef.current === anuncioId) {
      return;
    }
    ultimoIdRegistradoRef.current = anuncioId;
    void registrarVisualizacao(anuncioId, origem);
  }, [anuncioId, origem]);
}
