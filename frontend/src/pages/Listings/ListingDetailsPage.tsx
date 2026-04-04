import React, { useState } from "react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { Heart, Star, Share2, Clock, ShieldCheck } from "lucide-react";

export const ListingDetailsPage: React.FC = () => {
  const [selectedImg, setSelectedImg] = useState(0);

  const listing = {
    title: "Monitor Dell 24 polegadas - P2419H",
    description:
      "Monitor em perfeito estado de conservação, com 2 anos de uso. Acompanha cabo HDMI e cabo de força. Estou interessado em trocar por um monitor 27 polegadas ou periféricos gamers de meu interesse.",
    type: "TRADE",
    condition: "GOOD",
    category: "Eletrônicos",
    user: {
      name: "Marcos Oliveira",
      reputation: 4.8,
      joined: "Membro desde 2023",
      avatar: "MO",
    },
    images: [
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800",
      "https://images.unsplash.com/photo-1547119957-637f8679db1e?w=800",
      "https://images.unsplash.com/photo-1551645120-d70bfe84c826?w=800",
    ],
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-plus-jakarta-sans text-left">
      <Header />

      <main className="max-w-[1200px] mx-auto px-4 py-12 flex-grow w-full">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
              <div className="relative aspect-[16/10] w-full rounded-3xl overflow-hidden bg-slate-50 mb-6 group">
                <img
                  src={listing.images[selectedImg]}
                  className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                  alt="Produto principal"
                />
              </div>

              <div className="flex gap-4 overflow-x-auto pb-2">
                {listing.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImg(i)}
                    className={`relative min-w-[100px] h-[100px] rounded-2xl overflow-hidden border-2 transition-all ${
                      selectedImg === i
                        ? "border-blue-600 ring-4 ring-blue-50"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      className="w-full h-full object-cover"
                      alt={`Miniatura ${i}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-10 rounded-[32px] shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
                Descrição
              </h2>
              <p className="text-slate-600 leading-relaxed text-lg italic">
                "{listing.description}"
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-widest">
                    CONDIÇÃO
                  </span>
                  <p className="font-bold text-slate-900 text-lg mt-1">
                    {listing.condition === "GOOD" ? "Bom estado" : "Novo"}
                  </p>
                </div>
                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-widest">
                    CATEGORIA
                  </span>
                  <p className="font-bold text-slate-900 text-lg mt-1">
                    {listing.category}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest text-white ${
                    listing.type === "TRADE" && (
                      <button className="w-full py-4 bg-blue-600 text-white font-bold rounded-[20px] shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all text-lg mt-3">
                        Propor Troca
                      </button>
                    )
                  }`}
                >
                  {listing.type === "TRADE" ? "Troca" : "Doação"}
                </span>
                <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                  <Clock size={14} />
                  Publicado há 2 dias
                </div>
              </div>

              <h1 className="text-2xl font-extrabold text-slate-900 leading-tight mb-8">
                {listing.title}
              </h1>

              <div className="space-y-4">
                <button className="w-full py-5 bg-orange-600 text-white font-bold rounded-[20px] shadow-lg shadow-orange-200 hover:bg-orange-700 active:scale-95 transition-all text-lg">
                  Tenho Interesse
                </button>
                <button className="w-full py-4 bg-white border-2 border-slate-100 text-slate-700 font-bold rounded-[20px] hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                  <Heart size={18} />
                  Salvar nos favoritos
                </button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-2 text-slate-400 text-xs font-medium border-t border-slate-50 pt-6">
                <ShieldCheck size={16} className="text-emerald-500" />
                Negociação protegida pelo ReUseHub
              </div>
            </div>

            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-[11px] uppercase tracking-widest mb-6">
                Anunciante
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-100">
                  {listing.user.avatar}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-lg leading-none mb-1">
                    {listing.user.name}
                  </p>
                  <p className="text-xs text-slate-400 font-medium">
                    {listing.user.joined}
                  </p>
                  <div className="flex items-center gap-1 mt-2 bg-orange-50 px-2 py-1 rounded-lg w-fit">
                    <Star
                      size={14}
                      className="text-orange-500 fill-orange-500"
                    />
                    <span className="text-sm font-bold text-orange-600">
                      {listing.user.reputation}
                    </span>
                  </div>
                </div>
              </div>
              <button className="w-full mt-8 py-3.5 border-2 border-blue-600 text-blue-600 font-bold rounded-2xl hover:bg-blue-600 hover:text-white transition-all duration-300">
                Ver perfil completo
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
