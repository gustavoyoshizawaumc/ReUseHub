package com.reusehub.anuncio.destaque.enums;

/**
 * Origem da escolha da categoria em destaque.
 *
 * <ul>
 *   <li>{@link #INTERESSE_USUARIO}: categoria com maior pontuacao de afinidade
 *       baseada em favoritos e interesses enviados pelo usuario.</li>
 *   <li>{@link #ROTATIVA}: categoria escolhida deterministicamente por dia
 *       entre as mais populares da plataforma.</li>
 * </ul>
 */
public enum TipoSelecaoCategoria {
    INTERESSE_USUARIO,
    ROTATIVA
}
