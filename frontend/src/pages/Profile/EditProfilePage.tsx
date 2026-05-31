import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import {
  User,
  Phone,
  FileText,
  Camera,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";

const Spinner: React.FC = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
  </div>
);

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(() => {
    const usuario = authService.getUser();
    return {
      name: usuario?.name || "",
      phone: usuario?.phone || "",
      bio: usuario?.bio || "",
      avatarFile: null as File | null,
      avatarPreview: usuario?.avatarUrl || "",
    };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authService.getUser()) {
      navigate("/login");
    }
  }, [navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Selecione uma imagem válida (JPG ou PNG)");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          avatarFile: file,
          avatarPreview: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await authService.updateProfile(
        {
          name: formData.name,
          phone: formData.phone,
          bio: formData.bio,
          avatarUrl: "",
        },
        formData.avatarFile || undefined,
      );

      setSuccess(true);
      setTimeout(() => navigate("/profile"), 1500);
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : "Erro ao atualizar perfil";
      setError(mensagem);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarPreview = () => {
    if (!formData.avatarPreview) return DEFAULT_AVATAR;
    if (
      formData.avatarPreview.startsWith("http") ||
      formData.avatarPreview.startsWith("data:")
    ) {
      return formData.avatarPreview;
    }
    return `${API_BASE_URL}${formData.avatarPreview.startsWith("/") ? "" : "/"}${formData.avatarPreview}`;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-plus-jakarta-sans text-left">
      <Header />

      <main className="flex-grow bg-[#f1f5f9] px-3 py-6 sm:px-4 sm:py-12 flex items-center justify-center">
        <div className="w-full max-w-2xl rounded-lg border border-slate-100 bg-white p-5 shadow-sm sm:p-8 md:p-12">
          <button
            onClick={() => navigate("/profile")}
            className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-blue-600 group sm:mb-8"
          >
            <ArrowLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Voltar ao perfil
          </button>

          <div className="mb-7 text-center md:mb-10 md:text-left">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Editar Perfil
            </h1>
            <p className="text-slate-500 mt-2 text-[16px]">
              Altere sua foto e informações pessoais.
            </p>
          </div>

          {success && (
            <div className="mb-8 p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 rounded-r-xl text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
              <CheckCircle2 size={20} />
              <span className="font-bold text-[16px]">
                Perfil atualizado com sucesso! Redirecionando...
              </span>
            </div>
          )}

          {error && (
            <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl text-sm flex items-center gap-3">
              <AlertCircle size={20} />
              <span className="font-bold text-[16px]">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-600 shadow-lg bg-slate-100">
                  <img
                    src={getAvatarPreview()}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                    }}
                  />
                </div>
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2.5 rounded-full cursor-pointer hover:bg-blue-700 shadow-md transition-all border-4 border-white active:scale-90">
                  <Camera size={20} />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                Clique na câmera para mudar a foto
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-extrabold text-slate-800 uppercase tracking-widest ml-1">
                Nome Completo
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-600 group-focus-within:text-orange-500 transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                  placeholder="Seu nome completo"
                  className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-lg focus:ring-4 focus:ring-blue-50 focus:border-blue-500 bg-slate-50/50 text-slate-800 outline-none transition-all text-[16px]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-extrabold text-slate-800 uppercase tracking-widest ml-1">
                Telefone
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-600 group-focus-within:text-orange-500 transition-colors">
                  <Phone size={20} />
                </div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, phone: e.target.value }))
                  }
                  placeholder="(11) 98765-4321"
                  className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-lg focus:ring-4 focus:ring-blue-50 focus:border-blue-500 bg-slate-50/50 text-slate-800 outline-none transition-all text-[16px]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[11px] font-extrabold text-slate-800 uppercase tracking-widest">
                  Biografia
                </label>
                <span className="text-[10px] font-bold text-slate-400">
                  {(formData.bio || "").length}/500
                </span>
              </div>
              <div className="relative group">
                <div className="absolute top-4 left-4 text-blue-600 group-focus-within:text-orange-500 transition-colors">
                  <FileText size={20} />
                </div>
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, bio: e.target.value }))
                  }
                  maxLength={500}
                  rows={4}
                  placeholder="Conte um pouco sobre você..."
                  className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-lg focus:ring-4 focus:ring-blue-50 focus:border-blue-500 bg-slate-50/50 text-slate-800 outline-none transition-all text-[16px] resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="flex-1 py-4 border-2 border-slate-100 text-slate-500 font-bold rounded-lg hover:bg-slate-50 transition-all active:scale-[0.98]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-orange-600 text-white font-bold py-4 rounded-lg hover:bg-orange-700 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-[0.98]"
              >
                {loading ? <Spinner /> : "Salvar Alterações"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};
