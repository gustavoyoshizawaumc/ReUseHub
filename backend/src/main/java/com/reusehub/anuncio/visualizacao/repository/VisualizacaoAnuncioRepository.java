package com.reusehub.anuncio.visualizacao.repository;

import com.reusehub.anuncio.visualizacao.model.VisualizacaoAnuncio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Acesso a dados de {@link VisualizacaoAnuncio}.
 *
 * <p>O repository foca em duas operacoes:
 * <ul>
 *   <li>verificar se ja existe visualizacao recente para a chave de dedupe
 *       (uma query por camada de identificacao, para usar os indices parciais
 *       criados na V15);</li>
 *   <li>agregar contagem por anuncio em janela temporal, usado pelo refino
 *       do score de destaque (PR D.2).</li>
 * </ul>
 */
@Repository
public interface VisualizacaoAnuncioRepository extends JpaRepository<VisualizacaoAnuncio, UUID> {

    /**
     * Camada 1 (usuario logado): existe visualizacao deste usuario neste anuncio
     * a partir de {@code limiteInferior}?
     */
    boolean existsByUsuarioIdAndAnuncioIdAndVisualizadoEmAfter(
            UUID usuarioId,
            UUID anuncioId,
            LocalDateTime limiteInferior
    );

    /**
     * Camada 2 (anonimo identificado): existe visualizacao deste anon_id neste
     * anuncio a partir de {@code limiteInferior}?
     */
    boolean existsByAnonIdAndAnuncioIdAndVisualizadoEmAfter(
            String anonId,
            UUID anuncioId,
            LocalDateTime limiteInferior
    );

    /**
     * Camada 3 (fallback por IP): existe visualizacao deste IP neste anuncio
     * a partir de {@code limiteInferior}?
     */
    boolean existsByIpAddressAndAnuncioIdAndVisualizadoEmAfter(
            String ipAddress,
            UUID anuncioId,
            LocalDateTime limiteInferior
    );

    /**
     * Contagem de visualizacoes por anuncio em janela temporal, para um
     * conjunto de ids (consulta unica para evitar N+1 no ranqueamento).
     *
     * <p>Retorna {@code Object[]} com {@code [anuncioId (UUID), total (Long)]}.
     * O service converte para {@code Map<UUID, Integer>} usando getOrDefault(0).
     */
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
