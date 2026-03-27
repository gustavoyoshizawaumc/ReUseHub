package com.reusehub.auth.dto;

import com.reusehub.auth.model.Perfil;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class AuthResponse {

    private String token;
    private String id;
    private String name;
    private String cpf;
    private String email;
    private String phone;
    
    @JsonProperty("avatar_url")
    private String avatarUrl;
    
    private String bio;
    private Perfil perfil;
    
    @JsonProperty("reputation_score")
    private BigDecimal reputationScore;
    
    @JsonProperty("is_active")
    private Boolean isActive;
    
    @JsonProperty("is_verified")
    private Boolean isVerified;
    
    @JsonProperty("lgpd_consent")
    private Boolean lgpdConsent;
    
    @JsonProperty("lgpd_consent_at")
    private LocalDateTime lgpdConsentAt;
    
    @JsonProperty("created_at")
    private LocalDateTime createdAt;
    
    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;
}