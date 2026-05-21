import React, { useState } from "react";
import { Search, X } from "lucide-react";

interface BuscaAnunciosProps {
  onBuscar: (termo: string) => void;
  termoInicial?: string;
}

const SUGESTOES = ["Cadeira", "iPhone", "Livros"];

export const BuscaAnuncios: React.FC<BuscaAnunciosProps> = ({
  onBuscar,
  termoInicial = "",
}) => {
  const [termo, setTermo] = useState(termoInicial);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onBuscar(termo.trim());
  };

  const handleLimpar = () => {
    setTermo("");
    onBuscar("");
  };

  const handleSugestao = (sugestao: string) => {
    setTermo(sugestao);
    onBuscar(sugestao);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <Search
            size={20}
            className="text-slate-400 group-focus-within:text-blue-600 transition-colors"
          />
        </div>

        <input
          type="text"
          placeholder="O que você está procurando hoje?"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          className="w-full pl-14 pr-32 py-4 bg-white border border-slate-200 rounded-[22px] shadow-sm outline-none transition-all focus:ring-4 focus:ring-blue-50 focus:border-blue-500 text-slate-700 font-medium placeholder:text-slate-400"
        />

        <div className="absolute inset-y-2 right-2 flex items-center gap-2">
          {termo && (
            <button
              type="button"
              onClick={handleLimpar}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
            >
              <X size={18} />
            </button>
          )}
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-[16px] font-bold text-sm shadow-lg shadow-blue-100 transition-all active:scale-95"
          >
            Buscar
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 ml-4">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          Sugestões:
        </span>
        {SUGESTOES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => handleSugestao(item)}
            className="text-[11px] font-bold text-blue-600 hover:underline"
          >
            {item}
          </button>
        ))}
      </div>
    </form>
  );
};
