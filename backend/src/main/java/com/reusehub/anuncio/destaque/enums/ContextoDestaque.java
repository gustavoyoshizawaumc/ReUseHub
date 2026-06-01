package com.reusehub.anuncio.destaque.enums;

/**
 * Estrategia de busca/ranqueamento usada por cada secao da home.
 *
 * <ul>
 *   <li>{@link #RECOMENDADOS_PARA_VOCE}: score multi-fator com afinidade ativa,
 *       direcionado ao usuario autenticado com historico minimo.</li>
 *   <li>{@link #MAIS_PROCURADOS}: score multi-fator filtrado por categoria,
 *       com peso alto em popularidade.</li>
 *   <li>{@link #POPULARES}: ordenacao direta por total de visualizacoes.</li>
 *   <li>{@link #RECENTES}: ordenacao direta por data de criacao.</li>
 * </ul>
 */
public enum ContextoDestaque {
    RECOMENDADOS_PARA_VOCE,
    MAIS_PROCURADOS,
    POPULARES,
    RECENTES
}
