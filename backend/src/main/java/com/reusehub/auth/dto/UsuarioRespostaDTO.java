package com.reusehub.auth.dto;

import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
public class UsuarioRespostaDTO {
    private UUID id;
    private String name;
    private String email;
    private String phone;
    private String cpf;
    private String avatarUrl;
    private String bio;
    private BigDecimal reputationScore;
    private Boolean isActive;
    private Boolean banido;
    private Boolean isVerified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
