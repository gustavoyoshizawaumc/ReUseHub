import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { AlertTriangle, Trash2, ArrowLeft, ShieldAlert } from "lucide-react";

const Spinner: React.FC = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
  </div>
);

export const DeleteAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const [confirmacao, setConfirmacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDeleteAccount = async () => {
    if (confirmacao !== "DELETAR MINHA CONTA") return;

    setLoading(true);
    setError("");

    try {
      await authService.deleteAccount();
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Erro ao deletar conta");
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-plus-jakarta-sans text-left">
      <Header />

      <main className="flex-grow bg-[#f1f5f9] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNlMmU4ZjAiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMCAwaDQwdjE4SDBWMHptMCAyMGg0MHYxOEgwVjIwek0xOSAwaDJ2NDBoLTJWME05IDBoMnY0MEg5VjBteTIwIDBoMnY0MGgtMlYwek0wIDloNDB2MkgwVjl6bTAgMjBoNDB2MkgwVjI5eiIvPjwvZz48L2c+PC9zdmciPg==')] py-12 px-4 flex items-center justify-center">
        <div className="bg-white rounded-[32px] shadow-xl w-full max-w-2xl p-8 md:p-12 border border-slate-100">
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold text-sm mb-8 transition-colors group"
          >
            <ArrowLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Voltar ao perfil
          </button>

          <div className="text-center md:text-left mb-10">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Encerrar Conta
            </h1>
            <p className="text-slate-500 mt-2">
              Lamentamos ver você partir. Por favor, leia os avisos abaixo.
            </p>
          </div>

          <div className="bg-red-50 border-2 border-red-100 p-6 rounded-2xl mb-10 flex items-start gap-4">
            <div className="bg-red-100 p-3 rounded-xl text-red-600 shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2 className="text-red-800 font-bold text-lg mb-1">
                Ação Irreversível
              </h2>
              <p className="text-red-700/80 text-sm leading-relaxed">
                Ao confirmar, seu perfil ficará <strong>inativo</strong> em
                nossa plataforma. Seus anúncios serão removidos e você{" "}
                <strong>não conseguirá mais acessar sua conta</strong> ou
                recuperar seus dados.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-r-xl text-sm font-bold flex items-center gap-2">
              <ShieldAlert size={18} />
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-extrabold text-slate-800 uppercase tracking-widest ml-1">
                Confirmação de Segurança
              </label>
              <p className="text-sm text-slate-500 mb-4">
                Para prosseguir, digite exatamente{" "}
                <span className="font-bold text-slate-900 underline">
                  DELETAR MINHA CONTA
                </span>{" "}
                no campo abaixo:
              </p>

              <div className="relative group">
                <input
                  type="text"
                  value={confirmacao}
                  onChange={(e) => setConfirmacao(e.target.value)}
                  placeholder="Digite aqui..."
                  className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-red-50 focus:border-red-500 bg-slate-50/50 text-slate-800 outline-none transition-all font-mono font-bold text-[16px] placeholder:font-sans placeholder:font-medium"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={() => navigate("/profile")}
                className="flex-1 py-4 border-2 border-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all active:scale-[0.98]"
              >
                Manter minha conta
              </button>

              <button
                onClick={handleDeleteAccount}
                disabled={loading || confirmacao !== "DELETAR MINHA CONTA"}
                className="flex-[1.5] bg-red-600 text-white font-bold py-4 rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {loading ? (
                  <Spinner />
                ) : (
                  <>
                    <Trash2 size={20} />
                    Deletar Permanentemente
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
