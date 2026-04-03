package com.reusehub.anuncio.repository;

import com.reusehub.anuncio.model.ImagemAnuncio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
public interface ImagemAnuncioRepository extends JpaRepository<ImagemAnuncio, UUID> {

    List<ImagemAnuncio> findByAnuncio_IdOrderByOrdemExibicaoAsc(UUID anuncioId);

    int countByAnuncio_Id(UUID anuncioId);

    @Transactional
    void deleteByAnuncio_Id(UUID anuncioId);
}