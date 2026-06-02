package com.reusehub.anuncio.dto;

import com.reusehub.anuncio.enums.PrecisaoLocalizacao;

import java.math.BigDecimal;

/**
 * Resultado de uma tentativa de geocoding. Encapsula coordenadas (possivelmente
 * null) com a informacao de quao confiavel foi a obtencao.
 *
 * <p>Quando {@link #precisao()} for {@link PrecisaoLocalizacao#INDEFINIDA},
 * latitude e longitude sao garantidamente null e o consumidor deve evitar
 * gravar (0,0) como fallback.
 */
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
