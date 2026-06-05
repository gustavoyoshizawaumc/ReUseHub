package com.reusehub.auth.ratelimit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.reusehub.anuncio.visualizacao.util.ExtratorIpCliente;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AuthRateLimitInterceptor implements HandlerInterceptor {

    private static final long JANELA_CURTA_MS = 60_000;
    private static final long JANELA_CONTA_MS = 60 * 60_000;
    private static final int LIMITE_REGISTRO_REATIVACAO = 5;
    private static final int LIMITE_ENCERRAMENTO_CONTA = 3;

    private final ConcurrentHashMap<String, Janela> tentativas = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {
        Regra regra = regraPara(request);
        if (regra == null) {
            return true;
        }

        String chave = regra.nome() + ":" + identificadorCliente(request);
        long agora = System.currentTimeMillis();
        Janela janela = tentativas.compute(chave, (key, atual) -> {
            if (atual == null || agora >= atual.expiraEmMs()) {
                return new Janela(1, agora + regra.janelaMs());
            }
            return new Janela(atual.tentativas() + 1, atual.expiraEmMs());
        });

        if (janela.tentativas() <= regra.limite()) {
            return true;
        }

        escreverRespostaBloqueada(response);
        return false;
    }

    private Regra regraPara(HttpServletRequest request) {
        String metodo = request.getMethod();
        String path = request.getRequestURI();

        if ("POST".equalsIgnoreCase(metodo)
                && ("/api/auth/registrar".equals(path) || "/api/auth/reativar-conta".equals(path))) {
            return new Regra("auth-publico", LIMITE_REGISTRO_REATIVACAO, JANELA_CURTA_MS);
        }

        if (("DELETE".equalsIgnoreCase(metodo) && "/api/auth/minha-conta".equals(path))
                || ("PATCH".equalsIgnoreCase(metodo) && "/api/auth/minha-conta/desativar".equals(path))) {
            return new Regra("encerramento-conta", LIMITE_ENCERRAMENTO_CONTA, JANELA_CONTA_MS);
        }

        return null;
    }

    private String identificadorCliente(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()
                && authentication.getName() != null && !"anonymousUser".equals(authentication.getName())) {
            return "user:" + authentication.getName();
        }

        String ip = ExtratorIpCliente.extrair(request);
        return "ip:" + (ip == null ? "desconhecido" : ip);
    }

    private void escreverRespostaBloqueada(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(), Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", HttpStatus.TOO_MANY_REQUESTS.value(),
                "titulo", "Muitas tentativas",
                "mensagem", "Aguarde alguns instantes antes de tentar novamente."
        ));
    }

    private record Regra(String nome, int limite, long janelaMs) {
    }

    private record Janela(int tentativas, long expiraEmMs) {
    }
}
