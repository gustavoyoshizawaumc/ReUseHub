package com.reusehub.anuncio.dto;

import com.reusehub.anuncio.model.Anuncio;
import lombok.Data;

@Data
public class BuscaFiltroDTO {

    private String termo;
    private Integer categoriaId;
    private Anuncio.TipoAnuncio tipo;
    private Anuncio.CondicaoItem condicao;

    private Double latitude;
    private Double longitude;
    private Double raioKm;
    private String cep;

    private TipoOrdenacao ordenacao;

    public boolean possuiCoordenadas() {
        return latitude != null && longitude != null;
    }

    public boolean possuiCep() {
        return cep != null && !cep.isBlank();
    }

    public boolean possuiTermoBusca() {
        return termo != null && !termo.isBlank();
    }
}