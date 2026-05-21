import React from "react";
import { useNavigate } from "react-router-dom";
import type { Anuncio } from "../../types/anuncio.types";
import {
  Ban,
  Box,
  CheckCircle2,
  Clock3,
  Eye,
  Heart,
  PackageCheck,
  Tag,
  Trash2,
  XCircle,
} from "lucide-react";

const BASE_URL = "http://localhost:8080";

interface CardAnuncioProps {
  anuncio: Anuncio;
  onDelete?: (id: string) => void;
  variant?: "list" | "grid";
}

export const CardAnuncio: React.FC<CardAnuncioProps> = ({
  anuncio,
  onDelete,
  variant = "list",
}) => {
  const navigate = useNavigate();
  const cardVariant = variant === "grid" || !onDelete ? "grid" : "list";

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
          helper: "Aguardando aprovacao da moderacao",
        };
      case "ATIVO":
        return {
          label: "Publicado",
          className: "bg-emerald-50 text-emerald-700 border-emerald-100",
          icon: CheckCircle2,
          helper: "Disponivel publicamente",
        };
      case "REPROVADO":
        return {
          label: "Reprovado",
          className: "bg-rose-50 text-rose-700 border-rose-100",
          icon: XCircle,
          helper: "Revise as informacoes do anuncio",
        };
      case "RESERVADO":
        return {
          label: "Reservado",
          className: "bg-blue-50 text-blue-700 border-blue-100",
          icon: PackageCheck,
          helper: "Negociacao em andamento",
        };
      case "CONCLUIDO":
        return {
          label: "Concluido",
          className: "bg-violet-50 text-violet-700 border-violet-100",
          icon: CheckCircle2,
          helper: "Anuncio finalizado",
        };
      case "CANCELADO":
        return {
          label: "Cancelado",
          className: "bg-slate-100 text-slate-700 border-slate-200",
          icon: Ban,
          helper: "Anuncio desativado",
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
    ? fotoCapa.startsWith("http")
      ? fotoCapa
      : `${BASE_URL}${fotoCapa}`
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
    anuncio.status === "ATIVO" ? "Ver anuncio" : "Acompanhar status";

  if (cardVariant === "grid") {
    return (
      <button
        type="button"
        onClick={handlePrimaryAction}
        className="group bg-white rounded-[22px] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 h-full flex flex-col text-left w-full active:scale-[0.99]"
      >
        <div className="relative aspect-[4/2.7] bg-slate-50 overflow-hidden">
          {fotoCapaUrl ? (
            <img
              src={fotoCapaUrl}
              alt={anuncio.titulo}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <Box
                size={52}
                strokeWidth={1.5}
                className="group-hover:text-blue-300 transition-colors"
              />
            </div>
          )}

          <div className="absolute top-3 left-3 flex flex-wrap gap-2 max-w-[72%]">
            <span
              className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border bg-white/95 backdrop-blur ${getTipoBadge(anuncio.tipo)}`}
            >
              {anuncio.tipo === "DOACAO" ? "Doacao" : "Troca"}
            </span>
          </div>

          <button
            type="button"
            onClick={(event) => event.stopPropagation()}
            className="absolute top-3 right-3 w-10 h-10 rounded-2xl bg-white/95 text-slate-500 hover:bg-rose-50 hover:text-rose-500 backdrop-blur shadow-sm transition-all flex items-center justify-center"
            title="Favoritar anuncio"
          >
            <Heart size={16} />
          </button>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <div className="flex flex-wrap gap-2 mb-2.5">
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getCondicaoColor(anuncio.condicao)}`}
            >
              {anuncio.condicao}
            </span>

            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border inline-flex items-center gap-1 ${statusConfig.className}`}
            >
              <StatusIcon size={11} />
              {statusConfig.label}
            </span>
          </div>

          <h3 className="text-[1.35rem] leading-tight font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[3.1rem]">
            {anuncio.titulo}
          </h3>

          <p className="text-slate-500 text-sm mt-2.5 line-clamp-2 leading-relaxed min-h-[2.5rem]">
            {anuncio.descricao}
          </p>

          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
            {statusConfig.helper && (
              <p className="text-xs font-bold text-slate-600 line-clamp-1">
                {statusConfig.helper}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-400">
              <div className="flex items-center gap-1.5">
                <Tag size={13} className="text-blue-500" />
                <span className="text-slate-600">{anuncio.nomeCategoria}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Eye size={13} />
                <span>{anuncio.totalVisualizacoes} vistas</span>
              </div>
            </div>

            {(anuncio.cidade || anuncio.bairro || anuncio.uf) && (
              <p className="text-xs text-slate-400 line-clamp-1">
                {[anuncio.bairro, anuncio.cidade, anuncio.uf]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </div>

          {onDelete && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(anuncio.id);
              }}
              className="mt-4 w-full bg-red-50 hover:bg-red-500 text-red-500 hover:text-white p-3 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95"
              title="Deletar Anuncio"
            >
              <Trash2 size={18} />
              <span className="text-xs font-bold">Deletar</span>
            </button>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="group bg-white rounded-[24px] border border-slate-100 p-5 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-40 h-40 rounded-2xl shrink-0 overflow-hidden bg-slate-50 flex items-center justify-center text-slate-300">
        {fotoCapaUrl ? (
          <img
            src={fotoCapaUrl}
            alt={anuncio.titulo}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <Box
            size={48}
            strokeWidth={1.5}
            className="group-hover:text-blue-300 transition-colors"
          />
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getTipoBadge(anuncio.tipo)}`}
            >
              {anuncio.tipo === "DOACAO" ? "Doacao" : "Troca"}
            </span>

            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getCondicaoColor(anuncio.condicao)}`}
            >
              {anuncio.condicao}
            </span>

            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1 ${statusConfig.className}`}
            >
              <StatusIcon size={12} />
              {statusConfig.label}
            </span>
          </div>

          <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
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

        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-50 text-[12px] font-bold text-slate-400">
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
        <button
          onClick={handlePrimaryAction}
          className="flex-1 md:flex-none bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-600 p-3 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <span className="text-xs font-bold">{primaryButtonLabel}</span>
        </button>

        {onDelete && (
          <button
            onClick={() => onDelete(anuncio.id)}
            className="flex-1 md:flex-none bg-red-50 hover:bg-red-500 text-red-500 hover:text-white p-3 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95"
            title="Deletar Anuncio"
          >
            <span className="text-xs font-bold md:hidden">Deletar</span>
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
