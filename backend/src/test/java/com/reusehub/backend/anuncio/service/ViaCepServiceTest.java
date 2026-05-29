package com.reusehub.backend.anuncio.service;

import com.reusehub.anuncio.exception.OperacaoInvalidaException;
import com.reusehub.anuncio.exception.RecursoNaoEncontradoException;
import com.reusehub.anuncio.service.ViaCepService;
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

@DisplayName("Testes Unitarios de ViaCepService")
class ViaCepServiceTest {

    private static final String BASE_URL = "https://viacep.com.br/ws";

    private ViaCepService viaCepService;
    private MockRestServiceServer mockServer;

    @BeforeEach
    void prepararCenario() {
        RestClient.Builder builder = RestClient.builder().baseUrl(BASE_URL);
        mockServer = MockRestServiceServer.bindTo(builder).build();
        viaCepService = new ViaCepService(builder.build());
    }

    @Test
    @DisplayName("deve retornar dados mapeados com sucesso ao informar CEP valido")
    void buscarCepComSucesso() {
        String jsonMock = """
            {
                "cep": "01001-000",
                "logradouro": "Praca da Se",
                "bairro": "Se",
                "localidade": "Sao Paulo",
                "uf": "SP"
            }
            """;

        mockServer.expect(MockRestRequestMatchers.requestTo(BASE_URL + "/01001000/json/"))
                .andRespond(MockRestResponseCreators.withSuccess(jsonMock, MediaType.APPLICATION_JSON));

        ViaCepService.DadosCEP resultado = viaCepService.buscarDadosCEP("01001-000");

        assertNotNull(resultado);
        assertEquals("Praca da Se", resultado.rua());
        assertEquals("Se", resultado.bairro());
        assertEquals("Sao Paulo", resultado.cidade());
        assertEquals("SP", resultado.uf());
        mockServer.verify();
    }

    @Test
    @DisplayName("deve estourar RecursoNaoEncontradoException se o CEP nao existir no banco do ViaCEP")
    void erroCepInexistente() {
        String jsonErroMock = "{ \"erro\": true }";

        mockServer.expect(MockRestRequestMatchers.requestTo(BASE_URL + "/99999999/json/"))
                .andRespond(MockRestResponseCreators.withSuccess(jsonErroMock, MediaType.APPLICATION_JSON));

        assertThrows(RecursoNaoEncontradoException.class,
                () -> viaCepService.buscarDadosCEP("99999-999"));
    }

    @Test
    @DisplayName("deve estourar OperacaoInvalidaException se o formato do CEP for malformado")
    void erroFormatoInvalido() {
        assertThrows(OperacaoInvalidaException.class, () -> viaCepService.buscarDadosCEP("123-ABC"));
        assertThrows(OperacaoInvalidaException.class, () -> viaCepService.buscarDadosCEP("1234"));
        assertThrows(OperacaoInvalidaException.class, () -> viaCepService.buscarDadosCEP(null));
    }
}
