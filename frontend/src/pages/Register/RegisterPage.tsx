// frontend/src/pages/register/RegisterPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import type { RegisterRequest } from "../../types/auth.types";

type RegisterFormData = RegisterRequest & {
  confirmPassword: string;
};

// Componente Spinner simples para o loading state
const Spinner: React.FC = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
  </div>
);

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string>("");

  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    cpf: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    lgpdConsent: false,
  });

  const [errors, setErrors] = useState({
    name: "",
    cpf: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    lgpdConsent: "",
  });

  const validateField = (name: string, value: string | boolean): string => {
    let error = "";
    switch (name) {
      case "name":
        if (typeof value === "string" && value.trim().length < 3)
          error = "Nome deve ter no mínimo 3 caracteres.";
        break;
      case "cpf":
        if (typeof value === "string") {
          const cleanedCpf = value.replace(/[^\d]/g, "");

          if (!cleanedCpf) {
            error = "CPF é obrigatório.";
          } else if (!/^\d{11}$/.test(cleanedCpf)) {
            error = "CPF deve ter 11 dígitos.";
          }
        }
        break;
      case "email":
        if (typeof value === "string" && !/\S+@\S+\.\S+/.test(value))
          error = "E-mail inválido.";
        break;
      case "password":
        if (typeof value === "string" && value.length < 6)
          error = "Senha deve ter no mínimo 6 caracteres.";
        break;
      case "confirmPassword":
        if (typeof value === "string" && value !== formData.password)
          error = "As senhas não coincidem.";
        break;
      case "phone":
        if (typeof value === "string") {
          const cleanedPhone = value.replace(/[^\d]/g, "");

          if (!cleanedPhone) {
            error = "Telefone é obrigatório.";
          } else if (!/^\d{10,11}$/.test(cleanedPhone)) {
            error = "Telefone inválido (10 ou 11 dígitos).";
          }
        }
        break;
        break;
      case "lgpdConsent":
        if (!value) error = "Você deve aceitar os termos da LGPD.";
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, newValue),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsLoading(true);

    let hasErrors = false;
    const newErrors = { ...errors };
    for (const key in formData) {
      const fieldName = key as keyof RegisterRequest;
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
      await authService.register(formData);
      navigate("/dashboard");
    } catch (err: any) {
      setFormError(err.message || "Erro ao cadastrar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page-bg min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md px-8 py-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Criar sua Conta <br />
            <span className="logo text-reusehub-blue font-extrabold">Re</span>
            <span className="logo text-reusehub-orange font-extrabold">
              Use
            </span>
            <span className="logo text-reusehub-navy font-extrabold"> Hub</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Conecte-se a uma comunidade que troca e doa itens para um mundo mais
            sustentável.
            <br />
            Faça parte, é rápido e gratuito!
          </p>
        </div>

        {/* Erro geral */}
        {formError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-600 rounded-lg text-sm transition-all duration-300">
            {formError}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-black mb-1 text-start"
            >
              Nome Completo
            </label>
            <div className="relative flex items-center">
              <div className="field-icon-box">
                {/* icon: person */}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="w-5 h-5 text-reusehub-blue"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </div>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={() =>
                  setErrors((prev) => ({
                    ...prev,
                    name: validateField("name", formData.name),
                  }))
                }
                placeholder="Maria Santos"
                className={`field-input ${errors.name ? "border-red-400" : "border-gray-200"}`}
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-black mb-1 text-start"
            >
              E-mail
            </label>
            <div className="relative flex items-center">
              <div className="field-icon-box">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="w-5 h-5 text-reusehub-blue"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m2 7 10 7 10-7" />
                </svg>
              </div>
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
                placeholder="maria@email.com"
                className={`field-input ${errors.email ? "border-red-400" : "border-gray-200"}`}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* CPF */}
          <div>
            <label
              htmlFor="cpf"
              className="block text-sm font-semibold text-black mb-1 text-start"
            >
              CPF
            </label>
            <div className="relative flex items-center">
              <div className="field-icon-box">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="w-5 h-5 text-reusehub-blue"
                >
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <circle cx="8" cy="12" r="2" />
                  <path d="M13 10h4M13 14h4" />
                </svg>
              </div>
              <input
                type="text"
                id="cpf"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                onBlur={() =>
                  setErrors((prev) => ({
                    ...prev,
                    cpf: validateField("cpf", formData.cpf),
                  }))
                }
                placeholder="123.456.789-01"
                className={`field-input ${errors.cpf ? "border-red-400" : "border-gray-200"}`}
              />
            </div>
            {errors.cpf && (
              <p className="text-red-500 text-xs mt-1">{errors.cpf}</p>
            )}
          </div>

          {/* Telefone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-semibold text-black mb-1 text-start"
            >
              Telefone (Celular){" "}
            </label>
            <div className="relative flex items-center">
              <div className="field-icon-box">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="w-5 h-5 text-reusehub-blue"
                >
                  <rect x="5" y="2" width="14" height="20" rx="2" />
                  <circle cx="12" cy="17" r="1" fill="currentColor" />
                </svg>
              </div>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={() =>
                  setErrors((prev) => ({
                    ...prev,
                    phone: validateField("phone", formData.phone),
                  }))
                }
                placeholder="(11) 98765-4321"
                className={`field-input ${errors.phone ? "border-red-400" : "border-gray-200"}`}
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-black mb-1 text-start"
            >
              Senha
            </label>
            <div className="relative flex items-center">
              <div className="field-icon-box">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="w-5 h-5 text-reusehub-blue"
                >
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
              </div>
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
                className={`field-input pr-10 ${errors.password ? "border-red-400" : "border-gray-200"}`}
              />
              {/* ícone olho desativado — igual ao mockup */}
              <span className="absolute right-3 text-gray-300 pointer-events-none">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="w-4 h-4"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </span>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirmar Senha — campo novo */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-semibold text-black mb-1 text-start"
            >
              Confirmar Senha
            </label>
            <div className="relative flex items-center">
              <div className="field-icon-box">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="w-5 h-5 text-reusehub-blue"
                >
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
              </div>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword ?? ""}
                onChange={handleChange}
                onBlur={() =>
                  setErrors((prev) => ({
                    ...prev,
                    confirmPassword:
                      formData.confirmPassword !== formData.password
                        ? "As senhas não coincidem."
                        : "",
                  }))
                }
                placeholder="••••••"
                className={`field-input ${errors.confirmPassword ? "border-red-400" : "border-gray-200"}`}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* LGPD / Termos */}
          <div>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="lgpdConsent"
                name="lgpdConsent"
                checked={formData.lgpdConsent}
                onChange={handleChange}
                onBlur={() =>
                  setErrors((prev) => ({
                    ...prev,
                    lgpdConsent: validateField(
                      "lgpdConsent",
                      formData.lgpdConsent,
                    ),
                  }))
                }
                className="mt-0.5 w-4 h-4 accent-reusehub-blue cursor-pointer"
              />
              <label
                htmlFor="lgpdConsent"
                className="text-sm text-gray-600 leading-snug"
              >
                Li e concordo com os{" "}
                <a
                  href="/terms"
                  className="text-reusehub-blue underline font-medium"
                >
                  Termos de Uso
                </a>{" "}
                e{" "}
                <a
                  href="/privacy"
                  className="text-reusehub-blue underline font-medium"
                >
                  Política de Privacidade
                </a>
              </label>
            </div>
            {errors.lgpdConsent && (
              <p className="text-red-500 text-xs mt-1 ml-7">
                {errors.lgpdConsent}
              </p>
            )}
          </div>

          {/* Botão Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-reusehub-orange hover:bg-[#e06a08] disabled:opacity-60 text-white font-semibold py-3 rounded-full transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg mt-2"
          >
            {isLoading ? <Spinner /> : "Cadastrar-se"}
          </button>
        </form>

        {/* Link para Login */}
        <p className="text-center mt-5 text-sm text-gray-500">
          Já tem uma conta?{" "}
          <a
            href="/login"
            className="text-reusehub-blue font-semibold hover:underline transition-colors duration-200"
          >
            Entrar
          </a>
        </p>
      </div>
    </div>
  );
};
