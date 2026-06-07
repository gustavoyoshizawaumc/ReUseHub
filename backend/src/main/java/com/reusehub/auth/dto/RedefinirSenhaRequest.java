package com.reusehub.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class RedefinirSenhaRequest {

    @NotBlank(message = "Token é obrigatório")
    private String token;

    @NotBlank(message = "Nova senha é obrigatória")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]).{8,}$",
        message = "Senha deve ter no minimo 8 caracteres, incluindo maiuscula, minuscula, numero e caractere especial como !, ? ou @"
    )
    private String novaSenha;

    @NotBlank(message = "Confirmação de senha é obrigatória")
    private String confirmacaoSenha;
}
