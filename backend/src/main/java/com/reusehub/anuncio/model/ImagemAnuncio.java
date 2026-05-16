package com.reusehub.anuncio.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "imagens_anuncio")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImagemAnuncio {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "anuncio_id", nullable = false)
    private Anuncio anuncio;

    @Column(name = "url_imagem", nullable = false, columnDefinition = "TEXT")
    private String urlImagem;

    @Column(name = "capa")
    @Builder.Default
    private Boolean capa = false;

    @Column(name = "ordem_exibicao")
    @Builder.Default
    private Short ordemExibicao = 0;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;
}