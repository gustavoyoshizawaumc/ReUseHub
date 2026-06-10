import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Heart, ImageIcon, MapPin, Star } from "lucide-react";
import type { Anuncio, AnuncioDestaque } from "../types/anuncio.types";
import type { OrigemVisualizacao } from "../services/visualizacaoService";
import { useFavoritos } from "../hooks/useFavoritos";
import { useFeedback } from "./feedback/feedbackContext";

interface ProductSectionProps {
  titulo: string;
  anuncios: AnuncioDestaque[];
  linkVerTodos: string | null;
  origem?: OrigemVisualizacao;
}

export const ProductSection: React.FC<ProductSectionProps> = ({
  titulo,
  anuncios,
  linkVerTodos,
  origem = "CARD_HOME",
}) => {
  const navigate = useNavigate();
  const { ehFavorito, alternarFavorito, possuiUsuarioAutenticado } = useFavoritos();
  const { notify } = useFeedback();

  if (anuncios.length === 0) {
    return null;
  }

  const handleToggleFavorito = async (anuncioId: string) => {
    if (!possuiUsuarioAutenticado) {
      navigate("/login");
      return;
    }
    try {
      await alternarFavorito(anuncioId);
    } catch (error) {
      notify({
        variant: "error",
        title: "Nao foi possivel atualizar os favoritos",
        message: error instanceof Error ? error.message : "Tente novamente em alguns instantes.",
      });
    }
  };

  return (
    <section className="max-w-[1400px] mx-auto px-3 py-7 sm:px-4 sm:py-10">
      <div className="mb-4 flex items-start justify-between gap-3 sm:mb-6 sm:items-center">
        <h2 className="m-0 min-w-0 text-[17px] font-extrabold tracking-tight text-reusehub-navy font-plus-jakarta-sans sm:text-[18px]">
          {titulo}
        </h2>

        {linkVerTodos && (
          <button
            type="button"
            onClick={() => navigate(linkVerTodos)}
            className="inline-flex shrink-0 items-center gap-1 text-blue-600 font-bold text-xs hover:text-reusehub-navy transition-colors sm:text-sm"
          >
            Ver todos <ArrowRight size={15} />
          </button>
        )}
      </div>

      <div className="grid auto-rows-fr grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
        {anuncios.map((destaque) => (
          <CardDeAnuncio
            key={destaque.anuncio.id}
            anuncio={destaque.anuncio}
            ehFavorito={ehFavorito(destaque.anuncio.id)}
            onToggleFavorito={() => handleToggleFavorito(destaque.anuncio.id)}
            onClick={() =>
              navigate(`/anuncios/${destaque.anuncio.id}`, {
                state: { origem },
              })
            }
          />
        ))}
      </div>
    </section>
  );
};

interface CardDeAnuncioProps {
  anuncio: Anuncio;
  ehFavorito: boolean;
  onToggleFavorito: () => void;
  onClick: () => void;
}

const CardDeAnuncio: React.FC<CardDeAnuncioProps> = ({
  anuncio,
  ehFavorito,
  onToggleFavorito,
  onClick,
}) => {
  const cidade = anuncio.cidade ?? anuncio.endereco?.cidade ?? "";
  const uf = anuncio.uf ?? anuncio.endereco?.uf ?? "";
  const localizacao = [cidade, uf].filter(Boolean).join(", ");
  const urlCapa = obterUrlCapa(anuncio);
  const ehDoacao = anuncio.tipo === "DOACAO";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      className="group flex h-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-md border border-slate-200 bg-white text-left shadow-sm transition-colors hover:border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
    >
      <div className="relative h-44 w-full shrink-0 sm:h-48 md:h-44 lg:h-36 xl:h-40">
        <div
          className={`relative flex h-full w-full items-center justify-center overflow-hidden transition-colors ${
            ehDoacao ? "bg-green-50" : "bg-blue-50"
          }`}
        >
          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
            <ImageIcon size={30} strokeWidth={1.6} />
          </div>
          {urlCapa && (
            <img
              src={urlCapa}
              alt=""
              className="relative h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          )}
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorito();
          }}
          className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md border border-white/70 bg-white/95 backdrop-blur-sm transition-colors sm:right-3 sm:top-3 ${
            ehFavorito
              ? "text-rose-500 hover:bg-rose-50"
              : "text-slate-300 hover:text-rose-500"
          }`}
          aria-label={ehFavorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          aria-pressed={ehFavorito}
        >
          <Heart size={14} fill={ehFavorito ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="flex min-h-[128px] flex-1 flex-col px-3 pb-4 sm:min-h-[138px] sm:px-4 sm:pb-5">
        <div className="flex flex-wrap gap-1.5 pt-3">
          <span
            className={`rounded border px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide ${
              ehDoacao
                ? "border-blue-100 bg-blue-50 text-blue-700"
                : "border-orange-100 bg-orange-50 text-orange-700"
            }`}
          >
            {ehDoacao ? "Doação" : "Troca"}
          </span>
          <span className="rounded border border-blue-100 bg-white px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-blue-700">
            {anuncio.condicao}
          </span>
        </div>

        <h3 className="line-clamp-2 min-h-[2.4rem] break-words pt-2 text-[12px] font-semibold leading-snug text-slate-800 sm:text-[13px]">
          {anuncio.titulo}
        </h3>

        <div className="mt-1 min-h-[1rem]">
          {localizacao && (
          <p className="flex min-w-0 items-center gap-1 truncate text-[10px] text-slate-400">
            <MapPin size={10} className="text-slate-300" />
            <span className="truncate">{localizacao}</span>
          </p>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="flex min-w-0 items-center gap-1.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-[10px] font-bold text-blue-600">
              {(anuncio.nomeUsuario ?? "?").charAt(0).toUpperCase()}
            </div>
            <span className="truncate text-[10px] font-bold text-slate-600">
              {(anuncio.nomeUsuario ?? "").split(" ")[0]}
            </span>
          </div>
          <span className="inline-flex shrink-0 items-center gap-0.5 text-[10px] font-black text-orange-500">
            <Star size={11} fill="currentColor" />
            {Number(anuncio.notaReputacaoUsuario ?? 0).toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
};

const obterUrlCapa = (anuncio: Anuncio): string | null => {
  if (anuncio.imagens && anuncio.imagens.length > 0) {
    const capa = anuncio.imagens.find((imagem) => imagem.capa) ?? anuncio.imagens[0];
    return capa?.urlImagem ?? null;
  }
  if (anuncio.imagensUrls && anuncio.imagensUrls.length > 0) {
    return anuncio.imagensUrls[0];
  }
  return null;
};
