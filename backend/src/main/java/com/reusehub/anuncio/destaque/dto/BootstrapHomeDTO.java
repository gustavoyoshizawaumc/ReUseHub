package com.reusehub.anuncio.destaque.dto;

import com.reusehub.anuncio.destaque.enums.CenarioHome;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record BootstrapHomeDTO(
        CenarioHome cenario,
        CategoriaEmDestaqueDTO categoriaEmDestaque,
        List<SecaoHomeDTO> secoes,
        Instant geradoEm,
        LocalDate dataRotacao
) {
}
