import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../../services/authService";
import type { LoginRequest } from "../../types/auth.types";
import { isPerfilOperacional } from "../../utils/perfil";

const Spinner: React.FC = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
  </div>
);

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string>("");
  const [canReactivate, setCanReactivate] = useState(false);

  const [formData, setFormData] = useState<LoginRequest>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const validateField = (name: string, value: string): string => {
    let error = "";
    switch (name) {
      case "email":
        if (!/\S+@\S+\.\S+/.test(value)) error = "E-mail inválido.";
        break;
      case "password":
        if (value.length < 6) error = "Senha deve ter no mínimo 6 caracteres.";
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    setCanReactivate(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setCanReactivate(false);
    setIsLoading(true);

    let hasErrors = false;
    const newErrors = { ...errors };
    for (const key in formData) {
      const fieldName = key as keyof LoginRequest;
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        hasErrors = true;
      }
    }
    setErrors(newErrors);

    if (hasErrors) {
      setFormError("Por favor, corrija os erros no formulário.");
      setIsLoading(false);
      return;
    }

    try {
      const usuario = await authService.login(formData);
      navigate(isPerfilOperacional(usuario.perfil) ? "/moderacao" : "/");
    } catch (err) {
      const mensagem = err instanceof Error
        ? err.message
        : "Erro ao fazer login. Verifique suas credenciais.";
      setFormError(mensagem);
      setCanReactivate(mensagem.toLowerCase().includes("desativada"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivate = async () => {
    setIsLoading(true);
    setFormError("");

    try {
      const usuario = await authService.reactivateAccount(formData);
      navigate(isPerfilOperacional(usuario.perfil) ? "/moderacao" : "/");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao reativar conta.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-4">
      {}
      <div className="w-[calc(100vw-2rem)] min-w-0 max-w-md rounded-lg border border-slate-100 bg-white p-6 shadow-sm animate-fade-in sm:p-10 md:p-12">
        {}
        <div className="mb-8 text-center sm:mb-10">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-plus-jakarta-sans sm:text-3xl">
            Faça login na sua conta
          </h1>
          <div className="mt-4 mb-6 flex justify-center">
            <h2 className="text-3xl font-bold">
              <span className="text-blue-600">Re</span>
              <span className="text-orange-500">Use</span>
              <span className="text-slate-950">Hub</span>
            </h2>
          </div>
        </div>

        {formError && (
          <div className="mb-6 rounded-r-xl border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-700 animate-shake">
            <p>{formError}</p>
            {canReactivate && (
              <button
                type="button"
                onClick={handleReactivate}
                disabled={isLoading}
                className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reativar minha conta
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {}
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
                value={formData.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                className={`w-full pl-12 pr-4 py-3.5 border ${errors.email ? "border-red-400 focus:ring-red-100" : "border-slate-200 focus:ring-orange-100 focus:border-orange-300"} rounded-xl bg-slate-50/50 text-slate-800 placeholder-slate-400 transition-all outline-none focus:ring-4`}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-[11px] font-medium ml-1">
                {errors.email}
              </p>
            )}
          </div>

          {}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label
                htmlFor="password"
                className="block text-left text-sm font-bold text-slate-800"
              >
                Senha
              </label>
              <Link
                to="/esqueci-senha"
                className="text-[11px] font-bold text-blue-600 hover:text-orange-600 transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••"
                className={`w-full pl-12 pr-4 py-3.5 border ${errors.password ? "border-red-400 focus:ring-red-100" : "border-slate-200 focus:ring-orange-100 focus:border-orange-300"} rounded-xl bg-slate-50/50 text-slate-800 placeholder-slate-400 transition-all outline-none focus:ring-4`}
              />
            </div>
            {errors.password && (
              <p className="text-red-500 text-[11px] font-medium ml-1">
                {errors.password}
              </p>
            )}
          </div>

          {}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-600 text-white font-bold py-4 rounded-full text-base shadow-sm hover:bg-orange-700 hover:shadow-orange-300 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? <Spinner /> : "Entrar"}
          </button>
        </form>

        {}
        <div className="mt-8 text-center text-sm sm:mt-12">
          <p className="text-slate-500">
            Não tem conta?{" "}
            <Link
              to="/register"
              className="font-bold text-blue-600 hover:text-orange-600 transition-colors duration-200"
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
