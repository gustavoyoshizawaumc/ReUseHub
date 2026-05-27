WITH denuncias_duplicadas AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY denunciante_id, anuncio_id
            ORDER BY criado_em ASC, id ASC
        ) AS ordem
    FROM denuncias_anuncio
)
DELETE FROM denuncias_anuncio
WHERE id IN (
    SELECT id
    FROM denuncias_duplicadas
    WHERE ordem > 1
);

ALTER TABLE denuncias_anuncio
ADD CONSTRAINT uk_denuncias_anuncio_denunciante_anuncio
UNIQUE (denunciante_id, anuncio_id);
