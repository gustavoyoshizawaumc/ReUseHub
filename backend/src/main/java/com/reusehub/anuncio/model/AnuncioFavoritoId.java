package com.reusehub.anuncio.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Data
@Embeddable
@NoArgsConstructor
@AllArgsConstructor
public class AnuncioFavoritoId implements Serializable {

    @Column(name = "usuario_id", nullable = false)
    private UUID usuarioId;

    @Column(name = "anuncio_id", nullable = false)
    private UUID anuncioId;
}
