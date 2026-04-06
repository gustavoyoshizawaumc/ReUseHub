import React from "react";
import type { Anuncio } from "../../types/anuncio.types";
import { Link } from "react-router-dom";
import { Eye, Tag, Trash2, ArrowRight, Box } from "lucide-react";

interface CardAnuncioProps {
  anuncio: Anuncio;
  onDelete?: (id: string) => void;
}

export const CardAnuncio: React.FC<CardAnuncioProps> = ({
  anuncio,
  onDelete,
}) => {
  const getCondicaoColor = (condicao: string) => {
    switch (condicao) {
      case "NOVO":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "BOM":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "REGULAR":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "RUIM":
        return "bg-red-50 text-red-700 border-red-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  const getTipoBadge = (tipo: string) => {
    return tipo === "DOACAO"
      ? "bg-teal-50 text-teal-700 border-teal-100"
      : "bg-orange-50 text-orange-700 border-orange-100";
  };

  return (
    <div className="group bg-white rounded-[24px] border border-slate-100 p-5 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-40 h-40 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 shrink-0 group-hover:bg-blue-50 transition-colors">
        <Box size={48} strokeWidth={1.5} />
      </div>

      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getTipoBadge(anuncio.tipo)}`}
            >
              {anuncio.tipo === "DOACAO" ? "Doação" : "Troca"}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getCondicaoColor(anuncio.condicao)}`}
            >
              {anuncio.condicao}
            </span>
          </div>

          <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
            {anuncio.titulo}
          </h3>

          <p className="text-slate-500 text-sm mt-2 line-clamp-2 leading-relaxed">
            {anuncio.descricao}
          </p>
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50 text-[12px] font-bold text-slate-400">
          <div className="flex items-center gap-1.5">
            <Tag size={14} className="text-blue-500" />
            <span className="text-slate-600">{anuncio.nomeCategoria}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Eye size={14} />
            <span>{anuncio.totalVisualizacoes} vistas</span>
          </div>
        </div>
      </div>

      <div className="flex md:flex-col justify-end gap-2 shrink-0 md:border-l md:border-slate-50 md:pl-6">
        <Link
          to={`/listings/${anuncio.id}`}
          className="flex-1 md:flex-none bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-600 p-3 rounded-xl transition-all flex items-center justify-center gap-2 group/btn active:scale-95"
        >
          <span className="text-xs font-bold md:hidden">Ver Detalhes</span>
          <ArrowRight size={18} />
        </Link>

        {onDelete && (
          <button
            onClick={() => onDelete(anuncio.id)}
            className="flex-1 md:flex-none bg-red-50 hover:bg-red-500 text-red-500 hover:text-white p-3 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95"
            title="Deletar Anúncio"
          >
            <span className="text-xs font-bold md:hidden">Deletar</span>
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
