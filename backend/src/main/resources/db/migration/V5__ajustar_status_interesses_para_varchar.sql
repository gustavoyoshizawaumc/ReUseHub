ALTER TABLE interesses_troca
ALTER COLUMN status DROP DEFAULT;

ALTER TABLE interesses_troca
ALTER COLUMN status TYPE VARCHAR(20) USING status::text;

ALTER TABLE interesses_troca
ALTER COLUMN status SET DEFAULT 'PENDENTE';
