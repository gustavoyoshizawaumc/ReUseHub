package com.reusehub.backend.anuncio.service;

import com.reusehub.anuncio.exception.OperacaoInvalidaException;
import com.reusehub.anuncio.exception.RecursoNaoEncontradoException;
import com.reusehub.anuncio.service.NominatimService;
import com.reusehub.anuncio.service.NominatimService.Coordenadas;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.client.match.MockRestRequestMatchers;
import org.springframework.test.web.client.response.MockRestResponseCreators;
import org.springframework.web.client.RestClient;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DisplayName("Testes Unitarios de NominatimService")
class NominatimServiceTest {

    private static final String BASE_URL = "https://nominatim.openstreetmap.org";
    private static final String CAMINHO_BUSCA = BASE_URL + "/search";
    private static final String ENDERECO_VALIDO = "Avenida Paulista, Bela Vista, Sao Paulo, SP, Brasil";
    private static final String ENDERECO_INEXISTENTE = "endereco que nao existe em lugar nenhum";
    private static final double LATITUDE_ESPERADA = -23.561414;
    private static final double LONGITUDE_ESPERADA = -46.655881;
    private static final double DELTA_PRECISAO = 0.000001;
    private static final String QUERY_FORMATO_JSON = "format=json";
    private static final String QUERY_LIMITE_UM = "limit=1";

    private NominatimService nominatimService;
    private MockRestServiceServer mockServer;

    @BeforeEach
    void prepararCenario() {
        RestClient.Builder builder = RestClient.builder().baseUrl(BASE_URL);
        mockServer = MockRestServiceServer.bindTo(builder).build();
        nominatimService = new NominatimService(builder.build());
    }

    @Test
    @DisplayName("deve retornar coordenadas ao consultar endereco existente")
    void buscarCoordenadasComSucesso() {
        String jsonMock = """
            [{"lat":"-23.561414","lon":"-46.655881"}]
            """;

        mockServer.expect(MockRestRequestMatchers.requestTo(matcherDeRequisicaoNominatim()))
                .andRespond(MockRestResponseCreators.withSuccess(jsonMock, MediaType.APPLICATION_JSON));

        Coordenadas resultado = nominatimService.buscarCoordenadasPorEndereco(ENDERECO_VALIDO);

        assertNotNull(resultado);
        assertEquals(LATITUDE_ESPERADA, resultado.latitude(), DELTA_PRECISAO);
        assertEquals(LONGITUDE_ESPERADA, resultado.longitude(), DELTA_PRECISAO);
        mockServer.verify();
    }

    @Test
    @DisplayName("deve estourar RecursoNaoEncontradoException quando Nominatim retornar lista vazia")
    void erroEnderecoInexistente() {
        mockServer.expect(MockRestRequestMatchers.requestTo(matcherDeRequisicaoNominatim()))
                .andRespond(MockRestResponseCreators.withSuccess("[]", MediaType.APPLICATION_JSON));

        assertThrows(RecursoNaoEncontradoException.class,
                () -> nominatimService.buscarCoordenadasPorEndereco(ENDERECO_INEXISTENTE));
    }

    @Test
    @DisplayName("deve estourar OperacaoInvalidaException quando o servico Nominatim falhar")
    void erroServicoIndisponivel() {
        mockServer.expect(MockRestRequestMatchers.requestTo(matcherDeRequisicaoNominatim()))
                .andRespond(MockRestResponseCreators.withServerError());

        assertThrows(OperacaoInvalidaException.class,
                () -> nominatimService.buscarCoordenadasPorEndereco(ENDERECO_VALIDO));
    }

    private org.hamcrest.Matcher<String> matcherDeRequisicaoNominatim() {
        return Matchers.allOf(
                Matchers.startsWith(CAMINHO_BUSCA),
                Matchers.containsString(QUERY_FORMATO_JSON),
                Matchers.containsString(QUERY_LIMITE_UM)
        );
    }
}
