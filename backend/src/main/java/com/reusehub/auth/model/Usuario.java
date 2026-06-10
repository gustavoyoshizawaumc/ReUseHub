package com.reusehub.auth.model;

import com.reusehub.auth.crypto.SensitiveDataCrypto;
import com.reusehub.auth.crypto.SensitiveStringConverter;
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

    @Convert(converter = SensitiveStringConverter.class)
    @Column(name = "nome", nullable = false, columnDefinition = "TEXT")
    private String name;

    @Convert(converter = SensitiveStringConverter.class)
    @Column(name = "email", nullable = false, columnDefinition = "TEXT")
    private String email;

    @Column(name = "email_hash", length = 64)
    private String emailHash;

    @Convert(converter = SensitiveStringConverter.class)
    @Column(name = "cpf", nullable = false, columnDefinition = "TEXT")
    private String cpf;

    @Column(name = "cpf_hash", length = 64)
    private String cpfHash;

    @Column(name = "senha_hash", nullable = false, length = 255)
    private String passwordHash;

    @Convert(converter = SensitiveStringConverter.class)
    @Column(name = "telefone", columnDefinition = "TEXT")
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

    @Column(name = "banido")
    @Builder.Default
    private Boolean banido = false;

    @Column(name = "conta_excluida", nullable = false)
    @Builder.Default
    private Boolean contaExcluida = false;

    @Column(name = "desativado_em")
    private LocalDateTime desativadoEm;

    @Column(name = "excluido_em")
    private LocalDateTime excluidoEm;

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

    @PrePersist
    @PreUpdate
    private void atualizarIndicesSensiveis() {
        this.emailHash = SensitiveDataCrypto.emailHash(email);
        this.cpfHash = SensitiveDataCrypto.cpfHash(cpf);
    }
}
