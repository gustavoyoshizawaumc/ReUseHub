package com.reusehub.anuncio.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.reusehub.anuncio.exception.OperacaoInvalidaException;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
public class NominatimService {

    private static final String NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
    private static final String USER_AGENT = "ReUseHub/1.0";
    private static final int LIMITE_RESULTADOS = 1;
    private static final int CONNECT_TIMEOUT_MS = 3000;
    private static final int READ_TIMEOUT_MS = 8000;

    private final RestTemplate restTemplate = criarRestTemplateComTimeout();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private RestTemplate criarRestTemplateComTimeout() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return new RestTemplate(factory);
    }

    public Coordenadas buscarCoordenadasPorEndereco(String enderecoTextual) {
        log.info("Buscando coordenadas para: {}", enderecoTextual);
        long inicio = System.currentTimeMillis();

        String url = montarUrlPorEndereco(enderecoTextual);
        String resposta = executarRequisicao(url);
        Coordenadas coordenadas = extrairCoordenadas(resposta, enderecoTextual);

        log.info("Coordenadas obtidas em {}ms: lat={}, lng={}",
                System.currentTimeMillis() - inicio,
                coordenadas.getLatitude(),
                coordenadas.getLongitude());

        return coordenadas;
    }

    private String montarUrlPorEndereco(String enderecoTextual) {
        String enderecoEncoded = URLEncoder.encode(enderecoTextual, StandardCharsets.UTF_8);
        return NOMINATIM_URL
                + "?q=" + enderecoEncoded
                + "&format=json"
                + "&limit=" + LIMITE_RESULTADOS;
    }

    private String executarRequisicao(String url) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.USER_AGENT, USER_AGENT);
            HttpEntity<String> entity = new HttpEntity<>(headers);

            URI uri = new URI(url);

            ResponseEntity<String> resposta = restTemplate.exchange(
                    uri, HttpMethod.GET, entity, String.class
            );
            return resposta.getBody();
        } catch (OperacaoInvalidaException e) {
            throw e;
        } catch (Exception e) {
            throw new OperacaoInvalidaException(
                    "Falha ao consultar o serviço de geolocalização"
            );
        }
    }

    private Coordenadas extrairCoordenadas(String resposta, String referenciaConsulta) {
        try {
            JsonNode raiz = objectMapper.readTree(resposta);

            if (raiz.isEmpty()) {
                throw new OperacaoInvalidaException(
                        "Endereço não encontrado no geolocalizador: " + referenciaConsulta
                );
            }

            JsonNode primeiroResultado = raiz.get(0);
            double latitude = primeiroResultado.get("lat").asDouble();
            double longitude = primeiroResultado.get("lon").asDouble();

            return new Coordenadas(latitude, longitude);
        } catch (OperacaoInvalidaException e) {
            throw e;
        } catch (Exception e) {
            throw new OperacaoInvalidaException(
                    "Erro ao processar resposta do geolocalizador"
            );
        }
    }

    @Data
    public static class Coordenadas {
        private final double latitude;
        private final double longitude;
    }
}