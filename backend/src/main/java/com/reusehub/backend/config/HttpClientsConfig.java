package com.reusehub.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

/**
 * Configuracao centralizada dos clientes HTTP usados pela aplicacao.
 *
 * Cada bean aqui registrado representa um cliente dedicado a um servico
 * externo, permitindo configurar URLs base, timeouts e headers padrao
 * em um unico lugar.
 */
@Configuration
public class HttpClientsConfig {

    @Bean(name = "viaCepRestClient")
    public RestClient viaCepRestClient(
            @Value("${external.viacep.base-url}") String baseUrl
    ) {
        return RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }
}
