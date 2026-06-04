ALTER TABLE usuarios
    DROP CONSTRAINT IF EXISTS usuarios_email_key,
    DROP CONSTRAINT IF EXISTS usuarios_cpf_key;

ALTER TABLE usuarios
    ALTER COLUMN nome TYPE TEXT,
    ALTER COLUMN email TYPE TEXT,
    ALTER COLUMN cpf TYPE TEXT,
    ALTER COLUMN telefone TYPE TEXT;

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS email_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS cpf_hash VARCHAR(64);

CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_email_hash
    ON usuarios (email_hash)
    WHERE email_hash IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_cpf_hash
    ON usuarios (cpf_hash)
    WHERE cpf_hash IS NOT NULL;
