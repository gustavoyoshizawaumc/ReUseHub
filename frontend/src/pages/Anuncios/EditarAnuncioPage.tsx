import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as anuncioService from "../../services/anuncioService";
import type { Anuncio } from "../../types/anuncio.types";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { AlertCircle, ArrowLeft, Edit3, Loader2, MapPin, Search, Camera, PlusCircle, X } from "lucide-react";
import { buscarEnderecoPorCEP } from "../../services/viaCepService";

export const EditarAnuncioPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [anuncio, setAnuncio] = useState<Anuncio | null>(null);
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
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

  useEffect(() => {
    const carregarDados = async () => {
      try {
        if (id) {
          const dados = await anuncioService.obterAnuncio(id);
          setAnuncio(dados);

          setTitulo(dados.titulo);
          setDescricao(dados.descricao);
          setCondicao(dados.condicao);
          setCategoriaId(String(dados.categoriaId));
          setExpiraEm(dados.expiraEm ? dados.expiraEm.split("T")[0] : "");

          setCep(dados.cep ?? "");
          setNumero(dados.numero ?? "");
          setComplemento(dados.complemento ?? "");
          if (dados.cep && dados.rua) {
            setEnderecoDisplay(
              `${dados.rua}, ${dados.bairro} — ${dados.cidade}/${dados.uf}`
            );
          }

          if (dados.imagensUrls && dados.imagensUrls.length > 0) {
            const urls = dados.imagensUrls.map((url) =>
              url.startsWith("http") ? url : `http://localhost:8080${url}`
            );
            setPreviews(urls);
          }
        }
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Erro ao carregar anúncio");
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, [id]);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const novasImagens = Array.from(e.target.files);
    const total = [...imagens, ...novasImagens].slice(0, 5);
    setImagens(total);
    setPreviews(total.map((f) => URL.createObjectURL(f)));
    e.target.value = "";
  };

  const removerImagem = (index: number) => {
    setImagens(imagens.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !anuncio) return;

    setLoading(true);
    setErro(null);

    try {
      const dadosAtualizacao = {
        titulo,
        descricao,
        condicao,
        categoriaId: Number(categoriaId),
        expiraEm: expiraEm ? `${expiraEm}T00:00:00` : "",
        cep: cep.replace(/\D/g, ""),
        numero,
        complemento: complemento || undefined,
        enderecoId: anuncio.enderecoId,
      };

      const anuncioAtualizado = await anuncioService.atualizarAnuncio(id, dadosAtualizacao);
      navigate(`/anuncios/${anuncioAtualizado.id}`);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao atualizar anúncio");
    } finally {
      setLoading(false);
    }
  };

  const labelClass = "text-xs font-bold text-slate-500 uppercase tracking-wider ml-1";
  const inputClass =
    "w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-slate-800 placeholder-slate-400";

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (erro && !anuncio) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-sm text-center max-w-md">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Erro</h2>
          <p className="text-slate-500 mb-6">{erro}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold transition-all active:scale-95"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-plus-jakarta-sans text-left">
      <Header />

      <main className="flex-grow bg-[#f1f5f9] py-12 px-4 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm w-full max-w-3xl p-8 md:p-12 border border-slate-100">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold text-sm mb-8 transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Voltar
          </button>

          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <Edit3 className="text-orange-500" size={28} />
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Editar Anúncio
              </h1>
            </div>
            <p className="text-slate-500 text-[16px]">Atualize os detalhes do seu anúncio.</p>
          </div>

          {erro && (
            <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl text-sm flex items-center gap-3">
              <AlertCircle size={20} />
              <span className="font-bold text-[16px]">{erro}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={labelClass}>Título</label>
                <input
                  required
                  className={inputClass}
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
                >
                  <option value="">Selecione...</option>
                  <option value="1">Imóveis</option>
                  <option value="2">Autos</option>
                  <option value="3">Autopeças</option>
                  <option value="4">Celulares e Telefonia</option>
                  <option value="5">Casa, Decoração e Utensílios</option>
                  <option value="6">Esportes e Fitness</option>
                  <option value="7">Serviços</option>
                  <option value="8">Moda e Beleza</option>
                  <option value="9">Artigos Infantis</option>
                  <option value="10">Animais de Estimação</option>
                  <option value="11">Música e Hobbies</option>
                  <option value="12">Agro e Indústria</option>
                  <option value="13">Vagas de Emprego</option>
                  <option value="14">Comércio</option>
                  <option value="15">Câmeras e Drones</option>
                  <option value="16">Games</option>
                  <option value="17">TVs e Vídeo</option>
                  <option value="18">Áudio</option>
                  <option value="19">Informática</option>
                  <option value="20">Eletro</option>
                  <option value="21">Móveis</option>
                  <option value="22">Materiais de Construção</option>
                  <option value="23">Escritório e Home Office</option>
                </select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className={labelClass}>Descrição Detalhada</label>
                <textarea
                  required
                  rows={4}
                  className={inputClass + " resize-none"}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
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
                  <div className="flex gap-2">
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
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className={labelClass}>
                    Complemento <span className="normal-case font-normal text-slate-400">(opcional)</span>
                  </label>
                  <input
                    className={inputClass}
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
                  imagens.length === 5 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}>
                  {imagens.length}/5 {imagens.length === 5 ? "✓" : "opcional"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {imagens.length < 5 && (
                  <label className="cursor-pointer aspect-square rounded-[20px] border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center justify-center bg-white group">
                    <PlusCircle className="text-slate-400 group-hover:text-blue-600 mb-1 transition-colors" size={24} />
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-500 uppercase transition-colors">
                      Adicionar
                    </span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                )}
                {previews.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-[20px] overflow-hidden border border-slate-100 shadow-sm">
                    <img src={url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removerImagem(index)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow transition-all hover:scale-110"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Adicione novas fotos para substituir as existentes. Formatos aceitos: JPG, PNG, WEBP.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-orange-600 text-white font-bold rounded-lg shadow-sm hover:bg-orange-700 active:scale-[0.98] transition-all text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};
