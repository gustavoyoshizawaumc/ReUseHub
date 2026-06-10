package com.reusehub.avaliacao.repository;

import com.reusehub.avaliacao.model.Avaliacao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AvaliacaoRepository extends JpaRepository<Avaliacao, UUID> {

    boolean existsByAvaliadorIdAndAnuncioId(UUID avaliadorId, UUID anuncioId);

    boolean existsByAnuncioId(UUID anuncioId);

    Page<Avaliacao> findAllByOrderByCriadoEmDesc(Pageable pageable);

    @Query("""
            select a from Avaliacao a
            where a.removidoEm is null
              and (:termo = ''
                or lower(a.anuncio.titulo) like lower(concat('%', :termo, '%'))
                or lower(a.avaliador.name) like lower(concat('%', :termo, '%'))
                or lower(a.avaliado.name) like lower(concat('%', :termo, '%'))
                or lower(coalesce(a.comentario, '')) like lower(concat('%', :termo, '%'))
                or cast(a.id as string) like concat('%', :termo, '%'))
              and (:nota = 0 or a.nota = :nota)
              and a.criadoEm >= :criadoDe
              and a.criadoEm < :criadoAte
            order by a.criadoEm desc
            """)
    Page<Avaliacao> buscarParaModeracao(
            @Param("termo") String termo,
            @Param("nota") Integer nota,
            @Param("criadoDe") LocalDateTime criadoDe,
            @Param("criadoAte") LocalDateTime criadoAte,
            Pageable pageable
    );

    List<Avaliacao> findByAvaliadoIdAndRemovidoEmIsNullOrderByCriadoEmDesc(UUID avaliadoId);

    @Query("select avg(a.nota) from Avaliacao a where a.avaliado.id = :avaliadoId and a.removidoEm is null")
    Double calcularMediaDoAvaliado(UUID avaliadoId);
}
