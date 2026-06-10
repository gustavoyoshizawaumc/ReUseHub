package com.reusehub.avaliacao.model;

import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.auth.model.Usuario;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "avaliacoes", uniqueConstraints = {
        @UniqueConstraint(name = "unique_avaliador_anuncio", columnNames = {"avaliador_id", "anuncio_id"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Avaliacao {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "avaliador_id", nullable = false)
    private Usuario avaliador;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "avaliado_id", nullable = false)
    private Usuario avaliado;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "anuncio_id", nullable = false)
    private Anuncio anuncio;

    @Column(name = "nota", nullable = false)
    private short nota;

    @Column(name = "comentario", columnDefinition = "TEXT")
    private String comentario;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    /**
     * Quando preenchido, a avaliacao foi removida pela moderacao (soft delete).
     * A linha permanece para bloquear a recriacao pelo mesmo avaliador no mesmo
     * anuncio; leituras (media, perfil publico, fila de moderacao) a ignoram.
     */
    @Column(name = "removido_em")
    private LocalDateTime removidoEm;

    @PrePersist
    void prePersist() {
        if (criadoEm == null) {
            criadoEm = LocalDateTime.now();
        }
    }

    /** True quando a avaliacao foi removida pela moderacao (soft delete). */
    public boolean estaRemovida() {
        return removidoEm != null;
    }
}
