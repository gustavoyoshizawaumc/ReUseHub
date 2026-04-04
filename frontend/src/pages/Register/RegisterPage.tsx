// frontend/src/pages/register/RegisterPage.tsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../../services/authService";
import type { RegisterRequest } from "../../types/auth.types";

type RegisterFormData = RegisterRequest & {
  confirmPassword: string;
};

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
          if (!cleanedCpf) error = "CPF é obrigatório.";
          else if (!/^\d{11}$/.test(cleanedCpf))
            error = "CPF deve ter 11 dígitos.";
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
          if (!cleanedPhone) error = "Telefone é obrigatório.";
          else if (!/^\d{10,11}$/.test(cleanedPhone))
            error = "Telefone inválido.";
        }
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
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, newValue) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsLoading(true);

    let hasErrors = false;
    const newErrors = { ...errors };

    (Object.keys(formData) as Array<keyof RegisterFormData>).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error && key in newErrors) {
        newErrors[key as keyof typeof errors] = error;
        hasErrors = true;
      }
    });

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
    <div className="min-h-screen bg-[#f1f5f9] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNlMmU4ZjAiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMCAwaDQwdjE4SDBWMHptMCAyMGg0MHYxOEgwVjIwek0xOSAwaDJ2NDBoLTJWME05IDBoMnY0MEg5VjBteTIwIDBoMnY0MGgtMlYwek0wIDloNDB2MkgwVjl6bTAgMjBoNDB2MkgwVjI5eiIvPjwvZz48L2c+PC9zdmciPg==')] flex items-center justify-center p-4 sm:p-8">
      <div className="bg-white rounded-[32px] shadow-xl w-full max-w-lg p-8 md:p-10 border border-slate-100 my-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-plus-jakarta-sans m-0">
            Criar sua Conta
          </h1>
          <div className="mt-2 mb-2 flex justify-center">
            <h2 className="text-3xl font-bold">
              <span className="text-blue-600">Re</span>
              <span className="text-orange-500">Use</span>
              <span className="text-slate-950">Hub</span>
            </h2>
          </div>
          <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
            Conecte-se a uma comunidade sustentável.
          </p>
        </div>

        {formError && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl text-sm">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            {
              id: "name",
              label: "Nome Completo",
              placeholder: "Maria Santos",
              type: "text",
              icon: (
                <>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </>
              ),
            },
            {
              id: "email",
              label: "E-mail",
              placeholder: "maria@email.com",
              type: "email",
              icon: (
                <>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </>
              ),
            },
            {
              id: "cpf",
              label: "CPF",
              placeholder: "123.456.789-01",
              type: "text",
              icon: (
                <>
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </>
              ),
            },
            {
              id: "phone",
              label: "Telefone (Celular)",
              placeholder: "(11) 98765-4321",
              type: "text",
              icon: (
                <>
                  <rect x="5" y="2" width="14" height="20" rx="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </>
              ),
            },
          ].map((field) => (
            <div key={field.id} className="space-y-1">
              <label
                htmlFor={field.id}
                className="flex justify-start text-sm font-bold text-slate-800 ml-1"
              >
                {field.label}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-600 group-focus-within:text-orange-500 transition-colors">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    {field.icon}
                  </svg>
                </div>
                <input
                  id={field.id}
                  name={field.id}
                  type={field.type}
                  value={(formData as any)[field.id]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className={`w-full pl-12 pr-4 py-2 text-[16px] border ${errors[field.id as keyof typeof errors] ? "border-red-400 focus:ring-red-50" : "border-slate-200 focus:ring-orange-50 focus:border-orange-300"} rounded-xl bg-slate-50/50 text-slate-800 transition-all outline-none focus:ring-2`}
                />
              </div>
              {errors[field.id as keyof typeof errors] && (
                <p className="text-red-500 text-[10px] font-bold ml-2">
                  {errors[field.id as keyof typeof errors]}
                </p>
              )}
            </div>
          ))}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["password", "confirmPassword"].map((id) => (
              <div key={id} className="space-y-1">
                <label className="flex justify-start text-sm font-bold text-slate-800 ml-1">
                  {id === "password" ? "Senha" : "Confirmar Senha"}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-600 group-focus-within:text-orange-500">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input
                    name={id}
                    type="password"
                    value={(formData as any)[id]}
                    onChange={handleChange}
                    placeholder="••••••"
                    className={`w-full pl-12 pr-4 py-2 text-[16px] border ${errors[id as keyof typeof errors] ? "border-red-400" : "border-slate-200 focus:border-orange-300"} rounded-xl bg-slate-50/50 outline-none transition-all focus:ring-2 focus:ring-orange-50`}
                  />
                </div>
                {errors[id as keyof typeof errors] && (
                  <p className="text-red-500 text-[10px] font-bold ml-2">
                    {errors[id as keyof typeof errors]}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="pt-1">
            <div className="flex items-start gap-3 p-1">
              <input
                type="checkbox"
                id="lgpdConsent"
                name="lgpdConsent"
                checked={formData.lgpdConsent}
                onChange={handleChange}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
              />
              <label
                htmlFor="lgpdConsent"
                className="text-xs text-slate-500 leading-relaxed"
              >
                Li e concordo com os{" "}
                <Link
                  to="/terms"
                  className="text-blue-600 font-bold hover:underline"
                >
                  Termos de Uso
                </Link>{" "}
                e{" "}
                <Link
                  to="/privacy"
                  className="text-blue-600 font-bold hover:underline"
                >
                  Política de Privacidade
                </Link>
                .
              </label>
            </div>
            {errors.lgpdConsent && (
              <p className="text-red-500 text-[10px] font-bold mt-1 ml-8">
                {errors.lgpdConsent}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-600 text-white font-bold py-3 rounded-full text-base shadow-lg shadow-orange-100 hover:bg-orange-700 active:scale-[0.98] transition-all duration-200 mt-2"
          >
            {isLoading ? <Spinner /> : "Criar Conta"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-slate-500">
            Já tem uma conta?{" "}
            <Link
              to="/login"
              className="font-bold text-blue-600 hover:text-orange-600 transition-colors"
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
