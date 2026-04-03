import React from "react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { Edit3, Trash2, Plus, Package, Gift, Repeat, Eye } from "lucide-react";
import { Link } from "react-router-dom";

const MY_LISTINGS = [
  {
    id: "uuid-1",
    title: "Monitor Dell 24 polegadas",
    type: "TRADE",
    status: "ACTIVE",
    city: "São Paulo",
    state: "SP",
    thumbnail:
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=400&q=80",
    category: "Eletrônicos",
    views: 124,
  },
  {
    id: "uuid-2",
    title: "Cadeira de Bebê para Carro",
    type: "DONATION",
    status: "ACTIVE",
    city: "Guarulhos",
    state: "SP",
    thumbnail:
      "https://images.unsplash.com/photo-1596462502278-27bf86473a8c?auto=format&fit=crop&w=400&q=80",
    category: "Infantil",
    views: 45,
  },
];

export const MyListingsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-plus-jakarta-sans">
      <Header />

      <main className="max-w-[1200px] mx-auto px-4 py-12 flex-grow w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 text-left">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Meus Anúncios
            </h1>
            <p className="text-slate-500 mt-2 text-[16px]">
              Gerencie seus itens postados na plataforma.
            </p>
          </div>
          <Link
            to="/create-listing"
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-orange-100 active:scale-95"
          >
            <Plus size={20} />
            Novo Anúncio
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-10">
          <aside className="w-full md:w-64 shrink-0">
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm sticky top-24">
              <h3 className="font-semibold text-slate-900 text-xs uppercase tracking-[1.5px] mb-6 border-b border-slate-50 pb-4 text-left">
                Resumo da Conta
              </h3>

              <div className="space-y-6">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <Package size={16} className="text-blue-500" /> Ativos
                  </div>
                  <span className="font-bold text-slate-900">08</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <Gift size={16} className="text-emerald-500" /> Doações
                  </div>
                  <span className="font-bold text-slate-900">03</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <Repeat size={16} className="text-orange-500" /> Trocas
                  </div>
                  <span className="font-bold text-slate-900">05</span>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {MY_LISTINGS.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-[32px] border border-slate-100 overflow-hidden flex flex-col hover:shadow-xl transition-all group h-full"
              >
                <div className="relative aspect-[4/3] p-2">
                  <div className="w-full h-full rounded-[24px] overflow-hidden bg-slate-100">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>

                  <span
                    className={`absolute top-5 left-5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white shadow-md ${
                      item.type === "DONATION"
                        ? "bg-emerald-500"
                        : "bg-blue-600"
                    }`}
                  >
                    {item.type === "DONATION" ? "Doação" : "Troca"}
                  </span>
                </div>

                <div className="p-6 flex flex-col flex-1 text-left">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-extrabold text-orange-500 uppercase tracking-widest">
                      {item.category}
                    </span>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Eye size={12} />
                      <span className="text-[10px] font-bold">
                        {item.views}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-[17px] leading-tight mb-4 line-clamp-2">
                    {item.title}
                  </h3>

                  <div className="mt-auto pt-4 border-t border-slate-50 flex items-center gap-3">
                    <button className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 py-3 rounded-xl text-xs font-bold transition-all border border-transparent hover:border-blue-100">
                      <Edit3 size={14} />
                      Editar
                    </button>
                    <button className="w-12 h-12 flex items-center justify-center bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all border border-transparent hover:border-red-100 group/trash">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
