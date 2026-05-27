package com.reusehub.avaliacao.repository;

import com.reusehub.avaliacao.model.Avaliacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AvaliacaoRepository extends JpaRepository<Avaliacao, UUID> {

    boolean existsByAvaliadorIdAndAnuncioId(UUID avaliadorId, UUID anuncioId);

    boolean existsByAnuncioId(UUID anuncioId);

    List<Avaliacao> findByAvaliadoIdOrderByCriadoEmDesc(UUID avaliadoId);

    @Query("select avg(a.nota) from Avaliacao a where a.avaliado.id = :avaliadoId")
    Double calcularMediaDoAvaliado(UUID avaliadoId);
}
