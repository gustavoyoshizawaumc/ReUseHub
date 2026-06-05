package com.reusehub.auth.repository;

import com.reusehub.auth.model.CredencialBloqueada;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface CredencialBloqueadaRepository extends JpaRepository<CredencialBloqueada, UUID> {

    @Query("""
            select count(c) > 0
            from CredencialBloqueada c
            where (c.emailHash = :emailHash or c.cpfHash = :cpfHash)
              and (c.expiraEm is null or c.expiraEm > :agora)
            """)
    boolean existsBloqueioAtivoPorEmailOuCpf(
            @Param("emailHash") String emailHash,
            @Param("cpfHash") String cpfHash,
            @Param("agora") LocalDateTime agora
    );

    @Query("""
            select count(c) > 0
            from CredencialBloqueada c
            where (c.emailHash = :emailHash or c.cpfHash = :cpfHash)
              and c.motivo = :motivo
              and (c.expiraEm is null or c.expiraEm > :agora)
            """)
    boolean existsBanimentoAtivoPorEmailOuCpf(
            @Param("emailHash") String emailHash,
            @Param("cpfHash") String cpfHash,
            @Param("motivo") CredencialBloqueada.Motivo motivo,
            @Param("agora") LocalDateTime agora
    );
}
