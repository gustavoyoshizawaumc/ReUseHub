package com.reusehub.interesse.repository;

import com.reusehub.interesse.model.InteresseTroca;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
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

    @Query("""
            select distinct interesse
            from InteresseTroca interesse
            left join interesse.anuncioOferecido oferecido
            where interesse.interessado.id = :usuarioId
               or interesse.anuncioDesejado.usuario.id = :usuarioId
               or oferecido.usuario.id = :usuarioId
            order by interesse.criadoEm desc
            """)
    List<InteresseTroca> findHistoricoByUsuarioIdOrderByCriadoEmDesc(@Param("usuarioId") UUID usuarioId);

    boolean existsByAnuncioDesejadoIdAndInteressadoIdAndStatus(
            UUID anuncioId,
            UUID interessadoId,
            InteresseTroca.StatusInteresse status
    );

    boolean existsByAnuncioDesejadoIdAndStatus(
            UUID anuncioId,
            InteresseTroca.StatusInteresse status
    );

    boolean existsByAnuncioDesejadoIdAndInteressadoIdAndAnuncioOferecidoIdAndStatus(
            UUID anuncioId,
            UUID interessadoId,
            UUID anuncioOferecidoId,
            InteresseTroca.StatusInteresse status
    );

    boolean existsByAnuncioDesejadoIdAndInteressadoIdAndAnuncioOferecidoIsNullAndStatus(
            UUID anuncioId,
            UUID interessadoId,
            InteresseTroca.StatusInteresse status
    );

    @Modifying
    @Query(value = """
            update interesses_troca
            set status = 'REJEITADO'
            where status = 'PENDENTE'
              and id <> :interesseAceitoId
              and anuncio_id = :anuncioId
            """, nativeQuery = true)
    int rejeitarOutrosPendentesDoAnuncio(
            @Param("interesseAceitoId") UUID interesseAceitoId,
            @Param("anuncioId") UUID anuncioId
    );

    Optional<InteresseTroca> findFirstByAnuncioDesejadoIdAndInteressadoIdAndStatusOrderByCriadoEmDesc(
            UUID anuncioId,
            UUID interessadoId,
            InteresseTroca.StatusInteresse status
    );

    Optional<InteresseTroca> findFirstByAnuncioDesejadoIdAndInteressadoIdAndStatusInOrderByCriadoEmDesc(
            UUID anuncioId,
            UUID interessadoId,
            List<InteresseTroca.StatusInteresse> statuses
    );

    @Query("""
            select interesse.anuncioDesejado.categoria.id, count(interesse)
            from InteresseTroca interesse
            where interesse.interessado.id = :usuarioId
            group by interesse.anuncioDesejado.categoria.id
            """)
    List<Object[]> contarInteressesPorCategoria(@Param("usuarioId") UUID usuarioId);

    long countByInteressadoId(UUID usuarioId);

    @Query(value = """
            select exists (
                select 1
                from interesses_troca interesse
                join anuncios desejado on desejado.id = interesse.anuncio_id
                left join anuncios oferecido on oferecido.id = interesse.anuncio_oferecido_id
                where interesse.status = 'ACEITO'
                  and interesse.recebimento_confirmado_em is null
                  and (
                    interesse.usuario_interessado_id = :usuarioId
                    or desejado.usuario_id = :usuarioId
                    or oferecido.usuario_id = :usuarioId
                  )
            )
            """, nativeQuery = true)
    boolean existsNegociacaoEmAndamento(@Param("usuarioId") UUID usuarioId);

    @Modifying
    @Query(value = """
            update interesses_troca
            set status = 'CANCELADO'
            where status = 'PENDENTE'
              and (
                usuario_interessado_id = :usuarioId
                or anuncio_id in (select id from anuncios where usuario_id = :usuarioId)
                or anuncio_oferecido_id in (select id from anuncios where usuario_id = :usuarioId)
              )
            """, nativeQuery = true)
    int cancelarPendentesRelacionadosAoUsuario(@Param("usuarioId") UUID usuarioId);
}
