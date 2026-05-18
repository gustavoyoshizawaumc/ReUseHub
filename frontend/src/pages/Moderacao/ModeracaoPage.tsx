import React, { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock3,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Box,
  ShieldCheck,
  Tag,
  Eye,
  MapPin,
  User,
} from 'lucide-react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import {
  listarAnunciosPendentes,
  aprovarAnuncio,
  reprovarAnuncio,
} from '../../services/moderacaoService';
import type { Anuncio } from '../../types/anuncio.types';

const BASE_URL = 'http://localhost:8080';

export const ModeracaoPage: React.FC = () => {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [processando, setProcessando] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    id: string;
    tipo: 'aprovado' | 'reprovado';
  } | null>(null);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [total, setTotal] = useState(0);

  // Estado para controlar o índice da imagem ativa de cada anúncio individualmente
  const [imagensAtivas, setImagensAtivas] = useState<Record<string, number>>({});

  const carregar = useCallback(async (p = 0) => {
    setLoading(true);
    setErro(null);
    try {
      const data = await listarAnunciosPendentes(p, 10);
      setAnuncios(data.content ?? []);
      setTotalPaginas(data.totalPages ?? 0);
      setTotal(data.totalElements ?? 0);
      setPagina(p);
      
      // Inicializa o índice da imagem ativa como 0 para todos os anúncios carregados
      const iniciais: Record<string, number> = {};
      data.content?.forEach((anuncio: Anuncio) => {
        iniciais[anuncio.id] = 0;
      });
      setImagensAtivas(iniciais);
    } catch {
      setErro('Não foi possível carregar os anúncios pendentes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar(0);
  }, [carregar]);

  const handleAprovar = async (id: string) => {
    setProcessando(id);
    try {
      await aprovarAnuncio(id);
      setFeedback({ id, tipo: 'aprovado' });
      setTimeout(() => {
        setFeedback(null);
        setAnuncios((prev) => prev.filter((item) => item.id !== id));
        setTotal((prev) => prev - 1);
        setProcessando(null);
      }, 1200);
    } catch {
      setErro('Erro ao aprovar anúncio.');
      setProcessando(null);
    }
  };

  const handleReprovar = async (id: string) => {
    setProcessando(id);
    try {
      await reprovarAnuncio(id);
      setFeedback({ id, tipo: 'reprovado' });
      setTimeout(() => {
        setFeedback(null);
        setAnuncios((prev) => prev.filter((item) => item.id !== id));
        setTotal((prev) => prev - 1);
        setProcessando(null);
      }, 1200);
    } catch {
      setErro('Erro ao reprovar anúncio.');
      setProcessando(null);
    }
  };

  const handleAnterior = () => {
    if (pagina > 0) {
      carregar(pagina - 1);
    }
  };

  const handleProxima = () => {
    if (pagina < totalPaginas - 1) {
      carregar(pagina + 1);
    }
  };

  // Funções auxiliares para navegar no carrossel de cada card
  const imagemAnteriorCarrossel = (anuncioId: string, totalImagens: number) => {
    setImagensAtivas((prev) => ({
      ...prev,
      [anuncioId]: prev[anuncioId] === 0 ? totalImagens - 1 : prev[anuncioId] - 1,
    }));
  };

  const proximaImagemCarrossel = (anuncioId: string, totalImagens: number) => {
    setImagensAtivas((prev) => ({
      ...prev,
      [anuncioId]: prev[anuncioId] === totalImagens - 1 ? 0 : prev[anuncioId] + 1,
    }));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-plus-jakarta-sans text-left">
      <Header />

      <main className="flex-grow bg-[#f1f5f9] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNlMmU4ZjAiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMCAwaDQwdjE4SDBWMHptMCAyMGg0MHYxOEgwVjIwek0xOSAwaDJ2NDBoLTJWME05IDBoMnY0MEg5VjBteTIwIDBoMnY0MGgtMlYwek0wIDloNDB2MkgwVjl6bTAgMjBoNDB2MkgwVjI5eiIvPjwvZz48L2c+PC9zdmc+')] py-10 md:py-12">
        <div className="max-w-5xl mx-auto px-4">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-3 py-1.5 border border-slate-200 text-slate-600 text-sm font-semibold shadow-sm mb-4">
                <ShieldCheck size={16} className="text-blue-600" />
                Painel de moderação
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                Fila de Moderação
              </h1>
              <p className="text-slate-500 mt-2 leading-relaxed">
                Revise os anúncios enviados pelos usuários antes da publicação.
              </p>
            </div>

            {!loading && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-sm shrink-0">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clock3 size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                    Aguardando análise
                  </p>
                  <p className="text-2xl font-extrabold text-amber-900">
                    {total}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Erro */}
          {erro && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-900 rounded-[24px] px-5 py-4 flex items-start gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertCircle size={18} />
              </div>
              <div>
                <p className="font-extrabold">Algo deu errado</p>
                <p className="text-sm mt-1">{erro}</p>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-[32px] p-16 shadow-md border border-slate-100 flex flex-col items-center justify-center text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4" />
              <p className="text-slate-700 font-bold">
                Carregando anúncios pendentes...
              </p>
              <p className="text-slate-500 text-sm mt-2">
                Aguarde enquanto buscamos as submissões.
              </p>
            </div>
          )}

          {/* Vazio */}
          {!loading && !erro && anuncios.length === 0 && (
            <div className="bg-white rounded-[32px] p-16 shadow-md border border-slate-100 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-400 mb-4">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-800">
                Tudo em dia!
              </h3>
              <p className="text-slate-500 mt-2 max-w-md leading-relaxed">
                Não há anúncios aguardando moderação no momento. Volte mais
                tarde para verificar novas submissões.
              </p>
            </div>
          )}

          {/* Lista */}
          {!loading && anuncios.length > 0 && (
            <div className="space-y-4">
              {anuncios.map((anuncio) => {
                const imagens = anuncio.imagensUrls ?? [];
                const idxAtual = imagensAtivas[anuncio.id] ?? 0;
                const fotoUrl = imagens[idxAtual]
                  ? imagens[idxAtual].startsWith('http') ? imagens[idxAtual] : `${BASE_URL}${imagens[idxAtual]}`
                  : null;

                const isFeedbackAprovado =
                  feedback?.id === anuncio.id && feedback.tipo === 'aprovado';
                const isFeedbackReprovado =
                  feedback?.id === anuncio.id && feedback.tipo === 'reprovado';
                const isProcessando = processando === anuncio.id;

                if (isFeedbackAprovado) {
                  return (
                    <div
                      key={anuncio.id}
                      className="bg-emerald-50 border border-emerald-200 rounded-[24px] p-6 flex items-center gap-4 shadow-sm animate-in fade-in"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <p className="font-extrabold text-emerald-900">
                          Anúncio aprovado
                        </p>
                        <p className="text-sm text-emerald-700 mt-0.5">
                          "{anuncio.titulo}" foi publicado com sucesso.
                        </p>
                      </div>
                    </div>
                  );
                }

                if (isFeedbackReprovado) {
                  return (
                    <div
                      key={anuncio.id}
                      className="bg-rose-50 border border-rose-200 rounded-[24px] p-6 flex items-center gap-4 shadow-sm animate-in fade-in"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <XCircle size={24} />
                      </div>
                      <div>
                        <p className="font-extrabold text-rose-900">
                          Anúncio reprovado
                        </p>
                        <p className="text-sm text-rose-700 mt-0.5">
                          "{anuncio.titulo}" foi reprovado e não será publicado.
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={anuncio.id}
                    className="group bg-white rounded-[24px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row gap-0">
                      
                      {/* Container de Foto Otimizado com Carrossel e Tamanho Ampliado */}
                      <div className="relative w-full md:w-64 h-64 shrink-0 overflow-hidden bg-slate-50 flex items-center justify-center text-slate-300 group/carrossel border-b md:border-b-0 md:border-r border-slate-100">
                        {fotoUrl ? (
                          <>
                            <img
                              src={fotoUrl}
                              alt={`${anuncio.titulo} - Foto ${idxAtual + 1}`}
                              className="w-full h-full object-cover transition-all duration-300"
                            />
                            
                            {/* Controles do Mini Carrossel (Aparecem no Hover) */}
                            {imagens.length > 1 && (
                              <>
                                <button
                                  onClick={() => imagemAnteriorCarrossel(anuncio.id, imagens.length)}
                                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-800 rounded-full p-1.5 shadow-md transition-all opacity-0 group-hover/carrossel:opacity-100 active:scale-90"
                                >
                                  <ChevronLeft size={16} />
                                </button>
                                <button
                                  onClick={() => proximaImagemCarrossel(anuncio.id, imagens.length)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-800 rounded-full p-1.5 shadow-md transition-all opacity-0 group-hover/carrossel:opacity-100 active:scale-90"
                                >
                                  <ChevronRight size={16} />
                                </button>

                                {/* Indicador numérico de fotos */}
                                <span className="absolute bottom-2 right-2 bg-slate-900/70 backdrop-blur-sm text-white font-bold text-[10px] px-2 py-0.5 rounded-md tracking-wider">
                                  {idxAtual + 1}/{imagens.length}
                                </span>
                              </>
                            )}
                          </>
                        ) : (
                          <Box size={48} strokeWidth={1.5} />
                        )}
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 flex flex-col justify-between p-6">
                        <div>
                          {/* Badges */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              anuncio.tipo === 'DOACAO'
                                ? 'bg-teal-50 text-teal-700 border-teal-100'
                                : 'bg-orange-50 text-orange-700 border-orange-100'
                            }`}>
                              {anuncio.tipo === 'DOACAO' ? 'Doação' : 'Troca'}
                            </span>

                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              anuncio.condicao === 'NOVO'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : anuncio.condicao === 'BOM'
                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                : anuncio.condicao === 'REGULAR'
                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                : 'bg-red-50 text-red-700 border-red-100'
                            }`}>
                              {anuncio.condicao}
                            </span>

                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-100 inline-flex items-center gap-1">
                              <Clock3 size={10} />
                              Pendente
                            </span>
                          </div>

                          {/* Título */}
                          <h3 className="text-xl font-extrabold text-slate-900 line-clamp-1">
                            {anuncio.titulo}
                          </h3>

                          {/* Descrição */}
                          <p className="text-slate-500 text-sm mt-2 line-clamp-3 leading-relaxed">
                            {anuncio.descricao}
                          </p>

                          {/* Metadados / Detalhes do Anunciante */}
                          <div className="flex flex-wrap items-center gap-4 mt-5 text-[12px] font-bold text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <Tag size={13} className="text-blue-500" />
                              <span className="text-slate-600">
                                {anuncio.nomeCategoria}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <User size={13} className="text-slate-500" />
                              <span className="text-slate-600">
                                {anuncio.nomeUsuario}
                              </span>
                            </div>

                            {anuncio.cidade && (
                              <div className="flex items-center gap-1">
                                <MapPin size={13} className="text-orange-500" />
                                <span className="text-slate-600">{anuncio.cidade} - {anuncio.uf}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-1.5">
                              <Eye size={13} />
                              <span>{anuncio.totalVisualizacoes} vistas</span>
                            </div>
                          </div>
                        </div>

                        {/* Botões de Ação da Moderação */}
                        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                          <button
                            onClick={() => handleReprovar(anuncio.id)}
                            disabled={isProcessando}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
                          >
                            <XCircle size={14} />
                            Reprovar
                          </button>
                          
                          <button
                            onClick={() => handleAprovar(anuncio.id)}
                            disabled={isProcessando}
                            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-blue-100 active:scale-95"
                          >
                            <CheckCircle2 size={14} />
                            {isProcessando ? 'Processando...' : 'Aprovar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Paginação */}
          {!loading && totalPaginas > 1 && (
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mt-8">
              <button
                onClick={handleAnterior}
                disabled={pagina === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all text-sm"
              >
                <ChevronLeft size={20} />
                Anterior
              </button>

              <div className="text-sm font-bold text-slate-400">
                Página <span className="text-blue-600">{pagina + 1}</span> de {totalPaginas}
              </div>

              <button
                onClick={handleProxima}
                disabled={pagina >= totalPaginas - 1}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all text-sm"
              >
                Próxima
                <ChevronRight size={20} />
              </button>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};