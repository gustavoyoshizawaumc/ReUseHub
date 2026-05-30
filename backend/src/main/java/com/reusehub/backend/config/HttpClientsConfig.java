package com.reusehub.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

/**
 * Configuracao centralizada dos clientes HTTP usados pela aplicacao.
 *
 * Cada bean aqui registrado representa um cliente dedicado a um servico
 * externo, permitindo configurar URLs base, timeouts e headers padrao
 * em um unico lugar.
 */
@Configuration
public class HttpClientsConfig {

    private static final Duration TIMEOUT_CONEXAO_NOMINATIM = Duration.ofSeconds(3);
    private static final Duration TIMEOUT_LEITURA_NOMINATIM = Duration.ofSeconds(8);
    private static final String USER_AGENT_NOMINATIM = "ReUseHub/1.0";

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
                .requestFactory(criarRequestFactoryComTimeouts())
                .build();
    }

    private SimpleClientHttpRequestFactory criarRequestFactoryComTimeouts() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(TIMEOUT_CONEXAO_NOMINATIM);
        factory.setReadTimeout(TIMEOUT_LEITURA_NOMINATIM);
        return factory;
    }
}
