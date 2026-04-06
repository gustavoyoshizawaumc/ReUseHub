import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FormularioAnuncio } from "../../components/anuncios/FormularioAnuncio";
import * as anuncioService from "../../services/anuncioService";
import type {
  Anuncio,
  AnuncioCriacao,
  AnuncioAtualizacao,
} from "../../types/anuncio.types";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { AlertCircle, ArrowLeft, Edit3 } from "lucide-react";

export const EditarAnuncioPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [anuncio, setAnuncio] = useState<Anuncio | null>(null);
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [usuarioAtual, setUsuarioAtual] = useState<{ id: string } | null>(null);

  // ✅ Carregar dados do usuário e do anúncio
  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Carregar usuário atual
        const token = localStorage.getItem("token");
        if (token) {
          const response = await fetch("http://localhost:8080/api/auth/me", {
            headers: {
              Authorization: `Bearer ${token}`, // ✅ CORRIGIDO: Adicionar backticks
            },
          });
          if (response.ok) {
            const usuario = await response.json();
            setUsuarioAtual({ id: usuario.id });
          }
        }

        // Carregar anúncio
        if (id) {
          const dados = await anuncioService.obterAnuncio(id);
          setAnuncio(dados);

          // Verificar se é o dono
          if (usuarioAtual && usuarioAtual.id !== dados.usuarioId) {
            setErro("Você não tem permissão para editar este anúncio");
            setTimeout(() => navigate(-1), 2000);
          }
        }
      } catch (err) {
        setErro(
          err instanceof Error ? err.message : "Erro ao carregar anúncio",
        );
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, [id, navigate, usuarioAtual]);

  // ✅ Enviar atualização - CORRIGIDO para aceitar ambos os tipos
  const handleSubmit = async (dados: AnuncioCriacao | AnuncioAtualizacao) => {
    if (!id) return;

    setLoading(true);
    setErro(null);

    try {
      // ✅ TypeGuard para garantir que tem enderecoId
      const dadosAtualizacao = dados as AnuncioAtualizacao;

      if (!dadosAtualizacao.enderecoId) {
        throw new Error("enderecoId é obrigatório para atualização");
      }

      const anuncioAtualizado = await anuncioService.atualizarAnuncio(
        id,
        dadosAtualizacao,
      );
      navigate(`/listings/${anuncioAtualizado.id}`); // ✅ CORRIGIDO: Adicionar backticks
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao atualizar anúncio");
    } finally {
      setLoading(false);
    }
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (erro && !anuncio) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-[32px] shadow-xl text-center max-w-md">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Erro</h2>
          <p className="text-slate-500 mb-6">{erro}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold transition-all active:scale-95"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-plus-jakarta-sans text-left">
      <Header />

      <main className="flex-grow bg-[#f1f5f9] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNlMmU4ZjAiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMCAwaDQwdjE4SDBWMHptMCAyMGg0MHYxOEgwVjIwek0xOSAwaDJ2NDBoLTJWME05IDBoMnY0MEg5VjBteTIwIDBoMnY0MGgtMlYwek0wIDloNDB2MkgwVjl6bTAgMjBoNDB2MkgwVjI5eiIvPjwvZz48L2c+PC9zdmc+')] py-12 px-4 flex items-center justify-center">
        <div className="bg-white rounded-[32px] shadow-xl w-full max-w-3xl p-8 md:p-12 border border-slate-100">
          {/* Botão Voltar */}
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

          {/* Header da Seção */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <Edit3 className="text-orange-500" size={28} />
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Editar Anúncio
              </h1>
            </div>
            <p className="text-slate-500 text-[16px]">
              Atualize os detalhes do seu anúncio.
            </p>
          </div>

          {/* Exibir erro se houver */}
          {erro && (
            <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl text-sm flex items-center gap-3 animate-in fade-in">
              <AlertCircle size={20} />
              <span className="font-bold text-[16px]">{erro}</span>
            </div>
          )}

          {/* Formulário com dados pre-preenchidos */}
          {anuncio && (
            <div className="relative">
              <FormularioAnuncio
                onSubmit={handleSubmit}
                loading={loading}
                anuncioInicial={anuncio}
                isEditando={true}
              />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
