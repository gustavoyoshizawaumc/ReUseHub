import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  UsuarioRespostaDTO,
  UpdateProfileRequest,
} from "../types/auth.types";
import { apiUrl } from "../config/api";
import { obterTokenAtivoOuEncerrarSessao } from "../utils/sessao";

const API_URL = apiUrl("/api/auth");

export const authService = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/registrar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erro ao cadastrar");
    }

    const result: AuthResponse = await response.json();
    localStorage.setItem("token", result.token);
    localStorage.setItem("user", JSON.stringify(result));
    return result;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erro ao fazer login");
    }

    const result: AuthResponse = await response.json();
    localStorage.setItem("token", result.token);
    localStorage.setItem("user", JSON.stringify(result));
    return result;
  },

  getProfile: async (): Promise<UsuarioRespostaDTO> => {
    const token = obterTokenAtivoOuEncerrarSessao();

    if (!token) {
      throw new Error("Token não encontrado. Faça login novamente.");
    }

    const response = await fetch(`${API_URL}/minha-conta`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erro ao obter perfil");
    }

    return await response.json();
  },

  updateProfile: async (
    data: UpdateProfileRequest,
    avatarFile?: File,
  ): Promise<UsuarioRespostaDTO> => {
    const token = obterTokenAtivoOuEncerrarSessao();

    if (!token) {
      throw new Error("Token não encontrado. Faça login novamente.");
    }

    if (avatarFile) {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("phone", data.phone || "");
      formData.append("bio", data.bio || "");
      formData.append("avatarFile", avatarFile);

      const response = await fetch(`${API_URL}/minha-conta`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao atualizar perfil");
      }

      const result = await response.json();
      localStorage.setItem("user", JSON.stringify(result));
      return result;
    }

    const response = await fetch(`${API_URL}/minha-conta`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erro ao atualizar perfil");
    }

    const result = await response.json();
    localStorage.setItem("user", JSON.stringify(result));
    return result;
  },

  deleteAccount: async (): Promise<void> => {
    const token = obterTokenAtivoOuEncerrarSessao();

    if (!token) {
      throw new Error("Token não encontrado. Faça login novamente.");
    }

    const response = await fetch(`${API_URL}/minha-conta`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erro ao deletar conta");
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getToken: (): string | null => {
    return localStorage.getItem("token");
  },

  getUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isLoggedIn: (): boolean => {
    return !!localStorage.getItem("token");
  },

  forgotPassword: async (email: string): Promise<void> => {
    const response = await fetch(`${API_URL}/esqueci-senha`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erro ao solicitar recuperação de senha");
    }
  },

  resetPassword: async (
    token: string,
    novaSenha: string,
    confirmacaoSenha: string,
  ): Promise<void> => {
    const response = await fetch(`${API_URL}/redefinir-senha`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, novaSenha, confirmacaoSenha }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erro ao redefinir senha");
    }
  },
};
