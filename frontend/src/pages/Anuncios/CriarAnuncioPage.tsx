import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormularioAnuncio } from "../../components/anuncios/FormularioAnuncio";
import * as anuncioService from "../../services/anuncioService";
import type { AnuncioCriacao } from "../../types/anuncio.types";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { AlertCircle, ArrowLeft, PlusCircle } from "lucide-react";

export const CriarAnuncioPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (dados: AnuncioCriacao) => {
    setLoading(true);
    setErro(null);

    try {
      const novoAnuncio = await anuncioService.criarAnuncio(dados);
      navigate(`/listings/${novoAnuncio.id}`);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao criar anúncio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-plus-jakarta-sans text-left">
      <Header />

      <main className="flex-grow bg-[#f1f5f9] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNlMmU4ZjAiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMCAwaDQwdjE4SDBWMHptMCAyMGg0MHYxOEgwVjIwek0xOSAwaDJ2NDBoLTJWME05IDBoMnY0MEg5VjBteTIwIDBoMnY0MGgtMlYwek0wIDloNDB2MkgwVjl6bTAgMjBoNDB2MkgwVjI5eiIvPjwvZz48L2c+PC9zdmc+')] py-12 px-4 flex items-center justify-center">
        <div className="bg-white rounded-[32px] shadow-xl w-full max-w-3xl p-8 md:p-12 border border-slate-100">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold text-sm mb-8 transition-colors group"
          >
            <ArrowLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Voltar
          </button>

          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <PlusCircle className="text-orange-500" size={28} />
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Novo Anúncio
              </h1>
            </div>
            <p className="text-slate-500 text-[16px]">
              Preencha os detalhes abaixo para desapegar do seu item.
            </p>
          </div>

          {erro && (
            <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl text-sm flex items-center gap-3 animate-in fade-in">
              <AlertCircle size={20} />
              <span className="font-bold text-[16px]">{erro}</span>
            </div>
          )}

          <div className="relative">
            <FormularioAnuncio onSubmit={handleSubmit} loading={loading} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
