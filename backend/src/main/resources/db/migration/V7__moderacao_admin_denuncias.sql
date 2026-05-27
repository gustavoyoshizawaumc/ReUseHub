ALTER TABLE denuncias_anuncio
ALTER COLUMN status TYPE VARCHAR USING status::text;

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS banido BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS historico_moderacao (
    id UUID PRIMARY KEY,
    moderador_id UUID REFERENCES usuarios(id) NOT NULL,
    acao VARCHAR(80) NOT NULL,
    alvo_tipo VARCHAR(60) NOT NULL,
    alvo_id UUID,
    detalhes TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
