package com.reusehub.anuncio.destaque.service;

import java.math.BigDecimal;

/**
 * Constantes ajustaveis do modulo de destaque da home.
 *
 * <p>Todos os valores aqui sao tunaveis sem alterar o algoritmo. Em uma
 * eventual fase de A/B testing, esses valores podem migrar para configuracao
 * externa (banco, properties ou feature flags) sem mudancas de logica.
 *
 * <p>Esta classe e utility; nao pode ser instanciada.
 */
public final class ConfiguracaoDestaque {

    // -- Elegibilidade de categoria para rotacao -------------------------------

    /** Quantidade ideal de anuncios ATIVOS para uma categoria entrar no pool. */
    public static final int MIN_ANUNCIOS_POR_CATEGORIA = 6;

    /**
     * Quantidade reduzida usada como fallback quando o pool ideal nao atinge
     * {@link #TOP_CATEGORIAS_ROTACAO}. Evita quebrar a home em bases pequenas.
     */
    public static final int MIN_ANUNCIOS_POR_CATEGORIA_FALLBACK = 3;

    /** Tamanho maximo do pool de categorias candidatas a rotacao. */
    public static final int TOP_CATEGORIAS_ROTACAO = 7;

    // -- Tamanho das secoes ---------------------------------------------------

    public static final int DEFAULT_SIZE = 6;
    public static final int SIZE_RECOMENDADOS = 12;
    public static final int LIMITE_MAXIMO_SIZE = 24;

    // -- Deteccao de historico suficiente -------------------------------------

    /**
     * Soma minima de favoritos + interesses para detectar cenario
     * {@code HISTORICO_USUARIO}.
     */
    public static final int MINIMO_HISTORICO = 3;

    // -- Score: normalizacao --------------------------------------------------

    /** Meia-vida do decaimento exponencial da recencia (em dias). */
    public static final int HALFLIFE_DIAS = 14;

    /** Teto considerado "popularidade maxima" para a normalizacao logaritmica. */
    public static final int TETO_VISUALIZACOES = 1000;

    /** Nota maxima da reputacao do anunciante (range historico 0..5). */
    public static final BigDecimal NOTA_MAXIMA = new BigDecimal("5.0");

    // -- Score: pesos por sinal de afinidade ----------------------------------

    /** Peso de cada favorito do usuario na categoria. */
    public static final BigDecimal PESO_FAVORITO = BigDecimal.ONE;

    /**
     * Peso de cada interesse enviado pelo usuario na categoria.
     * Maior que favorito porque interesse expressa intencao mais forte.
     */
    public static final BigDecimal PESO_INTERESSE = new BigDecimal("2");

    private ConfiguracaoDestaque() {
        throw new UnsupportedOperationException("Utility class");
    }
}
