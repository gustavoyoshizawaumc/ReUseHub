import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as anuncioService from "../../services/anuncioService";
import type { Anuncio, ImagemAnuncio } from "../../types/anuncio.types";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { AlertCircle, ArrowLeft, Edit3, Loader2, MapPin, Search } from "lucide-react";
import { buscarEnderecoPorCEP } from "../../services/viaCepService";
import { GerenciadorDeImagens, type SelecaoDeImagens } from "../../components/GerenciadorDeImagens";
import { useCategorias } from "../../hooks/useCategorias";

const QUANTIDADE_MINIMA_IMAGENS = 3;
const QUANTIDADE_MAXIMA_IMAGENS = 5;

const haMudancaNasImagens = (
  selecao: SelecaoDeImagens,
  imagensOriginais: ImagemAnuncio[]
): boolean => {
  if (selecao.novasImagens.length > 0) {
    return true;
  }
  if (selecao.idsParaManter.length !== imagensOriginais.length) {
    return true;
  }
  const ordemOriginal = [...imagensOriginais]
    .sort((a, b) => a.ordemExibicao - b.ordemExibicao)
    .map((imagem) => imagem.id);
  return selecao.idsParaManter.some((id, indice) => id !== ordemOriginal[indice]);
};

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
  const [cep, setCep] = useState("");
  const [enderecoDisplay, setEnderecoDisplay] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erroCep, setErroCep] = useState<string | null>(null);
  const [selecaoImagens, setSelecaoImagens] = useState<SelecaoDeImagens>({
    idsParaManter: [],
    novasImagens: [],
    totalFinal: 0,
  });

  const {
    categorias,
    carregando: carregandoCategorias,
    erro: erroCategorias,
  } = useCategorias();

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

          setCep(dados.cep ?? "");
          if (dados.cep && dados.rua) {
            setEnderecoDisplay(
              `${dados.rua}, ${dados.bairro} — ${dados.cidade}/${dados.uf}`
            );
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

  const aoAtualizarSelecaoDeImagens = useCallback((selecao: SelecaoDeImagens) => {
    setSelecaoImagens(selecao);
  }, []);

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
    if (!id || !anuncio) return;

    if (
      selecaoImagens.totalFinal < QUANTIDADE_MINIMA_IMAGENS ||
      selecaoImagens.totalFinal > QUANTIDADE_MAXIMA_IMAGENS
    ) {
      setErro(
        `O anuncio deve conter entre ${QUANTIDADE_MINIMA_IMAGENS} e ${QUANTIDADE_MAXIMA_IMAGENS} imagens.`
      );
      return;
    }

    setLoading(true);
    setErro(null);

    try {
      const dadosAtualizacao = {
        titulo,
        descricao,
        condicao,
        categoriaId: Number(categoriaId),
        cep: cep.replace(/\D/g, ""),
        enderecoId: anuncio.enderecoId,
      };

      await anuncioService.atualizarAnuncio(id, dadosAtualizacao);

      if (haMudancaNasImagens(selecaoImagens, anuncio.imagens ?? [])) {
        await anuncioService.atualizarImagensDoAnuncio(
          id,
          selecaoImagens.idsParaManter,
          selecaoImagens.novasImagens
        );
      }

      navigate("/meus-anuncios?status=atualizado");
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

      <main className="flex-grow bg-[#f1f5f9] px-3 py-6 sm:px-4 sm:py-12 flex items-center justify-center">
        <div className="w-full max-w-3xl rounded-lg border border-slate-100 bg-white p-5 shadow-sm sm:p-8 md:p-12">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-blue-600 group sm:mb-8"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Voltar
          </button>

          <div className="mb-7 sm:mb-10">
            <div className="flex items-center gap-3 mb-2">
              <Edit3 className="text-orange-500" size={28} />
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Editar Anúncio
              </h1>
            </div>
            <p className="text-slate-500 text-[16px]">Atualize os detalhes do seu anúncio.</p>
          </div>

          <div className="mb-8 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-amber-600" />
            <p>
              Ao salvar qualquer alteração, o anúncio será enviado novamente para análise da moderação.
            </p>
          </div>

          {erro && (
            <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl text-sm flex items-center gap-3">
              <AlertCircle size={20} />
              <span className="font-bold text-[16px]">{erro}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
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

            </div>

            {}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <label className="text-sm font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={18} className="text-blue-600" />
                Onde o item está?
              </label>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className={labelClass}>CEP</label>
                  <div className="flex min-w-0 gap-2">
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
                      className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-white transition-all hover:bg-blue-700 disabled:opacity-50"
                    >
                      {buscandoCep ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    </button>
                  </div>
                  {erroCep && <p className="text-red-500 text-xs font-semibold ml-1">{erroCep}</p>}
                  {enderecoDisplay && (
                    <p className="text-emerald-600 text-xs font-semibold ml-1">✓ {enderecoDisplay}</p>
                  )}
                </div>
              </div>
            </div>

            {anuncio && (
              <GerenciadorDeImagens
                imagensExistentes={anuncio.imagens ?? []}
                onSelecaoMudou={aoAtualizarSelecaoDeImagens}
              />
            )}

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
