package com.reusehub.anuncio.repository;

import com.reusehub.anuncio.model.Anuncio;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnuncioRepository extends JpaRepository<Anuncio, UUID> {

    Optional<Anuncio> findByIdAndStatusNot(UUID id, Anuncio.StatusAnuncio status);

    Page<Anuncio> findByUsuarioIdOrderByCriadoEmDesc(UUID usuarioId, Pageable pageable);

    List<Anuncio> findByUsuarioIdAndStatusOrderByCriadoEmDesc(UUID usuarioId, Anuncio.StatusAnuncio status);

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

    Page<Anuncio> findByStatusOrderByCriadoEmDesc(Anuncio.StatusAnuncio status, Pageable pageable);

    @Query("""
            select a from Anuncio a
            where (:status = '' or cast(a.status as string) = :status)
              and (
                :termo = ''
                or lower(a.titulo) like lower(concat('%', :termo, '%'))
                or lower(a.usuario.name) like lower(concat('%', :termo, '%'))
                or cast(a.id as string) like concat('%', :termo, '%')
              )
            order by a.atualizadoEm desc, a.criadoEm desc
            """)
    Page<Anuncio> buscarParaModeracao(
            @Param("termo") String termo,
            @Param("status") String status,
            Pageable pageable
    );

    long countByStatus(Anuncio.StatusAnuncio status);

    long countByTipo(Anuncio.TipoAnuncio tipo);

    Page<Anuncio> findByStatus(Anuncio.StatusAnuncio status, Pageable pageable);

    @Query(value = """
        SELECT * FROM anuncios
        WHERE to_tsvector('portuguese_unaccent',
                  coalesce(titulo, '') || ' ' || coalesce(descricao, ''))
              @@ plainto_tsquery('portuguese_unaccent', unaccent(:termo))
        AND status = 'ATIVO'
        ORDER BY ts_rank(
            to_tsvector('portuguese_unaccent',
                coalesce(titulo, '') || ' ' || coalesce(descricao, '')),
            plainto_tsquery('portuguese_unaccent', unaccent(:termo))
        ) DESC
        """, nativeQuery = true)
    Page<Anuncio> buscarPorTermo(@Param("termo") String termo, Pageable pageable);

    @Query(value = """
        SELECT sub.* FROM (
            SELECT a.*, e.latitude as end_lat, e.longitude as end_lng
            FROM anuncios a
            JOIN enderecos e ON a.endereco_id = e.id
            WHERE a.status = 'ATIVO'

            AND (
                :termo IS NULL
                OR to_tsvector('portuguese_unaccent',
                       coalesce(a.titulo, '') || ' ' || coalesce(a.descricao, ''))
                   @@ plainto_tsquery('portuguese_unaccent', unaccent(:termo))
            )

            AND (:categoriaId IS NULL OR a.categoria_id = :categoriaId)

            AND (:tipo IS NULL OR a.tipo::text = :tipo)

            AND (:condicao IS NULL OR a.condicao::text = :condicao)

            AND (
                :lat IS NULL OR :lng IS NULL OR :raioKm IS NULL
                OR (
                    e.latitude IS NOT NULL AND e.longitude IS NOT NULL
                    AND (
                        6371 * acos(
                            cos(radians(:lat)) * cos(radians(e.latitude)) *
                            cos(radians(e.longitude) - radians(:lng)) +
                            sin(radians(:lat)) * sin(radians(e.latitude))
                        )
                    ) <= :raioKm
                )
            )
        ) as sub

        ORDER BY
            CASE WHEN :ordenacao = 'DISTANCIA' AND :lat IS NOT NULL AND :lng IS NOT NULL THEN
                6371 * acos(
                    cos(radians(:lat)) * cos(radians(sub.end_lat)) *
                    cos(radians(sub.end_lng) - radians(:lng)) +
                    sin(radians(:lat)) * sin(radians(sub.end_lat))
                )
            END ASC NULLS LAST,

            CASE WHEN :ordenacao = 'RECENTES' THEN sub.criado_em
            END DESC NULLS LAST,

            CASE WHEN :ordenacao = 'POPULARES' THEN sub.total_visualizacoes
            END DESC NULLS LAST,

            CASE WHEN (:ordenacao IS NULL OR :ordenacao = 'RELEVANCIA') AND :termo IS NOT NULL THEN
                ts_rank(
                    to_tsvector('portuguese_unaccent',
                        coalesce(sub.titulo, '') || ' ' || coalesce(sub.descricao, '')),
                    plainto_tsquery('portuguese_unaccent', unaccent(:termo))
                )
            END DESC NULLS LAST,

            sub.nota_relevancia DESC NULLS LAST,
            sub.criado_em DESC
        """,
        countQuery = """
        SELECT count(*)
        FROM anuncios a
        JOIN enderecos e ON a.endereco_id = e.id
        WHERE a.status = 'ATIVO'

        AND (
            :termo IS NULL
            OR to_tsvector('portuguese_unaccent',
                   coalesce(a.titulo, '') || ' ' || coalesce(a.descricao, ''))
               @@ plainto_tsquery('portuguese_unaccent', unaccent(:termo))
        )

        AND (:categoriaId IS NULL OR a.categoria_id = :categoriaId)

        AND (:tipo IS NULL OR a.tipo::text = :tipo)

        AND (:condicao IS NULL OR a.condicao::text = :condicao)

        AND (
            :lat IS NULL OR :lng IS NULL OR :raioKm IS NULL
            OR (
                e.latitude IS NOT NULL AND e.longitude IS NOT NULL
                AND (
                    6371 * acos(
                        cos(radians(:lat)) * cos(radians(e.latitude)) *
                        cos(radians(e.longitude) - radians(:lng)) +
                        sin(radians(:lat)) * sin(radians(e.latitude))
                    )
                ) <= :raioKm
            )
        )
        """,
        nativeQuery = true)
    Page<Anuncio> buscarComFiltros(
            @Param("termo") String termo,
            @Param("categoriaId") Integer categoriaId,
            @Param("tipo") String tipo,
            @Param("condicao") String condicao,
            @Param("lat") Double lat,
            @Param("lng") Double lng,
            @Param("raioKm") Double raioKm,
            @Param("ordenacao") String ordenacao,
            Pageable pageable
    );

    @Query("SELECT a FROM Anuncio a WHERE a.status = 'ATIVO' " +
            "ORDER BY a.notaRelevancia DESC NULLS LAST, a.criadoEm DESC")
    Page<Anuncio> findAnunciosAtivosOrdenadosPorRelevancia(Pageable pageable);

    long countByUsuarioIdAndStatus(UUID usuarioId, Anuncio.StatusAnuncio status);

    boolean existsByUsuarioIdAndStatus(UUID usuarioId, Anuncio.StatusAnuncio status);

    @Modifying
    @Query("""
            update Anuncio a
            set a.status = com.reusehub.anuncio.model.Anuncio.StatusAnuncio.CANCELADO
            where a.usuario.id = :usuarioId
              and a.status in :statuses
            """)
    int cancelarPublicacoesDoUsuario(
            @Param("usuarioId") UUID usuarioId,
            @Param("statuses") Collection<Anuncio.StatusAnuncio> statuses
    );

    @Modifying
    @Query("""
            update Anuncio a
            set a.totalVisualizacoes = coalesce(a.totalVisualizacoes, 0) + 1
            where a.id = :anuncioId
            """)
    int incrementarTotalVisualizacoes(@Param("anuncioId") UUID anuncioId);

    List<Anuncio> findTop5ByOrderByTotalVisualizacoesDesc();

    @Query("SELECT a FROM Anuncio a WHERE a.status = 'ATIVO' " +
            "AND a.expiraEm IS NOT NULL " +
            "AND a.expiraEm <= CURRENT_TIMESTAMP")
    List<Anuncio> findAnunciosExpirados();

    @Query("""
            select a from Anuncio a
            join fetch a.usuario
            where a.status = com.reusehub.anuncio.model.Anuncio.StatusAnuncio.ATIVO
              and (a.expiraEm is null or a.expiraEm > CURRENT_TIMESTAMP)
            """)
    List<Anuncio> findAtivosNaoExpiradosParaRelevancia();

    @Query("""
            select a from Anuncio a
            where a.status = com.reusehub.anuncio.model.Anuncio.StatusAnuncio.ATIVO
              and (a.expiraEm is null or a.expiraEm > CURRENT_TIMESTAMP)
            order by a.criadoEm desc
            """)
    List<Anuncio> findElegiveisParaDestaque(Pageable pageable);

    @Query("""
            select a from Anuncio a
            where a.status = com.reusehub.anuncio.model.Anuncio.StatusAnuncio.ATIVO
              and (a.expiraEm is null or a.expiraEm > CURRENT_TIMESTAMP)
              and a.categoria.id = :categoriaId
            order by a.criadoEm desc
            """)
    List<Anuncio> findElegiveisParaDestaquePorCategoria(
            @Param("categoriaId") Integer categoriaId,
            Pageable pageable
    );

    @Query("""
            select a from Anuncio a
            where a.status = com.reusehub.anuncio.model.Anuncio.StatusAnuncio.ATIVO
              and (a.expiraEm is null or a.expiraEm > CURRENT_TIMESTAMP)
            order by coalesce(a.totalVisualizacoes, 0) desc, a.criadoEm desc
            """)
    List<Anuncio> findElegiveisOrdenadosPorPopularidade(Pageable pageable);

    @Query("""
            select a.categoria.id, sum(coalesce(a.totalVisualizacoes, 0))
            from Anuncio a
            where a.status = com.reusehub.anuncio.model.Anuncio.StatusAnuncio.ATIVO
              and (a.expiraEm is null or a.expiraEm > CURRENT_TIMESTAMP)
            group by a.categoria.id
            having count(a) >= :minimoAnuncios
            order by sum(coalesce(a.totalVisualizacoes, 0)) desc
            """)
    List<Object[]> listarCategoriasMaisPopulares(
            @Param("minimoAnuncios") long minimoAnuncios,
            Pageable pageable
    );
}
