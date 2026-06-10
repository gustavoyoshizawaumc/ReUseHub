package com.reusehub.anuncio.visualizacao.repository;

import com.reusehub.anuncio.visualizacao.model.VisualizacaoAnuncio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface VisualizacaoAnuncioRepository extends JpaRepository<VisualizacaoAnuncio, UUID> {

    @Query("""
            select (count(v) > 0) from VisualizacaoAnuncio v
            where v.usuario.id = :usuarioId
              and v.anuncio.id = :anuncioId
              and v.visualizadoEm > :limiteInferior
            """)
    boolean existeVisualizacaoRecenteDeUsuario(
            @Param("usuarioId") UUID usuarioId,
            @Param("anuncioId") UUID anuncioId,
            @Param("limiteInferior") LocalDateTime limiteInferior
    );

    @Query("""
            select (count(v) > 0) from VisualizacaoAnuncio v
            where v.anonId = :anonId
              and v.anuncio.id = :anuncioId
              and v.visualizadoEm > :limiteInferior
            """)
    boolean existeVisualizacaoRecenteDeAnonimo(
            @Param("anonId") String anonId,
            @Param("anuncioId") UUID anuncioId,
            @Param("limiteInferior") LocalDateTime limiteInferior
    );

    @Query("""
            select (count(v) > 0) from VisualizacaoAnuncio v
            where v.ipAddress = :ipAddress
              and v.anuncio.id = :anuncioId
              and v.visualizadoEm > :limiteInferior
            """)
    boolean existeVisualizacaoRecenteDeIp(
            @Param("ipAddress") String ipAddress,
            @Param("anuncioId") UUID anuncioId,
            @Param("limiteInferior") LocalDateTime limiteInferior
    );

    @Query("""
            select v.anuncio.id, count(v)
            from VisualizacaoAnuncio v
            where v.anuncio.id in :anuncioIds
              and v.visualizadoEm >= :limiteInferior
            group by v.anuncio.id
            """)
    List<Object[]> contarPorAnuncioDesde(
            @Param("anuncioIds") List<UUID> anuncioIds,
            @Param("limiteInferior") LocalDateTime limiteInferior
    );
}
