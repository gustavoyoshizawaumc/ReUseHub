import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  aceitarInteresse,
  listarInteressesRecebidos,
  recusarInteresse,
} from "../../services/interesseService";
import type { InteresseResposta } from "../../types/interesse.types";

export const InteressesRecebidosPage: React.FC = () => {
  const navigate = useNavigate();
  const [interesses, setInteresses] = useState<InteresseResposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const carregar = async () => {
    try {
      setLoading(true);
      const dados = await listarInteressesRecebidos();
      setInteresses(dados);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao carregar interesses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleAceitar = async (id: string) => {
    try {
      setProcessingId(id);
      const resposta = await aceitarInteresse(id);
      await carregar();

      if (resposta.conversaId) {
        navigate("/chat", {
          state: {
            conversaId: resposta.conversaId,
          },
        });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao aceitar interesse");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRecusar = async (id: string) => {
    try {
      setProcessingId(id);
      await recusarInteresse(id);
      await carregar();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao recusar interesse");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="p-6">Carregando interesses recebidos...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Interesses recebidos</h1>

      {interesses.length === 0 ? (
        <div className="bg-white rounded-3xl p-6 shadow border border-slate-100 text-slate-500">
          Nenhum interesse recebido até o momento.
        </div>
      ) : (
        interesses.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl p-6 shadow border border-slate-100 space-y-3"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-slate-900">{item.anuncioDesejadoTitulo}</h2>
                <p className="text-sm text-slate-500">
                  Interesse enviado por {item.interessadoNome}
                </p>
              </div>

              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                {item.status}
              </span>
            </div>

            {item.anuncioOferecidoTitulo && (
              <p className="text-sm text-slate-600">
                Ofereceu em troca: <strong>{item.anuncioOferecidoTitulo}</strong>
              </p>
            )}

            <p className="text-slate-700 whitespace-pre-wrap">{item.mensagem}</p>

            {item.status === "PENDENTE" && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleAceitar(item.id)}
                  disabled={processingId === item.id}
                  className="px-5 py-3 rounded-2xl bg-emerald-600 text-white font-bold disabled:opacity-60"
                >
                  {processingId === item.id ? "Processando..." : "Aceitar"}
                </button>

                <button
                  onClick={() => handleRecusar(item.id)}
                  disabled={processingId === item.id}
                  className="px-5 py-3 rounded-2xl bg-red-600 text-white font-bold disabled:opacity-60"
                >
                  {processingId === item.id ? "Processando..." : "Recusar"}
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};