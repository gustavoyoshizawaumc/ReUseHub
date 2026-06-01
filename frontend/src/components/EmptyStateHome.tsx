import React from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

/**
 * Exibido quando o backend devolve secoes vazias - nenhuma das fontes
 * (favoritos, mais procurados, populares, recentes) gerou conteudo.
 * Acontece em bases novas ou sem anuncios ativos.
 */
export const EmptyStateHome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="max-w-[700px] mx-auto px-4 py-16 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <Sparkles size={32} />
      </div>
      <h2 className="mb-3 text-2xl font-extrabold text-slate-900">
        Ainda nao temos anuncios para mostrar
      </h2>
      <p className="mb-8 text-slate-500">
        Seja o primeiro a publicar um anuncio de doacao ou troca e ajude a comunidade
        ReUseHub a crescer.
      </p>
      <button
        type="button"
        onClick={() => navigate("/anuncios/novo")}
        className="rounded-lg bg-orange-600 px-6 py-3 font-bold text-white shadow-sm transition-all hover:bg-orange-700 active:scale-[0.98]"
      >
        Publicar um anuncio
      </button>
    </section>
  );
};
