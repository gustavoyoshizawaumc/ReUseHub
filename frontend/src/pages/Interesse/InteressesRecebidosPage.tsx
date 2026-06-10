import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  aceitarInteresse,
  listarHistoricoInteresses,
  recusarInteresse,
} from "../../services/interesseService";
import { authService } from "../../services/authService";
import type { InteresseResposta, InteresseStatus } from "../../types/interesse.types";
import { AvaliacaoModal } from "../../components/avaliacao/AvaliacaoModal";
import { Header } from "../../components/Header";
import { useFeedback } from "../../components/feedback/feedbackContext";
import { CheckCircle2, Clock3, ImageOff, Star, XCircle } from "lucide-react";

import { API_BASE_URL } from "../../config/api";

const BASE_URL = API_BASE_URL;

type FiltroHistorico = "TODOS" | "RECEBIDAS" | "ENVIADAS" | "CONCLUIDAS" | "CANCELADAS";

const imagemUrl = (url?: string | null) => {
  if (!url) return null;
  return url.startsWith("http") ? url : `${BASE_URL}${url}`;
};

const dataCurta = (valor?: string | null) =>
  valor
    ? new Date(valor).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";

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
    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-100 text-slate-300 sm:h-20 sm:w-20">
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <ImageOff size={22} />
      )}
    </div>
  );
};

const statusConfig: Record<InteresseStatus, { label: string; className: string; icon: React.ElementType }> = {
  PENDENTE: {
    label: "Pendente",
    className: "border-amber-100 bg-amber-50 text-amber-700",
    icon: Clock3,
  },
  ACEITO: {
    label: "Em andamento",
    className: "border-blue-100 bg-blue-50 text-blue-700",
    icon: Clock3,
  },
  REJEITADO: {
    label: "Recusada",
    className: "border-slate-200 bg-slate-50 text-slate-600",
    icon: XCircle,
  },
  CANCELADO: {
    label: "Cancelada",
    className: "border-rose-100 bg-rose-50 text-rose-700",
    icon: XCircle,
  },
};

const obterStatusVisual = (item: InteresseResposta) => {
  if (item.status === "ACEITO" && item.anuncioDesejadoStatus === "CONCLUIDO") {
    return {
      label: "Concluida",
      className: "border-emerald-100 bg-emerald-50 text-emerald-700",
      icon: CheckCircle2,
    };
  }

  return statusConfig[item.status];
};

export const InteressesRecebidosPage: React.FC = () => {
  const navigate = useNavigate();
  const user = authService.getUser();
  const usuarioId = user?.id ?? "";
  const [interesses, setInteresses] = useState<InteresseResposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [avaliacao, setAvaliacao] = useState<InteresseResposta | null>(null);
  const [filtro, setFiltro] = useState<FiltroHistorico>("TODOS");
  const { notify } = useFeedback();

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      const dados = await listarHistoricoInteresses();
      setInteresses(dados);
    } catch (err) {
      notify({
        variant: "error",
        title: "Erro ao carregar negociacoes",
        message: err instanceof Error ? err.message : "Tente novamente em alguns instantes.",
      });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
  }, [carregar]);

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
      notify({
        variant: "error",
        title: "Erro ao aceitar interesse",
        message: err instanceof Error ? err.message : "Tente novamente em alguns instantes.",
      });
      await carregar();
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
      notify({
        variant: "error",
        title: "Erro ao recusar interesse",
        message: err instanceof Error ? err.message : "Tente novamente em alguns instantes.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const interessesFiltrados = useMemo(() => {
    return interesses.filter((item) => {
      const ehInteressado = item.interessadoId === usuarioId;
      const concluida = item.status === "ACEITO" && item.anuncioDesejadoStatus === "CONCLUIDO";

      if (filtro === "RECEBIDAS") return !ehInteressado;
      if (filtro === "ENVIADAS") return ehInteressado;
      if (filtro === "CONCLUIDAS") return concluida;
      if (filtro === "CANCELADAS") return item.status === "CANCELADO" || item.status === "REJEITADO";
      return true;
    });
  }, [filtro, interesses, usuarioId]);

  const contadores = useMemo(() => {
    return {
      todos: interesses.length,
      recebidas: interesses.filter((item) => item.interessadoId !== usuarioId).length,
      enviadas: interesses.filter((item) => item.interessadoId === usuarioId).length,
      concluidas: interesses.filter((item) => item.status === "ACEITO" && item.anuncioDesejadoStatus === "CONCLUIDO").length,
      canceladas: interesses.filter((item) => item.status === "CANCELADO" || item.status === "REJEITADO").length,
    };
  }, [interesses, usuarioId]);

  const filtros: Array<{ value: FiltroHistorico; label: string; count: number }> = [
    { value: "TODOS", label: "Todas", count: contadores.todos },
    { value: "RECEBIDAS", label: "Recebidas", count: contadores.recebidas },
    { value: "ENVIADAS", label: "Enviadas", count: contadores.enviadas },
    { value: "CONCLUIDAS", label: "Concluidas", count: contadores.concluidas },
    { value: "CANCELADAS", label: "Canceladas", count: contadores.canceladas },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header />

      <main className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Negociacoes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Acompanhe propostas recebidas, enviadas, concluidas e canceladas.
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
          {filtros.map((opcao) => (
            <button
              key={opcao.value}
              type="button"
              onClick={() => setFiltro(opcao.value)}
              className={`shrink-0 rounded-md px-3 py-2 text-xs font-bold transition-colors ${
                filtro === opcao.value
                  ? "bg-blue-600 text-white"
                  : "bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              {opcao.label}
              <span className="ml-2 opacity-75">{opcao.count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
            Carregando negociacoes...
          </div>
        ) : interessesFiltrados.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
            Nenhuma negociacao encontrada para este filtro.
          </div>
        ) : (
          interessesFiltrados.map((item) => {
            const ehInteressado = item.interessadoId === usuarioId;
            const ehDono = item.anuncianteId === usuarioId;
            const status = obterStatusVisual(item);
            const StatusIcon = status.icon;
            const podeResponder =
              ehDono && item.status === "PENDENTE" && item.anuncioDesejadoStatus === "ATIVO";
            const podeAvaliar =
              item.status === "ACEITO" &&
              item.anuncioDesejadoStatus === "CONCLUIDO" &&
              !item.usuarioJaAvaliou;
            const avaliadoId = ehInteressado ? item.anuncianteId : item.interessadoId;
            const avaliadoNome = ehInteressado ? item.anuncianteNome : item.interessadoNome;
            const pessoaRelacionadaNome = ehInteressado ? item.anuncianteNome : item.interessadoNome;
            const pessoaRelacionadaId = ehInteressado ? item.anuncianteId : item.interessadoId;
            const pessoaRelacionadaNota = ehInteressado ? item.anuncianteNotaReputacao : item.interessadoNotaReputacao;
            const origemTexto = ehInteressado ? "Voce enviou esta proposta" : "Voce recebeu esta proposta";
            const tipoTexto = item.anuncioDesejadoTipo === "DOACAO" ? "Doacao" : "Troca";

            return (
              <div key={item.id} className="space-y-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                  <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                    <MiniImagem
                      url={item.anuncioDesejadoImagemUrl}
                      alt={item.anuncioDesejadoTitulo}
                    />
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-black uppercase text-blue-700">
                          {tipoTexto}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          {origemTexto}
                        </span>
                      </div>
                      <h2 className="break-words font-bold text-slate-900">
                        {item.anuncioDesejadoTitulo}
                      </h2>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                        <span>{ehInteressado ? "Anunciante" : "Interessado"}</span>
                        <button
                          type="button"
                          onClick={() => navigate(`/perfil/${pessoaRelacionadaId}`)}
                          className="font-bold text-blue-600 hover:text-blue-700"
                        >
                          {pessoaRelacionadaNome}
                        </button>
                        <Estrelas nota={pessoaRelacionadaNota} />
                      </div>
                      <p className="mt-2 text-xs font-semibold text-slate-400">
                        Criada em {dataCurta(item.criadoEm)}
                        {item.canceladoEm ? ` • Encerrada em ${dataCurta(item.canceladoEm)}` : ""}
                        {item.recebimentoConfirmadoEm ? ` • Concluida em ${dataCurta(item.recebimentoConfirmadoEm)}` : ""}
                      </p>
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${status.className}`}>
                    <StatusIcon size={14} />
                    {status.label}
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
                        Item oferecido na troca
                      </p>
                      <p className="break-words font-bold text-slate-800">
                        {item.anuncioOferecidoTitulo}
                      </p>
                    </div>
                  </div>
                )}

                <p className="whitespace-pre-wrap rounded-lg border border-slate-200 p-4 text-slate-700">
                  {item.mensagem}
                </p>

                {podeResponder && (
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

                {podeAvaliar && avaliadoId && (
                  <button
                    onClick={() => setAvaliacao(item)}
                    className="w-full rounded-lg bg-orange-500 px-5 py-3 font-bold text-white sm:w-auto"
                  >
                    Avaliar {avaliadoNome}
                  </button>
                )}
              </div>
            );
          })
        )}
      </main>

      {avaliacao && (
        <AvaliacaoModal
          open={Boolean(avaliacao)}
          onClose={() => setAvaliacao(null)}
          anuncioId={avaliacao.anuncioDesejadoId}
          avaliadoId={avaliacao.interessadoId === usuarioId ? avaliacao.anuncianteId : avaliacao.interessadoId}
          avaliadoNome={avaliacao.interessadoId === usuarioId ? avaliacao.anuncianteNome : avaliacao.interessadoNome}
          onSuccess={carregar}
        />
      )}
    </div>
  );
};
