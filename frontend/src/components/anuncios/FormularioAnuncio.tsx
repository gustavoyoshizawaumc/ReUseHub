import React, { useState } from "react";
import { buscarEnderecoPorCEP } from "../../services/viaCepService";
import type {
  DadosCEP,
  AnuncioCriacao,
  Anuncio,
  AnuncioAtualizacao,
} from "../../types/anuncio.types";
import {
  MapPin,
  Info,
  Tag,
  AlertCircle,
  Search,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface FormularioAnuncioProps {
  onSubmit: (
    dados: AnuncioCriacao | AnuncioAtualizacao,
  ) => void | Promise<void>;
  loading: boolean;
  anuncioInicial?: Anuncio;
  isEditando?: boolean;
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

export const FormularioAnuncio: React.FC<FormularioAnuncioProps> = ({
  onSubmit,
  loading,
  anuncioInicial,
  isEditando = false,
}) => {
  const [cep, setCep] = useState(anuncioInicial?.endereco?.cep || "");
  const [endereco, setEndereco] = useState<DadosCEP | null>(
    anuncioInicial?.endereco
      ? {
          cep: anuncioInicial.endereco.cep,
          rua: anuncioInicial.endereco.rua,
          bairro: anuncioInicial.endereco.bairro,
          cidade: anuncioInicial.endereco.cidade,
          uf: anuncioInicial.endereco.uf,
        }
      : null,
  );
  const [numero, setNumero] = useState(anuncioInicial?.endereco?.numero || "");
  const [complemento, setComplemento] = useState(
    anuncioInicial?.endereco?.complemento || "",
  );
  const [titulo, setTitulo] = useState(anuncioInicial?.titulo || "");
  const [descricao, setDescricao] = useState(anuncioInicial?.descricao || "");
  const [tipo, setTipo] = useState<"DOACAO" | "TROCA">(
    (anuncioInicial?.tipo as "DOACAO" | "TROCA") || "DOACAO",
  );
  const [condicao, setCondicao] = useState<"NOVO" | "BOM" | "REGULAR" | "RUIM">(
    (anuncioInicial?.condicao as "NOVO" | "BOM" | "REGULAR" | "RUIM") || "BOM",
  );
  const [categoriaId, setCategoriaId] = useState(
    anuncioInicial?.categoriaId || 19,
  );
  const [expiraEm, setExpiraEm] = useState(anuncioInicial?.expiraEm || "");
  const [erroCep, setErroCep] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);

  const handleBuscarCep = async () => {
    const cleanCep = cep.replace(/\D/g, "");

    if (cleanCep.length !== 8) {
      setErroCep("CEP inválido");
      return;
    }

    setBuscandoCep(true);
    setErroCep("");

    try {
      const dados = await buscarEnderecoPorCEP(cleanCep);
      setEndereco(dados);
    } catch (err) {
      setErroCep("CEP não encontrado");
      setEndereco(null);
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!endereco) {
      setErroCep("Valide o endereço antes de prosseguir");
      return;
    }

    const dados: AnuncioCriacao | AnuncioAtualizacao =
      isEditando && anuncioInicial
        ? {
            titulo,
            descricao,
            condicao,
            categoriaId,
            expiraEm,
            cep,
            numero,
            complemento,
            enderecoId: anuncioInicial.enderecoId,
          }
        : {
            titulo,
            descricao,
            tipo,
            condicao,
            categoriaId,
            expiraEm,
            cep,
            numero,
            complemento,
          };

    onSubmit(dados);
  };

  const inputStyle =
    "w-full p-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none transition-all focus:ring-4 focus:ring-blue-50 focus:border-blue-500 font-medium text-slate-700 placeholder:text-slate-400 text-sm";
  const labelStyle =
    "text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-10 font-plus-jakarta-sans text-left"
    >
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <MapPin size={20} className="text-blue-600" />
          <h3 className="font-bold text-slate-900">Onde o item está?</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <label className={labelStyle}>CEP</label>
            <div className="relative">
              <input
                type="text"
                placeholder="00000-000"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                onBlur={handleBuscarCep}
                className={inputStyle}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {buscandoCep ? (
                  <Loader2 size={18} className="animate-spin text-blue-600" />
                ) : (
                  <Search size={18} className="text-slate-300" />
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            {endereco && (
              <div className="h-full flex items-center p-4 bg-emerald-50 border border-emerald-100 rounded-2xl animate-in fade-in zoom-in duration-300">
                <CheckCircle2
                  className="text-emerald-500 mr-3 shrink-0"
                  size={20}
                />
                <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                  <strong>{endereco.rua}</strong>, {endereco.bairro}
                  <br />
                  {endereco.cidade} - {endereco.uf}
                </p>
              </div>
            )}

            {erroCep && (
              <div className="h-full flex items-center p-4 bg-red-50 border border-red-100 rounded-2xl">
                <AlertCircle className="text-red-500 mr-3 shrink-0" size={20} />
                <p className="text-xs text-red-800 font-bold">{erroCep}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className={labelStyle}>Número</label>
            <input
              type="text"
              required
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              className={inputStyle}
              placeholder="Ex: 123"
            />
          </div>
          <div>
            <label className={labelStyle}>Complemento</label>
            <input
              type="text"
              value={complemento}
              onChange={(e) => setComplemento(e.target.value)}
              className={inputStyle}
              placeholder="Apto, Bloco..."
            />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Info size={20} className="text-blue-600" />
          <h3 className="font-bold text-slate-900">Sobre o Desapego</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelStyle}>Título do Anúncio</label>
            <input
              type="text"
              required
              minLength={5}
              maxLength={150}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className={inputStyle}
              placeholder="Ex: Teclado Mecânico RGB em perfeito estado"
            />
          </div>

          <div>
            <label className={labelStyle}>Descrição Detalhada</label>
            <textarea
              required
              rows={4}
              minLength={10}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className={`${inputStyle} resize-none`}
              placeholder="Conte mais sobre o item, tempo de uso, motivo do desapego..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid grid-cols-2 gap-4">
            {!isEditando && (
              <div>
                <label className={labelStyle}>Tipo</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as any)}
                  className={inputStyle}
                >
                  <option value="DOACAO">Doação</option>
                  <option value="TROCA">Troca</option>
                </select>
              </div>
            )}

            <div>
              <label className={labelStyle}>Condição</label>
              <select
                value={condicao}
                onChange={(e) => setCondicao(e.target.value as any)}
                className={inputStyle}
              >
                <option value="NOVO">Novo</option>
                <option value="BOM">Bom</option>
                <option value="REGULAR">Regular</option>
                <option value="RUIM">Ruim</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelStyle}>Categoria</label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(Number(e.target.value))}
                className={inputStyle}
              >
                {CATEGORIAS.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelStyle}>Data Limite</label>
              <input
                type="datetime-local"
                value={expiraEm}
                onChange={(e) => setExpiraEm(e.target.value)}
                className={inputStyle}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading || !endereco}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-[20px] font-bold text-lg shadow-lg shadow-orange-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              <Tag size={20} />
              {isEditando ? "Atualizar Anúncio" : "Publicar Anúncio"}
            </>
          )}
        </button>
        {!endereco && !erroCep && (
          <p className="text-center text-[11px] text-slate-400 font-bold uppercase mt-4 tracking-widest">
            Valide o CEP para habilitar o botão
          </p>
        )}
      </div>
    </form>
  );
};
