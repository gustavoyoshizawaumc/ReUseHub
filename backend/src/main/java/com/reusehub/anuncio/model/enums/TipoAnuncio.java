package com.reusehub.anuncio.model.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum TipoAnuncio {
    DOACAO("Doação"),
    TROCA("Troca");

    private final String descricao;

    TipoAnuncio(String descricao){
        this.descricao = descricao;
    }

    @JsonValue
    public String getDescricao(){
        return descricao;
    }
}
