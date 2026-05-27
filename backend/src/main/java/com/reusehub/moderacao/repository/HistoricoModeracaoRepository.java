package com.reusehub.moderacao.repository;

import com.reusehub.moderacao.model.HistoricoModeracao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface HistoricoModeracaoRepository extends JpaRepository<HistoricoModeracao, UUID> {

    Page<HistoricoModeracao> findByModeradorIdOrderByCriadoEmDesc(UUID moderadorId, Pageable pageable);

    Page<HistoricoModeracao> findAllByOrderByCriadoEmDesc(Pageable pageable);
}
