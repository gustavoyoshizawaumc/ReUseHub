ALTER TABLE anuncios
DROP CONSTRAINT IF EXISTS chk_anuncios_status_valido;

ALTER TABLE anuncios
ADD CONSTRAINT chk_anuncios_status_valido
CHECK (status IN ('PENDENTE', 'ATIVO', 'REPROVADO', 'SUSPENSO', 'CONCLUIDO', 'CANCELADO', 'EXPIRADO'));
