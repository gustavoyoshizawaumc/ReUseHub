import { describe, expect, it, vi, beforeEach } from "vitest";
import { authService } from "./authService";
import {
  criarAvaliacao,
  listarAvaliacoesRecebidas,
} from "./avaliacaoService";
import { denunciarAnuncio } from "./denunciaService";
import { obterPerfilPublico } from "./perfilService";
import { buscarEnderecoPorCEP } from "./viaCepService";
import {
  aceitarInteresse,
  cancelarNegociacaoInteresse,
  confirmarRecebimentoInteresse,
  criarInteresse,
  listarHistoricoInteresses,
  listarInteressesEnviados,
  listarInteressesRecebidos,
  marcarInteresseComoEntregue,
  recusarInteresse,
} from "./interesseService";
import {
  enviarMensagem,
  iniciarConversa,
  listarConversas,
  marcarComoLido,
  obterConversaPorId,
  obterMensagens,
} from "./chatService";

const fetchMock = vi.fn();

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });

const textResponse = (body: string, init: ResponseInit = {}) =>
  new Response(init.status === 204 ? null : body, {
    status: init.status ?? 200,
    headers: init.headers,
  });

const tokenValido = () => {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
  return `header.${payload}.signature`;
};

const usuarioAuth = {
  token: tokenValido(),
  id: "usuario-1",
  name: "Ana",
  cpf: "123",
  email: "ana@email.com",
  phone: "11999999999",
  avatar_url: "avatar.png",
  bio: "bio",
  perfil: "USUARIO",
  reputation_score: 4.8,
  is_active: true,
  is_verified: true,
  lgpd_consent: true,
  lgpd_consent_at: "2026-01-01T00:00:00",
  created_at: "2026-01-01T00:00:00",
  updated_at: "2026-01-01T00:00:00",
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  localStorage.setItem("token", tokenValido());
});

describe("authService", () => {
  it("salva sessao ao registrar e logar", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(usuarioAuth))
      .mockResolvedValueOnce(jsonResponse({ ...usuarioAuth, name: "Bruno" }));

    const cadastro = await authService.register({
      name: "Ana",
      cpf: "123",
      email: "ana@email.com",
      password: "Senha123!",
      phone: "11999999999",
      lgpdConsent: true,
    });
    const login = await authService.login({
      email: "bruno@email.com",
      password: "Senha123!",
    });

    expect(cadastro.name).toBe("Ana");
    expect(login.name).toBe("Bruno");
    expect(authService.isLoggedIn()).toBe(true);
    expect(authService.getUser()?.name).toBe("Bruno");
  });

  it("retorna mensagens de validacao do backend no cadastro", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      erros: {
        email: "E-mail ja cadastrado.",
        password: "Senha fraca.",
      },
    }, { status: 400 }));

    await expect(authService.register({
      name: "Ana",
      cpf: "123",
      email: "ana@email.com",
      password: "123",
      phone: "11999999999",
      lgpdConsent: true,
    })).rejects.toThrow("E-mail ja cadastrado. Senha fraca.");
  });

  it("carrega, atualiza, desativa e remove a conta autenticada", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ ...usuarioAuth, avatarUrl: "novo.png", reputationScore: 5 }))
      .mockResolvedValueOnce(jsonResponse({ ...usuarioAuth, name: "Ana Atualizada" }))
      .mockResolvedValueOnce(textResponse("", { status: 204 }))
      .mockResolvedValueOnce(textResponse("", { status: 204 }));

    const perfil = await authService.getProfile();
    const atualizado = await authService.updateProfile({ name: "Ana Atualizada", phone: "11", bio: "bio" });
    await authService.deactivateAccount();
    localStorage.setItem("token", tokenValido());
    await authService.deleteAccount();

    expect(perfil.avatarUrl).toBe("novo.png");
    expect(atualizado.name).toBe("Ana Atualizada");
    expect(authService.getToken()).toBeNull();
  });

  it("envia fluxos de recuperacao de senha e limpa sessao no logout", async () => {
    fetchMock
      .mockResolvedValueOnce(textResponse("", { status: 204 }))
      .mockResolvedValueOnce(textResponse("", { status: 204 }))
      .mockResolvedValueOnce(jsonResponse(usuarioAuth));

    await authService.forgotPassword("ana@email.com");
    await authService.resetPassword("token", "Senha123!", "Senha123!");
    await authService.reactivateAccount({ email: "ana@email.com", password: "Senha123!" });
    authService.logout();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(authService.isLoggedIn()).toBe(false);
  });
});

describe("servicos baseados em fetch", () => {
  it("executa avaliacoes, perfil publico, denuncia e CEP", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: "avaliacao-1", nota: 5 }))
      .mockResolvedValueOnce(jsonResponse([{ id: "avaliacao-1", nota: 5 }]))
      .mockResolvedValueOnce(jsonResponse({ id: "denuncia-1" }))
      .mockResolvedValueOnce(jsonResponse({ id: "perfil-1", nome: "Ana" }))
      .mockResolvedValueOnce(jsonResponse({
        cep: "08613-565",
        logradouro: "Rua A",
        bairro: "Centro",
        localidade: "Suzano",
        uf: "SP",
      }));

    await expect(criarAvaliacao({ anuncioId: "a1", avaliadoId: "u1", nota: 5, comentario: "Otimo" })).resolves.toMatchObject({ nota: 5 });
    await expect(listarAvaliacoesRecebidas("u1")).resolves.toHaveLength(1);
    await expect(denunciarAnuncio({ anuncioId: "a1", motivo: "SPAM", descricao: "Suspeito" })).resolves.toMatchObject({ id: "denuncia-1" });
    await expect(obterPerfilPublico("u1")).resolves.toMatchObject({ id: "perfil-1" });
    await expect(buscarEnderecoPorCEP("08613-565")).resolves.toMatchObject({ cidade: "Suzano", uf: "SP" });
  });

  it("trata erros de denuncia, perfil e CEP", async () => {
    fetchMock
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(jsonResponse({ mensagem: "Denuncia duplicada" }, { status: 400 }))
      .mockResolvedValueOnce(textResponse("Perfil indisponivel", { status: 404 }))
      .mockResolvedValueOnce(jsonResponse({ erro: true }));

    await expect(denunciarAnuncio({ anuncioId: "a1", motivo: "SPAM" })).rejects.toThrow("Nao foi possivel conectar");
    await expect(denunciarAnuncio({ anuncioId: "a1", motivo: "SPAM" })).rejects.toThrow("Denuncia duplicada");
    await expect(obterPerfilPublico("u1")).rejects.toThrow("Perfil indisponivel");
    await expect(buscarEnderecoPorCEP("08613565")).rejects.toThrow("CEP n");
    await expect(buscarEnderecoPorCEP("123")).rejects.toThrow("8");
  });

  it("executa os fluxos de interesse", async () => {
    const interesse = { id: "i1", status: "PENDENTE" };
    fetchMock
      .mockResolvedValueOnce(jsonResponse(interesse))
      .mockResolvedValueOnce(jsonResponse([interesse]))
      .mockResolvedValueOnce(jsonResponse([interesse]))
      .mockResolvedValueOnce(jsonResponse([interesse]))
      .mockResolvedValueOnce(jsonResponse({ ...interesse, status: "ACEITO" }))
      .mockResolvedValueOnce(jsonResponse({ ...interesse, status: "RECUSADO" }))
      .mockResolvedValueOnce(jsonResponse({ ...interesse, status: "ENTREGUE" }))
      .mockResolvedValueOnce(jsonResponse({ ...interesse, status: "CONCLUIDO" }))
      .mockResolvedValueOnce(jsonResponse({ ...interesse, status: "CANCELADO" }));

    await expect(criarInteresse({ anuncioDesejadoId: "a1", mensagem: "Quero trocar" })).resolves.toMatchObject(interesse);
    await expect(listarInteressesRecebidos()).resolves.toHaveLength(1);
    await expect(listarInteressesEnviados()).resolves.toHaveLength(1);
    await expect(listarHistoricoInteresses()).resolves.toHaveLength(1);
    await expect(aceitarInteresse("i1")).resolves.toMatchObject({ status: "ACEITO" });
    await expect(recusarInteresse("i1")).resolves.toMatchObject({ status: "RECUSADO" });
    await expect(marcarInteresseComoEntregue("i1")).resolves.toMatchObject({ status: "ENTREGUE" });
    await expect(confirmarRecebimentoInteresse("i1")).resolves.toMatchObject({ status: "CONCLUIDO" });
    await expect(cancelarNegociacaoInteresse("i1")).resolves.toMatchObject({ status: "CANCELADO" });
  });

  it("executa os fluxos de chat", async () => {
    const conversa = { id: "c1", mensagens: [{ id: "m1", conteudo: "Oi" }], naoLidas: 0 };
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ conversas: [{ id: "c1", mensagensNaoLidas: 2 }] }))
      .mockResolvedValueOnce(jsonResponse(conversa))
      .mockResolvedValueOnce(jsonResponse(conversa))
      .mockResolvedValueOnce(jsonResponse(conversa))
      .mockResolvedValueOnce(textResponse("", { status: 204 }))
      .mockResolvedValueOnce(textResponse("", { status: 403 }))
      .mockResolvedValueOnce(textResponse("", { status: 204 }));

    await expect(listarConversas()).resolves.toMatchObject([{ id: "c1", naoLidas: 2 }]);
    await expect(obterConversaPorId("c1")).resolves.toMatchObject({ id: "c1" });
    await expect(obterMensagens("c1")).resolves.toHaveLength(1);
    await expect(iniciarConversa({ anuncioId: "a1", destinatarioId: "u1" })).resolves.toMatchObject({ id: "c1" });
    await expect(enviarMensagem("c1", "Oi")).resolves.toBeUndefined();
    await expect(marcarComoLido("c1")).resolves.toBeUndefined();
    await expect(marcarComoLido("c1")).resolves.toBeUndefined();
    await expect(obterConversaPorId("")).rejects.toThrow("ID da conversa");
  });
});
