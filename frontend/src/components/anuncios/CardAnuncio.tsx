import React from "react";
import type { Anuncio } from "../../types/anuncio.types";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  Tag,
  Trash2,
  ArrowRight,
  Box,
  Clock3,
  CheckCircle2,
  XCircle,
  Ban,
  PackageCheck,
} from "lucide-react";

const BASE_URL = "http://localhost:8080";

interface CardAnuncioProps {
  anuncio: Anuncio;
  onDelete?: (id: string) => void;
}

export const CardAnuncio: React.FC<CardAnuncioProps> = ({ anuncio, onDelete }) => {
  const navigate = useNavigate();

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

  const getTipoBadge = (tipo: string) =>
    tipo === "DOACAO"
      ? "bg-teal-50 text-teal-700 border-teal-100"
      : "bg-orange-50 text-orange-700 border-orange-100";

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "PENDENTE":
        return {
          label: "Pendente",
          className: "bg-amber-50 text-amber-700 border-amber-100",
          icon: Clock3,
          helper: "Aguardando aprovação da moderação",
        };
      case "ATIVO":
        return {
          label: "Publicado",
          className: "bg-emerald-50 text-emerald-700 border-emerald-100",
          icon: CheckCircle2,
          helper: "Disponível publicamente",
        };
      case "REPROVADO":
        return {
          label: "Reprovado",
          className: "bg-rose-50 text-rose-700 border-rose-100",
          icon: XCircle,
          helper: "Revise as informações do anúncio",
        };
      case "RESERVADO":
        return {
          label: "Reservado",
          className: "bg-blue-50 text-blue-700 border-blue-100",
          icon: PackageCheck,
          helper: "Negociação em andamento",
        };
      case "CONCLUIDO":
        return {
          label: "Concluído",
          className: "bg-violet-50 text-violet-700 border-violet-100",
          icon: CheckCircle2,
          helper: "Anúncio finalizado",
        };
      case "CANCELADO":
        return {
          label: "Cancelado",
          className: "bg-slate-100 text-slate-700 border-slate-200",
          icon: Ban,
          helper: "Anúncio desativado",
        };
      default:
        return {
          label: status,
          className: "bg-slate-50 text-slate-700 border-slate-100",
          icon: Tag,
          helper: "",
        };
    }
  };

  const fotoCapa = anuncio.imagensUrls?.[0];
  const fotoCapaUrl = fotoCapa
    ? fotoCapa.startsWith("http") ? fotoCapa : `${BASE_URL}${fotoCapa}`
    : null;

  const statusConfig = getStatusConfig(anuncio.status);
  const StatusIcon = statusConfig.icon;

  const handlePrimaryAction = () => {
    if (anuncio.status === "ATIVO") {
      navigate(`/anuncios/${anuncio.id}`);
      return;
    }

    navigate("/meus-anuncios");
  };

  const primaryButtonLabel =
    anuncio.status === "ATIVO" ? "Ver anúncio" : "Acompanhar status";

  return (
    <div className="group flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-blue-200 sm:p-4 md:flex-row md:gap-5">
      <div className="flex h-36 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50 text-slate-300 sm:h-40 md:w-40">
        {fotoCapaUrl ? (
          <img
            src={fotoCapaUrl}
            alt={anuncio.titulo}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <Box size={48} strokeWidth={1.5} className="group-hover:text-blue-300 transition-colors" />
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getTipoBadge(anuncio.tipo)}`}>
              {anuncio.tipo === "DOACAO" ? "Doação" : "Troca"}
            </span>

            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getCondicaoColor(anuncio.condicao)}`}>
              {anuncio.condicao}
            </span>

            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1 ${statusConfig.className}`}>
              <StatusIcon size={12} />
              {statusConfig.label}
            </span>
          </div>

          <h3 className="text-lg font-extrabold text-reusehub-navy transition-colors line-clamp-2 group-hover:text-blue-600 sm:text-xl md:line-clamp-1">
            {anuncio.titulo}
          </h3>

          <p className="text-slate-500 text-sm mt-2 line-clamp-2 leading-relaxed">
            {anuncio.descricao}
          </p>

          {statusConfig.helper && (
            <p className="mt-3 text-xs font-bold text-slate-500">
              {statusConfig.helper}
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-[12px] font-bold text-slate-400">
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

      <div className="flex md:flex-col justify-end gap-2 shrink-0 md:border-l md:border-slate-100 md:pl-5">
        <button
          onClick={handlePrimaryAction}
          className="flex-1 md:flex-none bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-600 p-3 rounded-lg transition-colors flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          <span className="text-xs font-bold md:hidden">{primaryButtonLabel}</span>
          <ArrowRight size={18} />
        </button>

        {onDelete && (
          <button
            onClick={() => onDelete(anuncio.id)}
            className="flex-1 md:flex-none bg-red-50 hover:bg-red-500 text-red-500 hover:text-white p-3 rounded-lg transition-colors flex items-center justify-center gap-2 active:scale-[0.99]"
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
