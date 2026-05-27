package com.reusehub.auth.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tokens_usuario")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TokenUsuario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Usuario usuario;

    /**
     * Armazena o HASH SHA-256 do token, nunca o token puro.
     * O token puro só existe no e-mail enviado ao usuário.
     */
    @Column(name = "token", nullable = false, unique = true, columnDefinition = "TEXT")
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false)
    private TipoToken tipo;

    @Column(name = "expira_em", nullable = false)
    private LocalDateTime expiraEm;

    @Column(name = "usado_em")
    private LocalDateTime usadoEm;

    @Column(name = "criado_em", updatable = false)
    private LocalDateTime criadoEm;

    @PrePersist
    protected void onCreate() {
        if (criadoEm == null) {
            criadoEm = LocalDateTime.now();
        }
    }
}
