// frontend/src/pages/login/LoginPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import type { LoginRequest } from "../../types/auth.types";

// Componente Spinner simples para o loading state
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

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
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
    <div className="min-h-screen bg-gradient-reusehub flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 sm:p-8 lg:p-10 transform transition-all duration-300 hover:scale-105">
        {/* Header com Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-reusehub-blue tracking-tight">
            ReUseHub
          </h1>
          <p className="text-reusehub-gray mt-2 text-lg">
            Faça login na sua conta
          </p>
          <div className="flex justify-center space-x-4 mt-4">
            <span className="bg-reusehub-green text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
              Doação
            </span>
            <span className="bg-reusehub-purple text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
              Troca
            </span>
          </div>
        </div>

        {/* Erro geral do formulário */}
        {formError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm transition-all duration-300">
            {formError}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              E-mail
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                ✉️
              </span>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={() =>
                  setErrors((prev) => ({
                    ...prev,
                    email: validateField("email", formData.email),
                  }))
                }
                placeholder="seu@email.com"
                className={`w-full pl-10 pr-4 py-2 border ${errors.email ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-reusehub-blue focus:border-transparent outline-none transition-all duration-200`}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Senha
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                🔒
              </span>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={() =>
                  setErrors((prev) => ({
                    ...prev,
                    password: validateField("password", formData.password),
                  }))
                }
                placeholder="••••••"
                className={`w-full pl-10 pr-4 py-2 border ${errors.password ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-reusehub-blue focus:border-transparent outline-none transition-all duration-200`}
              />
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {/* Botão Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-reusehub-orange hover:bg-[#e65c2e] text-white font-semibold py-3 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
          >
            {isLoading ? <Spinner /> : "Entrar"}
          </button>
        </form>

        {/* Link para Cadastro */}
        <p className="text-center mt-6 text-gray-600 text-sm">
          Não tem conta?{" "}
          <a
            href="/register"
            className="text-reusehub-blue hover:underline font-medium transition-colors duration-200"
          >
            Cadastre-se
          </a>
        </p>
      </div>
    </div>
  );
};
