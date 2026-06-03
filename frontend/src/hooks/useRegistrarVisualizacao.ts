import { useEffect, useRef } from "react";
import {
  registrarVisualizacao,
  type OrigemVisualizacao,
} from "../services/visualizacaoService";

/**
 * Dispara o tracking de visualizacao do anuncio (PR D.2) exatamente uma
 * vez por mount do componente que o usa.
 *
 * <p>Proteg-se contra:
 *  - Double-fire do React 19 StrictMode em dev (mount -&gt; unmount -&gt; mount):
 *    um {@code ref} guarda o id ja registrado e ignora a 2a chamada.
 *  - Mudanca de {@code anuncioId} durante navegacao SPA: ao trocar para um
 *    novo id, o ref e atualizado e dispara o tracking do novo.
 *  - {@code anuncioId} indefinido (rota ainda carregando): nao chama nada.
 *
 * <p>O backend tem dedupe de 1h, entao mesmo que escape um disparo extra
 * por bug do client, a contagem se mantem honesta. O ref aqui e otimizacao
 * (menos requests inuteis), nao requisito de corretude.
 *
 * @param anuncioId Id do anuncio a registrar; tracking pausa quando {@code undefined}.
 * @param origem    De onde o usuario veio (definido pela rota que renderiza este componente).
 */
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
