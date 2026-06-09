package com.reusehub.admin.dto;

import com.reusehub.auth.model.Perfil;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record AdminUsuarioDTO(
        UUID id,
        String name,
        String email,
        String cpf,
        String phone,
        Perfil perfil,
        Boolean ativo,
        Boolean banido,
        Boolean adminRaiz,
        Boolean acoesRestritas,
        BigDecimal notaReputacao,
        LocalDateTime criadoEm
) {
}
