package com.reusehub.anuncio.destaque.enums;

/**
 * Cenario detectado pelo backend ao montar a receita da home.
 * O frontend recebe esse valor apenas como metadado; nao deve aplicar
 * regras de exibicao baseadas nele (toda inteligencia fica no backend).
 */
public enum CenarioHome {
    /** Usuario autenticado com historico suficiente de favoritos + interesses. */
    HISTORICO_USUARIO,

    /** Usuario autenticado mas sem historico minimo para personalizacao. */
    SEM_HISTORICO,

    /** Visitante nao autenticado. */
    ANONIMO
}
