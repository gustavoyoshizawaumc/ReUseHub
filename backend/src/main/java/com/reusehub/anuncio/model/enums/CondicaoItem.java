package com.reusehub.anuncio.model.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum CondicaoItem {
    NOVO("Novo"),
    BOM("Em bom estado"),
    REGULAR("Marcas de uso"),
    RUIM("Com defeito/ Para retirada de peças");

    private final String descricao;

    CondicaoItem(String descricao){
        this.descricao = descricao;
    }

    @JsonValue
    public String getDescricao(){
        return descricao;
    }
}
