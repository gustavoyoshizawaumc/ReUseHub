package com.reusehub.perfil.dto;

import com.reusehub.anuncio.dto.AnuncioRespostaDTO;
import com.reusehub.avaliacao.dto.AvaliacaoRespostaDTO;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record PerfilPublicoDTO(
        UUID id,
        String name,
        String avatarUrl,
        String bio,
        BigDecimal reputationScore,
        List<AnuncioRespostaDTO> anunciosAtivos,
        List<AvaliacaoRespostaDTO> avaliacoesRecebidas
) {
}
