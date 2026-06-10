package com.reusehub.anuncio.visualizacao.util;

import jakarta.servlet.http.HttpServletRequest;

public final class ExtratorIpCliente {

    private static final String HEADER_X_FORWARDED_FOR = "X-Forwarded-For";
    private static final String HEADER_X_REAL_IP = "X-Real-IP";
    private static final String SEPARADOR_CADEIA = ",";

    private ExtratorIpCliente() {
        throw new UnsupportedOperationException("Utility class");
    }

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
