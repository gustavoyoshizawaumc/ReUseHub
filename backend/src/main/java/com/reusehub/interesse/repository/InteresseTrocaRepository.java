package com.reusehub.interesse.repository;

import com.reusehub.interesse.model.InteresseTroca;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InteresseTrocaRepository extends JpaRepository<InteresseTroca, UUID> {

    List<InteresseTroca> findByAnuncioDesejadoUsuarioIdOrderByCriadoEmDesc(UUID usuarioId);

    List<InteresseTroca> findByInteressadoIdOrderByCriadoEmDesc(UUID usuarioId);
}