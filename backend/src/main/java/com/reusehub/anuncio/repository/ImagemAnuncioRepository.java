package com.reusehub.anuncio.repository;

import com.reusehub.anuncio.model.ImagemAnuncio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ImagemAnuncioRepository extends JpaRepository<ImagemAnuncio, UUID> {

    List<ImagemAnuncio> findByAnuncioIdOrderByOrdemExibicaoAsc(UUID anuncioId);

    List<ImagemAnuncio> findByAnuncioId(UUID anuncioId);
}
