import React from "react";
import type { Listing } from "../types/listing";
import { ArrowRight, Heart, ImageIcon, MapPin, Star } from "lucide-react";

interface ProductSectionProps {
  title: string;
  products: Listing[];
}

export const ProductSection: React.FC<ProductSectionProps> = ({
  title,
  products,
}) => {
  return (
    <section className="max-w-[1200px] mx-auto px-3 py-7 sm:px-4 sm:py-10">
      <div className="mb-4 flex items-start justify-between gap-3 sm:mb-6 sm:items-center">
        <h2 className="m-0 min-w-0 text-[17px] font-extrabold tracking-tight text-reusehub-navy font-plus-jakarta-sans sm:text-[18px]">
          {title}
        </h2>
        <button className="inline-flex shrink-0 items-center gap-1 text-blue-600 font-bold text-xs hover:text-reusehub-navy transition-colors sm:text-sm">
          Ver todos <ArrowRight size={15} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="group flex cursor-pointer flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-colors hover:border-blue-200"
          >
            <div className="relative aspect-square w-full">
              <div
                className={`relative w-full h-full flex items-center justify-center overflow-hidden transition-colors ${
                  product.tipo === "DOACAO" ? "bg-green-50" : "bg-blue-50"
                }`}
              >
                <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                  <ImageIcon size={30} strokeWidth={1.6} />
                </div>
                <img
                  src={product.url_imagem_capa}
                  alt=""
                  className="relative w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>

              <span
                className={`absolute left-2 top-2 rounded-md px-2 py-1 text-[8px] font-extrabold uppercase tracking-wide text-white sm:left-3 sm:top-3 sm:text-[9px] ${
                  product.tipo === "DOACAO" ? "bg-emerald-600" : "bg-blue-600"
                }`}
              >
                {product.tipo === "DOACAO" ? "Doação" : "Troca"}
              </span>

              <button className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg border border-white/70 bg-white/95 text-slate-300 backdrop-blur-sm transition-colors hover:text-reusehub-orange sm:right-3 sm:top-3">
                <Heart size={14} fill="currentColor" />
              </button>
            </div>

            <div className="flex flex-1 flex-col px-3 pb-4 sm:px-4 sm:pb-5">
              <h3 className="min-h-[2.4rem] pt-2 text-[12px] font-semibold leading-snug text-slate-800 line-clamp-2 sm:text-[13px]">
                {product.titulo}
              </h3>

              <p className="mt-1 flex min-w-0 items-center gap-1 truncate text-[10px] text-slate-400">
                <MapPin size={10} className="text-slate-300" />
                <span className="truncate">
                  {product.endereco.cidade}, {product.endereco.estado}
                </span>
              </p>

              <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <div className="flex min-w-0 items-center gap-1.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-[10px] font-bold text-blue-600">
                    {product.usuario.nome.charAt(0)}
                  </div>
                  <span className="truncate text-[10px] font-bold text-slate-600">
                    {product.usuario.nome.split(" ")[0]}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-0.5 rounded-md bg-orange-50 px-1.5 py-0.5">
                  <Star size={10} className="text-orange-400 fill-orange-400" />
                  <span className="text-[11px] font-bold text-orange-500">
                    {product.usuario.nota_reputacao.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
