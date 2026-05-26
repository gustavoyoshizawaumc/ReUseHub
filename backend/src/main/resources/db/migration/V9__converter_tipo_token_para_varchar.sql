-- Converte o tipo ENUM do PostgreSQL para VARCHAR, igual foi feito em V3 para os anuncios.
-- Isso garante compatibilidade total com o Hibernate sem precisar de mapeamento de tipo customizado.
ALTER TABLE tokens_usuario ALTER COLUMN tipo TYPE VARCHAR USING tipo::text;

-- Restitui a integridade perdida com a saída do ENUM nativo:
-- o banco rejeita qualquer valor fora do conjunto permitido, independente da aplicação.
ALTER TABLE tokens_usuario
    ADD CONSTRAINT chk_tokens_usuario_tipo
        CHECK (tipo IN ('ATUALIZACAO', 'VERIFICACAO_EMAIL', 'RECUPERACAO_SENHA'));
