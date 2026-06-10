package com.reusehub.anuncio.visualizacao.model;

import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.visualizacao.enums.OrigemVisualizacao;
import com.reusehub.auth.model.Usuario;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "visualizacoes_anuncio")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisualizacaoAnuncio {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "anuncio_id", nullable = false)
    private Anuncio anuncio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(name = "anon_id", length = 64)
    private String anonId;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Enumerated(EnumType.STRING)
    @Column(name = "origem", nullable = false, length = 40)
    private OrigemVisualizacao origem;

    @CreationTimestamp
    @Column(name = "visualizado_em", nullable = false, updatable = false)
    private LocalDateTime visualizadoEm;
}
