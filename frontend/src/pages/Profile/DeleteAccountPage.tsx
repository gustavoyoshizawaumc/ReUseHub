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
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : "Erro ao deletar conta";
      setError(mensagem);
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-plus-jakarta-sans text-left">
      <Header />

      <main className="flex flex-grow items-center justify-center bg-[#f1f5f9] px-3 py-6 sm:px-4 sm:py-12">
        <div className="w-full max-w-2xl rounded-lg border border-slate-100 bg-white p-5 shadow-sm sm:p-8 md:p-12">
          <button
            onClick={() => navigate("/profile")}
            className="group mb-6 flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-blue-600 sm:mb-8"
          >
            <ArrowLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Voltar ao perfil
          </button>

          <div className="mb-7 text-center md:mb-10 md:text-left">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Encerrar Conta
            </h1>
            <p className="text-slate-500 mt-2">
              Lamentamos ver você partir. Por favor, leia os avisos abaixo.
            </p>
          </div>

          <div className="mb-7 flex flex-col items-start gap-4 rounded-lg border-2 border-red-100 bg-red-50 p-4 sm:mb-10 sm:flex-row sm:p-6">
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
                  className="w-full px-5 py-4 border-2 border-slate-100 rounded-lg focus:ring-4 focus:ring-red-50 focus:border-red-500 bg-slate-50/50 text-slate-800 outline-none transition-all font-mono font-bold text-[16px] placeholder:font-sans placeholder:font-medium"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={() => navigate("/profile")}
                className="flex-1 py-4 border-2 border-slate-100 text-slate-500 font-bold rounded-lg hover:bg-slate-50 transition-all active:scale-[0.98]"
              >
                Manter minha conta
              </button>

              <button
                onClick={handleDeleteAccount}
                disabled={loading || confirmacao !== "DELETAR MINHA CONTA"}
                className="flex-[1.5] bg-red-600 text-white font-bold py-4 rounded-lg hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
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
