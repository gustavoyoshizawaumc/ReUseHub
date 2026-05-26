package com.reusehub.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class EmailService {

    private static final String RESEND_API_URL = "https://api.resend.com/emails";
    private static final String ASSUNTO_RECUPERACAO_SENHA = "Recuperação de senha — ReUseHub";

    private final RestClient restClient;
    private final String apiKey;
    private final String fromEmail;
    private final String frontendUrl;

    public EmailService(
            RestClient.Builder restClientBuilder,
            @Value("${resend.api-key}") String apiKey,
            @Value("${resend.from-email}") String fromEmail,
            @Value("${app.frontend-url}") String frontendUrl) {
        this.restClient = restClientBuilder.build();
        this.apiKey = apiKey;
        this.fromEmail = fromEmail;
        this.frontendUrl = frontendUrl;
    }

    public void enviarEmailRecuperacaoSenha(
            String destinatario,
            String nomeUsuario,
            String tokenPuro,
            int expiracaoMinutos) {

        String linkRedefinicao = frontendUrl + "/redefinir-senha?token=" + tokenPuro;

        Map<String, Object> payload = Map.of(
                "from", fromEmail,
                "to", List.of(destinatario),
                "subject", ASSUNTO_RECUPERACAO_SENHA,
                "html", gerarHtmlRecuperacaoSenha(nomeUsuario, linkRedefinicao, expiracaoMinutos)
        );

        try {
            restClient.post()
                    .uri(RESEND_API_URL)
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();

            log.info("E-mail de recuperação de senha enviado para {}", destinatario);
        } catch (Exception e) {
            log.error("Falha ao enviar e-mail de recuperação para {}: {}", destinatario, e.getMessage());
        }
    }

    private String gerarHtmlRecuperacaoSenha(String nome, String link, int expiracaoMinutos) {
        return """
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                  <meta charset="UTF-8"/>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                </head>
                <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
                    <tr>
                      <td align="center">
                        <table width="520" cellpadding="0" cellspacing="0"
                               style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
                          <tr>
                            <td style="background:#1e293b;padding:28px 40px;text-align:center;">
                              <span style="font-size:26px;font-weight:800;letter-spacing:-0.5px;">
                                <span style="color:#3b82f6;">Re</span><span style="color:#f97316;">Use</span><span style="color:#f8fafc;">Hub</span>
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:40px 40px 32px;">
                              <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0f172a;">
                                Olá, %s!
                              </p>
                              <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
                                Recebemos uma solicitação para redefinir a senha da sua conta no ReUseHub.
                                Clique no botão abaixo para criar uma nova senha.
                              </p>
                              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                                <tr>
                                  <td style="border-radius:50px;background:#ea580c;">
                                    <a href="%s"
                                       style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;
                                              color:#ffffff;text-decoration:none;border-radius:50px;">
                                      Redefinir minha senha
                                    </a>
                                  </td>
                                </tr>
                              </table>
                              <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-align:center;">
                                Este link expira em <strong>%d minutos</strong>.
                              </p>
                              <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">
                                Se você não solicitou a recuperação de senha, ignore este e-mail.
                                Sua senha permanece a mesma.
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td style="background:#f8fafc;padding:20px 40px;text-align:center;
                                       border-top:1px solid #e2e8f0;">
                              <p style="margin:0;font-size:12px;color:#94a3b8;">
                                © 2024 ReUseHub · Plataforma de doação e troca sustentável
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(nome, link, expiracaoMinutos);
    }
}
