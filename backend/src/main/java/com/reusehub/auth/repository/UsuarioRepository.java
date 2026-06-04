package com.reusehub.auth.repository;

import com.reusehub.auth.crypto.SensitiveDataCrypto;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.model.Perfil;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    boolean existsByEmailHash(String emailHash);

    boolean existsByCpfHash(String cpfHash);

    Optional<Usuario> findByEmailHash(String emailHash);

    Optional<Usuario> findByCpfHash(String cpfHash);

    default boolean existsByEmail(String email) {
        return existsByEmailHash(SensitiveDataCrypto.emailHash(email));
    }

    default boolean existsByCpf(String cpf) {
        return existsByCpfHash(SensitiveDataCrypto.cpfHash(cpf));
    }

    default Optional<Usuario> findByEmail(String email) {
        return findByEmailHash(SensitiveDataCrypto.emailHash(email));
    }

    default Optional<Usuario> findByCpf(String cpf) {
        return findByCpfHash(SensitiveDataCrypto.cpfHash(cpf));
    }

    List<Usuario> findTop5ByOrderByReputationScoreDesc();

    @Query("""
            select count(u)
            from Usuario u
            where u.perfil = :perfil
              and u.isActive = true
              and (u.banido = false or u.banido is null)
            """)
    long countAtivosNaoBanidosPorPerfil(Perfil perfil);
}
