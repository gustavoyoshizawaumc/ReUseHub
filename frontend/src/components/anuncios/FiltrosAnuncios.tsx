import React, { useState } from "react";
import {
  ArrowLeftRight,
  ChevronRight,
  HandHelping,
  Layers,
  PlusCircle,
  RotateCcw,
  SortAsc,
} from "lucide-react";
import type { BuscaFiltro, TipoOrdenacao } from "../../types/busca.types";
import { useCategorias } from "../../hooks/useCategorias";

interface FiltrosAnunciosProps {
  onFiltrar: (filtro: BuscaFiltro) => void;
  onLimpar: () => void;
}

const OPCOES_ORDENACAO: { value: TipoOrdenacao; label: string }[] = [
  { value: "DISTANCIA", label: "Mais próximos" },
  { value: "RECENTES", label: "Mais recentes" },
  { value: "RELEVANCIA", label: "Mais relevantes" },
  { value: "POPULARES", label: "Mais visualizados" },
];

export const FiltrosAnuncios: React.FC<FiltrosAnunciosProps> = ({ onFiltrar, onLimpar }) => {
  const [tipo, setTipo] = useState<"DOACAO" | "TROCA" | "">("");
  const [condicao, setCondicao] = useState<"NOVO" | "BOM" | "REGULAR" | "RUIM" | "">("");
  const [categoriaId, setCategoriaId] = useState<number | "">("");
  const [ordenacao, setOrdenacao] = useState<TipoOrdenacao | "">("");

  const {
    categorias,
    carregando: carregandoCategorias,
    erro: erroCategorias,
  } = useCategorias();
  const possuiFiltroAtivo = Boolean(tipo || condicao || categoriaId || ordenacao);

  const montarFiltro = (): BuscaFiltro => {
    const filtro: BuscaFiltro = {};
    if (tipo) filtro.tipo = tipo;
    if (condicao) filtro.condicao = condicao;
    if (categoriaId) filtro.categoriaId = Number(categoriaId);
    if (ordenacao) filtro.ordenacao = ordenacao;
    return filtro;
  };

  const handleLimpar = () => {
    setTipo("");
    setCondicao("");
    setCategoriaId("");
    setOrdenacao("");
    onLimpar();
  };

  const handleTipo = (novoTipo: "DOACAO" | "TROCA") => {
    setTipo(tipo === novoTipo ? "" : novoTipo);
  };

  const labelSecao = "flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400";
  const botaoFiltro = (ativo: boolean, corAtivo: string) =>
    `flex items-center justify-between rounded-md border px-4 py-3 text-sm font-bold transition-all ${
      ativo ? corAtivo : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/40"
    }`;
  const selectClass =
    "w-full rounded-md border border-slate-200 bg-white p-3 text-sm font-bold text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:opacity-60";

  return (
    <div className="flex flex-col gap-5 font-plus-jakarta-sans text-left">
      <div className="flex min-h-5 items-center justify-end">
        {possuiFiltroAtivo && (
          <button onClick={handleLimpar} className="flex items-center gap-1 text-[11px] font-bold text-slate-400 transition-colors hover:text-orange-600">
            <RotateCcw size={12} /> Limpar
          </button>
        )}
      </div>

      <div className="space-y-3">
        <h3 className={labelSecao}>
          <Layers size={14} /> Modalidade
        </h3>
        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => handleTipo("DOACAO")} className={botaoFiltro(tipo === "DOACAO", "border-teal-200 bg-teal-50 text-teal-700 shadow-sm")}>
            <div className="flex items-center gap-3"><HandHelping size={18} /> Doação</div>
            {tipo === "DOACAO" && <ChevronRight size={14} />}
          </button>
          <button type="button" onClick={() => handleTipo("TROCA")} className={botaoFiltro(tipo === "TROCA", "border-orange-200 bg-orange-50 text-orange-700 shadow-sm")}>
            <div className="flex items-center gap-3"><ArrowLeftRight size={18} /> Troca</div>
            {tipo === "TROCA" && <ChevronRight size={14} />}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className={labelSecao}><PlusCircle size={14} /> Condição</h3>
        <select value={condicao} onChange={(e) => setCondicao(e.target.value as typeof condicao)} className={selectClass}>
          <option value="">Qualquer condição</option>
          <option value="NOVO">Novo</option>
          <option value="BOM">Bem conservado</option>
          <option value="REGULAR">Regular</option>
          <option value="RUIM">Ruim</option>
        </select>
      </div>

      <div className="space-y-3">
        <h3 className={labelSecao}><PlusCircle size={14} /> Categoria</h3>
        <select
          value={categoriaId}
          onChange={(e) => setCategoriaId(Number(e.target.value) || "")}
          disabled={carregandoCategorias || categorias.length === 0}
          className={selectClass}
        >
          <option value="">
            {carregandoCategorias ? "Carregando..." : "Todas as categorias"}
          </option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.nome}</option>
          ))}
        </select>
        {erroCategorias && (
          <p className="text-red-500 text-[11px] font-semibold">{erroCategorias}</p>
        )}
      </div>

      <div className="space-y-3">
        <h3 className={labelSecao}><SortAsc size={14} /> Ordenar por</h3>
        <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value as TipoOrdenacao)} className={selectClass}>
          <option value="">Padrão</option>
          {OPCOES_ORDENACAO.map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
        </select>
      </div>

      <button type="button" onClick={() => onFiltrar(montarFiltro())} className="w-full rounded-md bg-blue-600 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.99]">
        Aplicar filtros
      </button>
      <button type="button" onClick={handleLimpar} className="flex items-center justify-center gap-2 rounded-md border border-dashed border-slate-200 py-3 text-xs font-bold text-slate-400 transition-all hover:border-orange-200 hover:text-orange-600">
        <RotateCcw size={14} /> Resetar preferências
      </button>
    </div>
  );
};
