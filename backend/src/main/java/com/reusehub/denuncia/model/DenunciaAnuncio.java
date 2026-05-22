package com.reusehub.denuncia.model;

import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.auth.model.Usuario;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "denuncias_anuncio")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DenunciaAnuncio {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "denunciante_id", nullable = false)
    private Usuario denunciante;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "anuncio_id", nullable = false)
    private Anuncio anuncio;

    @Column(name = "motivo", nullable = false, length = 100)
    private String motivo;

    @Column(name = "descricao", columnDefinition = "TEXT")
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private StatusDenuncia status = StatusDenuncia.ABERTA;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    @PrePersist
    void prePersist() {
        if (criadoEm == null) {
            criadoEm = LocalDateTime.now();
        }
        if (status == null) {
            status = StatusDenuncia.ABERTA;
        }
    }

    public enum StatusDenuncia {
        ABERTA,
        ANALISADA,
        DESCARTADA
    }
}
