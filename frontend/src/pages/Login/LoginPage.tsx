// frontend/src/pages/login/LoginPage.tsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../../services/authService";
import type { LoginRequest } from "../../types/auth.types";

const Spinner: React.FC = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
  </div>
);

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string>("");

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
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
      await authService.login(formData);
      navigate("/dashboard");
    } catch (err: any) {
      setFormError(
        err.message || "Erro ao fazer login. Verifique suas credenciais.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Fundo quadriculado igual ao de cadastro
    <div className="min-h-screen bg-[#f1f5f9] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNlMmU4ZjAiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMCAwaDQwdjE4SDBWMHptMCAyMGg0MHYxOEgwVjIwek0xOSAwaDJ2NDBoLTJWME05IDBoMnY0MEg5VjBteTIwIDBoMnY0MGgtMlYwek0wIDloNDB2MkgwVjl6bTAgMjBoNDB2MkgwVjI5eiIvPjwvZz48L2c+PC9zdmciPg==')] flex items-center justify-center p-4">
      {/* Card Branco com rounded-3xl */}
      <div className="bg-white rounded-[32px] shadow-xl w-full max-w-md p-10 md:p-12 border border-slate-100 animate-fade-in">
        {/* Header com a Logo Estilizada */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-plus-jakarta-sans">
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
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl text-sm animate-shake">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo E-mail */}
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

          {/* Campo Senha */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label
                htmlFor="password"
                className="block text-left text-sm font-bold text-slate-800"
              >
                Senha
              </label>
              <a
                href="#"
                className="text-[11px] font-bold text-blue-600 hover:text-orange-600 transition-colors"
              >
                Esqueceu a senha?
              </a>
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

          {/* Botão Entrar com Orange vibrante */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-600 text-white font-bold py-4 rounded-full text-base shadow-lg shadow-orange-200 hover:bg-orange-700 hover:shadow-orange-300 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? <Spinner /> : "Entrar"}
          </button>
        </form>

        {/* Rodapé - Link para Cadastro */}
        <div className="mt-12 text-center text-sm">
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
