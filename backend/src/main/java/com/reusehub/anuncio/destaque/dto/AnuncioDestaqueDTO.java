package com.reusehub.anuncio.destaque.dto;

import com.reusehub.anuncio.dto.AnuncioRespostaDTO;

import java.math.BigDecimal;

/**
 * Encapsula um anuncio no contexto de destaque da home.
 *
 * <p>Usa composicao (em vez de herdar de {@link AnuncioRespostaDTO}, o que
 * records nao permitem em Java) para separar claramente o dado de dominio
 * do metadado de ranqueamento (score). O score e descritivo, util para
 * debug e instrumentacao; a ordem ja vem garantida pelo backend.
 */
public record AnuncioDestaqueDTO(
        AnuncioRespostaDTO anuncio,
        BigDecimal scoreDestaque
) {
    public static AnuncioDestaqueDTO de(AnuncioRespostaDTO anuncio, BigDecimal scoreDestaque) {
        return new AnuncioDestaqueDTO(anuncio, scoreDestaque);
    }
}
