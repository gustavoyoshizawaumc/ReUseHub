package com.reusehub.moderacao.repository;

import com.reusehub.moderacao.model.HistoricoModeracao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface HistoricoModeracaoRepository extends JpaRepository<HistoricoModeracao, UUID> {

    Page<HistoricoModeracao> findByModeradorIdOrderByCriadoEmDesc(UUID moderadorId, Pageable pageable);

    Page<HistoricoModeracao> findAllByOrderByCriadoEmDesc(Pageable pageable);

    @Query("""
            select h from HistoricoModeracao h
            where (:moderadorId = :moderadorSentinela or h.moderador.id = :moderadorId)
              and (
                :termo = ''
                or lower(h.acao) like lower(concat('%', :termo, '%'))
                or lower(h.alvoTipo) like lower(concat('%', :termo, '%'))
                or lower(coalesce(h.detalhes, '')) like lower(concat('%', :termo, '%'))
                or lower(h.moderador.name) like lower(concat('%', :termo, '%'))
                or cast(h.alvoId as string) like concat('%', :termo, '%')
              )
              and (:acao = '' or h.acao = :acao)
              and h.criadoEm >= :criadoDe
              and h.criadoEm < :criadoAte
            order by h.criadoEm desc
            """)
    Page<HistoricoModeracao> buscar(
            @Param("moderadorId") UUID moderadorId,
            @Param("moderadorSentinela") UUID moderadorSentinela,
            @Param("termo") String termo,
            @Param("acao") String acao,
            @Param("criadoDe") LocalDateTime criadoDe,
            @Param("criadoAte") LocalDateTime criadoAte,
            Pageable pageable
    );
}
