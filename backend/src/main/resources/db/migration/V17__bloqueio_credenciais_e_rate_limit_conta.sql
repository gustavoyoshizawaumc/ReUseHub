CREATE TABLE IF NOT EXISTS credenciais_bloqueadas (
    id UUID PRIMARY KEY,
    email_hash VARCHAR(64) NOT NULL,
    cpf_hash VARCHAR(64) NOT NULL,
    motivo VARCHAR(40) NOT NULL,
    usuario_origem_id UUID,
    expira_em TIMESTAMP,
    detalhes TEXT,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_credenciais_bloqueadas_email_hash
    ON credenciais_bloqueadas (email_hash);

CREATE INDEX IF NOT EXISTS idx_credenciais_bloqueadas_cpf_hash
    ON credenciais_bloqueadas (cpf_hash);

CREATE INDEX IF NOT EXISTS idx_credenciais_bloqueadas_expira_em
    ON credenciais_bloqueadas (expira_em);
