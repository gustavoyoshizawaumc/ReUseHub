package com.reusehub.backend.anuncio.model;

import com.reusehub.anuncio.model.Anuncio;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@DisplayName("Testes do builder de Anuncio")
class AnuncioTest {

    @Test
    @DisplayName("builder inicializa nota_relevancia em ZERO (nunca null) para nao furar a ordenacao por relevancia")
    void builderInicializaRelevanciaEmZero() {
        Anuncio anuncio = Anuncio.builder().build();

        assertNotNull(anuncio.getNotaRelevancia(), "nota_relevancia nao pode nascer null (NULL vai pro topo no ORDER BY DESC)");
        assertEquals(0, BigDecimal.ZERO.compareTo(anuncio.getNotaRelevancia()));
    }
}
