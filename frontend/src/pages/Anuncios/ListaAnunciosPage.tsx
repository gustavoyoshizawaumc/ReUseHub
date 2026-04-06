import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";

export const ListaAnunciosPage: React.FC = () => {
  const navigate = useNavigate();
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

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja deletar este anúncio?")) {
      try {
        await anuncioService.deletarAnuncio(id);
        listar();
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

      <main className="flex-grow bg-[#f1f5f9] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNlMmU4ZjAiIGZpbGwtb3BhY2l0yT0iMC40Ij48cGF0aCBkPSJNMCAwaDQwdjE4SDBWMHptMCAyMGg0MHYxOEgwVjIwek0xOSAwaDJ2NDBoLTJWME05IDBoMnY0MEg5VjBteTIwIDBoMnY0MGgtMlYwek0wIDloNDB2MkgwVjl6bTAgMjBoNDB2MkgwVjI5eiIvPjwvZz48L2c+PC9zdmciPg==')] py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Meus Anúncios
              </h1>
              <p className="text-slate-500 mt-1">
                Gerencie seus itens publicados na plataforma.
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

          <div className="mb-8">
            <BuscaAnuncios onBuscar={buscar} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            <aside className="lg:col-span-1 sticky top-24">
              <div className="bg-white rounded-[24px] p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
                <FiltrosAnuncios
                  onFiltrarTipo={filtrarTipo}
                  onFiltrarCategoria={filtrarCategoria}
                  onLimpar={listar}
                />
              </div>
            </aside>

            <div className="lg:col-span-3 space-y-6">
              {loading && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-slate-500 font-medium">
                    Carregando seus anúncios...
                  </p>
                </div>
              )}

              {erro && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center gap-3 text-red-700">
                  <AlertCircle size={20} />
                  <span className="font-bold">Erro: {erro}</span>
                </div>
              )}

              {!loading && anuncios.length === 0 && (
                <div className="bg-white rounded-[32px] p-16 shadow-md border border-slate-100 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                    <Package size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">
                    Nada por aqui ainda
                  </h3>
                  <p className="text-slate-500 mt-2 max-w-xs">
                    Você ainda não tem anúncios ativos. Que tal começar
                    desapegando de algo agora?
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {anuncios.map((anuncio) => (
                  <div
                    key={anuncio.id}
                    className="transition-all hover:translate-x-1"
                  >
                    <CardAnuncio anuncio={anuncio} onDelete={handleDelete} />
                  </div>
                ))}
              </div>

              {!loading && paginacao.totalPages > 1 && (
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mt-8">
                  <button
                    onClick={handleAnterior}
                    disabled={paginacao.currentPage === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
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
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
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
