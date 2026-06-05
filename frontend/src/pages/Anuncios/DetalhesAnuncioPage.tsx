import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import * as anuncioService from "../../services/anuncioService";
import { iniciarConversa } from "../../services/chatService";
import type { Anuncio } from "../../types/anuncio.types";
import type { OrigemVisualizacao } from "../../services/visualizacaoService";
import { useRegistrarVisualizacao } from "../../hooks/useRegistrarVisualizacao";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { InteresseModal } from "../../components/interesse/InteresseModal";
import { AvaliacaoModal } from "../../components/avaliacao/AvaliacaoModal";
import { DenunciaAnuncioModal } from "../../components/denuncia/DenunciaAnuncioModal";
import { useFavoritos } from "../../hooks/useFavoritos";
import {
  ArrowLeft,
  Calendar,
  Tag,
  Eye,
  Star,
  User,
  Edit3,
  MessageCircle,
  Heart,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Info,
  ShieldAlert,
  FileText,
} from "lucide-react";

import { API_BASE_URL } from "../../config/api";

const BASE_URL = API_BASE_URL;

export const DetalhesAnuncioPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Quem chega via card preenche state.origem (CARD_HOME, BUSCA_RESULTADO,
  // FAVORITO, etc). Sem state = entrada direta (URL, refresh, bookmark, link
  // compartilhado): cai no LINK_DIRETO.
  const origemVisualizacao: OrigemVisualizacao =
    (location.state as { origem?: OrigemVisualizacao } | null)?.origem ?? "LINK_DIRETO";

  useRegistrarVisualizacao(id, origemVisualizacao);

  const [anuncio, setAnuncio] = useState<Anuncio | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [usuarioAtual, setUsuarioAtual] = useState<{ id: string; nome: string } | null>(null);
  const [imagemAtual, setImagemAtual] = useState(0);
  const [modalInteresseAberto, setModalInteresseAberto] = useState(false);
  const [modalAvaliacaoAberto, setModalAvaliacaoAberto] = useState(false);
  const [modalDenunciaAberto, setModalDenunciaAberto] = useState(false);
  const [iniciandoChat, setIniciandoChat] = useState(false);
  const { ehFavorito, alternarFavorito, possuiUsuarioAutenticado } = useFavoritos();



  useEffect(() => {
    const carregarDados = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const response = await fetch(`${BASE_URL}/api/auth/minha-conta`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const usuario = await response.json();
            setUsuarioAtual({ id: usuario.id, nome: usuario.name || usuario.nome });
          }
        }

        if (id) {
          const dados = await anuncioService.obterAnuncio(id);
          setAnuncio(dados);
        }
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Erro ao carregar anúncio");
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [id]);

  const isEDono = useMemo(
    () => Boolean(usuarioAtual && anuncio && usuarioAtual.id === anuncio.usuarioId),
    [usuarioAtual, anuncio]
  );

  const getCondicaoColor = (condicao: string) => {
    switch (condicao) {
      case "NOVO": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "BOM": return "bg-blue-50 text-blue-700 border-blue-100";
      case "REGULAR": return "bg-amber-50 text-amber-700 border-amber-100";
      case "RUIM": return "bg-red-50 text-red-700 border-red-100";
      default: return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  const imagemUrl = (url: string) =>
    url.startsWith("http") ? url : `${BASE_URL}${url}`;

  const irParaAnterior = () =>
    setImagemAtual((prev) => (prev === 0 ? imagens.length - 1 : prev - 1));

  const irParaProxima = () =>
    setImagemAtual((prev) => (prev === imagens.length - 1 ? 0 : prev + 1));

  const exigirLogin = () => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return false;
    }

    return true;
  };

  const handleAbrirInteresse = () => {
    if (!exigirLogin()) return;
    setModalInteresseAberto(true);
  };

  const handleFalarComAnunciante = async () => {
    if (!anuncio || !exigirLogin()) return;

    try {
      setIniciandoChat(true);
      const conversa = await iniciarConversa({
        anuncioId: anuncio.id,
        destinatarioId: anuncio.usuarioId,
      });

      navigate("/chat", {
        state: {
          conversaId: conversa.id,
          destinatarioId: anuncio.usuarioId,
          destinatarioNome: anuncio.nomeUsuario,
          anuncioId: anuncio.id,
          anuncioTitulo: anuncio.titulo,
        },
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao iniciar conversa");
    } finally {
      setIniciandoChat(false);
    }
  };

  const handleToggleFavorito = async () => {
    if (!anuncio) return;
    if (!possuiUsuarioAutenticado && !exigirLogin()) return;

    try {
      await alternarFavorito(anuncio.id);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar favoritos."
      );
    }
  };

  const handleAbrirDenuncia = () => {
    if (!exigirLogin()) return;
    setModalDenunciaAberto(true);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );

  if (erro || !anuncio)
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center max-w-md">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Ops!</h2>
          <p className="text-slate-500 mb-6">
            {erro || "Este anúncio não está disponível no momento."}
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold transition-all active:scale-95"
          >
            Voltar para Home
          </button>
        </div>
      </div>
    );

    const imagens = anuncio.imagensUrls ?? [];

    const anuncioEstaAtivo = anuncio.status === "ATIVO";
    const anuncioConcluido = anuncio.status === "CONCLUIDO";
    const podeFalarComAnunciante = !isEDono && anuncioEstaAtivo && anuncio.tipo === "DOACAO";
    const podeEnviarInteresse = !isEDono && anuncioEstaAtivo && anuncio.tipo === "TROCA";
    const podeInteragir = podeFalarComAnunciante || podeEnviarInteresse;
    const mostrarFavoritos = !isEDono && anuncioEstaAtivo;
    const podeDenunciar = !isEDono && anuncioEstaAtivo;
    const podeAvaliarAnunciante = !isEDono && anuncioConcluido;
    const anuncioFavoritado = ehFavorito(anuncio.id);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-plus-jakarta-sans text-left">
      <Header />

      <main className="flex-grow bg-slate-50 px-3 py-6 sm:px-4 sm:py-12">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold text-sm mb-6 transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Voltar
          </button>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">

                {/* CARROSSEL */}
                {imagens.length > 0 ? (
                  <div className="relative">
                    <div className="aspect-[16/10] w-full overflow-hidden bg-slate-100">
                      <img
                        src={imagemUrl(imagens[imagemAtual])}
                        alt={`Foto ${imagemAtual + 1}`}
                        className="w-full h-full object-cover transition-all duration-300"
                      />
                    </div>

                    {imagens.length > 1 && (
                      <>
                        <button
                          onClick={irParaAnterior}
                          className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-800 rounded-lg p-2 border border-slate-200 transition-colors"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          onClick={irParaProxima}
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-800 rounded-lg p-2 border border-slate-200 transition-colors"
                        >
                          <ChevronRight size={20} />
                        </button>

                        {/* MINIATURAS */}
                        <div className="flex gap-2 overflow-x-auto p-3 sm:p-4">
                          {imagens.map((url: string, index: number) => (
                            <button
                              key={index}
                              onClick={() => setImagemAtual(index)}
                              className={`h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:h-16 sm:w-16 ${
                                imagemAtual === index
                                  ? "border-blue-600 ring-2 ring-blue-100"
                                  : "border-transparent opacity-60 hover:opacity-100"
                              }`}
                            >
                              <img
                                src={imagemUrl(url)}
                                alt={`Miniatura ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>

                        {/* INDICADOR */}
                        <div className="flex justify-center gap-1.5 pb-4">
                          {imagens.map((_: string, index: number) => (
                            <button
                              key={index}
                              onClick={() => setImagemAtual(index)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                imagemAtual === index
                                  ? "bg-blue-600 w-4"
                                  : "bg-slate-300"
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="h-64 bg-slate-100 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <ImageOff size={48} opacity={0.3} />
                    <span className="text-sm">Sem fotos disponíveis</span>
                  </div>
                )}

                <div className="p-5 sm:p-8">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      anuncio.tipo === "DOACAO"
                        ? "bg-teal-50 text-teal-700 border-teal-100"
                        : "bg-orange-50 text-orange-700 border-orange-100"
                    }`}>
                      {anuncio.tipo === "DOACAO" ? "Doação" : "Troca"}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getCondicaoColor(anuncio.condicao)}`}>
                      {anuncio.condicao}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-slate-100 text-slate-600">
                      {anuncio.status}
                    </span>
                  </div>

                  <h1 className="mb-4 text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">{anuncio.titulo}</h1>

                  <div className="mb-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 sm:mb-8">
                    <button
                      type="button"
                      onClick={() => navigate(`/perfil/${anuncio.usuarioId}`)}
                      className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                    >
                      <User size={16} className="text-blue-600" />
                      <span className="font-semibold">{anuncio.nomeUsuario}</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={16} />
                      <span>{new Date(anuncio.criadoEm).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <FileText size={20} className="text-blue-600" /> Descrição
                    </h2>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {anuncio.descricao}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:space-y-6 sm:p-6">
                <h3 className="font-bold text-slate-900">Detalhes Técnicos</h3>

                  <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
                    <div className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
                      <Tag size={16} /> <span>Categoria</span>
                    </div>
                    <span className="max-w-[55%] break-words text-right text-sm font-bold text-slate-900">{anuncio.nomeCategoria}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
                    <div className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
                      <Eye size={16} /> <span>Vistas</span>
                    </div>
                    <span className="max-w-[55%] break-words text-right text-sm font-bold text-slate-900">{anuncio.totalVisualizacoes}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
                    <div className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
                      <Star size={16} /> <span>Relevância</span>
                    </div>
                    <span className="max-w-[55%] break-words text-right text-sm font-bold text-blue-600">
                      {anuncio.notaRelevancia ? anuncio.notaRelevancia.toFixed(2) : "0.00"}
                    </span>
                  </div>

                </div>

                {isEDono ? (
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate(`/anuncios/${anuncio.id}/editar`)}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
                    >
                      <Edit3 size={18} />
                      Editar Anúncio
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {podeInteragir ? (
                      <>
                        {podeFalarComAnunciante && (
                          <button
                            onClick={handleFalarComAnunciante}
                            disabled={iniciandoChat}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
                          >
                            <MessageCircle size={18} />
                            {iniciandoChat ? "Abrindo conversa..." : "Falar com o anunciante"}
                          </button>
                        )}

                        {podeEnviarInteresse && (
                          <button
                            onClick={handleAbrirInteresse}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
                          >
                            <Heart size={18} />
                            Quero trocar
                          </button>
                        )}

                        {mostrarFavoritos && (
                          <button
                            type="button"
                            onClick={handleToggleFavorito}
                            className={`w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors active:scale-[0.99] ${
                              anuncioFavoritado
                                ? "bg-rose-50 hover:bg-rose-100 text-rose-600"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                            }`}
                          >
                            <Heart
                              size={18}
                              fill={anuncioFavoritado ? "currentColor" : "none"}
                            />
                            {anuncioFavoritado
                              ? "Remover dos Favoritos"
                              : "Salvar nos Favoritos"}
                          </button>
                        )}

                        {podeDenunciar && (
                          <button
                            type="button"
                            onClick={handleAbrirDenuncia}
                            className="w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors active:scale-[0.99] bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-700 border border-slate-200 hover:border-orange-200"
                          >
                            <ShieldAlert size={18} />
                            Denunciar anuncio
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                        Este anúncio não está disponível para contato no momento.
                      </div>
                    )}

                    {podeAvaliarAnunciante && (
                      <button
                        onClick={() => {
                          if (!exigirLogin()) return;
                          setModalAvaliacaoAberto(true);
                        }}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
                      >
                        <Star size={18} />
                        Avaliar anunciante
                      </button>
                    )}

                    {podeDenunciar && !podeInteragir && (
                      <button
                        type="button"
                        onClick={handleAbrirDenuncia}
                        className="w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors active:scale-[0.99] bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-700 border border-slate-200 hover:border-orange-200"
                      >
                        <ShieldAlert size={18} />
                        Denunciar anuncio
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50 p-5 sm:p-6">
                <h4 className="text-blue-800 font-bold text-sm mb-2 flex items-center gap-2">
                  <Info size={16} />
                  Dica ReUseHub
                </h4>
                <p className="text-blue-700/70 text-xs leading-relaxed">
                    {isEDono
                      ? "Mantenha seu anúncio atualizado para garantir maior relevância nas buscas!"
                      : anuncioEstaAtivo
                        ? anuncio.tipo === "DOACAO"
                          ? "Fale com o anunciante para combinar os detalhes da doação."
                          : "Envie uma proposta de troca; o chat será aberto quando a oferta for aceita."
                        : "Este anúncio não está disponível para novas interações no momento."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <InteresseModal
        open={modalInteresseAberto}
        onClose={() => setModalInteresseAberto(false)}
        anuncio={anuncio}
      />

      <AvaliacaoModal
        open={modalAvaliacaoAberto}
        onClose={() => setModalAvaliacaoAberto(false)}
        anuncioId={anuncio.id}
        avaliadoId={anuncio.usuarioId}
        avaliadoNome={anuncio.nomeUsuario}
      />

      <DenunciaAnuncioModal
        open={modalDenunciaAberto}
        onClose={() => setModalDenunciaAberto(false)}
        anuncioId={anuncio.id}
        anuncioTitulo={anuncio.titulo}
      />
    </div>
  );
};
