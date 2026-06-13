package com.reusehub.shared.util;

public final class NomePublicoUtils {

    private NomePublicoUtils() {
    }

    public static String primeiroNome(String nomeCompleto) {
        if (nomeCompleto == null || nomeCompleto.isBlank()) {
            return "";
        }

        String[] partes = nomeCompleto.trim().split("\\s+");
        return partes.length == 0 ? "" : partes[0];
    }
}
