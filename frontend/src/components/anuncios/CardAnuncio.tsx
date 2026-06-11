import React from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Ban,
  Box,
  CheckCircle2,
  Clock3,
  Eye,
  Flag,
  Heart,
  MapPin,
  Star,
  Tag,
  Trash2,
  XCircle,
} from "lucide-react";
import type { Anuncio } from "../../types/anuncio.types";
import type { OrigemVisualizacao } from "../../services/visualizacaoService";
import { authService } from "../../services/authService";
import { DenunciaAnuncioModal } from "../denuncia/DenunciaAnuncioModal";

import { API_BASE_URL } from "../../config/api";

const BASE_URL = API_BASE_URL;

interface CardAnuncioProps {
  anuncio: Anuncio;
  onDelete?: (id: string) => void;
  variant?: "list" | "grid";
  isFavorito?: boolean;
  onToggleFavorito?: (id: string) => void | Promise<void>;
  origem?: OrigemVisualizacao;
}

const getCondicaoColor = (condicao: string) => {
  switch (condicao) {
    case "NOVO":
      return "bg-white/95 text-blue-700 border-blue-100";
    case "BOM":
      return "bg-white/95 text-blue-700 border-blue-100";
    case "REGULAR":
      return "bg-white/95 text-orange-700 border-orange-100";
    case "RUIM":
      return "bg-white/95 text-orange-700 border-orange-100";
    default:
      return "bg-white/95 text-slate-700 border-slate-200";
  }
};

const getTipoBadge = (tipo: string) =>
  tipo === "DOACAO"
    ? "bg-blue-600 text-white border-blue-600"
    : "bg-orange-600 text-white border-orange-600";

const getStatusConfig = (status: string) => {
  switch (status) {
    case "PENDENTE":
      return { label: "Pendente", className: "bg-orange-50 text-orange-700 border-orange-100", icon: Clock3 };
    case "ATIVO":
      return { label: "Publicado", className: "bg-blue-50 text-blue-700 border-blue-100", icon: CheckCircle2 };
    case "SUSPENSO":
      return { label: "Suspenso", className: "bg-orange-50 text-orange-700 border-orange-100", icon: Ban };
    case "REPROVADO":
      return { label: "Reprovado", className: "bg-orange-50 text-orange-700 border-orange-100", icon: XCircle };
    case "CONCLUIDO":
      return { label: "Concluido", className: "bg-slate-50 text-slate-700 border-slate-200", icon: CheckCircle2 };
    case "CANCELADO":
      return { label: "Cancelado", className: "bg-slate-50 text-slate-700 border-slate-200", icon: Ban };
    case "EXPIRADO":
      return { label: "Expirado", className: "bg-slate-50 text-slate-700 border-slate-200", icon: Clock3 };
    default:
      return { label: status, className: "bg-slate-50 text-slate-700 border-slate-200", icon: Tag };
  }
};

export const CardAnuncio: React.FC<CardAnuncioProps> = ({
  anuncio,
  onDelete,
  variant = "list",
  isFavorito = false,
  onToggleFavorito,
  origem,
}) => {
  const navigate = useNavigate();
  const [modalDenunciaAberto, setModalDenunciaAberto] = React.useState(false);
  const cardVariant = variant === "grid" || !onDelete ? "grid" : "list";
  const fotoCapa = anuncio.imagensUrls?.[0];
  const fotoCapaUrl = fotoCapa ? (fotoCapa.startsWith("http") ? fotoCapa : `${BASE_URL}${fotoCapa}`) : null;
  const statusConfig = getStatusConfig(anuncio.status);
  const StatusIcon = statusConfig.icon;
  const user = authService.getUser();
  const ehDono = user?.id === anuncio.usuarioId;
  const podeDenunciar = anuncio.status === "ATIVO" && !ehDono;
  const podeFavoritar = !ehDono;
  const mostrarStatus = Boolean(onDelete);
  const cidade = anuncio.cidade ?? anuncio.endereco?.cidade ?? "";
  const uf = anuncio.uf ?? anuncio.endereco?.uf ?? "";
  const localizacao = [cidade, uf].filter(Boolean).join(", ");
  const reputacao = Number(anuncio.notaReputacaoUsuario ?? 0).toFixed(1);

  const handlePrimaryAction = () => {
    if (anuncio.status !== "ATIVO") {
      return;
    }
    navigate(
      `/anuncios/${anuncio.id}`,
      origem ? { state: { origem } } : undefined
    );
  };

  const handleToggleFavorito = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onToggleFavorito?.(anuncio.id);
  };

  const handleDenunciar = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    setModalDenunciaAberto(true);
  };

  const imageBlock = (
    <div className={cardVariant === "grid" ? "relative aspect-[4/2.7] overflow-hidden bg-slate-50" : "flex h-36 w-full shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-50 text-slate-300 sm:h-40 md:w-40"}>
      {fotoCapaUrl ? (
        <img src={fotoCapaUrl} alt={anuncio.titulo} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-slate-300">
          <Box size={cardVariant === "grid" ? 52 : 48} strokeWidth={1.5} />
        </div>
      )}

      {cardVariant === "grid" && (
        <>
          {podeFavoritar && (
            <button
              type="button"
              onClick={handleToggleFavorito}
              className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-md shadow-sm backdrop-blur transition-all ${
                isFavorito ? "bg-rose-50 text-rose-500" : "bg-white/95 text-slate-500 hover:bg-rose-50 hover:text-rose-500"
              }`}
              title="Favoritar anuncio"
              aria-pressed={isFavorito}
            >
              <Heart size={16} fill={isFavorito ? "currentColor" : "none"} />
            </button>
          )}
          {podeDenunciar && (
            <button
              type="button"
              onClick={handleDenunciar}
              className="absolute right-3 top-16 flex h-10 w-10 items-center justify-center rounded-md bg-white/95 text-slate-500 shadow-sm backdrop-blur transition-all hover:bg-orange-50 hover:text-orange-600"
              title="Denunciar anuncio"
            >
              <Flag size={16} />
            </button>
          )}
        </>
      )}
    </div>
  );

  const content = (
    <div className="flex flex-1 flex-col justify-between">
      <div>
        <div className="mb-3 flex flex-wrap gap-2">
          <span className={`rounded border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${getTipoBadge(anuncio.tipo)}`}>
            {anuncio.tipo === "DOACAO" ? "Doação" : "Troca"}
          </span>
          <span className={`rounded border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${cardVariant === "list" ? getCondicaoColor(anuncio.condicao).replace("bg-white/95", "bg-white") : getCondicaoColor(anuncio.condicao)}`}>
            {anuncio.condicao}
          </span>
          {mostrarStatus && (
            <span className={`inline-flex items-center gap-1 rounded border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusConfig.className}`}>
              <StatusIcon size={12} />
              {statusConfig.label}
            </span>
          )}
        </div>

        <h3 className="line-clamp-2 text-base font-extrabold text-reusehub-navy transition-colors group-hover:text-blue-600 sm:text-lg">
          {anuncio.titulo}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">{anuncio.descricao}</p>
        {mostrarStatus && anuncio.status === "SUSPENSO" && anuncio.motivoSuspensao && (
          <div className="mt-3 rounded-md border border-orange-100 bg-orange-50 p-3 text-orange-800">
            <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide">
              <AlertCircle size={14} />
              Motivo da suspensao
            </p>
            <p className="mt-1 text-sm font-semibold leading-relaxed">{anuncio.motivoSuspensao}</p>
          </div>
        )}
        {mostrarStatus && anuncio.status === "REPROVADO" && anuncio.motivoReprovacao && (
          <div className="mt-3 rounded-md border border-orange-100 bg-orange-50 p-3 text-orange-800">
            <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide">
              <AlertCircle size={14} />
              Motivo da reprovacao
            </p>
            <p className="mt-1 text-sm font-semibold leading-relaxed">{anuncio.motivoReprovacao}</p>
          </div>
        )}
        <div className="mt-3 grid gap-1.5 text-xs font-semibold text-slate-500">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-bold text-slate-700">{anuncio.nomeUsuario}</span>
            <span className="inline-flex shrink-0 items-center gap-0.5 font-black text-orange-500">
              <Star size={13} fill="currentColor" />
              {reputacao}
            </span>
          </div>
          <div className="flex min-w-0 items-center gap-1.5">
            <MapPin size={14} className="shrink-0 text-slate-400" />
            <span className="truncate">{localizacao || "Localização não informada"}</span>
          </div>
        </div>
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
      <>
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
          className="group flex h-full w-full flex-col overflow-hidden rounded-md border border-slate-100 bg-white text-left shadow-sm transition-all duration-300 hover:border-blue-200 hover:shadow-md active:scale-[0.99]"
        >
          {imageBlock}
          <div className="flex flex-1 flex-col p-4">{content}</div>
        </div>
        <DenunciaAnuncioModal
          open={modalDenunciaAberto}
          onClose={() => setModalDenunciaAberto(false)}
          anuncioId={anuncio.id}
          anuncioTitulo={anuncio.titulo}
        />
      </>
    );
  }

  return (
    <>
      <div className="group flex flex-col gap-4 rounded-md border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-blue-200 sm:p-4 md:flex-row md:gap-5">
        {imageBlock}
        {content}
        <div className="flex shrink-0 justify-end gap-2 md:flex-col md:border-l md:border-slate-100 md:pl-5">
          {podeFavoritar && (
            <button
              type="button"
              onClick={handleToggleFavorito}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md p-3 transition-colors active:scale-[0.99] md:flex-none ${
                isFavorito ? "bg-rose-50 text-rose-500 hover:bg-rose-100" : "bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-500"
              }`}
              title="Favoritar anuncio"
              aria-pressed={isFavorito}
            >
              <span className="text-xs font-bold md:hidden">{isFavorito ? "Favoritado" : "Favoritar"}</span>
              <Heart size={18} fill={isFavorito ? "currentColor" : "none"} />
            </button>
          )}

          {anuncio.status === "ATIVO" && (
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-slate-50 p-3 text-slate-600 transition-colors hover:bg-blue-600 hover:text-white active:scale-[0.99] md:flex-none"
            >
              <span className="text-xs font-bold">Ver anuncio</span>
            </button>
          )}

          {podeDenunciar && (
            <button
              type="button"
              onClick={handleDenunciar}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-orange-50 p-3 text-orange-600 transition-colors hover:bg-orange-100 active:scale-[0.99] md:flex-none"
              title="Denunciar anuncio"
            >
              <span className="text-xs font-bold md:hidden">Denunciar</span>
              <Flag size={18} />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(anuncio.id)}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-red-50 p-3 text-red-500 transition-colors hover:bg-red-500 hover:text-white active:scale-[0.99] md:flex-none"
              title="Deletar anuncio"
            >
              <span className="text-xs font-bold md:hidden">Deletar</span>
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
      <DenunciaAnuncioModal
        open={modalDenunciaAberto}
        onClose={() => setModalDenunciaAberto(false)}
        anuncioId={anuncio.id}
        anuncioTitulo={anuncio.titulo}
      />
    </>
  );
};
