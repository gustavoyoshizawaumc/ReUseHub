import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../../services/authService";

const Spinner: React.FC = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
  </div>
);

/**
 * Regra de senha forte: mínimo 8 caracteres, com pelo menos uma letra
 * maiúscula, uma minúscula, um número e um caractere especial.
 * Deve espelhar o @Pattern do RedefinirSenhaRequest no backend.
 */
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

/** Requisitos individuais, usados na dica visual abaixo do campo. */
const passwordRequisitos = (senha: string) => [
  { label: "Mínimo 8 caracteres", ok: senha.length >= 8 },
  { label: "Uma letra maiúscula", ok: /[A-Z]/.test(senha) },
  { label: "Uma letra minúscula", ok: /[a-z]/.test(senha) },
  { label: "Um número", ok: /\d/.test(senha) },
  { label: "Um caractere especial", ok: /[^A-Za-z0-9]/.test(senha) },
];

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") ?? "";

  const [formData, setFormData] = useState({
    novaSenha: "",
    confirmacaoSenha: "",
  });
  const [errors, setErrors] = useState({
    novaSenha: "",
    confirmacaoSenha: "",
  });
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/esqueci-senha");
    }
  }, [token, navigate]);

  const validateField = (name: string, value: string): string => {
    if (name === "novaSenha") {
      if (!PASSWORD_REGEX.test(value))
        return "Mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial.";
    }
    if (name === "confirmacaoSenha") {
      if (value !== formData.novaSenha) return "As senhas não coincidem.";
    }
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const novaSenhaError = validateField("novaSenha", formData.novaSenha);
    const confirmacaoError = validateField(
      "confirmacaoSenha",
      formData.confirmacaoSenha,
    );

    if (novaSenhaError || confirmacaoError) {
      setErrors({ novaSenha: novaSenhaError, confirmacaoSenha: confirmacaoError });
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(
        token,
        formData.novaSenha,
        formData.confirmacaoSenha,
      );
      setSucesso(true);
    } catch (err) {
      const mensagem = err instanceof Error
        ? err.message
        : "Token inválido ou expirado. Solicite um novo link.";
      setFormError(mensagem);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-4">
      <div className="w-[calc(100vw-2rem)] min-w-0 max-w-md rounded-lg border border-slate-100 bg-white p-6 shadow-sm animate-fade-in sm:p-10 md:p-12">
        {/* Header */}
        <div className="mb-8 text-center sm:mb-10">
          <div className="mb-4 flex justify-center">
            <h2 className="text-3xl font-bold">
              <span className="text-blue-600">Re</span>
              <span className="text-orange-500">Use</span>
              <span className="text-slate-950">Hub</span>
            </h2>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {sucesso ? "Senha redefinida!" : "Nova senha"}
          </h1>
          {!sucesso && (
            <p className="mt-2 text-sm text-slate-500">
              Escolha uma nova senha para sua conta.
            </p>
          )}
        </div>

        {sucesso ? (
          /* Estado de sucesso */
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
                Senha alterada com sucesso!
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Você já pode fazer login com sua nova senha.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-block w-full bg-orange-600 text-white font-bold py-3 rounded-full text-sm hover:bg-orange-700 transition-all text-center"
            >
              Ir para o login
            </Link>
          </div>
        ) : (
          /* Formulário */
          <form onSubmit={handleSubmit} className="space-y-6">
            {formError && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl text-sm">
                {formError}
                {formError.includes("expirado") && (
                  <span>
                    {" "}
                    <Link
                      to="/esqueci-senha"
                      className="font-bold underline hover:text-red-900"
                    >
                      Clique aqui para solicitar um novo.
                    </Link>
                  </span>
                )}
              </div>
            )}

            {(["novaSenha", "confirmacaoSenha"] as const).map((field) => (
              <div key={field} className="space-y-2">
                <label
                  htmlFor={field}
                  className="flex justify-start text-sm font-bold text-slate-800"
                >
                  {field === "novaSenha" ? "Nova senha" : "Confirmar nova senha"}
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
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    id={field}
                    name={field}
                    type="password"
                    value={formData[field]}
                    onChange={handleChange}
                    placeholder="••••••"
                    className={`w-full pl-12 pr-4 py-3.5 border ${
                      errors[field]
                        ? "border-red-400 focus:ring-red-100"
                        : "border-slate-200 focus:ring-orange-100 focus:border-orange-300"
                    } rounded-xl bg-slate-50/50 text-slate-800 placeholder-slate-400 transition-all outline-none focus:ring-4`}
                  />
                </div>
                {errors[field] && (
                  <p className="text-red-500 text-[11px] font-medium ml-1">
                    {errors[field]}
                  </p>
                )}
                {field === "novaSenha" && formData.novaSenha && (
                  <ul className="mt-1 ml-1 space-y-0.5">
                    {passwordRequisitos(formData.novaSenha).map((req) => (
                      <li
                        key={req.label}
                        className={`flex items-center gap-1 text-[11px] font-medium ${
                          req.ok ? "text-green-600" : "text-slate-400"
                        }`}
                      >
                        <span>{req.ok ? "✓" : "○"}</span>
                        {req.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-600 text-white font-bold py-4 rounded-full text-base shadow-sm hover:bg-orange-700 hover:shadow-orange-300 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? <Spinner /> : "Redefinir senha"}
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
