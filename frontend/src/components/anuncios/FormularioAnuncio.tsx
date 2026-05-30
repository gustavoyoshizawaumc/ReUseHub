import React, { useState } from "react";
import { Camera, PlusCircle, X, Loader2, MapPin, Search } from "lucide-react";
import type { AnuncioCriacao } from "../../types/anuncio.types";
import { buscarEnderecoPorCEP } from "../../services/viaCepService";
import { useCategorias } from "../../hooks/useCategorias";

const QUANTIDADE_MINIMA_IMAGENS = 3;
const QUANTIDADE_MAXIMA_IMAGENS = 5;

interface FormularioAnuncioProps {
  onSubmit: (dados: AnuncioCriacao, imagens: File[]) => Promise<void>;
  loading: boolean;
}

export const FormularioAnuncio: React.FC<FormularioAnuncioProps> = ({
  onSubmit,
  loading,
}) => {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<"DOACAO" | "TROCA">("DOACAO");
  const [condicao, setCondicao] = useState<"NOVO" | "BOM" | "REGULAR" | "RUIM">("BOM");
  const [categoriaId, setCategoriaId] = useState("");
  const [expiraEm, setExpiraEm] = useState("");
  const [cep, setCep] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [enderecoDisplay, setEnderecoDisplay] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erroCep, setErroCep] = useState<string | null>(null);

  const [imagens, setImagens] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [erroImagens, setErroImagens] = useState<string | null>(null);

  const {
    categorias,
    carregando: carregandoCategorias,
    erro: erroCategorias,
  } = useCategorias();

  const quantidadeImagensValida = imagens.length >= QUANTIDADE_MINIMA_IMAGENS;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const novasImagens = Array.from(e.target.files);
    const total = [...imagens, ...novasImagens].slice(0, QUANTIDADE_MAXIMA_IMAGENS);
    setImagens(total);
    setPreviews(total.map((f) => URL.createObjectURL(f)));
    setErroImagens(null);
    e.target.value = "";
  };

  const removerImagem = (index: number) => {
    const novas = imagens.filter((_, i) => i !== index);
    const novasPreviews = previews.filter((_, i) => i !== index);
    setImagens(novas);
    setPreviews(novasPreviews);
  };

  const handleBuscarCep = async () => {
    if (cep.replace(/\D/g, "").length !== 8) {
      setErroCep("CEP deve conter 8 dígitos");
      return;
    }
    setBuscandoCep(true);
    setErroCep(null);
    try {
      const dados = await buscarEnderecoPorCEP(cep);
      setEnderecoDisplay(`${dados.rua}, ${dados.bairro} — ${dados.cidade}/${dados.uf}`);
    } catch (err) {
      setErroCep(err instanceof Error ? err.message : "CEP não encontrado");
      setEnderecoDisplay("");
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quantidadeImagensValida) {
      setErroImagens(
        `É obrigatório enviar entre ${QUANTIDADE_MINIMA_IMAGENS} e ${QUANTIDADE_MAXIMA_IMAGENS} fotos para publicar o anúncio.`
      );
      return;
    }

    const dados: AnuncioCriacao = {
      titulo,
      descricao,
      tipo,
      condicao,
      categoriaId: Number(categoriaId),
      expiraEm: expiraEm ? `${expiraEm}T00:00:00` : "",
      cep: cep.replace(/\D/g, ""),
      numero,
      complemento: complemento || undefined,
    };

    await onSubmit(dados, imagens);
  };

  const labelClass = "text-xs font-bold text-slate-500 uppercase tracking-wider ml-1";
  const inputClass =
    "w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-slate-800 placeholder-slate-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* CAMPOS PRINCIPAIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className={labelClass}>Título</label>
          <input
            required
            className={inputClass}
            placeholder="Ex: PlayStation 2 Slim Conservado"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Categoria</label>
          <select
            required
            className={inputClass + " cursor-pointer"}
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            disabled={carregandoCategorias || categorias.length === 0}
          >
            <option value="">
              {carregandoCategorias ? "Carregando..." : "Selecione..."}
            </option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
          {erroCategorias && (
            <p className="text-red-500 text-xs font-semibold ml-1">{erroCategorias}</p>
          )}
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className={labelClass}>Descrição Detalhada</label>
          <textarea
            required
            rows={4}
            className={inputClass + " resize-none"}
            placeholder="Conte mais sobre o produto, estado de conservação, motivo da doação..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Tipo</label>
          <select
            className={inputClass + " cursor-pointer"}
            value={tipo}
            onChange={(e) => setTipo(e.target.value as "DOACAO" | "TROCA")}
          >
            <option value="DOACAO">Doação</option>
            <option value="TROCA">Troca</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Condição</label>
          <select
            className={inputClass + " cursor-pointer"}
            value={condicao}
            onChange={(e) => setCondicao(e.target.value as "NOVO" | "BOM" | "REGULAR" | "RUIM")}
          >
            <option value="NOVO">Novo</option>
            <option value="BOM">Bem Conservado</option>
            <option value="REGULAR">Regular</option>
            <option value="RUIM">Ruim</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Data Limite</label>
          <input
            required
            type="date"
            className={inputClass}
            value={expiraEm}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setExpiraEm(e.target.value)}
          />
        </div>
      </div>

      {/* ENDEREÇO */}
      <div className="space-y-4 pt-6 border-t border-slate-100">
        <label className="text-sm font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2">
          <MapPin size={18} className="text-blue-600" />
          Onde o item está?
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={labelClass}>CEP</label>
            <div className="relative flex gap-2">
              <input
                required
                className={inputClass}
                placeholder="00000-000"
                value={cep}
                maxLength={9}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 8);
                  setCep(v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v);
                  setEnderecoDisplay("");
                  setErroCep(null);
                }}
                onBlur={handleBuscarCep}
              />
              <button
                type="button"
                onClick={handleBuscarCep}
                disabled={buscandoCep}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {buscandoCep ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </button>
            </div>
            {erroCep && <p className="text-red-500 text-xs font-semibold ml-1">{erroCep}</p>}
            {enderecoDisplay && (
              <p className="text-emerald-600 text-xs font-semibold ml-1">✓ {enderecoDisplay}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Número</label>
            <input
              required
              className={inputClass}
              placeholder="Ex: 42"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className={labelClass}>
              Complemento{" "}
              <span className="normal-case font-normal text-slate-400">(opcional)</span>
            </label>
            <input
              className={inputClass}
              placeholder="Ex: Apto 12, Bloco B"
              value={complemento}
              onChange={(e) => setComplemento(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* UPLOAD DE FOTOS */}
      <div className="space-y-4 pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="text-sm font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2">
            <Camera size={18} className="text-blue-600" />
            Fotos do Produto
          </label>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
            quantidadeImagensValida ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
          }`}>
            {imagens.length}/{QUANTIDADE_MAXIMA_IMAGENS}{" "}
            {quantidadeImagensValida
              ? "✓"
              : `mínimo ${QUANTIDADE_MINIMA_IMAGENS}`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {imagens.length < QUANTIDADE_MAXIMA_IMAGENS && (
            <label className="cursor-pointer aspect-square rounded-[20px] border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center justify-center bg-white group">
              <PlusCircle className="text-slate-400 group-hover:text-blue-600 mb-1 transition-colors" size={24} />
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-500 uppercase transition-colors">
                Adicionar
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          )}

          {previews.map((url, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-[20px] overflow-hidden border border-slate-100 shadow-sm"
            >
              <img src={url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removerImagem(index)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow transition-all hover:scale-110"
              >
                <X size={12} />
              </button>
              <span className="absolute bottom-2 left-2 bg-black/40 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {index + 1}
              </span>
            </div>
          ))}
        </div>

        {erroImagens && (
          <p className="text-red-500 text-sm font-semibold flex items-center gap-2">
            <span>⚠</span> {erroImagens}
          </p>
        )}

        <p className="text-xs text-slate-400 font-medium">
          Envie de {QUANTIDADE_MINIMA_IMAGENS} a {QUANTIDADE_MAXIMA_IMAGENS} fotos do item.
          Formatos aceitos: JPG, PNG, WEBP.
        </p>
      </div>

      {/* BOTÃO PUBLICAR */}
      <button
        type="submit"
        disabled={loading || !quantidadeImagensValida}
        className="w-full py-5 bg-orange-600 text-white font-bold rounded-lg shadow-sm hover:bg-orange-700 active:scale-[0.98] transition-all text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Publicando...
          </>
        ) : (
          "Publicar Anúncio"
        )}
      </button>
    </form>
  );
};
