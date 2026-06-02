package com.reusehub.anuncio.enums;

/**
 * Origem das coordenadas geograficas armazenadas no Endereco.
 *
 * <p>Permite que a busca por raio ignore enderecos sem geocoding valido
 * (em vez de tratar (0,0) silenciosamente, que poluia os resultados).
 *
 * <p>Os valores sao deliberadamente poucos para nao over-engineer pra um
 * caso de uso que ainda nao distingue precisao mais fina. Podem ser
 * expandidos no futuro (ex.: BAIRRO, RUA, NUMERO_EXATO) quando o produto
 * justificar.
 */
public enum PrecisaoLocalizacao {

    /** Coordenadas vindas com sucesso de um servico de geocoding. */
    ENDERECO_GEOCODIFICADO,

    /** Geocoding falhou. latitude/longitude ficam NULL. Anuncio nao entra em busca por raio. */
    INDEFINIDA
}
