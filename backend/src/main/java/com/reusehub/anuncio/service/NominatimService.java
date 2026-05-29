package com.reusehub.anuncio.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.reusehub.anuncio.exception.OperacaoInvalidaException;
import com.reusehub.anuncio.exception.RecursoNaoEncontradoException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;

@Slf4j
@Service
public class NominatimService {

    private static final String RECURSO_ENDERECO = "endereco";
    private static final String CAMINHO_BUSCA = "/search";
    private static final String FORMATO_JSON = "json";
    private static final int LIMITE_RESULTADOS = 1;

    private final RestClient restClient;

    public NominatimService(@Qualifier("nominatimRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    public Coordenadas buscarCoordenadasPorEndereco(String enderecoTextual) {
        log.debug("Buscando coordenadas para o endereco: {}", enderecoTextual);

        List<NominatimResposta> resultados = consultarNominatim(enderecoTextual);
        garantirEnderecoEncontrado(resultados, enderecoTextual);

        return resultados.get(0).paraCoordenadas();
    }

    private List<NominatimResposta> consultarNominatim(String enderecoTextual) {
        try {
            return restClient.get()
                    .uri(uri -> uri.path(CAMINHO_BUSCA)
                            .queryParam("q", enderecoTextual)
                            .queryParam("format", FORMATO_JSON)
                            .queryParam("limit", LIMITE_RESULTADOS)
                            .build())
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
        } catch (ResourceAccessException e) {
            log.error("Timeout ou falha de conexao com Nominatim para '{}'", enderecoTextual, e);
            throw new OperacaoInvalidaException(
                    "Servico de geolocalizacao demorou para responder", e
            );
        } catch (RestClientException e) {
            log.error("Falha na comunicacao com Nominatim para '{}'", enderecoTextual, e);
            throw new OperacaoInvalidaException(
                    "Falha ao consultar o servico de geolocalizacao", e
            );
        }
    }

    private void garantirEnderecoEncontrado(List<NominatimResposta> resultados, String enderecoTextual) {
        if (resultados == null || resultados.isEmpty()) {
            throw new RecursoNaoEncontradoException(RECURSO_ENDERECO, enderecoTextual);
        }
    }

    public record Coordenadas(double latitude, double longitude) {}

    private record NominatimResposta(
            @JsonProperty("lat") String latitudeTexto,
            @JsonProperty("lon") String longitudeTexto
    ) {
        Coordenadas paraCoordenadas() {
            return new Coordenadas(
                    Double.parseDouble(latitudeTexto),
                    Double.parseDouble(longitudeTexto)
            );
        }
    }
}
