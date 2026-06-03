-- Tracking explicito de visualizacoes de anuncios (PR D.2).
--
-- Motivacao:
--  - Ate aqui, Anuncio.totalVisualizacoes existia mas nunca era incrementado,
--    deixando o sinal de "popularidade" do CalculadorScoreDestaque inutil
--    (sempre 0 para todos os anuncios).
--  - Esta tabela registra 1 linha por visualizacao valida, possibilitando:
--      * agregacao por janela temporal (ex: views dos ultimos 7 dias)
--      * dedupe robusto em 3 camadas (logado / anonimo / IP)
--      * historico para metricas futuras (sem reconstruir)
--
-- Identificacao (em ordem de prioridade no service):
--   1. usuario_id  -> usuario logado via JWT
--   2. anon_id     -> UUID gerado pelo client em localStorage (X-Anon-Id)
--   3. ip_address  -> fallback quando faltam os dois acima
--
-- Regras anti-fraude (aplicadas no RegistroVisualizacaoService):
--   - dono do anuncio nao gera linha (descartado silenciosamente)
--   - dedupe de 1h por chave de identificacao mais especifica disponivel

CREATE TABLE visualizacoes_anuncio (
    id UUID PRIMARY KEY,
    anuncio_id UUID NOT NULL REFERENCES anuncios(id) ON DELETE CASCADE,
    usuario_id UUID NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    anon_id VARCHAR(64) NULL,
    ip_address VARCHAR(45) NULL,
    origem VARCHAR(40) NOT NULL,
    visualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Garante que toda visualizacao tenha ao menos um identificador.
    -- Se os tres forem NULL e bug ou abuso direto na tabela.
    CONSTRAINT chk_visualizacao_tem_identificador
        CHECK (usuario_id IS NOT NULL OR anon_id IS NOT NULL OR ip_address IS NOT NULL)
);

-- Agregacao por anuncio em janela temporal (views ultimos 7 dias na home).
CREATE INDEX idx_visualizacoes_anuncio_anuncio_data
    ON visualizacoes_anuncio (anuncio_id, visualizado_em DESC);

-- Dedupe camada 1: usuario logado.
CREATE INDEX idx_visualizacoes_anuncio_usuario_anuncio_data
    ON visualizacoes_anuncio (usuario_id, anuncio_id, visualizado_em DESC)
    WHERE usuario_id IS NOT NULL;

-- Dedupe camada 2: anonimo identificado.
CREATE INDEX idx_visualizacoes_anuncio_anon_anuncio_data
    ON visualizacoes_anuncio (anon_id, anuncio_id, visualizado_em DESC)
    WHERE anon_id IS NOT NULL;

-- Dedupe camada 3: fallback por IP (bot/curl sem anon_id).
CREATE INDEX idx_visualizacoes_anuncio_ip_anuncio_data
    ON visualizacoes_anuncio (ip_address, anuncio_id, visualizado_em DESC)
    WHERE ip_address IS NOT NULL;
