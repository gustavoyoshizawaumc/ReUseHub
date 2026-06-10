package com.reusehub.anuncio.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class TomTomGeocodingService {

    private static final String CAMINHO_GEOCODE = "/geocode/{query}.json";
    private static final String PAIS_BRASIL = "BR";
    private static final int QUANTIDADE_RESULTADOS = 1;

    private final RestClient restClient;
    private final String apiKey;

    public TomTomGeocodingService(
            @Qualifier("tomTomRestClient") RestClient restClient,
            @Value("${external.tomtom.api-key:}") String apiKey
    ) {
        this.restClient = restClient;
        this.apiKey = apiKey;
    }

    public Optional<Coordenadas> buscarCoordenadasPorEndereco(String enderecoTextual) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("TomTom desabilitado: chave de API nao configurada (TOMTOM_API_KEY)");
            return Optional.empty();
        }
        if (enderecoTextual == null || enderecoTextual.isBlank()) {
            return Optional.empty();
        }

        try {
            TomTomGeocodeResposta resposta = restClient.get()
                    .uri(uri -> uri.path(CAMINHO_GEOCODE)
                            .queryParam("key", apiKey)
                            .queryParam("limit", QUANTIDADE_RESULTADOS)
                            .queryParam("countrySet", PAIS_BRASIL)
                            .build(enderecoTextual))
                    .retrieve()
                    .body(TomTomGeocodeResposta.class);

            return extrairCoordenadas(resposta);
        } catch (RuntimeException e) {
            log.warn("Falha ao consultar TomTom para endereco '{}': {}",
                    enderecoTextual, e.getMessage());
            return Optional.empty();
        }
    }

    private Optional<Coordenadas> extrairCoordenadas(TomTomGeocodeResposta resposta) {
        if (resposta == null || resposta.results() == null || resposta.results().isEmpty()) {
            return Optional.empty();
        }
        TomTomPosition posicao = resposta.results().get(0).position();
        if (posicao == null || posicao.lat() == null || posicao.lon() == null) {
            return Optional.empty();
        }
        return Optional.of(new Coordenadas(
                BigDecimal.valueOf(posicao.lat()),
                BigDecimal.valueOf(posicao.lon())
        ));
    }

    public record Coordenadas(BigDecimal latitude, BigDecimal longitude) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record TomTomGeocodeResposta(List<TomTomResultado> results) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record TomTomResultado(TomTomPosition position) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record TomTomPosition(Double lat, Double lon) {}
}
