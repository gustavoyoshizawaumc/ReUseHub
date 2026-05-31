package com.reusehub.anuncio.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

/**
 * DTO que representa a edicao do conjunto de imagens de um anuncio.
 *
 * O contrato e: o cliente envia a lista completa dos ids das imagens que
 * deseja MANTER, na ordem desejada. Imagens existentes nao listadas sao
 * removidas. Novas imagens chegam separadamente no @RequestPart e sao
 * anexadas ao final, preservando a ordem de upload.
 */
public record AnuncioImagensAtualizacaoDTO(
        @NotNull List<UUID> idsParaManter
) {
}
