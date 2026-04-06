ALTER TABLE anuncios 
ALTER COLUMN tipo TYPE VARCHAR USING tipo::text;

ALTER TABLE anuncios 
ALTER COLUMN condicao TYPE VARCHAR USING condicao::text;

ALTER TABLE anuncios 
ALTER COLUMN status TYPE VARCHAR USING status::text;