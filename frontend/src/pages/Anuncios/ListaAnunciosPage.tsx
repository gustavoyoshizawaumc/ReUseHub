import React, { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CardAnuncio } from "../../components/anuncios/CardAnuncio";
import { FiltrosAnuncios } from "../../components/anuncios/FiltrosAnuncios";
import { BuscaAnuncios } from "../../components/anuncios/BuscaAnuncios";
import { useAnuncios } from "../../hooks/useAnuncios";
import * as anuncioService from "../../services/anuncioService";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import {
  PlusCircle,
  Package,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CheckCircle2,
  XCircle,
  Ban,
  Megaphone,
  Sparkles,
} from "lucide-react";

type StatusAnuncio =
  | "PENDENTE"
  | "ATIVO"
  | "REPROVADO"
  | "RESERVADO"
  | "CONCLUIDO"
  | "CANCELADO";

export const ListaAnunciosPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    anuncios,
    loading,
    erro,
    paginacao,
    listar,
    buscar,
    filtrarCategoria,
    filtrarTipo,
  } = useAnuncios();

  useEffect(() => {
    listar();
  }, [listar]);

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
      total: anuncios.length,
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

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja deletar este anúncio?")) {
      try {
        await anuncioService.deletarAnuncio(id);
        listar(paginacao.currentPage);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Erro ao deletar");
      }
    }
  };

  const handleProxima = () => {
    if (paginacao.currentPage < paginacao.totalPages - 1) {
      listar(paginacao.currentPage + 1);
    }
  };

  const handleAnterior = () => {
    if (paginacao.currentPage > 0) {
      listar(paginacao.currentPage - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-plus-jakarta-sans text-left">
      <Header />

      <main className="flex-grow bg-[#f1f5f9] py-7 md:py-12">
        <div className="mx-auto max-w-6xl px-3 sm:px-4">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-3 py-1.5 border border-slate-200 text-slate-600 text-sm font-semibold shadow-sm mb-4">
                <Megaphone size={16} className="text-orange-600" />
                Painel do anunciante
              </div>

              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                Meus Anúncios
              </h1>

              <p className="text-slate-500 mt-2 max-w-2xl leading-relaxed">
                Acompanhe seus anúncios, veja quais estão em análise e gerencie
                tudo em um só lugar.
              </p>
            </div>

            <button
              onClick={() => navigate("/create-listing")}
              className="bg-orange-600 hover:bg-orange-700 text-white py-3 px-6 rounded-lg font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
            >
              <PlusCircle size={20} />
              Novo Anúncio
            </button>
          </div>

          {(anuncioCriado || anuncioAtualizado || anuncioExcluido) && (
            <div className="mb-8">
              {anuncioCriado && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <p className="font-extrabold">
                        Anúncio enviado com sucesso
                      </p>
                      <p className="text-sm text-amber-800 mt-1">
                        Seu anúncio foi criado e está aguardando aprovação da
                        moderação antes de aparecer publicamente.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={limparFeedbackUrl}
                    className="self-start sm:self-center text-sm font-bold text-amber-700 hover:text-amber-900 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              )}

              {anuncioAtualizado && (
                <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-lg px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <p className="font-extrabold">Anúncio atualizado</p>
                      <p className="text-sm text-blue-800 mt-1">
                        As alterações foram salvas com sucesso.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={limparFeedbackUrl}
                    className="self-start sm:self-center text-sm font-bold text-blue-700 hover:text-blue-900 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              )}

              {anuncioExcluido && (
                <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-lg px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                      <Ban size={18} />
                    </div>
                    <div>
                      <p className="font-extrabold">Anúncio removido</p>
                      <p className="text-sm text-rose-800 mt-1">
                        O anúncio foi excluído da sua conta.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={limparFeedbackUrl}
                    className="self-start sm:self-center text-sm font-bold text-rose-700 hover:text-rose-900 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            {statusCards.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className={`rounded-lg border p-5 shadow-sm ${item.wrapper}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-500">
                        {item.label}
                      </p>
                      <p className={`text-3xl font-extrabold mt-2 ${item.text}`}>
                        {item.value}
                      </p>
                      <p className="text-sm text-slate-500 mt-2">
                        {item.subtext}
                      </p>
                    </div>

                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${item.iconBox}`}
                    >
                      <Icon size={22} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mb-8">
            <BuscaAnuncios onBuscar={buscar} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            <aside className="lg:col-span-1 lg:sticky lg:top-24">
              <div className="bg-white rounded-lg p-6 shadow-sm shadow-slate-200/50 border border-slate-100">
                <div className="mb-4">
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Filtros
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Encontre rapidamente um anúncio específico.
                  </p>
                </div>

                <FiltrosAnuncios
                  onFiltrarTipo={filtrarTipo}
                  onFiltrarCategoria={filtrarCategoria}
                  onLimpar={listar}
                />
              </div>
            </aside>

            <div className="lg:col-span-3 space-y-6">
              {loading && (
                <div className="flex flex-col items-center justify-center rounded-lg border border-slate-100 bg-white p-8 text-center shadow-md sm:p-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-slate-700 font-bold">
                    Carregando seus anúncios...
                  </p>
                  <p className="text-slate-500 text-sm mt-2">
                    Só um instante enquanto buscamos suas publicações.
                  </p>
                </div>
              )}

              {erro && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-3 text-red-700 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <AlertCircle size={18} />
                  </div>
                  <div>
                    <p className="font-extrabold">Erro ao carregar anúncios</p>
                    <p className="text-sm mt-1">{erro}</p>
                  </div>
                </div>
              )}

              {!loading && !erro && anuncios.length === 0 && (
                <div className="flex flex-col items-center rounded-lg border border-slate-100 bg-white p-8 text-center shadow-md sm:p-16">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                    <Package size={40} />
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-800">
                    Você ainda não criou nenhum anúncio
                  </h3>

                  <p className="text-slate-500 mt-2 max-w-md leading-relaxed">
                    Quando você cadastrar um item, ele aparecerá aqui com o
                    status correspondente, como pendente, ativo ou concluído.
                  </p>

                  <button
                    onClick={() => navigate("/create-listing")}
                    className="mt-6 bg-orange-600 hover:bg-orange-700 text-white py-3 px-6 rounded-lg font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
                  >
                    <PlusCircle size={18} />
                    Criar meu primeiro anúncio
                  </button>
                </div>
              )}

              {!loading && anuncios.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-lg px-5 py-4 shadow-sm">
                  <p className="text-sm text-slate-500">
                    Exibindo{" "}
                    <span className="font-extrabold text-slate-800">
                      {anuncios.length}
                    </span>{" "}
                    anúncio{anuncios.length > 1 ? "s" : ""} nesta página.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {anuncios.map((anuncio) => (
                  <div
                    key={anuncio.id}
                    className="transition-all md:hover:translate-x-1"
                  >
                    <CardAnuncio anuncio={anuncio} onDelete={handleDelete} />
                  </div>
                ))}
              </div>

              {!loading && paginacao.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white p-3 shadow-sm sm:p-4">
                  <button
                    onClick={handleAnterior}
                    disabled={paginacao.currentPage === 0}
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent sm:gap-2 sm:px-4"
                  >
                    <ChevronLeft size={20} />
                    Anterior
                  </button>

                  <div className="hidden sm:block">
                    <p className="text-sm font-bold text-slate-400">
                      Página{" "}
                      <span className="text-blue-600">
                        {paginacao.currentPage + 1}
                      </span>{" "}
                      de {paginacao.totalPages}
                    </p>
                  </div>

                  <button
                    onClick={handleProxima}
                    disabled={paginacao.currentPage >= paginacao.totalPages - 1}
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold text-blue-600 transition-all hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent sm:gap-2 sm:px-4"
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
