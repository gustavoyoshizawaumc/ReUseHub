import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CirclePower, Info, ShieldAlert } from "lucide-react";
import { Footer } from "../../components/Footer";
import { Header } from "../../components/Header";
import { authService } from "../../services/authService";

const CONFIRMACAO = "DESATIVAR MINHA CONTA";

const Spinner: React.FC = () => (
  <div className="flex items-center justify-center">
    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
  </div>
);

export const DeactivateAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const [confirmacao, setConfirmacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDeactivateAccount = async () => {
    if (confirmacao !== CONFIRMACAO) return;

    setLoading(true);
    setError("");

    try {
      await authService.deactivateAccount();
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao desativar conta");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc] text-left font-plus-jakarta-sans">
      <Header />

      <main className="flex flex-grow items-center justify-center bg-[#f1f5f9] px-3 py-6 sm:px-4 sm:py-12">
        <div className="w-full max-w-2xl rounded-lg border border-slate-100 bg-white p-5 shadow-sm sm:p-8 md:p-12">
          <button
            onClick={() => navigate("/profile")}
            className="group mb-6 flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-blue-600 sm:mb-8"
          >
            <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
            Voltar ao perfil
          </button>

          <div className="mb-7 md:mb-10">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Desativar conta
            </h1>
            <p className="mt-2 text-slate-500">
              Sua conta fica pausada e pode ser reativada apos 3 dias com seu e-mail e senha.
            </p>
          </div>

          <div className="mb-7 flex gap-4 rounded-lg border border-orange-100 bg-orange-50 p-4 sm:mb-10 sm:p-6">
            <div className="shrink-0 rounded-lg bg-orange-100 p-3 text-orange-700">
              <Info size={22} />
            </div>
            <div>
              <h2 className="mb-1 font-bold text-orange-900">O que acontece ao desativar</h2>
              <p className="text-sm leading-relaxed text-orange-800/80">
                Seus anuncios ativos e solicitacoes pendentes serao cancelados. Seu historico fica
                preservado e voce pode voltar pelo login apos o periodo de seguranca de 3 dias. Negociacoes em andamento precisam ser
                concluidas ou canceladas antes.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-8 flex items-center gap-2 rounded-r-lg border-l-4 border-red-500 bg-red-100 p-4 text-sm font-bold text-red-700">
              <ShieldAlert size={18} />
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="ml-1 text-[11px] font-extrabold uppercase tracking-widest text-slate-800">
                Confirmacao de seguranca
              </label>
              <p className="mb-4 text-sm text-slate-500">
                Para prosseguir, digite exatamente{" "}
                <span className="font-bold text-slate-900 underline">{CONFIRMACAO}</span>.
              </p>
              <input
                type="text"
                value={confirmacao}
                onChange={(event) => setConfirmacao(event.target.value)}
                placeholder="Digite aqui..."
                className="w-full rounded-lg border-2 border-slate-100 bg-slate-50/50 px-5 py-4 font-mono text-[16px] font-bold text-slate-800 outline-none transition-all placeholder:font-sans placeholder:font-medium focus:border-orange-500 focus:ring-4 focus:ring-orange-50"
              />
            </div>

            <div className="flex flex-col gap-4 pt-4 sm:flex-row">
              <button
                onClick={() => navigate("/profile")}
                className="flex-1 rounded-lg border-2 border-slate-100 py-4 font-bold text-slate-500 transition-all hover:bg-slate-50 active:scale-[0.98]"
              >
                Manter minha conta
              </button>
              <button
                onClick={handleDeactivateAccount}
                disabled={loading || confirmacao !== CONFIRMACAO}
                className="flex-[1.5] flex items-center justify-center gap-2 rounded-lg bg-orange-600 py-4 font-bold text-white shadow-lg shadow-orange-100 transition-all hover:bg-orange-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
              >
                {loading ? <Spinner /> : <><CirclePower size={20} /> Desativar conta</>}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
