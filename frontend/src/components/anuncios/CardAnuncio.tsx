import React from "react";
import { useNavigate } from "react-router-dom";
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
import type { Anuncio } from "../../types/anuncio.types";

const BASE_URL = import.meta.env.VITE_API_URL;

interface CardAnuncioProps {
  anuncio: Anuncio;
  onDelete?: (id: string) => void;
  variant?: "list" | "grid";
  isFavorito?: boolean;
  onToggleFavorito?: (id: string) => void | Promise<void>;
}

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
      return { label: "Pendente", className: "bg-amber-50 text-amber-700 border-amber-100", icon: Clock3, helper: "Aguardando aprovacao da moderacao" };
    case "ATIVO":
      return { label: "Publicado", className: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: CheckCircle2, helper: "Disponivel publicamente" };
    case "SUSPENSO":
      return { label: "Suspenso", className: "bg-orange-50 text-orange-700 border-orange-100", icon: Ban, helper: "Suspenso pela moderacao" };
    case "REPROVADO":
      return { label: "Reprovado", className: "bg-rose-50 text-rose-700 border-rose-100", icon: XCircle, helper: "Revise as informacoes do anuncio" };
    case "RESERVADO":
      return { label: "Reservado", className: "bg-blue-50 text-blue-700 border-blue-100", icon: PackageCheck, helper: "Negociacao em andamento" };
    case "CONCLUIDO":
      return { label: "Concluido", className: "bg-violet-50 text-violet-700 border-violet-100", icon: CheckCircle2, helper: "Anuncio finalizado" };
    case "CANCELADO":
      return { label: "Cancelado", className: "bg-slate-100 text-slate-700 border-slate-200", icon: Ban, helper: "Anuncio desativado" };
    default:
      return { label: status, className: "bg-slate-50 text-slate-700 border-slate-100", icon: Tag, helper: "" };
  }
};

export const CardAnuncio: React.FC<CardAnuncioProps> = ({
  anuncio,
  onDelete,
  variant = "list",
  isFavorito = false,
  onToggleFavorito,
}) => {
  const navigate = useNavigate();
  const cardVariant = variant === "grid" || !onDelete ? "grid" : "list";
  const fotoCapa = anuncio.imagensUrls?.[0];
  const fotoCapaUrl = fotoCapa ? (fotoCapa.startsWith("http") ? fotoCapa : `${BASE_URL}${fotoCapa}`) : null;
  const statusConfig = getStatusConfig(anuncio.status);
  const StatusIcon = statusConfig.icon;

  const handlePrimaryAction = () => {
    if (anuncio.status === "ATIVO") {
      navigate(`/anuncios/${anuncio.id}`);
      return;
    }
    navigate("/meus-anuncios");
  };

  const primaryButtonLabel = anuncio.status === "ATIVO" ? "Ver anuncio" : "Acompanhar status";

  const handleToggleFavorito = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onToggleFavorito?.(anuncio.id);
  };

  const imageBlock = (
    <div className={cardVariant === "grid" ? "relative aspect-[4/2.7] bg-slate-50 overflow-hidden" : "flex h-36 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50 text-slate-300 sm:h-40 md:w-40"}>
      {fotoCapaUrl ? (
        <img src={fotoCapaUrl} alt={anuncio.titulo} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-slate-300">
          <Box size={cardVariant === "grid" ? 52 : 48} strokeWidth={1.5} />
        </div>
      )}

      {cardVariant === "grid" && (
        <>
          <div className="absolute left-3 top-3 flex flex-wrap gap-2 max-w-[72%]">
            <span className={`rounded-lg border bg-white/95 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider backdrop-blur ${getTipoBadge(anuncio.tipo)}`}>
              {anuncio.tipo === "DOACAO" ? "Doacao" : "Troca"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleToggleFavorito}
            className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-lg shadow-sm backdrop-blur transition-all ${
              isFavorito ? "bg-rose-50 text-rose-500" : "bg-white/95 text-slate-500 hover:bg-rose-50 hover:text-rose-500"
            }`}
            title="Favoritar anuncio"
            aria-pressed={isFavorito}
          >
            <Heart size={16} fill={isFavorito ? "currentColor" : "none"} />
          </button>
        </>
      )}
    </div>
  );

  const content = (
    <div className="flex flex-1 flex-col justify-between">
      <div>
        <div className="mb-3 flex flex-wrap gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${getTipoBadge(anuncio.tipo)}`}>
            {anuncio.tipo === "DOACAO" ? "Doacao" : "Troca"}
          </span>
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${getCondicaoColor(anuncio.condicao)}`}>
            {anuncio.condicao}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusConfig.className}`}>
            <StatusIcon size={12} />
            {statusConfig.label}
          </span>
        </div>

        <h3 className="line-clamp-2 text-lg font-extrabold text-reusehub-navy transition-colors group-hover:text-blue-600 sm:text-xl">
          {anuncio.titulo}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">{anuncio.descricao}</p>
        {statusConfig.helper && <p className="mt-3 text-xs font-bold text-slate-500">{statusConfig.helper}</p>}
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
  );

  if (cardVariant === "grid") {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handlePrimaryAction}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handlePrimaryAction();
          }
        }}
        className="group flex h-full w-full flex-col overflow-hidden rounded-lg border border-slate-100 bg-white text-left shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 active:scale-[0.99]"
      >
        {imageBlock}
        <div className="flex flex-1 flex-col p-4">{content}</div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-blue-200 sm:p-4 md:flex-row md:gap-5">
      {imageBlock}
      {content}
      <div className="flex shrink-0 justify-end gap-2 md:flex-col md:border-l md:border-slate-100 md:pl-5">
        <button
          type="button"
          onClick={handleToggleFavorito}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg p-3 transition-colors active:scale-[0.99] md:flex-none ${
            isFavorito ? "bg-rose-50 text-rose-500 hover:bg-rose-100" : "bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-500"
          }`}
          title="Favoritar anuncio"
          aria-pressed={isFavorito}
        >
          <span className="text-xs font-bold md:hidden">{isFavorito ? "Favoritado" : "Favoritar"}</span>
          <Heart size={18} fill={isFavorito ? "currentColor" : "none"} />
        </button>

        <button
          type="button"
          onClick={handlePrimaryAction}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-50 p-3 text-slate-600 transition-colors hover:bg-blue-600 hover:text-white active:scale-[0.99] md:flex-none"
        >
          <span className="text-xs font-bold">{primaryButtonLabel}</span>
        </button>

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(anuncio.id)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-50 p-3 text-red-500 transition-colors hover:bg-red-500 hover:text-white active:scale-[0.99] md:flex-none"
            title="Deletar anuncio"
          >
            <span className="text-xs font-bold md:hidden">Deletar</span>
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
