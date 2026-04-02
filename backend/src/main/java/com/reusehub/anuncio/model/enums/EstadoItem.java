package com.reusehub.anuncio.model.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum EstadoItem {
    NEW("Novo"),
    GOOD("Em bom estado"),
    FAIR("Marcas de uso"),
    POOR("Com defeito/ Para retirada de peças");

    private final String descricao;

    EstadoItem(String descricao){
        this.descricao = descricao;
    }

    @JsonValue
    public String getDescricao(){
        return descricao;
    }
}
