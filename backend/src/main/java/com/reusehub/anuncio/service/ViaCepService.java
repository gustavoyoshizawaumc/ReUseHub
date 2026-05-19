package com.reusehub.anuncio.service;

import com.reusehub.anuncio.exception.OperacaoInvalidaException;
import com.reusehub.anuncio.exception.RecursoNaoEncontradoException;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class ViaCepService {

    private final RestClient restClient;

    public ViaCepService() {
        this.restClient = RestClient.builder()
                .baseUrl("https://viacep.com.br/ws")
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DadosCEP {
        private String cep;
        private String rua;
        private String bairro;
        private String cidade;
        private String uf;
    }

    @Data
    private static class ViaCepResponse {
        private String cep;
        private String logradouro;
        private String bairro;
        private String localidade;
        private String uf;
        private Boolean erro;
    }

    public DadosCEP buscarDadosCEP(String cepRaw) {
        String cep = limparEValidarCep(cepRaw);

        try {
            ViaCepResponse response = restClient.get()
                    .uri("/{cep}/json/", cep)
                    .retrieve()
                    .body(ViaCepResponse.class);

            if (response == null || Boolean.TRUE.equals(response.getErro())) {
                throw new RecursoNaoEncontradoException("CEP", cep);
            }

            return DadosCEP.builder()
                    .cep(response.getCep())
                    .rua(response.getLogradouro())
                    .bairro(response.getBairro())
                    .cidade(response.getLocalidade())
                    .uf(response.getUf())
                    .build();

        } catch (RecursoNaoEncontradoException e) {
            throw e;
        } catch (Exception e) {
            throw new OperacaoInvalidaException("Falha na comunicação com o serviço externo ViaCEP: " + e.getMessage());
        }
    }

    private String limparEValidarCep(String cep) {
        if (cep == null) {
            throw new OperacaoInvalidaException("O CEP não pode ser nulo.");
        }

        String cepLimpo = cep.replaceAll("\\D", "");

        if (!cepLimpo.matches("\\d{8}")) {
            throw new OperacaoInvalidaException("Formato de CEP inválido: " + cep);
        }

        return cepLimpo;
    }
}