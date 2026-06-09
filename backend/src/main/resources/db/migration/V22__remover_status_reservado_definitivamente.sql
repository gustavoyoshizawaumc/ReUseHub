UPDATE anuncios
SET status = 'ATIVO'
WHERE status = 'RESERVADO';

ALTER TABLE anuncios
DROP CONSTRAINT IF EXISTS chk_anuncios_status_valido;

ALTER TABLE anuncios
ADD CONSTRAINT chk_anuncios_status_valido
CHECK (status IN ('PENDENTE', 'ATIVO', 'REPROVADO', 'SUSPENSO', 'CONCLUIDO', 'CANCELADO'));

ALTER TABLE anuncios
ALTER COLUMN status SET DEFAULT 'PENDENTE';

DROP TYPE IF EXISTS status_anuncio;
