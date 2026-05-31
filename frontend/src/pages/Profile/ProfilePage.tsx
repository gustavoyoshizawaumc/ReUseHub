import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import type { UsuarioRespostaDTO } from "../../types/auth.types";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import {
  Mail,
  Phone,
  IdCard,
  Calendar,
  FileText,
  Star,
  Edit3,
  Trash2,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<UsuarioRespostaDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarPerfil = async () => {
      try {
        if (!authService.isLoggedIn()) {
          navigate("/login");
          return;
        }
        const dados = await authService.getProfile();
        setUsuario(dados);
      } catch {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    carregarPerfil();
  }, [navigate]);

  if (loading) return <div className="min-h-screen bg-[#f8fafc]" />;
  if (!usuario) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-plus-jakarta-sans">
      <Header />

      <main className="flex-grow px-3 py-6 sm:px-4 sm:py-12">
        <div className="max-w-[1000px] mx-auto text-left">
          <div className="bg-white rounded-lg shadow-sm shadow-slate-200/60 border border-slate-100 overflow-hidden">
            {/* Banner Decorativo */}
            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 w-full" />

            <div className="px-4 pb-7 sm:px-8 sm:pb-12">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-12">
                <div className="md:col-span-4 -mt-16 flex flex-col items-center text-center">
                  <div className="relative">
                    <div className="w-40 h-40 bg-white p-2 rounded-full shadow-lg overflow-hidden flex items-center justify-center">
                      <img
                        src={
                          usuario.avatarUrl
                            ? `${API_BASE_URL}${usuario.avatarUrl}`
                            : DEFAULT_AVATAR
                        }
                        alt={usuario.name}
                        className="w-full h-full rounded-full object-cover border-4 border-slate-50"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                        }}
                      />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-orange-500 text-white p-2 rounded-full border-4 border-white shadow-md">
                      <Star size={20} fill="currentColor" />
                    </div>
                  </div>

                  <div className="mt-6">
                    <h2 className="text-2xl font-bold text-slate-900 leading-tight max-w-[250px] mx-auto">
                      {usuario.name}
                    </h2>
                    <div className="flex items-center justify-center gap-2 mt-2 text-orange-600 bg-orange-50 px-4 py-1.5 rounded-full font-bold text-sm">
                      Reputação: {(usuario.reputationScore ?? 0).toFixed(1)}
                    </div>
                  </div>

                  <div className="mt-10 w-full space-y-3">
                    <button
                      onClick={() => navigate("/profile/edit")}
                      className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Edit3 size={18} /> Editar Perfil
                    </button>
                    <button
                      onClick={() => navigate("/profile/delete")}
                      className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-lg hover:bg-red-100 transition-all border border-red-100 flex items-center justify-center gap-2"
                    >
                      <Trash2 size={18} /> Excluir Conta
                    </button>
                  </div>
                </div>

                <div className="pt-2 md:col-span-8 md:pt-8">
                  <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900 sm:mb-8 sm:text-xl">
                    <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
                    Informações da Conta
                  </h3>

                  <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 sm:gap-y-10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Mail size={14} />
                        <span className="text-[10px] font-extrabold uppercase tracking-widest">
                          Email
                        </span>
                      </div>
                      <p className="break-all text-base font-semibold text-slate-900 sm:text-lg">
                        {usuario.email}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Phone size={14} />
                        <span className="text-[10px] font-extrabold uppercase tracking-widest">
                          Telefone
                        </span>
                      </div>
                      <p className="break-words text-base font-semibold text-slate-900 sm:text-lg">
                        {usuario.phone || "Não informado"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-slate-400">
                        <IdCard size={14} />
                        <span className="text-[10px] font-extrabold uppercase tracking-widest">
                          CPF
                        </span>
                      </div>
                      <p className="break-all text-base font-semibold text-slate-900 sm:text-lg">
                        {usuario.cpf}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar size={14} />
                        <span className="text-[10px] font-extrabold uppercase tracking-widest">
                          Membro Desde
                        </span>
                      </div>
                      <p className="break-words text-base font-semibold text-slate-900 sm:text-lg">
                        {new Date(usuario.createdAt ?? new Date()).toLocaleDateString(
                          "pt-BR",
                          { month: "long", year: "numeric" },
                        )}
                      </p>
                    </div>

                    <div className="space-y-1 rounded-lg border border-slate-100 bg-slate-50 p-4 sm:col-span-2 sm:p-6">
                      <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <FileText size={14} />
                        <span className="text-[10px] font-extrabold uppercase tracking-widest">
                          Biografia
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed italic">
                        {usuario.bio ||
                          "Este usuário ainda não adicionou uma biografia."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
