package com.reusehub.anuncio.service;

import com.reusehub.anuncio.exception.OperacaoInvalidaException;
import com.reusehub.anuncio.exception.RecursoNaoEncontradoException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
public class ViaCepService {

    private static final String RECURSO_CEP = "CEP";
    private static final String CAMINHO_CONSULTA = "/{cep}/json/";
    private static final String REGEX_CEP_VALIDO = "\\d{8}";
    private static final String REGEX_NAO_NUMERICO = "\\D";

    private final RestClient restClient;

    public ViaCepService(@Qualifier("viaCepRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    public DadosCEP buscarDadosCEP(String cepRaw) {
        String cep = normalizarEValidarCep(cepRaw);
        ViaCepResposta resposta = consultarViaCep(cep);
        garantirCepEncontrado(resposta, cep);
        return resposta.paraDadosCEP();
    }

    private ViaCepResposta consultarViaCep(String cep) {
        try {
            return restClient.get()
                    .uri(CAMINHO_CONSULTA, cep)
                    .retrieve()
                    .body(ViaCepResposta.class);
        } catch (RestClientException e) {
            throw new OperacaoInvalidaException(
                    "Falha na comunicacao com o servico ViaCEP", e
            );
        }
    }

    private void garantirCepEncontrado(ViaCepResposta resposta, String cep) {
        if (resposta == null || Boolean.TRUE.equals(resposta.erro())) {
            throw new RecursoNaoEncontradoException(RECURSO_CEP, cep);
        }
    }

    private String normalizarEValidarCep(String cep) {
        if (cep == null) {
            throw new OperacaoInvalidaException("O CEP nao pode ser nulo.");
        }

        String cepNormalizado = cep.replaceAll(REGEX_NAO_NUMERICO, "");

        if (!cepNormalizado.matches(REGEX_CEP_VALIDO)) {
            throw new OperacaoInvalidaException("Formato de CEP invalido: " + cep);
        }

        return cepNormalizado;
    }

    public record DadosCEP(
            String cep,
            String rua,
            String bairro,
            String cidade,
            String uf
    ) {
        public String paraEnderecoCompleto() {
            return String.format("%s, %s, %s, %s, Brasil", rua, bairro, cidade, uf);
        }
    }

    private record ViaCepResposta(
            String cep,
            String logradouro,
            String bairro,
            String localidade,
            String uf,
            Boolean erro
    ) {
        DadosCEP paraDadosCEP() {
            return new DadosCEP(cep, logradouro, bairro, localidade, uf);
        }
    }
}
