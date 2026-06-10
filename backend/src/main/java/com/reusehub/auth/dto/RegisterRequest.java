package com.reusehub.auth.dto;

import com.reusehub.auth.validation.ValidCpf;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Nome é obrigatório")
    @Size(min = 3, max = 100, message = "Nome deve ter entre 3 e 100 caracteres")
    private String name;

    @NotBlank(message = "CPF é obrigatório")
    @ValidCpf
    private String cpf;

    @NotBlank(message = "E-mail é obrigatório")
    @Email(message = "E-mail inválido")
    private String email;

    @NotBlank(message = "Senha é obrigatória")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]).{8,}$",
        message = "Senha deve ter no minimo 8 caracteres, incluindo maiuscula, minuscula, numero e caractere especial como !, ? ou @"
    )
    private String password;

    @Pattern(regexp = "^\\d{10,11}$", message = "Telefone inválido")
    private String phone;

    @NotNull(message = "Consentimento LGPD é obrigatório")
    private Boolean lgpdConsent;
}
