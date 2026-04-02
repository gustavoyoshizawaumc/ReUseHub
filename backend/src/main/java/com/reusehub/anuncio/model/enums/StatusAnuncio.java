package com.reusehub.anuncio.model.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum StatusAnuncio {
    ACTIVE("Ativo"),
    RESERVED("Reservado"),
    COMPLETED("Concluído"),
    CANCELLED("Cancelado");

    private final String descricao;

    StatusAnuncio(String descricao){
        this.descricao = descricao;
    }

    @JsonValue
    public String getDescricao(){
        return descricao;
    }
}
