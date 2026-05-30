import React, { useState } from "react";
import {
  ArrowLeftRight,
  ChevronRight,
  Filter,
  HandHelping,
  Layers,
  Loader2,
  MapPin,
  PlusCircle,
  RotateCcw,
  SortAsc,
} from "lucide-react";
import type { BuscaFiltro, TipoOrdenacao } from "../../types/busca.types";
import { useLocalizacao } from "../../hooks/useLocalizacao";
import { useCategorias } from "../../hooks/useCategorias";

interface FiltrosAnunciosProps {
  onFiltrar: (filtro: BuscaFiltro) => void;
  onLimpar: () => void;
}

const OPCOES_ORDENACAO: { value: TipoOrdenacao; label: string }[] = [
  { value: "RELEVANCIA", label: "Mais relevantes" },
  { value: "DISTANCIA", label: "Mais proximos" },
  { value: "RECENTES", label: "Mais recentes" },
  { value: "POPULARES", label: "Mais visualizados" },
];

const RAIOS_KM = [5, 10, 25, 50, 100];

export const FiltrosAnuncios: React.FC<FiltrosAnunciosProps> = ({ onFiltrar, onLimpar }) => {
  const [tipo, setTipo] = useState<"DOACAO" | "TROCA" | "">("");
  const [condicao, setCondicao] = useState<"NOVO" | "BOM" | "REGULAR" | "RUIM" | "">("");
  const [categoriaId, setCategoriaId] = useState<number | "">("");
  const [ordenacao, setOrdenacao] = useState<TipoOrdenacao | "">("");
  const [cep, setCep] = useState("");
  const [raioKm, setRaioKm] = useState<number>(10);
  const [fonteLocalizacao, setFonteLocalizacao] = useState<"gps" | "cep" | "nenhuma">("nenhuma");

  const { coordenadas, carregandoLocalizacao, obterLocalizacao, limparLocalizacao } = useLocalizacao();
  const {
    categorias,
    carregando: carregandoCategorias,
    erro: erroCategorias,
  } = useCategorias();
  const possuiFiltroAtivo = Boolean(tipo || condicao || categoriaId || ordenacao || fonteLocalizacao !== "nenhuma");

  const montarFiltro = (): BuscaFiltro => {
    const filtro: BuscaFiltro = {};
    if (tipo) filtro.tipo = tipo;
    if (condicao) filtro.condicao = condicao;
    if (categoriaId) filtro.categoriaId = Number(categoriaId);
    if (ordenacao) filtro.ordenacao = ordenacao;
    if (fonteLocalizacao === "gps" && coordenadas) {
      filtro.latitude = coordenadas.latitude;
      filtro.longitude = coordenadas.longitude;
      filtro.raioKm = raioKm;
    }
    if (fonteLocalizacao === "cep" && cep.length === 8) {
      filtro.cep = cep;
      filtro.raioKm = raioKm;
    }
    return filtro;
  };

  const handleLimpar = () => {
    setTipo("");
    setCondicao("");
    setCategoriaId("");
    setOrdenacao("");
    setCep("");
    setRaioKm(10);
    setFonteLocalizacao("nenhuma");
    limparLocalizacao();
    onLimpar();
  };

  const handleTipo = (novoTipo: "DOACAO" | "TROCA") => {
    setTipo(tipo === novoTipo ? "" : novoTipo);
  };

  const handleUsarGps = () => {
    if (fonteLocalizacao === "gps") {
      setFonteLocalizacao("nenhuma");
      limparLocalizacao();
      return;
    }
    setFonteLocalizacao("gps");
    obterLocalizacao();
  };

  const labelSecao = "text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2";
  const botaoFiltro = (ativo: boolean, corAtivo: string) =>
    `flex items-center justify-between px-4 py-3 rounded-lg font-bold text-sm transition-all border ${
      ativo ? corAtivo : "bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50"
    }`;

  return (
    <div className="flex flex-col gap-6 font-plus-jakarta-sans text-left">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
          <Filter size={16} className="text-blue-600" />
          Filtros
        </h2>
        {possuiFiltroAtivo && (
          <button onClick={handleLimpar} className="text-[11px] font-bold text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors">
            <RotateCcw size={12} /> Limpar
          </button>
        )}
      </div>

      <div className="space-y-3">
        <h3 className={labelSecao}>
          <Layers size={14} /> Modalidade
        </h3>
        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => handleTipo("DOACAO")} className={botaoFiltro(tipo === "DOACAO", "bg-teal-50 border-teal-200 text-teal-700 shadow-sm")}>
            <div className="flex items-center gap-3"><HandHelping size={18} /> Doacao</div>
            {tipo === "DOACAO" && <ChevronRight size={14} />}
          </button>
          <button type="button" onClick={() => handleTipo("TROCA")} className={botaoFiltro(tipo === "TROCA", "bg-orange-50 border-orange-200 text-orange-700 shadow-sm")}>
            <div className="flex items-center gap-3"><ArrowLeftRight size={18} /> Troca</div>
            {tipo === "TROCA" && <ChevronRight size={14} />}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className={labelSecao}><PlusCircle size={14} /> Condicao</h3>
        <select value={condicao} onChange={(e) => setCondicao(e.target.value as typeof condicao)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all">
          <option value="">Qualquer condicao</option>
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
          className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all disabled:opacity-60"
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
        <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value as TipoOrdenacao)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all">
          <option value="">Padrao</option>
          {OPCOES_ORDENACAO.map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        <h3 className={labelSecao}><MapPin size={14} /> Localizacao</h3>
        <div className="flex flex-col gap-2">
          <button type="button" onClick={handleUsarGps} disabled={carregandoLocalizacao} className={botaoFiltro(fonteLocalizacao === "gps", "bg-blue-50 border-blue-200 text-blue-700 shadow-sm")}>
            <div className="flex items-center gap-3">
              {carregandoLocalizacao ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
              {carregandoLocalizacao ? "Obtendo..." : "Usar minha localizacao"}
            </div>
            {fonteLocalizacao === "gps" && coordenadas && <ChevronRight size={14} />}
          </button>
          <input
            type="text"
            placeholder="Ou digite seu CEP"
            value={cep}
            maxLength={8}
            onChange={(e) => {
              const valor = e.target.value.replace(/\D/g, "");
              setCep(valor);
              setFonteLocalizacao(valor.length === 8 ? "cep" : "nenhuma");
            }}
            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all placeholder:font-normal"
          />
        </div>

        {fonteLocalizacao !== "nenhuma" && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Raio de busca</p>
            <div className="flex flex-wrap gap-2">
              {RAIOS_KM.map((raio) => (
                <button key={raio} type="button" onClick={() => setRaioKm(raio)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${raioKm === raio ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:border-blue-300"}`}>
                  {raio}km
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button type="button" onClick={() => onFiltrar(montarFiltro())} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-sm transition-all active:scale-[0.99]">
        Aplicar filtros
      </button>
      <button type="button" onClick={handleLimpar} className="py-3 border-2 border-dashed border-slate-100 rounded-lg text-slate-400 text-xs font-bold hover:border-blue-200 hover:text-blue-500 transition-all flex items-center justify-center gap-2">
        <RotateCcw size={14} /> Resetar preferencias
      </button>
    </div>
  );
};
