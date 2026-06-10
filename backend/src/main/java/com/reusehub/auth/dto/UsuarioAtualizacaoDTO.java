package com.reusehub.auth.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UsuarioAtualizacaoDTO {

    @NotBlank(message = "Nome é obrigatório")
    @Size(min = 3, max = 100, message = "Nome deve ter entre 3 e 100 caracteres")
    private String name;

    @Pattern(regexp = "^(\\(\\d{2}\\)\\s?\\d{4,5}-?\\d{4}|\\d{10,11})$", message = "Telefone inválido")
private String phone;

    @Size(max = 500, message = "Biografia não pode ter mais de 500 caracteres")
    private String bio;

    private String avatarUrl;
}
