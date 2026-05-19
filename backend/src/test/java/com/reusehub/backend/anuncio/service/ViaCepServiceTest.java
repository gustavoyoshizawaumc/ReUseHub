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

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Testes Unitários de ViaCepService")
class ViaCepServiceTest {

    private ViaCepService viaCepService;
    private MockRestServiceServer mockServer;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://viacep.com.br/ws");
        mockServer = MockRestServiceServer.bindTo(builder).build();
        
        viaCepService = new ViaCepService();
        org.springframework.test.util.ReflectionTestUtils.setField(viaCepService, "restClient", builder.build());
    }

    @Test
    @DisplayName("deve retornar dados mapeados com sucesso ao informar CEP válido")
    void buscarCepComSucesso() {
        String jsonMock = """
            {
                "cep": "01001-000",
                "logradouro": "Praça da Sé",
                "bairro": "Sé",
                "localidade": "São Paulo",
                "uf": "SP"
            }
            """;

        mockServer.expect(MockRestRequestMatchers.requestTo("https://viacep.com.br/ws/01001000/json/"))
                .andRespond(MockRestResponseCreators.withSuccess(jsonMock, MediaType.APPLICATION_JSON));

        ViaCepService.DadosCEP resultado = viaCepService.buscarDadosCEP("01001-000");

        assertNotNull(resultado);
        assertEquals("Praça da Sé", resultado.getRua());
        assertEquals("Sé", resultado.getBairro());
        assertEquals("São Paulo", resultado.getCidade());
        assertEquals("SP", resultado.getUf());
        mockServer.verify();
    }

    @Test
    @DisplayName("deve estourar RecursoNaoEncontradoException se o CEP não existir no banco do ViaCEP")
    void erroCepInexistente() {
        String jsonErroMock = "{ \"erro\": true }";

        mockServer.expect(MockRestRequestMatchers.requestTo("https://viacep.com.br/ws/99999999/json/"))
                .andRespond(MockRestResponseCreators.withSuccess(jsonErroMock, MediaType.APPLICATION_JSON));

        assertThrows(RecursoNaoEncontradoException.class, () -> {
            viaCepService.buscarDadosCEP("99999-999");
        });
    }

    @Test
    @DisplayName("deve estourar OperacaoInvalidaException se o formato do CEP for malformado")
    void erroFormatoInvalido() {
        assertThrows(OperacaoInvalidaException.class, () -> viaCepService.buscarDadosCEP("123-ABC"));
        assertThrows(OperacaoInvalidaException.class, () -> viaCepService.buscarDadosCEP("1234"));
        assertThrows(OperacaoInvalidaException.class, () -> viaCepService.buscarDadosCEP(null));
    }
}