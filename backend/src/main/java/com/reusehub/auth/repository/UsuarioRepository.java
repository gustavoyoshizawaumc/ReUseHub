package com.reusehub.auth.repository;

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
    
    boolean existsByEmail(String email);
    
    boolean existsByCpf(String cpf);
    
    Optional<Usuario> findByEmail(String email);
    
    Optional<Usuario> findByCpf(String cpf);

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
