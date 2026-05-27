package com.reusehub.admin.dto;

import com.reusehub.auth.model.Perfil;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminCriarModeradorDTO(
        @NotBlank @Size(min = 3, max = 100) String name,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6) String password,
        Perfil perfil
) {
}
