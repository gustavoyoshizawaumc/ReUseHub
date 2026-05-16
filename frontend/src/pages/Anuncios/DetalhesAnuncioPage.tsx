import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as anuncioService from "../../services/anuncioService";
import type { Anuncio } from "../../types/anuncio.types";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import {
  ArrowLeft,
  Calendar,
  Tag,
  Eye,
  Star,
  Clock,
  User,
  Edit3,
  MessageCircle,
  Heart,
  ChevronLeft,
  ChevronRight,
  ImageOff,
} from "lucide-react";

const BASE_URL = "http://localhost:8080";

export const DetalhesAnuncioPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [anuncio, setAnuncio] = useState<Anuncio | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [usuarioAtual, setUsuarioAtual] = useState<{ id: string; nome: string } | null>(null);
  const [isEDono, setIsEDono] = useState(false);
  const [imagemAtual, setImagemAtual] = useState(0);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const response = await fetch(`${BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const usuario = await response.json();
            setUsuarioAtual({ id: usuario.id, nome: usuario.nome });
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

  useEffect(() => {
    if (usuarioAtual && anuncio) {
      setIsEDono(usuarioAtual.id === anuncio.usuarioId);
    }
  }, [usuarioAtual, anuncio]);

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

  if (loading)
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );

  if (erro || !anuncio)
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-[32px] shadow-xl text-center max-w-md">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Ops!</h2>
          <p className="text-slate-500 mb-6">{erro || "Anúncio não encontrado"}</p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold transition-all active:scale-95"
          >
            Voltar para Home
          </button>
        </div>
      </div>
    );

  const imagens = anuncio.imagensUrls ?? [];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-plus-jakarta-sans text-left">
      <Header />

      <main className="flex-grow bg-[#f1f5f9] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNlMmU4ZjAiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMCAwaDQwdjE4SDBWMHptMCAyMGg0MHYxOEgwVjIwek0xOSAwaDJ2NDBoLTJWME05IDBoMnY0MEg5VjBteTIwIDBoMnY0MGgtMlYwek0wIDloNDB2MkgwVjl6bTAgMjBoNDB2MkgwVjI5eiIvPjwvZz48L2c+PC9zdmc+')] py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold text-sm mb-6 transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Voltar
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden">

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
                          className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 rounded-full p-2 shadow-lg transition-all hover:scale-110"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          onClick={irParaProxima}
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 rounded-full p-2 shadow-lg transition-all hover:scale-110"
                        >
                          <ChevronRight size={20} />
                        </button>

                        {/* MINIATURAS */}
                        <div className="flex gap-2 p-4 overflow-x-auto">
                          {imagens.map((url: string, index: number) => (
                            <button
                              key={index}
                              onClick={() => setImagemAtual(index)}
                              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
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

                <div className="p-8">
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

                  <h1 className="text-3xl font-extrabold text-slate-900 mb-4">{anuncio.titulo}</h1>

                  <div className="flex items-center gap-4 text-slate-500 text-sm mb-8">
                    <div className="flex items-center gap-1.5">
                      <User size={16} className="text-blue-600" />
                      <span className="font-semibold">{anuncio.nomeUsuario}</span>
                    </div>
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
              <div className="bg-white rounded-[32px] p-6 shadow-xl border border-slate-100 space-y-6">
                <h3 className="font-bold text-slate-900">Detalhes Técnicos</h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <Tag size={16} /> <span>Categoria</span>
                    </div>
                    <span className="font-bold text-slate-900 text-sm">{anuncio.nomeCategoria}</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <Eye size={16} /> <span>Vistas</span>
                    </div>
                    <span className="font-bold text-slate-900 text-sm">{anuncio.totalVisualizacoes}</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <Star size={16} /> <span>Relevância</span>
                    </div>
                    <span className="font-bold text-blue-600 text-sm">
                      {anuncio.notaRelevancia ? anuncio.notaRelevancia.toFixed(2) : "0.00"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <Clock size={16} /> <span>Expira</span>
                    </div>
                    <span className="font-bold text-slate-900 text-sm">
                      {new Date(anuncio.expiraEm).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>

                {isEDono ? (
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate(`/anuncios/${anuncio.id}/editar`)}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-100 transition-all active:scale-95"
                    >
                      <Edit3 size={18} />
                      Editar Anúncio
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95">
                      <MessageCircle size={18} />
                      Entrar em Contato
                    </button>
                    <button className="w-full bg-slate-200 hover:bg-slate-300 text-slate-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95">
                      <Heart size={18} />
                      Salvar nos Favoritos
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 rounded-[32px] p-6 border border-blue-100">
                <h4 className="text-blue-800 font-bold text-sm mb-2 flex items-center gap-2">
                  💡 Dica ReUseHub
                </h4>
                <p className="text-blue-700/70 text-xs leading-relaxed">
                  {isEDono
                    ? "Mantenha seu anúncio atualizado para garantir maior relevância nas buscas!"
                    : "Envie uma mensagem para o anunciante e negocie os termos da troca!"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

const FileText = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);
