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

    @Column(name = "nome", nullable = false, length = 100)
    private String name;

    @Column(name = "email", nullable = false, length = 150, unique = true)
    private String email;

    @Column(name = "cpf", nullable = false, length = 11, unique = true)
    private String cpf;

    @Column(name = "senha_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "telefone", length = 20)
    private String phone;

    @Column(name = "url_avatar", columnDefinition = "TEXT")
    private String avatarUrl;

    @Column(name = "biografia", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "nota_reputacao", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal reputationScore = BigDecimal.ZERO;

    @Column(name = "ativo")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "email_verificado")
    @Builder.Default
    private Boolean isVerified = false;

    @Column(name = "consentimento_lgpd", nullable = false)
    private Boolean lgpdConsent;

    @Column(name = "data_consentimento_lgpd")
    private LocalDateTime lgpdConsentAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "perfil", nullable = false, length = 50)
    @Builder.Default
    private Perfil perfil = Perfil.USUARIO;
}