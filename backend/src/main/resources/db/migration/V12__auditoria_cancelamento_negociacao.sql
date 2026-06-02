ALTER TABLE interesses_troca
    ADD COLUMN IF NOT EXISTS cancelado_em TIMESTAMP,
    ADD COLUMN IF NOT EXISTS cancelado_por_id UUID REFERENCES usuarios(id);
