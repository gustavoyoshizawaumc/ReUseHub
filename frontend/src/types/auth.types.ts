export interface RegisterRequest {
  name: string;
  cpf: string;
  email: string;
  password: string;
  phone: string;
  lgpdConsent: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  id: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  avatar_url: string | null;
  bio: string | null;
  perfil: "USUARIO" | "MODERADOR" | "ADMIN";
  reputation_score: number;
  is_active: boolean;
  is_verified: boolean;
  lgpd_consent: boolean;
  lgpd_consent_at: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  perfil: "USUARIO" | "MODERADOR" | "ADMIN";
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  register: (data: RegisterRequest) => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
}

export interface UsuarioRespostaDTO {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  reputationScore?: number;
  isActive?: boolean;
  isVerified?: boolean;
  lgpdConsent?: boolean;
  lgpdConsentAt?: string;
  createdAt?: string;
  updatedAt?: string;
  perfil?: 'USUARIO' | 'MODERADOR' | 'ADMIN';
}

export interface UpdateProfileRequest {
  name: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
}
