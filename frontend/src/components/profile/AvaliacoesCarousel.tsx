import React, { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, MessageSquare, Star } from "lucide-react";
import type { AvaliacaoResposta } from "../../types/avaliacao.types";

type AvaliacoesCarouselProps = {
  avaliacoes: AvaliacaoResposta[];
  emptyMessage?: string;
  onAbrirPerfil?: (usuarioId: string) => void;
  onRemoverAvaliacao?: (avaliacaoId: string) => void;
  podeRemover?: boolean;
};

const ITENS_POR_PAGINA = 2;

const Estrelas: React.FC<{ nota: number }> = ({ nota }) => (
  <div className="flex items-center gap-0.5 text-orange-500">
    {[1, 2, 3, 4, 5].map((valor) => (
      <Star
        key={valor}
        size={16}
        fill={valor <= Math.round(nota || 0) ? "currentColor" : "none"}
      />
    ))}
  </div>
);

export const AvaliacoesCarousel: React.FC<AvaliacoesCarouselProps> = ({
  avaliacoes,
  emptyMessage = "Ainda não há avaliações para este usuário.",
  onAbrirPerfil,
  onRemoverAvaliacao,
  podeRemover = false,
}) => {
  const [pagina, setPagina] = useState(0);
  const [animacaoAtiva, setAnimacaoAtiva] = useState(false);
  const timeoutAnimacaoRef = useRef<number | null>(null);
  const frameAnimacaoRef = useRef<number | null>(null);
  const totalPaginas = Math.max(1, Math.ceil(avaliacoes.length / ITENS_POR_PAGINA));

  const avaliacoesVisiveis = useMemo(() => {
    const inicio = pagina * ITENS_POR_PAGINA;
    return avaliacoes.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [avaliacoes, pagina]);

  const limparAnimacaoPendente = () => {
    if (timeoutAnimacaoRef.current !== null) {
      window.clearTimeout(timeoutAnimacaoRef.current);
      timeoutAnimacaoRef.current = null;
    }

    if (frameAnimacaoRef.current !== null) {
      window.cancelAnimationFrame(frameAnimacaoRef.current);
      frameAnimacaoRef.current = null;
    }
  };

  const trocarPagina = (proximaPagina: number) => {
    if (proximaPagina === pagina) {
      return;
    }

    limparAnimacaoPendente();
    setAnimacaoAtiva(true);

    timeoutAnimacaoRef.current = window.setTimeout(() => {
      setPagina(proximaPagina);
      frameAnimacaoRef.current = window.requestAnimationFrame(() => {
        setAnimacaoAtiva(false);
      });
    }, 120);
  };

  const voltar = () => trocarPagina(Math.max(0, pagina - 1));
  const avancar = () => trocarPagina(Math.min(totalPaginas - 1, pagina + 1));

  useEffect(() => {
    return () => {
      if (timeoutAnimacaoRef.current !== null) {
        window.clearTimeout(timeoutAnimacaoRef.current);
      }

      if (frameAnimacaoRef.current !== null) {
        window.cancelAnimationFrame(frameAnimacaoRef.current);
      }
    };
  }, []);

  if (avaliacoes.length === 0) {
    return (
      <div className="rounded-lg border border-slate-100 bg-white p-6 text-sm font-semibold text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className={`grid grid-cols-1 gap-4 motion-safe:transform-gpu motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out md:grid-cols-2 ${
          animacaoAtiva
            ? "opacity-0 translate-y-1"
            : "opacity-100 translate-y-0"
        }`}
      >
        {avaliacoesVisiveis.map((avaliacao) => (
          <article
            key={avaliacao.id}
            className="flex min-h-[210px] flex-col rounded-lg border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/50 sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => onAbrirPerfil?.(avaliacao.avaliadorId)}
                  className="max-w-full truncate text-left text-sm font-extrabold text-slate-950 transition-colors hover:text-blue-600"
                  disabled={!onAbrirPerfil}
                >
                  {avaliacao.avaliadorNome}
                </button>
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-400">
                  <Calendar size={13} />
                  {new Date(avaliacao.criadoEm).toLocaleDateString("pt-BR")}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <Estrelas nota={avaliacao.nota} />
                <span className="mt-1 block text-xs font-extrabold text-slate-500">
                  {Number(avaliacao.nota || 0).toFixed(1)}
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-md bg-slate-50 p-3">
              <p className="line-clamp-1 text-xs font-bold uppercase text-blue-600">
                {avaliacao.anuncioTitulo}
              </p>
              <p className="mt-2 flex gap-2 text-sm leading-relaxed text-slate-600">
                <MessageSquare size={17} className="mt-0.5 shrink-0 text-orange-500" />
                <span className={avaliacao.comentario ? "line-clamp-4" : "italic text-slate-400"}>
                  {avaliacao.comentario || "Sem comentário textual."}
                </span>
              </p>
            </div>

            {podeRemover && onRemoverAvaliacao && (
              <button
                type="button"
                onClick={() => onRemoverAvaliacao(avaliacao.id)}
                className="mt-auto self-start rounded-md bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100"
              >
                Remover avaliação
              </button>
            )}
          </article>
        ))}
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-slate-400">
            Página {pagina + 1} de {totalPaginas}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={voltar}
              disabled={pagina === 0}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Avaliações anteriores"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={avancar}
              disabled={pagina >= totalPaginas - 1}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Próximas avaliações"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
