import React from "react";
import type { Listing } from "../types/listing";
import { Heart, MapPin, Star } from "lucide-react";

interface ProductSectionProps {
  title: string;
  products: Listing[];
}

export const ProductSection: React.FC<ProductSectionProps> = ({
  title,
  products,
}) => {
  return (
    <section className="max-w-[1200px] mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8 border-l-4 border-orange-500 pl-4">
        <h2 className="text-[18px] font-bold text-slate-800 tracking-tight font-plus-jakarta-sans m-0">
          {title}
        </h2>
        <button className="text-blue-600 font-bold text-sm hover:underline">
          Ver todos →
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-[24px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col"
          >
            <div className="relative aspect-square w-full">
              <div
                className={`w-full h-full flex items-center justify-center overflow-hidden transition-colors ${
                  product.tipo === "DOACAO" ? "bg-green-50" : "bg-blue-50"
                }`}
              >
                <img
                  src={product.url_imagem_capa}
                  alt={product.titulo}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>

              <span
                className={`absolute top-4 left-3 text-[9px] px-2 py-0 rounded-lg font-extrabold uppercase text-white shadow-sm ${
                  product.tipo === "DOACAO" ? "bg-emerald-500" : "bg-blue-500"
                }`}
              >
                {product.tipo === "DOACAO" ? "Doação" : "Troca"}
              </span>

              <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors">
                <Heart size={14} fill="currentColor" />
              </button>
            </div>

            <div className="px-4 pb-5 flex-1 flex flex-col">
              <h3 className="font-normal text-slate-800 text-[13px] leading-tight line-clamp-2 min-h-[2.5rem] pt-2">
                {product.titulo}
              </h3>

              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                <MapPin size={10} className="text-slate-300" />
                {product.endereco.cidade}, {product.endereco.estado}
              </p>

              <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-blue-600 border border-white shadow-sm">
                    {product.usuario.nome.charAt(0)}
                  </div>
                  <span className="text-[10px] font-bold text-slate-600">
                    {product.usuario.nome.split(" ")[0]}
                  </span>
                </div>

                <div className="flex items-center gap-0.5 bg-orange-50 px-1.5 py-0.5 rounded-md">
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
