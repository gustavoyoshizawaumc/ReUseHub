import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  UsuarioRespostaDTO,
  SessaoUsuario,
  UpdateProfileRequest,
} from "../types/auth.types";
import { apiUrl } from "../config/api";
import { obterTokenAtivoOuEncerrarSessao } from "../utils/sessao";
import { limparUltimasBuscas } from "../utils/ultimasBuscas";

const API_URL = apiUrl("/api/auth");
export const AUTH_USER_UPDATED_EVENT = "reusehub:auth-user-updated";

const emitirAtualizacaoUsuario = () => {
  window.dispatchEvent(new CustomEvent(AUTH_USER_UPDATED_EVENT));
};

const salvarSessao = (token: string, user: AuthResponse | UsuarioRespostaDTO) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(normalizarUsuarioSessao(user)));
  emitirAtualizacaoUsuario();
};

const salvarUsuario = (user: AuthResponse | UsuarioRespostaDTO) => {
  localStorage.setItem("user", JSON.stringify(normalizarUsuarioSessao(user)));
  emitirAtualizacaoUsuario();
};

const limparSessaoLocal = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  limparUltimasBuscas();
  emitirAtualizacaoUsuario();
};

const normalizarUsuarioSessao = (user: AuthResponse | UsuarioRespostaDTO): SessaoUsuario => {
  const dados = user as AuthResponse & UsuarioRespostaDTO;

  return {
    id: dados.id,
    name: dados.name,
    avatarUrl: dados.avatarUrl ?? dados.avatar_url ?? undefined,
    perfil: dados.perfil,
    reputationScore: dados.reputationScore ?? dados.reputation_score,
  };
};

const lerMensagemErro = async (response: Response, fallback: string): Promise<string> => {
  try {
    const error = await response.json();
    if (error.erros && typeof error.erros === "object") {
      const mensagens = Object.values(error.erros)
        .filter((mensagem): mensagem is string => typeof mensagem === "string" && mensagem.trim().length > 0);

      if (mensagens.length > 0) {
        return mensagens.join(" ");
      }
    }
    return error.mensagem || error.message || fallback;
  } catch {
    return fallback;
  }
};

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
      throw new Error(await lerMensagemErro(response, "Nao foi possivel cadastrar. Confira os campos informados."));
    }

    const result: AuthResponse = await response.json();
    salvarSessao(result.token, result);
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
      throw new Error(await lerMensagemErro(response, "Erro ao fazer login"));
    }

    const result: AuthResponse = await response.json();
    salvarSessao(result.token, result);
    return result;
  },

  reactivateAccount: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/reativar-conta`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(await lerMensagemErro(response, "Erro ao reativar conta"));
    }

    const result: AuthResponse = await response.json();
    salvarSessao(result.token, result);
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

    const result = await response.json();
    salvarUsuario(result);
    return result;
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
      salvarUsuario(result);
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
    salvarUsuario(result);
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
      throw new Error(await lerMensagemErro(response, "Erro ao deletar conta"));
    }

    limparSessaoLocal();
  },

  deactivateAccount: async (): Promise<void> => {
    const token = obterTokenAtivoOuEncerrarSessao();

    if (!token) {
      throw new Error("Token não encontrado. Faça login novamente.");
    }

    const response = await fetch(`${API_URL}/minha-conta/desativar`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(await lerMensagemErro(response, "Erro ao desativar conta"));
    }

    limparSessaoLocal();
  },

  logout: () => {
    limparSessaoLocal();
  },

  getToken: (): string | null => {
    return localStorage.getItem("token");
  },

  getUser: (): SessaoUsuario | null => {
    const user = localStorage.getItem("user");
    return user ? normalizarUsuarioSessao(JSON.parse(user)) : null;
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
