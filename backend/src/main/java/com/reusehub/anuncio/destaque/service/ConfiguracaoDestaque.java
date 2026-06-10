package com.reusehub.anuncio.destaque.service;

import java.math.BigDecimal;

public final class ConfiguracaoDestaque {

    public static final int MIN_ANUNCIOS_POR_CATEGORIA = 6;

    public static final int MIN_ANUNCIOS_POR_CATEGORIA_FALLBACK = 3;

    public static final int TOP_CATEGORIAS_ROTACAO = 7;

    public static final int DEFAULT_SIZE = 6;
    public static final int SIZE_RECOMENDADOS = 12;
    public static final int LIMITE_MAXIMO_SIZE = 24;

    public static final int MINIMO_HISTORICO = 3;

    public static final int HALFLIFE_DIAS = 14;

    public static final int TETO_VISUALIZACOES = 1000;

    public static final int JANELA_VISUALIZACOES_DIAS = 7;

    public static final BigDecimal NOTA_MAXIMA = new BigDecimal("5.0");

    public static final BigDecimal PESO_FAVORITO = BigDecimal.ONE;

    public static final BigDecimal PESO_INTERESSE = new BigDecimal("2");

    private ConfiguracaoDestaque() {
        throw new UnsupportedOperationException("Utility class");
    }
}
