package com.reusehub.anuncio.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "categorias")
public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "nome", nullable = false, unique = true, length = 80)
    private String nome;

    @Column(name = "slug", nullable = false, unique = true, length = 80)
    private String slug;

    // Auto-relacionamento para subcategorias (Ex: "Eletrônicos" -> "Celulares")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_pai_id")
    private Categoria categoriaPai;

    @Column(name = "url_icone", columnDefinition = "TEXT")
    private String urlIcone;

    @Column(name = "ativa")
    private Boolean ativa = true;
}