package com.reusehub.anuncio.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "listing_images")
public class ImagemAnuncio {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    private Anuncio anuncio;

    @Column(name = "image_url", nullable = false)
    private String urlImagem;

    @Column(name = "thumbnail_url")
    private String urlThumbnail;

    @Column(name = "file_name")
    private String nomeArquivo;

    @Column(name = "is_cover")
    private Boolean ehCapa = false;

    @Column(name = "display_order")
    private Integer ordemExibicao = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime criadoEm;
}