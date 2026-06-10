package com.reusehub.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
public class HttpClientsConfig {

    private static final Duration TIMEOUT_CONEXAO_NOMINATIM = Duration.ofSeconds(3);
    private static final Duration TIMEOUT_LEITURA_NOMINATIM = Duration.ofSeconds(8);
    private static final String USER_AGENT_NOMINATIM = "ReUseHub/1.0";

    private static final Duration TIMEOUT_CONEXAO_TOMTOM = Duration.ofSeconds(3);
    private static final Duration TIMEOUT_LEITURA_TOMTOM = Duration.ofSeconds(5);

    @Bean(name = "viaCepRestClient")
    public RestClient viaCepRestClient(
            @Value("${external.viacep.base-url}") String baseUrl
    ) {
        return RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    @Bean(name = "nominatimRestClient")
    public RestClient nominatimRestClient(
            @Value("${external.nominatim.base-url}") String baseUrl
    ) {
        return RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.USER_AGENT, USER_AGENT_NOMINATIM)
                .requestFactory(criarRequestFactoryNominatim())
                .build();
    }

    @Bean(name = "tomTomRestClient")
    public RestClient tomTomRestClient(
            @Value("${external.tomtom.base-url}") String baseUrl
    ) {
        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(criarRequestFactoryTomTom())
                .build();
    }

    private SimpleClientHttpRequestFactory criarRequestFactoryNominatim() {
        return criarRequestFactoryComTimeouts(TIMEOUT_CONEXAO_NOMINATIM, TIMEOUT_LEITURA_NOMINATIM);
    }

    private SimpleClientHttpRequestFactory criarRequestFactoryTomTom() {
        return criarRequestFactoryComTimeouts(TIMEOUT_CONEXAO_TOMTOM, TIMEOUT_LEITURA_TOMTOM);
    }

    private SimpleClientHttpRequestFactory criarRequestFactoryComTimeouts(
            Duration timeoutConexao,
            Duration timeoutLeitura
    ) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeoutConexao);
        factory.setReadTimeout(timeoutLeitura);
        return factory;
    }
}
