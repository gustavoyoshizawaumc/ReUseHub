package com.reusehub.anuncio.model; 

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "categorias")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "nome", nullable = false, unique = true, length = 80)
    private String nome;

    @Column(name = "slug", nullable = false, unique = true, length = 80)
    private String slug;

    @Column(name = "categoria_pai_id")
    private Integer categoriaPaiId;

    @Column(name = "url_icone", columnDefinition = "TEXT")
    private String urlIcone;

    @Column(name = "ativa", nullable = false)
    @Builder.Default
    private Boolean ativa = true;
}