package com.reusehub.anuncio.model.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum TipoAnuncio {
    DONATION("Doação"),
    TRADE("Troca");

    private final String descricao;

    TipoAnuncio(String descricao){
        this.descricao = descricao;
    }

    @JsonValue
    public String getDescricao(){
        return descricao;
    }
}
