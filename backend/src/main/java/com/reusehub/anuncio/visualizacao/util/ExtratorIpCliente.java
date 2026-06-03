package com.reusehub.anuncio.visualizacao.util;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Extrai o IP real do cliente respeitando proxies/load balancers comuns.
 *
 * <p>Em producao (EC2 + nginx, ou ALB), {@code request.getRemoteAddr()} retorna
 * o IP do proxy, nao do cliente. Este utilitario consulta {@code X-Forwarded-For}
 * e {@code X-Real-IP} antes do fallback, e considera apenas o primeiro IP
 * da cadeia (o originador) caso o header contenha lista encadeada.
 *
 * <p>Headers podem ser forjados por client mal-intencionado quando a aplicacao
 * esta exposta diretamente. Para o caso de uso atual (tracking, nao auth),
 * o risco e aceitavel: o pior cenario e inflar/burlar o dedupe por IP, que ja
 * e a camada menos prioritaria (usuario logado &gt; anon_id &gt; IP).
 *
 * <p>O Spring Boot tambem aplica {@code server.forward-headers-strategy=FRAMEWORK}
 * antes do request chegar aqui, ou seja, {@code request.getRemoteAddr()} ja vem
 * "corrigido" em producao. Este extrator mantem-se como rede de seguranca caso a
 * configuracao mude ou um deploy nao tenha o forward strategy ativo.
 */
public final class ExtratorIpCliente {

    private static final String HEADER_X_FORWARDED_FOR = "X-Forwarded-For";
    private static final String HEADER_X_REAL_IP = "X-Real-IP";
    private static final String SEPARADOR_CADEIA = ",";

    private ExtratorIpCliente() {
        throw new UnsupportedOperationException("Utility class");
    }

    /**
     * Devolve o IP do cliente ou {@code null} quando nenhum identificador
     * puder ser determinado.
     */
    public static String extrair(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

        String forwardedFor = request.getHeader(HEADER_X_FORWARDED_FOR);
        String primeiroDaCadeia = primeiroIpDaCadeia(forwardedFor);
        if (primeiroDaCadeia != null) {
            return primeiroDaCadeia;
        }

        String realIp = request.getHeader(HEADER_X_REAL_IP);
        if (ehNaoVazio(realIp)) {
            return realIp.trim();
        }

        String remoteAddr = request.getRemoteAddr();
        return ehNaoVazio(remoteAddr) ? remoteAddr.trim() : null;
    }

    /**
     * X-Forwarded-For pode ser "client, proxy1, proxy2". O originador e o
     * primeiro IP da lista; os demais sao saltos de proxy.
     */
    private static String primeiroIpDaCadeia(String headerValue) {
        if (!ehNaoVazio(headerValue)) {
            return null;
        }
        String primeiro = headerValue.split(SEPARADOR_CADEIA)[0].trim();
        return primeiro.isEmpty() ? null : primeiro;
    }

    private static boolean ehNaoVazio(String valor) {
        return valor != null && !valor.isBlank();
    }
}
