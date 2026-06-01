package com.reusehub.interesse.repository;

import com.reusehub.interesse.model.InteresseTroca;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InteresseTrocaRepository extends JpaRepository<InteresseTroca, UUID> {

    List<InteresseTroca> findByAnuncioDesejadoUsuarioIdOrderByCriadoEmDesc(UUID usuarioId);

    List<InteresseTroca> findByInteressadoIdOrderByCriadoEmDesc(UUID usuarioId);

    boolean existsByAnuncioDesejadoIdAndInteressadoIdAndStatus(
            UUID anuncioId,
            UUID interessadoId,
            InteresseTroca.StatusInteresse status
    );

    boolean existsByAnuncioDesejadoIdAndStatus(
            UUID anuncioId,
            InteresseTroca.StatusInteresse status
    );

    Optional<InteresseTroca> findFirstByAnuncioDesejadoIdAndInteressadoIdAndStatusOrderByCriadoEmDesc(
            UUID anuncioId,
            UUID interessadoId,
            InteresseTroca.StatusInteresse status
    );

    /**
     * Conta interesses enviados pelo usuario agrupados pela categoria do anuncio desejado.
     * Cada linha retornada e um par {@code [categoriaId (Integer), quantidade (Long)]}.
     * Usado para calcular afinidade do usuario por categoria no score de destaque.
     */
    @Query("""
            select interesse.anuncioDesejado.categoria.id, count(interesse)
            from InteresseTroca interesse
            where interesse.interessado.id = :usuarioId
            group by interesse.anuncioDesejado.categoria.id
            """)
    List<Object[]> contarInteressesPorCategoria(@Param("usuarioId") UUID usuarioId);

    long countByInteressadoId(UUID usuarioId);
}
