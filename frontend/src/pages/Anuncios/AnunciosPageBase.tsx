import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
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
import { useFeedback } from "../../components/feedback/feedbackContext";
import { useAnuncios } from "../../hooks/useAnuncios";
import { useFavoritos } from "../../hooks/useFavoritos";
import * as anuncioService from "../../services/anuncioService";
import type { BuscaFiltro } from "../../types/busca.types";
import {
  EVENTO_FILTRO_LOCALIZACAO,
  obterBuscaLocalizacaoSessao,
} from "../../utils/filtroLocalizacao";

type StatusAnuncio =
  | "PENDENTE"
  | "ATIVO"
  | "REPROVADO"
  | "SUSPENSO"
  | "CONCLUIDO"
  | "CANCELADO";

interface AnunciosPageBaseProps {
  modo: "publico" | "privado";
}

// Em "Meus Anuncios" carregamos todos os anuncios do usuario de uma vez e
// filtramos/paginamos no client (escala pequena). LIMITE e o teto de itens
// buscados - alto o suficiente para qualquer usuario real; em escala maior o
// ideal seria filtrar/paginar no backend e ter um endpoint de COUNT.
const LIMITE_MEUS_ANUNCIOS = 2000;
const TAMANHO_PAGINA_MEUS_ANUNCIOS = 10;

const extrairFiltrosDaUrl = (searchParams: URLSearchParams): BuscaFiltro => {
  const filtro: BuscaFiltro = {};

  const termo = searchParams.get("termo")?.trim();
  if (termo) filtro.termo = termo;

  const categoriaId = Number(searchParams.get("categoriaId"));
  if (categoriaId && !Number.isNaN(categoriaId)) filtro.categoriaId = categoriaId;

  const ordenacao = searchParams.get("ordenacao");
  if (ordenacao === "RELEVANCIA" || ordenacao === "DISTANCIA" || ordenacao === "RECENTES" || ordenacao === "POPULARES") {
    filtro.ordenacao = ordenacao;
  }

  return filtro;
};

const possuiBuscaAtiva = (filtro: BuscaFiltro) =>
  Boolean(filtro.termo || filtro.categoriaId || filtro.cep || filtro.latitude || filtro.longitude || filtro.ordenacao);

export const AnunciosPageBase: React.FC<AnunciosPageBaseProps> = ({ modo }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtroLocalizacaoBusca, setFiltroLocalizacaoBusca] = useState<BuscaFiltro>(() => obterBuscaLocalizacaoSessao());
  const scrollPreservadoRef = useRef<number | null>(null);
  const [filtrosMoveisAbertos, setFiltrosMoveisAbertos] = useState(false);
  const exibindoMeusAnuncios = modo === "privado";
  const termoMeusAnuncios = searchParams.get("termo")?.trim().toLowerCase() ?? "";
  const statusSelecionado = searchParams.get("statusFiltro") ?? "TODOS";
  const { ehFavorito, possuiUsuarioAutenticado, alternarFavorito } = useFavoritos();
  const { notify, confirm } = useFeedback();

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

  const filtroPublicoAtual = useMemo(
    () => ({
      ...extrairFiltrosDaUrl(searchParams),
      ...filtroLocalizacaoBusca,
    }),
    [filtroLocalizacaoBusca, searchParams]
  );

  useEffect(() => {
    const atualizarFiltroLocalizacao = () => {
      setFiltroLocalizacaoBusca(obterBuscaLocalizacaoSessao());
    };

    window.addEventListener(EVENTO_FILTRO_LOCALIZACAO, atualizarFiltroLocalizacao);
    window.addEventListener("storage", atualizarFiltroLocalizacao);

    return () => {
      window.removeEventListener(EVENTO_FILTRO_LOCALIZACAO, atualizarFiltroLocalizacao);
      window.removeEventListener("storage", atualizarFiltroLocalizacao);
    };
  }, []);

  // Modo publico: busca/lista reagindo aos filtros da URL.
  // O modo privado tem carregamento proprio (efeito abaixo), pois termo e status
  // sao filtrados no client e nao devem cair na busca publica /filtrar.
  useEffect(() => {
    if (exibindoMeusAnuncios) return;

    if (possuiBuscaAtiva(filtroPublicoAtual)) {
      buscarComFiltros(filtroPublicoAtual);
      return;
    }

    listar();
  }, [buscarComFiltros, exibindoMeusAnuncios, filtroPublicoAtual, listar]);

  // Modo privado: carrega TODOS os anuncios do usuario de uma vez (sem paginar
  // no servidor) para servir de fonte unica de contadores, filtro de status,
  // busca por texto e paginacao - tudo resolvido no client. `gatilhoMeusAnuncios`
  // permite recarregar sob demanda (apos excluir ou ao voltar o foco) sem reagir
  // a cada tecla da busca/filtro.
  const [gatilhoMeusAnuncios, setGatilhoMeusAnuncios] = useState(0);
  const [paginaMeusAnuncios, setPaginaMeusAnuncios] = useState(0);
  const recarregarMeusAnuncios = useCallback(
    () => setGatilhoMeusAnuncios((valor) => valor + 1),
    []
  );

  useEffect(() => {
    if (!exibindoMeusAnuncios) return;
    listarMeus(0, LIMITE_MEUS_ANUNCIOS);
  }, [exibindoMeusAnuncios, gatilhoMeusAnuncios, listarMeus]);

  // Reatividade ao vivo: ao voltar o foco para a aba, recarrega a lista. Cobre o
  // caso de a moderacao aprovar/reprovar/suspender enquanto a pagina esta aberta
  // - contadores e lista se ajustam sozinhos.
  useEffect(() => {
    if (!exibindoMeusAnuncios) return;

    const aoVoltarFoco = () => {
      if (document.visibilityState === "visible") recarregarMeusAnuncios();
    };

    window.addEventListener("focus", aoVoltarFoco);
    document.addEventListener("visibilitychange", aoVoltarFoco);

    return () => {
      window.removeEventListener("focus", aoVoltarFoco);
      document.removeEventListener("visibilitychange", aoVoltarFoco);
    };
  }, [exibindoMeusAnuncios, recarregarMeusAnuncios]);

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
      suspensos: 0,
      cancelados: 0,
      concluidos: 0,
    };

    anuncios.forEach((anuncio) => {
      const status = anuncio.status as StatusAnuncio;
      if (status === "PENDENTE") base.pendentes += 1;
      if (status === "ATIVO") base.ativos += 1;
      if (status === "REPROVADO") base.reprovados += 1;
      if (status === "SUSPENSO") base.suspensos += 1;
      if (status === "CANCELADO") base.cancelados += 1;
      if (status === "CONCLUIDO") base.concluidos += 1;
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
      label: "Concluídos",
      value: contadores.concluidos,
      icon: Package,
      wrapper: "bg-blue-50 border-blue-100",
      iconBox: "bg-blue-100 text-blue-700",
      text: "text-blue-900",
      subtext: "Negócios finalizados",
    },
    {
      label: "Suspensos/Reprovados",
      value: contadores.suspensos + contadores.reprovados + contadores.cancelados,
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
    { value: "SUSPENSO", label: "Suspensos" },
    { value: "REPROVADO", label: "Reprovados" },
    { value: "CONCLUIDO", label: "Concluídos" },
    { value: "CANCELADO", label: "Cancelados" },
  ];

  // Modo privado: filtra a lista COMPLETA por status + termo (client-side).
  // Antes o filtro/busca so atuava sobre os 10 da pagina; agora cobre tudo.
  const anunciosPrivadosFiltrados = useMemo(() => {
    return anuncios.filter((anuncio) => {
      const combinaStatus =
        statusSelecionado === "TODOS" || anuncio.status === statusSelecionado;
      const combinaTermo =
        !termoMeusAnuncios ||
        anuncio.titulo.toLowerCase().includes(termoMeusAnuncios) ||
        anuncio.descricao.toLowerCase().includes(termoMeusAnuncios);

      return combinaStatus && combinaTermo;
    });
  }, [anuncios, statusSelecionado, termoMeusAnuncios]);

  // Paginacao client-side do modo privado sobre a lista ja filtrada.
  const totalPaginasMeusAnuncios = Math.max(
    1,
    Math.ceil(anunciosPrivadosFiltrados.length / TAMANHO_PAGINA_MEUS_ANUNCIOS)
  );

  // Pagina segura: evita pagina vazia quando o filtro encolhe a lista (ex.: apos
  // excluir ou ao trocar para um status com menos itens).
  const paginaMeusAnunciosSegura = Math.min(
    paginaMeusAnuncios,
    totalPaginasMeusAnuncios - 1
  );

  const inicioPaginaMeusAnuncios = paginaMeusAnunciosSegura * TAMANHO_PAGINA_MEUS_ANUNCIOS;
  const anunciosVisiveis = exibindoMeusAnuncios
    ? anunciosPrivadosFiltrados.slice(
        inicioPaginaMeusAnuncios,
        inicioPaginaMeusAnuncios + TAMANHO_PAGINA_MEUS_ANUNCIOS
      )
    : anuncios;

  // Distingue "ainda nao tem anuncios" de "o filtro nao retornou nada", para o
  // estado vazio mostrar a mensagem certa (e o botao de criar so no 1o caso).
  const semAnunciosCadastrados = exibindoMeusAnuncios && anuncios.length === 0;
  const filtroPrivadoSemResultados =
    exibindoMeusAnuncios && anuncios.length > 0 && anunciosVisiveis.length === 0;

  const tituloEstadoVazio = filtroPrivadoSemResultados
    ? "Nenhum anúncio para este filtro"
    : exibindoMeusAnuncios
      ? "Você ainda não criou nenhum anúncio"
      : "Nenhum anúncio encontrado";
  const descricaoEstadoVazio = filtroPrivadoSemResultados
    ? "Tente outro status ou limpe a busca."
    : exibindoMeusAnuncios
      ? "Quando você cadastrar um item, ele aparecerá aqui."
      : "Tente ajustar os filtros ou limpar a busca.";

  const handleDelete = async (id: string) => {
    const confirmado = await confirm({
      variant: "warning",
      title: "Excluir anuncio?",
      message: "Esta acao remove o anuncio da sua conta.",
      confirmLabel: "Excluir",
      cancelLabel: "Cancelar",
    });

    if (!confirmado) return;

    try {
      await anuncioService.deletarAnuncio(id);
      if (exibindoMeusAnuncios) {
        recarregarMeusAnuncios();
      } else {
        listar(paginacao.currentPage);
      }
    } catch (err) {
      notify({
        variant: "error",
        title: "Erro ao excluir anuncio",
        message: err instanceof Error ? err.message : "Tente novamente em alguns instantes.",
      });
    }
  };

  const preservarScroll = () => {
    scrollPreservadoRef.current = window.scrollY;
  };

  const restaurarScrollPreservado = () => {
    const scrollY = scrollPreservadoRef.current;
    if (scrollY === null) return;

    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY, behavior: "auto" });
      scrollPreservadoRef.current = null;
    });
  };

  // Chama o motor de busca com todos os filtros selecionados.
  // Mescla a busca ativa da URL (termo/categoria) com os filtros da sidebar,
  // para que aplicar uma ordenacao nao descarte o termo pesquisado.
  const handleFiltrar = async (filtro: BuscaFiltro) => {
    if (exibindoMeusAnuncios) return;
    preservarScroll();
    await buscarComFiltros({
      ...extrairFiltrosDaUrl(searchParams),
      ...filtro,
      ...obterBuscaLocalizacaoSessao(),
    });
    restaurarScrollPreservado();
  };

  const handleBuscar = (termo: string) => {
    const params = new URLSearchParams(searchParams);
    if (termo) {
      params.set("termo", termo);
    } else {
      params.delete("termo");
    }
    setSearchParams(params, { replace: true });
    setPaginaMeusAnuncios(0);
  };

  const handleFiltrarStatus = (novoStatus: string) => {
    const params = new URLSearchParams(searchParams);
    if (novoStatus === "TODOS") {
      params.delete("statusFiltro");
    } else {
      params.set("statusFiltro", novoStatus);
    }
    setSearchParams(params, { replace: true });
    setPaginaMeusAnuncios(0);
  };

  const limparFiltrosPrivados = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("termo");
    params.delete("statusFiltro");
    setSearchParams(params, { replace: true });
    setPaginaMeusAnuncios(0);
  };

  // Paginacao do modo publico (no servidor): busca ativa -> paginarFiltros;
  // caso contrario, lista padrao. O modo privado pagina no client (estado local).
  const paginarPaginaPublica = (page: number) => {
    if (possuiBuscaAtiva(filtroPublicoAtual)) {
      paginarFiltros(page);
    } else {
      listar(page);
    }
  };

  const handleProxima = () => {
    if (exibindoMeusAnuncios) {
      setPaginaMeusAnuncios((pagina) =>
        Math.min(pagina + 1, totalPaginasMeusAnuncios - 1)
      );
      return;
    }
    if (paginacao.currentPage < paginacao.totalPages - 1) {
      paginarPaginaPublica(paginacao.currentPage + 1);
    }
  };

  const handleAnterior = () => {
    if (exibindoMeusAnuncios) {
      setPaginaMeusAnuncios((pagina) => Math.max(pagina - 1, 0));
      return;
    }
    if (paginacao.currentPage > 0) {
      paginarPaginaPublica(paginacao.currentPage - 1);
    }
  };

  // Valores de paginacao exibidos no rodape: client-side no privado, servidor no publico.
  const paginaAtualExibida = exibindoMeusAnuncios
    ? paginaMeusAnunciosSegura
    : paginacao.currentPage;
  const totalPaginasExibidas = exibindoMeusAnuncios
    ? totalPaginasMeusAnuncios
    : paginacao.totalPages;

  const handleToggleFavorito = async (anuncioId: string) => {
    if (!possuiUsuarioAutenticado) {
      navigate("/login");
      return;
    }

    try {
      await alternarFavorito(anuncioId);
    } catch (error) {
      notify({
        variant: "error",
        title: "Nao foi possivel atualizar os favoritos",
        message: error instanceof Error ? error.message : "Tente novamente em alguns instantes.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-plus-jakarta-sans text-left">
      <Header />

      <main
        className={`flex-grow ${
          exibindoMeusAnuncios
            ? "bg-[#f1f5f9] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNlMmU4ZjAiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMCAwaDQwdjE4SDBWMHptMCAyMGg0MHYxOEgwVjIwek0xOSAwaDJ2NDBoLTJWME05IDBoMnY0MEg5VjBteTIwIDBoMnY0MGgtMlYwek0wIDloNDB2MkgwVjl6bTAgMjBoNDB2MkgwVjI5eiIvPjwvZz48L2c+PC9zdmc+')] py-10 md:py-12"
            : "bg-[#f8fafc] py-6 md:py-8"
        }`}
      >
        <div className={`${exibindoMeusAnuncios ? "max-w-6xl" : "max-w-[1480px]"} mx-auto px-4 sm:px-6`}>

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
                      <p className="text-sm text-blue-800 mt-1">As alterações foram salvas. O anúncio aguarda uma nova aprovação da moderação.</p>
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
            <div className="mb-5 grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
              {statusCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className={`rounded-lg border p-3 shadow-sm sm:p-4 ${item.wrapper}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold leading-tight text-slate-500 sm:text-xs">{item.label}</p>
                        <p className={`mt-1 text-2xl font-extrabold leading-none ${item.text}`}>{item.value}</p>
                        <p className="mt-1.5 hidden text-xs text-slate-500 lg:block">{item.subtext}</p>
                      </div>
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${item.iconBox}`}>
                        <Icon size={17} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* BARRA DE BUSCA MODO PRIVADO */}
          {exibindoMeusAnuncios && (
            <div className="mb-5 rounded-lg border border-slate-100 bg-white p-3 shadow-sm sm:p-4">
              <div className="flex items-center gap-2">
                <label className="relative flex-1">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchParams.get("termo") ?? ""}
                    onChange={(e) => handleBuscar(e.target.value)}
                    placeholder="Buscar entre os seus anúncios"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </label>
                <button
                  type="button"
                  onClick={limparFiltrosPrivados}
                  title="Limpar filtros"
                  className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-500 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                >
                  <XCircle size={17} />
                  <span className="hidden sm:inline">Limpar</span>
                </button>
              </div>
              <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
                {opcoesStatus.map((opcao) => {
                  const ativo = statusSelecionado === opcao.value;
                  return (
                    <button
                      key={opcao.value}
                      type="button"
                      onClick={() => handleFiltrarStatus(opcao.value)}
                      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                        ativo
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {opcao.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!exibindoMeusAnuncios && (
            <button
              type="button"
              onClick={() => setFiltrosMoveisAbertos((abertos) => !abertos)}
              className="mb-4 flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm lg:hidden"
            >
              <span className="flex items-center gap-2">
                <Filter size={17} className="text-blue-600" />
                Filtros da busca
              </span>
              {filtrosMoveisAbertos ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          )}

          <div className={`grid grid-cols-1 ${
            exibindoMeusAnuncios
              ? ""
              : "lg:grid-cols-[300px_minmax(0,1fr)] gap-6 xl:gap-8"
          } items-start`}>

            {/* SIDEBAR */}
            {!exibindoMeusAnuncios && (
              <aside className={`${!filtrosMoveisAbertos ? "hidden lg:block" : ""} lg:sticky lg:top-24`}>
                <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
                  <>
                    <div className="mb-5 border-b border-slate-100 pb-5">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">Busca</p>
                      <h2 className="mt-2 text-xl font-black text-slate-950">Filtros</h2>
                      <p className="mt-1 text-sm font-medium leading-relaxed text-slate-500">Refine os anúncios sem perder o contexto da busca.</p>
                    </div>
                    <FiltrosAnuncios
                      onFiltrar={async (filtro) => {
                        await handleFiltrar(filtro);
                        setFiltrosMoveisAbertos(false);
                      }}
                      onLimpar={async () => {
                        preservarScroll();
                        setSearchParams({}, { replace: true });
                        await listar();
                        restaurarScrollPreservado();
                        setFiltrosMoveisAbertos(false);
                      }}
                    />
                  </>
                </div>
              </aside>
            )}

            {/* CONTEUDO PRINCIPAL */}
            <div className="min-h-[420px] space-y-4 sm:min-h-[720px]">
              {loading && (
                <div className="flex flex-col items-center justify-center rounded-md border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-200/70 sm:p-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4" />
                  <p className="text-slate-700 font-bold">
                    {exibindoMeusAnuncios ? "Carregando seus anúncios..." : "Buscando anúncios..."}
                  </p>
                  <p className="text-slate-500 text-sm mt-2">Só um instante...</p>
                </div>
              )}

              {erro && (
                <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-red-100 text-red-600">
                    <AlertCircle size={18} />
                  </div>
                  <div>
                    <p className="font-extrabold">Erro ao carregar anúncios</p>
                    <p className="text-sm mt-1">{erro}</p>
                  </div>
                </div>
              )}

              {!loading && !erro && anunciosVisiveis.length === 0 && (
                <div className="flex flex-col items-center rounded-md border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-200/70 sm:p-16">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-md bg-slate-50 text-slate-300">
                    <Package size={40} />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-800">
                    {tituloEstadoVazio}
                  </h3>
                  <p className="text-slate-500 mt-2 max-w-md leading-relaxed">
                    {descricaoEstadoVazio}
                  </p>
                  {semAnunciosCadastrados && (
                    <button
                      onClick={() => navigate("/create-listing")}
                      className="mt-6 flex items-center justify-center gap-2 rounded-md bg-orange-600 px-6 py-3 font-bold text-white shadow-sm transition-colors hover:bg-orange-700 active:scale-[0.99]"
                    >
                      <PlusCircle size={18} />
                      Criar meu primeiro anúncio
                    </button>
                  )}
                </div>
              )}

              {!loading && anunciosVisiveis.length > 0 && (
                <div className="rounded-md border border-slate-200 bg-white px-5 py-4 shadow-sm shadow-slate-200/60">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">
                        Resultados
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        Exibindo{" "}
                        <span className="font-black text-slate-950">{anunciosVisiveis.length}</span>{" "}
                        anúncio{anunciosVisiveis.length > 1 ? "s" : ""} nesta página.
                      </p>
                    </div>
                    <p className="text-xs font-bold text-slate-400">
                      {possuiBuscaAtiva(filtroPublicoAtual) ? "Filtros aplicados" : "Listagem geral"}
                    </p>
                  </div>
                </div>
              )}

              <div className={
                exibindoMeusAnuncios
                  ? "grid grid-cols-1 gap-4"
                  : "grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3"
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
                      origem={exibindoMeusAnuncios ? undefined : "BUSCA_RESULTADO"}
                    />
                  </div>
                ))}
              </div>

              {!loading && totalPaginasExibidas > 1 && (
                <div className="mt-8 flex items-center justify-between rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                  <button
                    onClick={handleAnterior}
                    disabled={paginaAtualExibida === 0}
                    className="flex items-center gap-2 rounded-md px-4 py-2 font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-30"
                  >
                    <ChevronLeft size={20} />
                    Anterior
                  </button>
                  <p className="text-sm font-bold text-slate-400 hidden sm:block">
                    Página <span className="text-blue-600">{paginaAtualExibida + 1}</span> de {totalPaginasExibidas}
                  </p>
                  <button
                    onClick={handleProxima}
                    disabled={paginaAtualExibida >= totalPaginasExibidas - 1}
                    className="flex items-center gap-2 rounded-md px-4 py-2 font-bold text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-30"
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
