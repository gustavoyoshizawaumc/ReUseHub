import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import { listarAvaliacoesRecebidas } from "../../services/avaliacaoService";
import type { UsuarioRespostaDTO } from "../../types/auth.types";
import type { AvaliacaoResposta } from "../../types/avaliacao.types";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { AvaliacoesCarousel } from "../../components/profile/AvaliacoesCarousel";
import {
  Mail,
  Phone,
  IdCard,
  Calendar,
  FileText,
  Star,
  Edit3,
  Power,
  Trash2,
} from "lucide-react";
import { obterUrlImagem } from "../../utils/imagens";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<UsuarioRespostaDTO | null>(null);
  const [avaliacoesRecebidas, setAvaliacoesRecebidas] = useState<AvaliacaoResposta[]>([]);
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
        try {
          setAvaliacoesRecebidas(await listarAvaliacoesRecebidas(dados.id));
        } catch {
          setAvaliacoesRecebidas([]);
        }
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

      <main className="flex-grow px-3 py-6 sm:px-4 sm:py-10">
        <div className="mx-auto max-w-6xl space-y-6 text-left">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">
              Minha conta
            </p>
            <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">Perfil</h1>
          </div>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
            <aside className="rounded-md border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="h-32 w-32 overflow-hidden rounded-md border border-slate-200 bg-slate-50 p-1">
                    <img
                      src={obterUrlImagem(usuario.avatarUrl, DEFAULT_AVATAR) ?? DEFAULT_AVATAR}
                      alt={usuario.name}
                      className="h-full w-full rounded object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-md border border-orange-100 bg-white px-3 py-1 text-xs font-black text-orange-600 shadow-sm">
                    <Star size={14} fill="currentColor" />
                    {(usuario.reputationScore ?? 0).toFixed(1)}
                  </div>
                </div>

                <h2 className="mt-7 max-w-full break-words text-xl font-black text-slate-950">
                  {usuario.name}
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Membro desde{" "}
                  {new Date(usuario.createdAt ?? new Date()).toLocaleDateString("pt-BR", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-2">
                <button
                  onClick={() => navigate("/profile/edit")}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-blue-700"
                >
                  <Edit3 size={17} /> Editar perfil
                </button>
                <button
                  onClick={() => navigate("/profile/deactivate")}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-black text-orange-700 transition-colors hover:bg-orange-100"
                >
                  <Power size={17} /> Desativar conta
                </button>
                <button
                  onClick={() => navigate("/profile/delete")}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-600 transition-colors hover:bg-red-100"
                >
                  <Trash2 size={17} /> Excluir conta
                </button>
              </div>
            </aside>

            <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6">
              <div className="flex flex-col gap-1 border-b border-slate-100 pb-5">
                <h3 className="text-lg font-black text-slate-950">Informações da conta</h3>
                <p className="text-sm font-medium text-slate-500">
                  Dados principais usados no ReUseHub.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 py-5 sm:grid-cols-2">
                <InfoItem icon={Mail} label="Email" value={usuario.email} />
                <InfoItem icon={Phone} label="Telefone" value={usuario.phone || "Não informado"} />
                <InfoItem icon={IdCard} label="CPF" value={usuario.cpf} />
                <InfoItem
                  icon={Calendar}
                  label="Cadastro"
                  value={new Date(usuario.createdAt ?? new Date()).toLocaleDateString("pt-BR")}
                />
              </div>

              <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-slate-400">
                  <FileText size={15} />
                  <span className="text-[11px] font-black uppercase tracking-widest">
                    Biografia
                  </span>
                </div>
                <p className="leading-relaxed text-slate-600">
                  {usuario.bio || "Este usuário ainda não adicionou uma biografia."}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-xl font-black text-slate-950">Avaliações recebidas</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Feedbacks deixados por usuários com quem você negociou.
              </p>
            </div>
            <AvaliacoesCarousel
              avaliacoes={avaliacoesRecebidas}
              onAbrirPerfil={(usuarioId) => navigate(`/perfil/${usuarioId}`)}
            />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

type InfoItemProps = {
  icon: React.ElementType;
  label: string;
  value: string;
};

const InfoItem: React.FC<InfoItemProps> = ({ icon: Icon, label, value }) => (
  <div className="rounded-md border border-slate-100 bg-white p-4">
    <div className="mb-2 flex items-center gap-2 text-slate-400">
      <Icon size={15} />
      <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <p className="break-words text-sm font-extrabold text-slate-950 sm:text-base">{value}</p>
  </div>
);
