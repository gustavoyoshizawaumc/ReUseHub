package com.reusehub.interesse.repository;

import com.reusehub.interesse.model.InteresseTroca;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
