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
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AuthRateLimitInterceptor implements HandlerInterceptor {

    private static final long JANELA_CURTA_MS = 60_000;
    private static final long JANELA_MEDIA_MS = 15 * 60_000;
    private static final long JANELA_CONTA_MS = 60 * 60_000;

    private static final List<RotaProtegida> ROTAS_PROTEGIDAS = List.of(
            new RotaProtegida("POST", "/api/auth/registrar", new Regra("auth-publico", 5, JANELA_CURTA_MS)),
            new RotaProtegida("POST", "/api/auth/reativar-conta", new Regra("auth-publico", 5, JANELA_CURTA_MS)),
            new RotaProtegida("POST", "/api/auth/login", new Regra("login", 10, JANELA_CURTA_MS)),
            new RotaProtegida("POST", "/api/auth/esqueci-senha", new Regra("esqueci-senha", 5, JANELA_MEDIA_MS)),
            new RotaProtegida("POST", "/api/auth/redefinir-senha", new Regra("redefinir-senha", 10, JANELA_MEDIA_MS)),
            new RotaProtegida("DELETE", "/api/auth/minha-conta", new Regra("encerramento-conta", 3, JANELA_CONTA_MS)),
            new RotaProtegida("PATCH", "/api/auth/minha-conta/desativar", new Regra("encerramento-conta", 3, JANELA_CONTA_MS))
    );

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
        return ROTAS_PROTEGIDAS.stream()
                .filter(rota -> rota.corresponde(request.getMethod(), request.getRequestURI()))
                .map(RotaProtegida::regra)
                .findFirst()
                .orElse(null);
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

    private record RotaProtegida(String metodo, String path, Regra regra) {

        boolean corresponde(String metodo, String path) {
            return this.metodo.equalsIgnoreCase(metodo) && this.path.equals(path);
        }
    }

    private record Regra(String nome, int limite, long janelaMs) {
    }

    private record Janela(int tentativas, long expiraEmMs) {
    }
}
