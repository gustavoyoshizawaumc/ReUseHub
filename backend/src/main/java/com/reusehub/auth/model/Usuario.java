package com.reusehub.auth.model;

import com.reusehub.shared.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")
@Data
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Usuario extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 150, unique = true)
    private String email;

    @Column(nullable = false, length = 14, unique = true)
    private String cpf;

    @Column(nullable = false, length = 255)
    private String passwordHash;

    @Column(length = 20)
    private String phone;

    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "reputation_score", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal reputationScore = BigDecimal.ZERO;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_verified")
    @Builder.Default
    private Boolean isVerified = false;

    @Column(name = "lgpd_consent", nullable = false)
    private Boolean lgpdConsent;

    @Column(name = "lgpd_consent_at")
    private LocalDateTime lgpdConsentAt;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Perfil perfil = Perfil.USUARIO;
}