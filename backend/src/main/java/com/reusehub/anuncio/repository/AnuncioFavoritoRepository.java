package com.reusehub.anuncio.repository;

import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.model.AnuncioFavorito;
import com.reusehub.anuncio.model.AnuncioFavoritoId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnuncioFavoritoRepository extends JpaRepository<AnuncioFavorito, AnuncioFavoritoId> {

    boolean existsByUsuarioIdAndAnuncioId(UUID usuarioId, UUID anuncioId);

    void deleteByUsuarioIdAndAnuncioId(UUID usuarioId, UUID anuncioId);

    void deleteByUsuarioId(UUID usuarioId);

    @Query("""
            select favorito.anuncio.id
            from AnuncioFavorito favorito
            where favorito.usuario.id = :usuarioId
            order by favorito.criadoEm desc
            """)
    List<UUID> findAnuncioIdsByUsuarioId(@Param("usuarioId") UUID usuarioId);

    @Query("""
            select favorito.anuncio
            from AnuncioFavorito favorito
            where favorito.usuario.id = :usuarioId
            order by favorito.criadoEm desc
            """)
    List<Anuncio> findAnunciosFavoritosByUsuarioId(@Param("usuarioId") UUID usuarioId);

    /**
     * Conta favoritos do usuario agrupados por categoria.
     * Cada linha retornada e um par {@code [categoriaId (Integer), quantidade (Long)]}.
     * Usado para calcular afinidade do usuario por categoria no score de destaque.
     */
    @Query("""
            select favorito.anuncio.categoria.id, count(favorito)
            from AnuncioFavorito favorito
            where favorito.usuario.id = :usuarioId
            group by favorito.anuncio.categoria.id
            """)
    List<Object[]> contarFavoritosPorCategoria(@Param("usuarioId") UUID usuarioId);

    long countByUsuarioId(UUID usuarioId);
}
