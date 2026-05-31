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

  const handleSubmit = async (dados: AnuncioCriacao, imagens: File[]) => {
    setLoading(true);
    setErro(null);

    try {
      await anuncioService.criarAnuncio(dados, imagens);
      navigate("/meus-anuncios?status=pendente-criado");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao criar anúncio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-plus-jakarta-sans text-left">
      <Header />

      <main className="flex-grow bg-[#f1f5f9] px-3 py-6 sm:px-4 sm:py-12 flex items-center justify-center">
        <div className="w-full max-w-3xl rounded-lg border border-slate-100 bg-white p-5 shadow-sm sm:p-8 md:p-12">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-blue-600 group sm:mb-8"
          >
            <ArrowLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Voltar
          </button>

          <div className="mb-7 sm:mb-10">
            <div className="flex items-center gap-3 mb-2">
              <PlusCircle className="text-orange-500" size={28} />
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Novo Anúncio
              </h1>
            </div>

            <p className="text-slate-500 text-[16px]">
              Preencha os detalhes abaixo para desapegar do seu item.{" "}
              <span className="text-orange-500 font-semibold">
                Após o envio, seu anúncio passará por análise antes de ser publicado.
              </span>
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
