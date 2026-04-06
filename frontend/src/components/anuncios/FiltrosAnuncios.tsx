import React, { useState } from "react";
import {
  Filter,
  RotateCcw,
  ChevronRight,
  Layers,
  HandHelping,
  ArrowLeftRight,
  PlusCircle,
} from "lucide-react";

interface FiltrosAnunciosProps {
  onFiltrarTipo: (tipo: "DOACAO" | "TROCA") => void;
  onFiltrarCategoria: (categoriaId: number) => void;
  onLimpar: () => void;
}

const CATEGORIAS = [
  { id: 5, nome: "Casa, Decoração" },
  { id: 8, nome: "Moda e Beleza" },
  { id: 11, nome: "Música e Hobbies" },
  { id: 16, nome: "Games" },
  { id: 19, nome: "Informática" },
  { id: 20, nome: "Eletro" },
  { id: 21, nome: "Móveis" },
];

export const FiltrosAnuncios: React.FC<FiltrosAnunciosProps> = ({
  onFiltrarTipo,
  onFiltrarCategoria,
  onLimpar,
}) => {
  const [tipo, setTipo] = useState<"DOACAO" | "TROCA" | "">("");
  const [categoria, setCategoria] = useState<number | "">("");

  const handleTipoChange = (novoTipo: "DOACAO" | "TROCA") => {
    setTipo(novoTipo);
    onFiltrarTipo(novoTipo);
  };

  const handleCategoriaChange = (categoriaId: number) => {
    setCategoria(categoriaId);
    onFiltrarCategoria(categoriaId);
  };

  const handleLimpar = () => {
    setTipo("");
    setCategoria("");
    onLimpar();
  };

  return (
    <div className="flex flex-col gap-8 font-plus-jakarta-sans text-left">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
          <Filter size={16} className="text-blue-600" />
          Filtros
        </h2>
        {(tipo || categoria) && (
          <button
            onClick={handleLimpar}
            className="text-[11px] font-bold text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
          >
            <RotateCcw size={12} /> Limpar
          </button>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Layers size={14} /> Modalidade
        </h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => handleTipoChange("DOACAO")}
            className={`flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-sm transition-all border ${
              tipo === "DOACAO"
                ? "bg-teal-50 border-teal-200 text-teal-700 shadow-sm shadow-teal-50"
                : "bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <HandHelping size={18} /> Doação
            </div>
            {tipo === "DOACAO" && <ChevronRight size={14} />}
          </button>

          <button
            onClick={() => handleTipoChange("TROCA")}
            className={`flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-sm transition-all border ${
              tipo === "TROCA"
                ? "bg-orange-50 border-orange-200 text-orange-700 shadow-sm shadow-orange-50"
                : "bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <ArrowLeftRight size={18} /> Troca
            </div>
            {tipo === "TROCA" && <ChevronRight size={14} />}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <PlusCircle size={14} /> Categorias
        </h3>
        <div className="relative group">
          <select
            value={categoria}
            onChange={(e) => handleCategoriaChange(Number(e.target.value))}
            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all appearance-none cursor-pointer"
          >
            <option value="">Todas as categorias</option>
            {CATEGORIAS.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
            <ChevronDown size={18} />
          </div>
        </div>
      </div>

      <button
        onClick={handleLimpar}
        className="mt-4 py-4 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-xs font-bold hover:border-blue-200 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
      >
        <RotateCcw size={14} /> Resetar preferências
      </button>
    </div>
  );
};

const ChevronDown = ({
  size,
  className,
}: {
  size: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);
