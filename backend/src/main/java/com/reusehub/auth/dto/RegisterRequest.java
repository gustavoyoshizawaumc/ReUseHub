package com.reusehub.auth.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    
    @NotBlank(message = "Nome é obrigatório")
    @Size(min = 3, max = 100, message = "Nome deve ter entre 3 e 100 caracteres")
    private String name;
    
    @NotBlank(message = "CPF é obrigatório")
    @Pattern(regexp = "^\\d{11}$|^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$", 
            message = "CPF deve ter 11 dígitos ou formato XXX.XXX.XXX-XX")
    private String cpf;
    
    @NotBlank(message = "E-mail é obrigatório")
    @Email(message = "E-mail inválido")
    private String email;
    
    @NotBlank(message = "Senha é obrigatória")
    @Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres")
    private String password;
    
    @Pattern(regexp = "^\\d{10,11}$", message = "Telefone inválido")
    private String phone;
    
    @NotNull(message = "Consentimento LGPD é obrigatório")
    private Boolean lgpdConsent;
}