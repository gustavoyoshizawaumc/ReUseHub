CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE TEXT SEARCH CONFIGURATION portuguese_unaccent (COPY = portuguese);
ALTER TEXT SEARCH CONFIGURATION portuguese_unaccent
    ALTER MAPPING FOR hword, hword_part, word
    WITH unaccent, portuguese_stem;

CREATE INDEX idx_anuncios_fts
ON anuncios
USING GIN(
    to_tsvector('portuguese_unaccent',
        coalesce(titulo, '') || ' ' || coalesce(descricao, '')
    )
);

CREATE INDEX idx_anuncios_categoria_status
ON anuncios(categoria_id, status);

CREATE INDEX idx_anuncios_tipo_status
ON anuncios(tipo, status);

CREATE INDEX idx_anuncios_status_relevancia
ON anuncios(status, nota_relevancia DESC, criado_em DESC);

CREATE INDEX idx_enderecos_lat_lng
ON enderecos(latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;