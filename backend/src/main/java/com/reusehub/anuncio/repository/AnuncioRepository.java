package com.reusehub.anuncio.repository;

import com.reusehub.anuncio.model.Anuncio;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnuncioRepository extends JpaRepository<Anuncio, UUID> {

    Optional<Anuncio> findByIdAndStatusNot(UUID id, Anuncio.StatusAnuncio status);

    Page<Anuncio> findByUsuarioId(UUID usuarioId, Pageable pageable);

    Page<Anuncio> findByCategoriaIdAndStatus(
        Integer categoriaId,
        Anuncio.StatusAnuncio status,
        Pageable pageable
    );

    Page<Anuncio> findByTipoAndStatus(
        Anuncio.TipoAnuncio tipo,
        Anuncio.StatusAnuncio status,
        Pageable pageable
    );

    @Query("SELECT a FROM Anuncio a WHERE " +
           "(LOWER(a.titulo) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
           "LOWER(a.descricao) LIKE LOWER(CONCAT('%', :termo, '%'))) AND " +
           "a.status = 'ATIVO'")
    Page<Anuncio> buscarPorTermo(@Param("termo") String termo, Pageable pageable);

    @Query("SELECT a FROM Anuncio a WHERE a.status = 'ATIVO' " +
           "ORDER BY a.notaRelevancia DESC, a.criadoEm DESC")
    Page<Anuncio> findAnunciosAtivosOrdenadosPorRelevancia(Pageable pageable);

    long countByUsuarioIdAndStatus(UUID usuarioId, Anuncio.StatusAnuncio status);

    @Query("SELECT a FROM Anuncio a WHERE a.status = 'ATIVO' " +
           "AND a.expiraEm IS NOT NULL " +
           "AND a.expiraEm <= CURRENT_TIMESTAMP")
    List<Anuncio> findAnunciosExpirados();
}