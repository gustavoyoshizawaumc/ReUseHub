import React, { useEffect, useState } from "react";
import { Heart, LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CardAnuncio } from "../../components/anuncios/CardAnuncio";
import { Footer } from "../../components/Footer";
import { Header } from "../../components/Header";
import { useFavoritos } from "../../hooks/useFavoritos";
import * as anuncioService from "../../services/anuncioService";
import type { Anuncio } from "../../types/anuncio.types";

export const FavoritosPage: React.FC = () => {
  const navigate = useNavigate();
  const { favoritos, ehFavorito, alternarFavorito } = useFavoritos();
  const [anunciosFavoritos, setAnunciosFavoritos] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    const buscarFavoritos = async () => {
      setLoading(true);
      setErro(null);

      try {
        const anuncios = await anuncioService.listarFavoritos();
        if (ativo) {
          setAnunciosFavoritos(anuncios);
        }
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : "Erro ao carregar os favoritos."
          );
        }
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    };

    buscarFavoritos();

    return () => {
      ativo = false;
    };
  }, [favoritos]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-plus-jakarta-sans text-left">
      <Header />

      <main className="flex-grow bg-[#f1f5f9] py-6 sm:py-10 md:py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-3 py-1.5 border border-slate-200 text-slate-600 text-sm font-semibold shadow-sm mb-4">
              <Heart size={16} className="text-rose-500" fill="currentColor" />
              Sua curadoria
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
              Favoritos
            </h1>
            <p className="text-slate-500 mt-2 max-w-2xl leading-relaxed">
              Reúna aqui os anúncios que você quer acompanhar de perto.
            </p>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center rounded-[32px] border border-slate-100 bg-white p-8 text-center shadow-md sm:p-16">
              <LoaderCircle size={40} className="animate-spin text-blue-600 mb-4" />
              <p className="text-slate-700 font-bold">Carregando seus favoritos...</p>
            </div>
          )}

          {!loading && erro && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-[24px] text-red-700 shadow-sm">
              <p className="font-extrabold">Erro ao carregar favoritos</p>
              <p className="text-sm mt-1">{erro}</p>
            </div>
          )}

          {!loading && !erro && anunciosFavoritos.length === 0 && (
            <div className="flex flex-col items-center rounded-[32px] border border-slate-100 bg-white p-8 text-center shadow-md sm:p-16">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-300 mb-4">
                <Heart size={36} />
              </div>
              <h2 className="text-xl font-extrabold text-slate-800">
                Você ainda não favoritou nenhum anúncio
              </h2>
              <p className="text-slate-500 mt-2 max-w-md leading-relaxed">
                Explore a vitrine e clique no coração para montar sua lista.
              </p>
              <button
                type="button"
                onClick={() => navigate("/anuncios")}
                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-2xl font-bold transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 active:scale-95"
              >
                Explorar anúncios
              </button>
            </div>
          )}

          {!loading && !erro && anunciosFavoritos.length > 0 && (
            <>
              <div className="bg-white border border-slate-100 rounded-[20px] px-5 py-3 shadow-sm mb-4">
                <p className="text-sm text-slate-500">
                  Você tem{" "}
                  <span className="font-extrabold text-slate-800">
                    {anunciosFavoritos.length}
                  </span>{" "}
                  anúncio{anunciosFavoritos.length > 1 ? "s" : ""} favorito
                  {anunciosFavoritos.length > 1 ? "s" : ""}.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {anunciosFavoritos.map((anuncio) => (
                  <CardAnuncio
                    key={anuncio.id}
                    anuncio={anuncio}
                    variant="grid"
                    isFavorito={ehFavorito(anuncio.id)}
                    onToggleFavorito={async (anuncioId) => {
                      await alternarFavorito(anuncioId);
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
