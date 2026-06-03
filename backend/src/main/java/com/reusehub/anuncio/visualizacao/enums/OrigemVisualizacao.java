package com.reusehub.anuncio.visualizacao.enums;

/**
 * Identifica de onde veio a visualizacao do anuncio. Permite analises
 * futuras (ex: "qual secao da home gera mais cliques") sem exigir tabela
 * separada de eventos.
 *
 * <p>O valor e enviado pelo frontend no body do POST e validado por enum
 * binding do Spring (request com origem invalida = 400 automatico).
 */
public enum OrigemVisualizacao {

    /** Card clicado em alguma das secoes da home (recomendados, populares, etc). */
    CARD_HOME,

    /** Card clicado na pagina/resultado de busca. */
    BUSCA_RESULTADO,

    /** Acesso direto a URL do anuncio (link compartilhado, refresh, bookmark). */
    LINK_DIRETO,

    /** Card clicado na listagem de favoritos do usuario. */
    FAVORITO,

    /** Entrada via outro fluxo da pagina de detalhe (ex: anuncio relacionado). */
    DETALHE_DIRETO
}
