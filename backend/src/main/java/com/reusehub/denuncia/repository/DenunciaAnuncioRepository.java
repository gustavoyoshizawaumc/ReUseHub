package com.reusehub.denuncia.repository;

import com.reusehub.denuncia.model.DenunciaAnuncio;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DenunciaAnuncioRepository extends JpaRepository<DenunciaAnuncio, UUID> {

    Page<DenunciaAnuncio> findByStatusOrderByCriadoEmDesc(
            DenunciaAnuncio.StatusDenuncia status,
            Pageable pageable
    );

    long countByStatus(DenunciaAnuncio.StatusDenuncia status);

    long countByStatusNot(DenunciaAnuncio.StatusDenuncia status);

    long countByAnuncioIdAndStatus(UUID anuncioId, DenunciaAnuncio.StatusDenuncia status);

    boolean existsByDenuncianteIdAndAnuncioId(UUID denuncianteId, UUID anuncioId);

    @Query("""
            select d.anuncio.id, count(d.id)
            from DenunciaAnuncio d
            where d.status = 'ABERTA'
            group by d.anuncio.id
            having count(d.id) >= :minimo
            order by count(d.id) desc
            """)
    List<Object[]> listarAnunciosSuspeitos(@Param("minimo") long minimo);
}
