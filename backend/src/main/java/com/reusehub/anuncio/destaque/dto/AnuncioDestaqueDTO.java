package com.reusehub.anuncio.destaque.dto;

import com.reusehub.anuncio.dto.AnuncioRespostaDTO;

import java.math.BigDecimal;

public record AnuncioDestaqueDTO(
        AnuncioRespostaDTO anuncio,
        BigDecimal scoreDestaque
) {
    public static AnuncioDestaqueDTO de(AnuncioRespostaDTO anuncio, BigDecimal scoreDestaque) {
        return new AnuncioDestaqueDTO(anuncio, scoreDestaque);
    }
}
