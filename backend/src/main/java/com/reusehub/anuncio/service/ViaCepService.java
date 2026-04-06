package com.reusehub.anuncio.service;

import lombok.Builder;
import lombok.Data;
import org.springframework.stereotype.Service;

@Service
public class ViaCepService {

    @Data
    @Builder
    public static class DadosCEP {
        private String cep;
        private String rua;
        private String bairro;
        private String cidade;
        private String uf;
    }

    public DadosCEP buscarDadosCEP(String cep) {
        
        return DadosCEP.builder()
            .cep(cep)
            .rua("Rua Temporária")
            .bairro("Bairro Temporário")
            .cidade("São Paulo")
            .uf("SP")
            .build();
    }
}