package com.reusehub.anuncio.repository;

import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.model.enums.StatusAnuncio;
import com.reusehub.anuncio.model.enums.TipoAnuncio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AnuncioRepository extends JpaRepository<Anuncio, UUID> {

    List<Anuncio> findByUsuario_Id(UUID usuarioId);

    List<Anuncio> findByStatus(StatusAnuncio status);

    List<Anuncio> findByUsuario_IdAndTipoAndStatus(UUID usuarioId, TipoAnuncio tipo, StatusAnuncio status);
}