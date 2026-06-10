WITH interesses_pendentes_duplicados AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY
                anuncio_id,
                usuario_interessado_id,
                COALESCE(anuncio_oferecido_id, '00000000-0000-0000-0000-000000000000'::uuid)
            ORDER BY criado_em ASC, id ASC
        ) AS ordem
    FROM interesses_troca
    WHERE status = 'PENDENTE'
),
interesses_pendentes_com_negociacao_aceita AS (
    SELECT pendente.id
    FROM interesses_troca pendente
    WHERE pendente.status = 'PENDENTE'
      AND EXISTS (
          SELECT 1
          FROM interesses_troca aceito
          WHERE aceito.status = 'ACEITO'
            AND aceito.anuncio_id = pendente.anuncio_id
            AND aceito.usuario_interessado_id = pendente.usuario_interessado_id
      )
)
UPDATE interesses_troca
SET
    status = 'CANCELADO',
    cancelado_em = COALESCE(cancelado_em, NOW())
WHERE id IN (
    SELECT id
    FROM interesses_pendentes_duplicados
    WHERE ordem > 1

    UNION

    SELECT id
    FROM interesses_pendentes_com_negociacao_aceita
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_interesses_pendente_mesmo_item
ON interesses_troca (
    anuncio_id,
    usuario_interessado_id,
    COALESCE(anuncio_oferecido_id, '00000000-0000-0000-0000-000000000000'::uuid)
)
WHERE status = 'PENDENTE';

CREATE UNIQUE INDEX IF NOT EXISTS ux_interesses_aceito_por_usuario_anuncio
ON interesses_troca (
    anuncio_id,
    usuario_interessado_id
)
WHERE status = 'ACEITO';
