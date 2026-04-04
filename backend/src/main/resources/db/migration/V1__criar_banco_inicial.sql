CREATE TYPE tipo_anuncio AS ENUM ('DOACAO', 'TROCA');
CREATE TYPE condicao_item AS ENUM ('NOVO', 'BOM', 'REGULAR', 'RUIM');
CREATE TYPE status_anuncio AS ENUM ('ATIVO', 'RESERVADO', 'CONCLUIDO', 'CANCELADO');
CREATE TYPE status_interesse AS ENUM ('PENDENTE', 'ACEITO', 'REJEITADO', 'CANCELADO');
CREATE TYPE tipo_token AS ENUM ('ATUALIZACAO', 'VERIFICACAO_EMAIL', 'RECUPERACAO_SENHA');
CREATE TYPE status_denuncia AS ENUM ('ABERTA', 'ANALISADA', 'DESCARTADA');

CREATE TABLE usuarios (
    id UUID PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    cpf VARCHAR(11) UNIQUE NOT NULL,
    url_avatar TEXT,
    biografia TEXT,
    nota_reputacao DECIMAL(3,2) DEFAULT 0.00,
    ativo BOOLEAN DEFAULT TRUE,
    email_verificado BOOLEAN DEFAULT FALSE,
    consentimento_lgpd BOOLEAN NOT NULL,
    data_consentimento_lgpd TIMESTAMP,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP
);

CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(80) UNIQUE NOT NULL,
    slug VARCHAR(80) UNIQUE NOT NULL,
    categoria_pai_id INTEGER REFERENCES categorias(id),
    url_icone TEXT,
    ativa BOOLEAN DEFAULT TRUE
);

CREATE TABLE enderecos (
    id UUID PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id) NOT NULL,
    cep VARCHAR(9) NOT NULL,
    rua VARCHAR(150),
    numero VARCHAR(10),
    complemento VARCHAR(80),
    bairro VARCHAR(100),
    cidade VARCHAR(100) NOT NULL,
    uf VARCHAR(2) NOT NULL,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    principal BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notificacoes (
    id UUID PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    mensagem TEXT,
    referencia_id UUID,
    tipo_referencia VARCHAR(50),
    lida BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tokens_usuario (
    id UUID PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id) NOT NULL,
    token TEXT UNIQUE NOT NULL,
    tipo tipo_token NOT NULL,
    expira_em TIMESTAMP NOT NULL,
    usado_em TIMESTAMP,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE anuncios (
    id UUID PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id) NOT NULL,
    categoria_id INTEGER REFERENCES categorias(id) NOT NULL,
    endereco_id UUID REFERENCES enderecos(id) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT NOT NULL,
    tipo tipo_anuncio NOT NULL,
    condicao condicao_item NOT NULL,
    status status_anuncio DEFAULT 'ATIVO',
    total_visualizacoes INTEGER DEFAULT 0,
    nota_relevancia DECIMAL(8,4) DEFAULT 0,
    expira_em TIMESTAMP,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP
);

CREATE TABLE imagens_anuncio (
    id UUID PRIMARY KEY,
    anuncio_id UUID REFERENCES anuncios(id) NOT NULL,
    url_imagem TEXT NOT NULL,
    capa BOOLEAN DEFAULT FALSE,
    ordem_exibicao SMALLINT DEFAULT 0,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE interesses_troca (
    id UUID PRIMARY KEY,
    anuncio_id UUID REFERENCES anuncios(id) NOT NULL,
    usuario_interessado_id UUID REFERENCES usuarios(id) NOT NULL,
    anuncio_oferecido_id UUID REFERENCES anuncios(id),
    mensagem TEXT,
    status status_interesse DEFAULT 'PENDENTE',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE avaliacoes (
    id UUID PRIMARY KEY,
    avaliador_id UUID REFERENCES usuarios(id) NOT NULL,
    avaliado_id UUID REFERENCES usuarios(id) NOT NULL,
    anuncio_id UUID REFERENCES anuncios(id) NOT NULL,
    nota SMALLINT CHECK (nota >= 1 AND nota <= 5) NOT NULL,
    comentario TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_avaliador_anuncio UNIQUE (avaliador_id, anuncio_id)
);

CREATE TABLE anuncios_favoritos (
    usuario_id UUID REFERENCES usuarios(id) NOT NULL,
    anuncio_id UUID REFERENCES anuncios(id) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, anuncio_id)
);

CREATE TABLE denuncias_anuncio (
    id UUID PRIMARY KEY,
    denunciante_id UUID REFERENCES usuarios(id) NOT NULL,
    anuncio_id UUID REFERENCES anuncios(id) NOT NULL,
    motivo VARCHAR(100) NOT NULL,
    descricao TEXT,
    status status_denuncia DEFAULT 'ABERTA',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);