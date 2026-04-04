package com.reusehub.anuncio.model.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum StatusAnuncio {
    ATIVO("Ativo"),
    RESERVADO("Reservado"),
    CONCLUIDO("Concluído"),
    CANCELADO("Cancelado");

    private final String descricao;

    StatusAnuncio(String descricao){
        this.descricao = descricao;
    }

    @JsonValue
    public String getDescricao(){
        return descricao;
    }
}
