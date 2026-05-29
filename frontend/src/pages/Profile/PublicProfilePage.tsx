import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar, MessageSquare, Star, User2 } from "lucide-react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { authService } from "../../services/authService";
import { obterPerfilPublico } from "../../services/perfilService";
import { removerAvaliacaoModeracao } from "../../services/moderacaoService";
import type { PerfilPublico } from "../../types/perfil.types";

import { API_BASE_URL } from "../../config/api";

const BASE_URL = API_BASE_URL;
const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const imagemUrl = (url?: string | null) => {
  if (!url) return DEFAULT_AVATAR;
  return url.startsWith("http") ? url : `${BASE_URL}${url}`;
};

const Estrelas: React.FC<{ nota: number }> = ({ nota }) => (
  <div className="flex items-center gap-1 text-orange-500">
    {[1, 2, 3, 4, 5].map((valor) => (
      <Star
        key={valor}
        size={18}
        fill={valor <= Math.round(nota || 0) ? "currentColor" : "none"}
      />
    ))}
  </div>
);

export const PublicProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = authService.getUser();
  const podeModerar = user?.perfil === "MODERADOR" || user?.perfil === "ADMIN";
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const carregar = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setPerfil(await obterPerfilPublico(id));
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Erro ao carregar perfil");
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [id]);

  const removerAvaliacao = async (avaliacaoId: string) => {
    try {
      await removerAvaliacaoModeracao(avaliacaoId, "Removida por conteudo improprio.");
      setPerfil((atual) =>
        atual
          ? {
              ...atual,
              avaliacoesRecebidas: atual.avaliacoesRecebidas.filter(
                (avaliacao) => avaliacao.id !== avaliacaoId
              ),
            }
          : atual
      );
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao remover avaliacao");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (erro || !perfil) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-sm text-center max-w-md">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Perfil não encontrado</h1>
          <p className="text-slate-500 mb-6">{erro || "Não foi possível abrir este perfil."}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-plus-jakarta-sans">
      <Header />

      <main className="flex-grow py-10 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <section className="bg-white rounded-lg shadow-sm shadow-slate-200/60 border border-slate-100 overflow-hidden">
            <div className="h-28 bg-gradient-to-r from-blue-600 to-teal-500" />
            <div className="px-6 md:px-8 pb-8">
              <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-14">
                <img
                  src={imagemUrl(perfil.avatarUrl)}
                  alt={perfil.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white bg-white shadow-lg"
                  onError={(event) => {
                    (event.target as HTMLImageElement).src = DEFAULT_AVATAR;
                  }}
                />

                <div className="flex-1 md:pb-2">
                  <h1 className="text-3xl font-extrabold text-slate-900">{perfil.name}</h1>
                  <div className="flex items-center gap-3 mt-2">
                    <Estrelas nota={perfil.reputationScore || 0} />
                    <span className="font-bold text-slate-700">
                      {(perfil.reputationScore || 0).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-6 text-slate-600 leading-relaxed max-w-3xl">
                {perfil.bio || "Este usuário ainda não adicionou uma biografia."}
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Anúncios ativos</h2>
            {perfil.anunciosAtivos.length === 0 ? (
              <div className="bg-white rounded-lg border border-slate-100 p-6 text-slate-500">
                Nenhum anúncio ativo no momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {perfil.anunciosAtivos.map((anuncio) => (
                  <button
                    key={anuncio.id}
                    onClick={() => navigate(`/anuncios/${anuncio.id}`)}
                    className="bg-white rounded-lg border border-slate-100 overflow-hidden shadow-sm text-left hover:shadow-lg transition-shadow"
                  >
                    <div className="aspect-[4/3] bg-slate-100">
                      {anuncio.imagensUrls?.[0] ? (
                        <img
                          src={imagemUrl(anuncio.imagensUrls[0])}
                          alt={anuncio.titulo}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <User2 size={34} />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-bold text-blue-600 uppercase">{anuncio.tipo}</p>
                      <h3 className="font-bold text-slate-900 line-clamp-2 mt-1">{anuncio.titulo}</h3>
                      <p className="text-sm text-slate-500 mt-2">{anuncio.nomeCategoria}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Avaliações recebidas</h2>
            {perfil.avaliacoesRecebidas.length === 0 ? (
              <div className="bg-white rounded-lg border border-slate-100 p-6 text-slate-500">
                Ainda não há avaliações para este usuário.
              </div>
            ) : (
              <div className="space-y-3">
                {perfil.avaliacoesRecebidas.map((avaliacao) => (
                  <div key={avaliacao.id} className="bg-white rounded-lg border border-slate-100 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <button
                          type="button"
                          onClick={() => navigate(`/perfil/${avaliacao.avaliadorId}`)}
                          className="font-bold text-slate-900 hover:text-blue-600 transition-colors"
                        >
                          {avaliacao.avaliadorNome}
                        </button>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                          <Calendar size={14} />
                          {new Date(avaliacao.criadoEm).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Estrelas nota={avaliacao.nota} />
                    </div>

                    {avaliacao.comentario && (
                      <p className="text-slate-600 mt-4 flex gap-2">
                        <MessageSquare size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                        <span>{avaliacao.comentario}</span>
                      </p>
                    )}
                    {podeModerar && (
                      <button
                        type="button"
                        onClick={() => removerAvaliacao(avaliacao.id)}
                        className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
                      >
                        Remover avaliacao
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};
