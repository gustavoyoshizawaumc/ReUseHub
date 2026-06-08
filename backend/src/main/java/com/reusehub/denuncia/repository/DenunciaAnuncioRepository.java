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

    @Query("""
            select d from DenunciaAnuncio d
            where (:status = '' or cast(d.status as string) = :status)
              and (
                :termo = ''
                or lower(d.anuncio.titulo) like lower(concat('%', :termo, '%'))
                or lower(d.denunciante.name) like lower(concat('%', :termo, '%'))
                or lower(d.motivo) like lower(concat('%', :termo, '%'))
                or cast(d.id as string) like concat('%', :termo, '%')
              )
            order by d.criadoEm desc
            """)
    Page<DenunciaAnuncio> buscarParaModeracao(
            @Param("termo") String termo,
            @Param("status") String status,
            Pageable pageable
    );

    long countByStatus(DenunciaAnuncio.StatusDenuncia status);

    long countByStatusNot(DenunciaAnuncio.StatusDenuncia status);

    long countByAnuncioIdAndStatus(UUID anuncioId, DenunciaAnuncio.StatusDenuncia status);

    List<DenunciaAnuncio> findByAnuncioIdAndStatus(UUID anuncioId, DenunciaAnuncio.StatusDenuncia status);

    boolean existsByDenuncianteIdAndAnuncioId(UUID denuncianteId, UUID anuncioId);

    @Query("""
            select d.anuncio.id, count(d.id)
            from DenunciaAnuncio d
            where d.status = 'ABERTA'
              and (:status = '' or cast(d.anuncio.status as string) = :status)
              and (
                :termo = ''
                or lower(d.anuncio.titulo) like lower(concat('%', :termo, '%'))
                or lower(d.anuncio.usuario.name) like lower(concat('%', :termo, '%'))
                or cast(d.anuncio.id as string) like concat('%', :termo, '%')
              )
            group by d.anuncio.id
            having count(d.id) >= :minimo
            order by count(d.id) desc
            """)
    List<Object[]> listarAnunciosSuspeitos(
            @Param("minimo") long minimo,
            @Param("termo") String termo,
            @Param("status") String status
    );
}
