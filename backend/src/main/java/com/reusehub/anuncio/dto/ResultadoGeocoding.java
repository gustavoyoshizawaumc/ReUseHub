package com.reusehub.anuncio.dto;

import com.reusehub.anuncio.enums.PrecisaoLocalizacao;

import java.math.BigDecimal;

public record ResultadoGeocoding(
        BigDecimal latitude,
        BigDecimal longitude,
        PrecisaoLocalizacao precisao
) {

    public static ResultadoGeocoding geocodificado(BigDecimal latitude, BigDecimal longitude) {
        return new ResultadoGeocoding(latitude, longitude, PrecisaoLocalizacao.ENDERECO_GEOCODIFICADO);
    }

    public static ResultadoGeocoding indefinido() {
        return new ResultadoGeocoding(null, null, PrecisaoLocalizacao.INDEFINIDA);
    }

    public boolean possuiCoordenadas() {
        return latitude != null && longitude != null;
    }
}
