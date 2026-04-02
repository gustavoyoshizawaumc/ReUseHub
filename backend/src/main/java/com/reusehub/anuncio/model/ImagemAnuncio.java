package com.reusehub.anuncio.model;

import com.reusehub.shared.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "listing_images")
public class ImagemAnuncio extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    private Anuncio anuncio;

    @Column(name = "image_url", nullable = false, columnDefinition = "TEXT")
    private String urlImagem;

    @Column(name = "thumbnail_url", columnDefinition = "TEXT")
    private String urlThumbnail;

    @Column(name = "file_name")
    private String nomeArquivo;

    @Column(name = "is_cover")
    private Boolean ehCapa = false;

    @Column(name = "display_order")
    private Integer ordemExibicao = 0;
}