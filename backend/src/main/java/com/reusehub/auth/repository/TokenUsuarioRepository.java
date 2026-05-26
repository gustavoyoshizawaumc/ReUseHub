package com.reusehub.auth.repository;

import com.reusehub.auth.model.TipoToken;
import com.reusehub.auth.model.TokenUsuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TokenUsuarioRepository extends JpaRepository<TokenUsuario, UUID> {

    Optional<TokenUsuario> findByTokenAndTipo(String token, TipoToken tipo);

    /**
     * Marca como usados todos os tokens ativos do usuário para um dado tipo,
     * evitando que tokens antigos de recuperação de senha continuem válidos.
     */
    @Modifying
    @Query("""
            UPDATE TokenUsuario t
            SET t.usadoEm = CURRENT_TIMESTAMP
            WHERE t.usuario.id = :usuarioId
              AND t.tipo = :tipo
              AND t.usadoEm IS NULL
            """)
    void invalidarTokensAntigos(UUID usuarioId, TipoToken tipo);
}
