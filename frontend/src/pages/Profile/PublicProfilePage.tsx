import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Star, User2 } from "lucide-react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { AvaliacoesCarousel } from "../../components/profile/AvaliacoesCarousel";
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

      <main className="flex-grow px-3 py-6 sm:px-4 sm:py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
              <div className="flex flex-col items-start gap-4 sm:flex-row lg:flex-col">
                <img
                  src={imagemUrl(perfil.avatarUrl)}
                  alt={perfil.name}
                  className="h-32 w-32 rounded-md border border-slate-200 bg-slate-50 object-cover p-1"
                  onError={(event) => {
                    (event.target as HTMLImageElement).src = DEFAULT_AVATAR;
                  }}
                />

                <div className="grid grid-cols-2 gap-2 sm:min-w-[220px] lg:w-full">
                  <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nota</p>
                    <p className="mt-1 flex items-center gap-1 text-lg font-black text-orange-600">
                      <Star size={17} fill="currentColor" />
                      {(perfil.reputationScore || 0).toFixed(1)}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Anúncios</p>
                    <p className="mt-1 text-lg font-black text-blue-600">{perfil.anunciosAtivos.length}</p>
                  </div>
                </div>
              </div>

              <div className="flex min-w-0 flex-col justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">
                    Perfil público
                  </p>
                  <h1 className="mt-2 break-words text-2xl font-black text-slate-950 sm:text-3xl">
                    {perfil.name}
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Estrelas nota={perfil.reputationScore || 0} />
                    <span className="text-sm font-extrabold text-slate-600">
                      {(perfil.reputationScore || 0).toFixed(1)} de reputação
                    </span>
                  </div>
                </div>

                <div className="mt-6 rounded-md border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Biografia
                  </p>
                  <p className="mt-2 leading-relaxed text-slate-600">
                    {perfil.bio || "Este usuário ainda não adicionou uma biografia."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-black text-slate-950">Anúncios ativos</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Itens publicados por este usuário no marketplace.
              </p>
            </div>
            {perfil.anunciosAtivos.length === 0 ? (
              <div className="rounded-md border border-slate-100 bg-white p-6 text-sm font-semibold text-slate-500">
                Nenhum anúncio ativo no momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {perfil.anunciosAtivos.map((anuncio) => (
                  <button
                    key={anuncio.id}
                    onClick={() => navigate(`/anuncios/${anuncio.id}`)}
                    className="overflow-hidden rounded-md border border-slate-200 bg-white text-left shadow-sm shadow-slate-200/60 transition-colors hover:border-blue-200"
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
                      <div className="mb-3 flex items-center gap-2">
                        <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-black uppercase text-blue-600">
                          {anuncio.tipo}
                        </span>
                      </div>
                      <h3 className="line-clamp-2 font-black text-slate-950">{anuncio.titulo}</h3>
                      <p className="mt-2 text-sm font-semibold text-slate-500">{anuncio.nomeCategoria}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-black text-slate-950">Avaliações recebidas</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Experiências registradas por outros usuários.
              </p>
            </div>
            <AvaliacoesCarousel
              avaliacoes={perfil.avaliacoesRecebidas}
              onAbrirPerfil={(usuarioId) => navigate(`/perfil/${usuarioId}`)}
              onRemoverAvaliacao={removerAvaliacao}
              podeRemover={podeModerar}
            />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};
