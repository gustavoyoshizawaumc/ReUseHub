import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "../../services/authService";

const Spinner: React.FC = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
  </div>
);

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const validateEmail = (value: string): string => {
    if (!value) return "E-mail é obrigatório.";
    if (!/\S+@\S+\.\S+/.test(value)) return "E-mail inválido.";
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError(validateEmail(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }

    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setEnviado(true);
    } catch {
      // Mesmo em caso de erro inesperado, mostramos a mensagem genérica
      setEnviado(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm w-full max-w-md p-10 md:p-12 border border-slate-100 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="mb-4 flex justify-center">
            <h2 className="text-3xl font-bold">
              <span className="text-blue-600">Re</span>
              <span className="text-orange-500">Use</span>
              <span className="text-slate-950">Hub</span>
            </h2>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Recuperar senha
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Informe seu e-mail e enviaremos um link para redefinir sua senha.
          </p>
        </div>

        {enviado ? (
          /* Estado de sucesso — resposta genérica */
          <div className="text-center space-y-6">
            <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-green-50">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <p className="text-slate-700 font-semibold text-base">
                Verifique seu e-mail
              </p>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Se o e-mail <strong>{email}</strong> estiver cadastrado, você
                receberá as instruções para redefinir sua senha em breve.
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Não se esqueça de verificar a pasta de spam.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-block w-full bg-orange-600 text-white font-bold py-3 rounded-full text-sm hover:bg-orange-700 transition-all text-center"
            >
              Voltar para o login
            </Link>
          </div>
        ) : (
          /* Formulário */
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="flex justify-start text-sm font-bold text-slate-800"
              >
                E-mail
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-600 group-focus-within:text-orange-500 transition-colors duration-200">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  className={`w-full pl-12 pr-4 py-3.5 border ${
                    emailError
                      ? "border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:ring-orange-100 focus:border-orange-300"
                  } rounded-xl bg-slate-50/50 text-slate-800 placeholder-slate-400 transition-all outline-none focus:ring-4`}
                />
              </div>
              {emailError && (
                <p className="text-red-500 text-[11px] font-medium ml-1">
                  {emailError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-600 text-white font-bold py-4 rounded-full text-base shadow-sm hover:bg-orange-700 hover:shadow-orange-300 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? <Spinner /> : "Enviar link de recuperação"}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm font-bold text-blue-600 hover:text-orange-600 transition-colors"
              >
                ← Voltar para o login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
