import React, { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  Megaphone,
  Package,
  PlusCircle,
  Search,
  Sparkles,
  XCircle,
} from "lucide-react";
import { CardAnuncio } from "../../components/anuncios/CardAnuncio";
import { FiltrosAnuncios } from "../../components/anuncios/FiltrosAnuncios";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { useAnuncios } from "../../hooks/useAnuncios";
import { useFavoritos } from "../../hooks/useFavoritos";
import * as anuncioService from "../../services/anuncioService";
import type { BuscaFiltro } from "../../types/busca.types";

type StatusAnuncio =
  | "PENDENTE"
  | "ATIVO"
  | "REPROVADO"
  | "RESERVADO"
  | "CONCLUIDO"
  | "CANCELADO";

interface AnunciosPageBaseProps {
  modo: "publico" | "privado";
}

const extrairFiltrosDaUrl = (searchParams: URLSearchParams): BuscaFiltro => {
  const filtro: BuscaFiltro = {};

  const termo = searchParams.get("termo")?.trim();
  if (termo) filtro.termo = termo;

  const categoriaId = Number(searchParams.get("categoriaId"));
  if (categoriaId && !Number.isNaN(categoriaId)) filtro.categoriaId = categoriaId;

  return filtro;
};

const possuiBuscaAtiva = (filtro: BuscaFiltro) =>
  Boolean(filtro.termo || filtro.categoriaId);

export const AnunciosPageBase: React.FC<AnunciosPageBaseProps> = ({ modo }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const exibindoMeusAnuncios = modo === "privado";
  const termoMeusAnuncios = searchParams.get("termo")?.trim().toLowerCase() ?? "";
  const statusSelecionado = searchParams.get("statusFiltro") ?? "TODOS";
  const { ehFavorito, possuiUsuarioAutenticado, alternarFavorito } = useFavoritos();

  const {
    anuncios,
    loading,
    erro,
    paginacao,
    listar,
    listarMeus,
    buscarComFiltros,
    paginarFiltros,
  } = useAnuncios();

  useEffect(() => {
    const filtroUrl = extrairFiltrosDaUrl(searchParams);

    if (possuiBuscaAtiva(filtroUrl)) {
      buscarComFiltros(filtroUrl);
      return;
    }

    if (exibindoMeusAnuncios) {
      listarMeus();
      return;
    }

    listar();
  }, [buscarComFiltros, exibindoMeusAnuncios, listar, listarMeus, searchParams]);

  const anuncioCriado = searchParams.get("status") === "pendente-criado";
  const anuncioAtualizado = searchParams.get("status") === "atualizado";
  const anuncioExcluido = searchParams.get("status") === "excluido";

  const limparFeedbackUrl = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("status");
    setSearchParams(params, { replace: true });
  };

  const contadores = useMemo(() => {
    const base = {
      pendentes: 0,
      ativos: 0,
      reprovados: 0,
      cancelados: 0,
      concluidos: 0,
      reservados: 0,
    };

    anuncios.forEach((anuncio) => {
      const status = anuncio.status as StatusAnuncio;
      if (status === "PENDENTE") base.pendentes += 1;
      if (status === "ATIVO") base.ativos += 1;
      if (status === "REPROVADO") base.reprovados += 1;
      if (status === "CANCELADO") base.cancelados += 1;
      if (status === "CONCLUIDO") base.concluidos += 1;
      if (status === "RESERVADO") base.reservados += 1;
    });

    return base;
  }, [anuncios]);

  const statusCards = [
    {
      label: "Pendentes",
      value: contadores.pendentes,
      icon: Clock3,
      wrapper: "bg-amber-50 border-amber-100",
      iconBox: "bg-amber-100 text-amber-700",
      text: "text-amber-900",
      subtext: "Aguardando moderação",
    },
    {
      label: "Ativos",
      value: contadores.ativos,
      icon: CheckCircle2,
      wrapper: "bg-emerald-50 border-emerald-100",
      iconBox: "bg-emerald-100 text-emerald-700",
      text: "text-emerald-900",
      subtext: "Já publicados",
    },
    {
      label: "Reservados/Concluídos",
      value: contadores.reservados + contadores.concluidos,
      icon: Package,
      wrapper: "bg-blue-50 border-blue-100",
      iconBox: "bg-blue-100 text-blue-700",
      text: "text-blue-900",
      subtext: "Em andamento ou finalizados",
    },
    {
      label: "Reprovados/Cancelados",
      value: contadores.reprovados + contadores.cancelados,
      icon: XCircle,
      wrapper: "bg-rose-50 border-rose-100",
      iconBox: "bg-rose-100 text-rose-700",
      text: "text-rose-900",
      subtext: "Precisam de atenção",
    },
  ];

  const opcoesStatus = [
    { value: "TODOS", label: "Todos" },
    { value: "PENDENTE", label: "Pendentes" },
    { value: "ATIVO", label: "Ativos" },
    { value: "REPROVADO", label: "Reprovados" },
    { value: "RESERVADO", label: "Reservados" },
    { value: "CONCLUIDO", label: "Concluídos" },
    { value: "CANCELADO", label: "Cancelados" },
  ];

  const anunciosVisiveis = useMemo(() => {
    if (!exibindoMeusAnuncios) return anuncios;

    return anuncios.filter((anuncio) => {
      const combinaStatus =
        statusSelecionado === "TODOS" || anuncio.status === statusSelecionado;
      const combinaTermo =
        !termoMeusAnuncios ||
        anuncio.titulo.toLowerCase().includes(termoMeusAnuncios) ||
        anuncio.descricao.toLowerCase().includes(termoMeusAnuncios);

      return combinaStatus && combinaTermo;
    });
  }, [anuncios, exibindoMeusAnuncios, statusSelecionado, termoMeusAnuncios]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja deletar este anúncio?")) return;

    try {
      await anuncioService.deletarAnuncio(id);
      exibindoMeusAnuncios
        ? listarMeus(paginacao.currentPage)
        : listar(paginacao.currentPage);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao deletar");
    }
  };

  // Chama o motor de busca com todos os filtros selecionados
  const handleFiltrar = (filtro: BuscaFiltro) => {
    if (exibindoMeusAnuncios) return;
    buscarComFiltros(filtro);
  };

  const handleBuscar = (termo: string) => {
    const params = new URLSearchParams(searchParams);
    termo ? params.set("termo", termo) : params.delete("termo");
    setSearchParams(params, { replace: true });
  };

  const handleFiltrarStatus = (novoStatus: string) => {
    const params = new URLSearchParams(searchParams);
    novoStatus === "TODOS"
      ? params.delete("statusFiltro")
      : params.set("statusFiltro", novoStatus);
    setSearchParams(params, { replace: true });
  };

  const limparFiltrosPrivados = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("termo");
    params.delete("statusFiltro");
    setSearchParams(params, { replace: true });
  };

  const handleProxima = () => {
    if (paginacao.currentPage < paginacao.totalPages - 1) {
      paginarFiltros(paginacao.currentPage + 1);
    }
  };

  const handleAnterior = () => {
    if (paginacao.currentPage > 0) {
      paginarFiltros(paginacao.currentPage - 1);
    }
  };

  const handleToggleFavorito = (anuncioId: string) => {
    if (!possuiUsuarioAutenticado) {
      navigate("/login");
      return;
    }

    alternarFavorito(anuncioId);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-plus-jakarta-sans text-left">
      <Header />

      <main
        className={`flex-grow bg-[#f1f5f9] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNlMmU4ZjAiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMCAwaDQwdjE4SDBWMHptMCAyMGg0MHYxOEgwVjIwek0xOSAwaDJ2NDBoLTJWME05IDBoMnY0MEg5VjBteTIwIDBoMnY0MGgtMlYwek0wIDloNDB2MkgwVjl6bTAgMjBoNDB2MkgwVjI5eiIvPjwvZz48L2c+PC9zdmc+')] ${
          exibindoMeusAnuncios ? "py-10 md:py-12" : "py-5 md:py-6"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4">

          {/* HEADER MODO PRIVADO */}
          {exibindoMeusAnuncios && (
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-3 py-1.5 border border-slate-200 text-slate-600 text-sm font-semibold shadow-sm mb-4">
                  <Megaphone size={16} className="text-orange-600" />
                  Painel do anunciante
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Meus Anúncios
                </h1>
                <p className="text-slate-500 mt-2 max-w-2xl leading-relaxed">
                  Acompanhe seus anúncios, veja quais estão em análise e gerencie tudo em um só lugar.
                </p>
              </div>
              <button
                onClick={() => navigate("/create-listing")}
                className="bg-orange-600 hover:bg-orange-700 text-white py-3 px-6 rounded-2xl font-bold transition-all shadow-lg shadow-orange-100 flex items-center justify-center gap-2 active:scale-95"
              >
                <PlusCircle size={20} />
                Novo Anúncio
              </button>
            </div>
          )}

          {/* FEEDBACKS */}
          {exibindoMeusAnuncios && (anuncioCriado || anuncioAtualizado || anuncioExcluido) && (
            <div className="mb-8">
              {anuncioCriado && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-[24px] px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <p className="font-extrabold">Anúncio enviado com sucesso</p>
                      <p className="text-sm text-amber-800 mt-1">Aguardando aprovação da moderação.</p>
                    </div>
                  </div>
                  <button onClick={limparFeedbackUrl} className="self-start sm:self-center text-sm font-bold text-amber-700 hover:text-amber-900 transition-colors">Fechar</button>
                </div>
              )}
              {anuncioAtualizado && (
                <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-[24px] px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <p className="font-extrabold">Anúncio atualizado</p>
                      <p className="text-sm text-blue-800 mt-1">As alterações foram salvas com sucesso.</p>
                    </div>
                  </div>
                  <button onClick={limparFeedbackUrl} className="self-start sm:self-center text-sm font-bold text-blue-700 hover:text-blue-900 transition-colors">Fechar</button>
                </div>
              )}
              {anuncioExcluido && (
                <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-[24px] px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                      <Ban size={18} />
                    </div>
                    <div>
                      <p className="font-extrabold">Anúncio removido</p>
                      <p className="text-sm text-rose-800 mt-1">O anúncio foi excluído da sua conta.</p>
                    </div>
                  </div>
                  <button onClick={limparFeedbackUrl} className="self-start sm:self-center text-sm font-bold text-rose-700 hover:text-rose-900 transition-colors">Fechar</button>
                </div>
              )}
            </div>
          )}

          {/* CARDS DE STATUS */}
          {exibindoMeusAnuncios && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              {statusCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className={`rounded-[24px] border p-5 shadow-sm ${item.wrapper}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-500">{item.label}</p>
                        <p className={`text-3xl font-extrabold mt-2 ${item.text}`}>{item.value}</p>
                        <p className="text-sm text-slate-500 mt-2">{item.subtext}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.iconBox}`}>
                        <Icon size={22} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* BARRA DE BUSCA MODO PRIVADO */}
          {exibindoMeusAnuncios && (
            <div className="mb-8 rounded-[24px] bg-white border border-slate-100 shadow-sm p-4 md:p-5">
              <div className="flex flex-col xl:flex-row xl:items-center gap-4">
                <label className="relative flex-1">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchParams.get("termo") ?? ""}
                    onChange={(e) => handleBuscar(e.target.value)}
                    placeholder="Buscar entre os seus anúncios"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                  />
                </label>
                <button
                  type="button"
                  onClick={limparFiltrosPrivados}
                  className="px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
                >
                  Limpar filtros
                </button>
              </div>
            </div>
          )}

          <div className={`grid grid-cols-1 ${
            exibindoMeusAnuncios
              ? "lg:grid-cols-4 gap-8"
              : "lg:grid-cols-[260px_minmax(0,1fr)] gap-5"
          } items-start`}>

            {/* SIDEBAR */}
            <aside className="lg:col-span-1 lg:sticky lg:top-24">
              <div className={`bg-white rounded-[24px] ${exibindoMeusAnuncios ? "p-6" : "p-5"} shadow-xl shadow-slate-200/50 border border-slate-100`}>
                {exibindoMeusAnuncios ? (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                        <Filter size={18} className="text-blue-600" />
                        Gestão rápida
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Filtre seus anúncios por status.
                      </p>
                    </div>
                    <div className="space-y-2">
                      {opcoesStatus.map((opcao) => {
                        const ativo = statusSelecionado === opcao.value;
                        return (
                          <button
                            key={opcao.value}
                            type="button"
                            onClick={() => handleFiltrarStatus(opcao.value)}
                            className={`w-full rounded-2xl px-4 py-3 text-sm font-bold text-left transition-all border ${
                              ativo
                                ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
                                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            {opcao.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <h2 className="text-lg font-extrabold text-slate-900">Filtros</h2>
                      <p className="text-sm text-slate-500 mt-1">Encontre rapidamente um anúncio específico.</p>
                    </div>
                    <FiltrosAnuncios
                      onFiltrar={handleFiltrar}
                      onLimpar={() => {
                        setSearchParams({}, { replace: true });
                        listar();
                      }}
                    />
                  </>
                )}
              </div>
            </aside>

            {/* CONTEÚDO PRINCIPAL */}
            <div className={`${exibindoMeusAnuncios ? "lg:col-span-3 space-y-6" : "space-y-4"}`}>
              {loading && (
                <div className="bg-white rounded-[32px] p-16 shadow-md border border-slate-100 flex flex-col items-center justify-center text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4" />
                  <p className="text-slate-700 font-bold">
                    {exibindoMeusAnuncios ? "Carregando seus anúncios..." : "Buscando anúncios..."}
                  </p>
                  <p className="text-slate-500 text-sm mt-2">Só um instante...</p>
                </div>
              )}

              {erro && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-[24px] flex items-start gap-3 text-red-700 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <AlertCircle size={18} />
                  </div>
                  <div>
                    <p className="font-extrabold">Erro ao carregar anúncios</p>
                    <p className="text-sm mt-1">{erro}</p>
                  </div>
                </div>
              )}

              {!loading && !erro && anunciosVisiveis.length === 0 && (
                <div className="bg-white rounded-[32px] p-16 shadow-md border border-slate-100 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                    <Package size={40} />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-800">
                    {exibindoMeusAnuncios ? "Você ainda não criou nenhum anúncio" : "Nenhum anúncio encontrado"}
                  </h3>
                  <p className="text-slate-500 mt-2 max-w-md leading-relaxed">
                    {exibindoMeusAnuncios
                      ? "Quando você cadastrar um item, ele aparecerá aqui."
                      : "Tente ajustar os filtros ou limpar a busca."}
                  </p>
                  {exibindoMeusAnuncios && (
                    <button
                      onClick={() => navigate("/create-listing")}
                      className="mt-6 bg-orange-600 hover:bg-orange-700 text-white py-3 px-6 rounded-2xl font-bold transition-all shadow-lg shadow-orange-100 flex items-center justify-center gap-2 active:scale-95"
                    >
                      <PlusCircle size={18} />
                      Criar meu primeiro anúncio
                    </button>
                  )}
                </div>
              )}

              {!loading && anunciosVisiveis.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-[20px] px-5 py-3 shadow-sm">
                  <p className="text-sm text-slate-500">
                    Exibindo{" "}
                    <span className="font-extrabold text-slate-800">{anunciosVisiveis.length}</span>{" "}
                    anúncio{anunciosVisiveis.length > 1 ? "s" : ""} nesta página.
                  </p>
                </div>
              )}

              <div className={
                exibindoMeusAnuncios
                  ? "grid grid-cols-1 gap-4"
                  : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
              }>
                {anunciosVisiveis.map((anuncio) => (
                  <div
                    key={anuncio.id}
                    className={exibindoMeusAnuncios ? "transition-all hover:translate-x-1" : "h-full"}
                  >
                    <CardAnuncio
                      anuncio={anuncio}
                      onDelete={exibindoMeusAnuncios ? handleDelete : undefined}
                      variant={exibindoMeusAnuncios ? "list" : "grid"}
                      isFavorito={ehFavorito(anuncio.id)}
                      onToggleFavorito={handleToggleFavorito}
                    />
                  </div>
                ))}
              </div>

              {!loading && paginacao.totalPages > 1 && (
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mt-8">
                  <button
                    onClick={handleAnterior}
                    disabled={paginacao.currentPage === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all"
                  >
                    <ChevronLeft size={20} />
                    Anterior
                  </button>
                  <p className="text-sm font-bold text-slate-400 hidden sm:block">
                    Página <span className="text-blue-600">{paginacao.currentPage + 1}</span> de {paginacao.totalPages}
                  </p>
                  <button
                    onClick={handleProxima}
                    disabled={paginacao.currentPage >= paginacao.totalPages - 1}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-blue-600 hover:bg-blue-50 disabled:opacity-30 transition-all"
                  >
                    Próxima
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
