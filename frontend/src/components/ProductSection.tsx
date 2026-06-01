import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Heart, ImageIcon, MapPin } from "lucide-react";
import type { Anuncio, AnuncioDestaque } from "../types/anuncio.types";

interface ProductSectionProps {
  titulo: string;
  anuncios: AnuncioDestaque[];
  linkVerTodos: string | null;
}

export const ProductSection: React.FC<ProductSectionProps> = ({
  titulo,
  anuncios,
  linkVerTodos,
}) => {
  const navigate = useNavigate();

  if (anuncios.length === 0) {
    return null;
  }

  return (
    <section className="max-w-[1200px] mx-auto px-3 py-7 sm:px-4 sm:py-10">
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

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
        {anuncios.map((destaque) => (
          <CardDeAnuncio
            key={destaque.anuncio.id}
            anuncio={destaque.anuncio}
            onClick={() => navigate(`/anuncios/${destaque.anuncio.id}`)}
          />
        ))}
      </div>
    </section>
  );
};

interface CardDeAnuncioProps {
  anuncio: Anuncio;
  onClick: () => void;
}

const CardDeAnuncio: React.FC<CardDeAnuncioProps> = ({ anuncio, onClick }) => {
  const cidade = anuncio.cidade ?? anuncio.endereco?.cidade ?? "";
  const uf = anuncio.uf ?? anuncio.endereco?.uf ?? "";
  const localizacao = [cidade, uf].filter(Boolean).join(", ");
  const urlCapa = obterUrlCapa(anuncio);
  const ehDoacao = anuncio.tipo === "DOACAO";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-colors hover:border-blue-200 text-left"
    >
      <div className="relative aspect-square w-full">
        <div
          className={`relative w-full h-full flex items-center justify-center overflow-hidden transition-colors ${
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
              className="relative w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          )}
        </div>

        <span
          className={`absolute left-2 top-2 rounded-md px-2 py-1 text-[8px] font-extrabold uppercase tracking-wide text-white sm:left-3 sm:top-3 sm:text-[9px] ${
            ehDoacao ? "bg-emerald-600" : "bg-blue-600"
          }`}
        >
          {ehDoacao ? "Doação" : "Troca"}
        </span>

        <span
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg border border-white/70 bg-white/95 text-slate-300 backdrop-blur-sm sm:right-3 sm:top-3"
          aria-hidden="true"
        >
          <Heart size={14} fill="currentColor" />
        </span>
      </div>

      <div className="flex flex-1 flex-col px-3 pb-4 sm:px-4 sm:pb-5">
        <h3 className="min-h-[2.4rem] break-words pt-2 text-[12px] font-semibold leading-snug text-slate-800 line-clamp-2 sm:text-[13px]">
          {anuncio.titulo}
        </h3>

        {localizacao && (
          <p className="mt-1 flex min-w-0 items-center gap-1 truncate text-[10px] text-slate-400">
            <MapPin size={10} className="text-slate-300" />
            <span className="truncate">{localizacao}</span>
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="flex min-w-0 items-center gap-1.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-[10px] font-bold text-blue-600">
              {(anuncio.nomeUsuario ?? "?").charAt(0).toUpperCase()}
            </div>
            <span className="truncate text-[10px] font-bold text-slate-600">
              {(anuncio.nomeUsuario ?? "").split(" ")[0]}
            </span>
          </div>
        </div>
      </div>
    </button>
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
