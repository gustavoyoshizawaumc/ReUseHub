import React, { useState } from "react";
import { Search, X } from "lucide-react";

interface BuscaAnunciosProps {
  onBuscar: (termo: string) => void;
}

export const BuscaAnuncios: React.FC<BuscaAnunciosProps> = ({ onBuscar }) => {
  const [termo, setTermo] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onBuscar(termo.trim());
  };

  const handleClear = () => {
    setTermo("");
    onBuscar("");
  };

  return (
    <form onSubmit={handleSubmit} className="w-full mb-8">
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
          className="w-full rounded-lg border border-slate-200 bg-white py-4 pl-14 pr-4 font-medium text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 sm:pr-32"
        />

        <div className="mt-2 flex items-center gap-2 sm:absolute sm:inset-y-2 sm:right-2 sm:mt-0">
          {termo && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          )}
          <button
            type="submit"
            className="flex-1 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 sm:flex-none"
          >
            Buscar
          </button>
        </div>
      </div>

      <div className="mt-3 ml-1 flex flex-wrap items-center gap-2 sm:ml-4">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          Sugestões:
        </span>
        {["Cadeira", "iPhone", "Livros"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setTermo(item);
              onBuscar(item);
            }}
            className="text-[11px] font-bold text-blue-600 hover:underline"
          >
            {item}
          </button>
        ))}
      </div>
    </form>
  );
};
