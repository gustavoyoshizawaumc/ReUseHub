import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  aceitarInteresse,
  listarInteressesRecebidos,
  recusarInteresse,
} from "../../services/interesseService";
import type { InteresseResposta } from "../../types/interesse.types";
import { AvaliacaoModal } from "../../components/avaliacao/AvaliacaoModal";
import { Header } from "../../components/Header";
import { ImageOff, Star } from "lucide-react";

import { API_BASE_URL } from "../../config/api";

const BASE_URL = API_BASE_URL;

const imagemUrl = (url?: string | null) => {
  if (!url) return null;
  return url.startsWith("http") ? url : `${BASE_URL}${url}`;
};

const Estrelas: React.FC<{ nota?: number | null }> = ({ nota = 0 }) => (
  <div className="flex items-center gap-0.5 text-orange-500">
    {[1, 2, 3, 4, 5].map((valor) => (
      <Star
        key={valor}
        size={14}
        fill={valor <= Math.round(nota || 0) ? "currentColor" : "none"}
      />
    ))}
    <span className="ml-1 text-xs font-bold text-slate-500">
      {(nota || 0).toFixed(1)}
    </span>
  </div>
);

const MiniImagem: React.FC<{ url?: string | null; alt: string }> = ({ url, alt }) => {
  const src = imagemUrl(url);

  return (
    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 text-slate-300 sm:h-20 sm:w-20">
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <ImageOff size={22} />
      )}
    </div>
  );
};

export const InteressesRecebidosPage: React.FC = () => {
  const navigate = useNavigate();
  const [interesses, setInteresses] = useState<InteresseResposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [avaliacao, setAvaliacao] = useState<InteresseResposta | null>(null);

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
    // Fetch inicial da lista de interesses recebidos.
    // setState dentro do effect e aceitavel: sincronizacao com a API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header />

      <main className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Solicitações de troca</h1>

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
            Carregando solicitações...
          </div>
        ) : interesses.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
            Nenhuma solicitação recebida até o momento.
          </div>
        ) : (
          interesses.map((item) => (
            <div key={item.id} className="space-y-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                  <MiniImagem
                    url={item.anuncioDesejadoImagemUrl}
                    alt={item.anuncioDesejadoTitulo}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase text-blue-600">
                      Seu anúncio
                    </p>
                    <h2 className="break-words font-bold text-slate-900">
                      {item.anuncioDesejadoTitulo}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                      <span>Interesse enviado por</span>
                      <button
                        type="button"
                        onClick={() => navigate(`/perfil/${item.interessadoId}`)}
                        className="font-bold text-blue-600 hover:text-blue-700"
                      >
                        {item.interessadoNome}
                      </button>
                      <Estrelas nota={item.interessadoNotaReputacao} />
                    </div>
                  </div>
                </div>

                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                  {item.status}
                </span>
              </div>

              {item.anuncioOferecidoTitulo && (
                <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:gap-4 sm:p-4">
                  <MiniImagem
                    url={item.anuncioOferecidoImagemUrl}
                    alt={item.anuncioOferecidoTitulo}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase text-orange-600">
                      Oferta em troca
                    </p>
                    <p className="break-words font-bold text-slate-800">
                      {item.anuncioOferecidoTitulo}
                    </p>
                  </div>
                </div>
              )}

              <p className="text-slate-700 whitespace-pre-wrap rounded-lg border border-slate-200 p-4">
                {item.mensagem}
              </p>

              {item.status === "PENDENTE" && (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => handleAceitar(item.id)}
                    disabled={processingId === item.id}
                    className="w-full rounded-lg bg-emerald-600 px-5 py-3 font-bold text-white disabled:opacity-60 sm:w-auto"
                  >
                    {processingId === item.id ? "Processando..." : "Aceitar"}
                  </button>

                  <button
                    onClick={() => handleRecusar(item.id)}
                    disabled={processingId === item.id}
                    className="w-full rounded-lg bg-red-600 px-5 py-3 font-bold text-white disabled:opacity-60 sm:w-auto"
                  >
                    {processingId === item.id ? "Processando..." : "Recusar"}
                  </button>
                </div>
              )}

              {item.status === "ACEITO" && item.anuncioDesejadoStatus === "CONCLUIDO" && !item.donoJaAvaliou && (
                <button
                  onClick={() => setAvaliacao(item)}
                  className="w-full rounded-lg bg-orange-500 px-5 py-3 font-bold text-white sm:w-auto"
                >
                  Avaliar interessado
                </button>
              )}
            </div>
          ))
        )}
      </main>

      {avaliacao && (
        <AvaliacaoModal
          open={Boolean(avaliacao)}
          onClose={() => setAvaliacao(null)}
          anuncioId={avaliacao.anuncioDesejadoId}
          avaliadoId={avaliacao.interessadoId}
          avaliadoNome={avaliacao.interessadoNome}
          onSuccess={carregar}
        />
      )}
    </div>
  );
};
