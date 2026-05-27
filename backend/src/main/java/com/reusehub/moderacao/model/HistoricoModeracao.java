package com.reusehub.moderacao.model;

import com.reusehub.auth.model.Usuario;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "historico_moderacao")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoricoModeracao {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "moderador_id", nullable = false)
    private Usuario moderador;

    @Column(name = "acao", nullable = false, length = 80)
    private String acao;

    @Column(name = "alvo_tipo", nullable = false, length = 60)
    private String alvoTipo;

    @Column(name = "alvo_id")
    private UUID alvoId;

    @Column(name = "detalhes", columnDefinition = "TEXT")
    private String detalhes;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    @PrePersist
    void prePersist() {
        if (criadoEm == null) {
            criadoEm = LocalDateTime.now();
        }
    }
}
