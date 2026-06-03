-- Corrige efeito colateral da V13 em enderecos pre-existentes.
--
-- Contexto:
--  - A V13 adicionou a coluna precisao_localizacao com DEFAULT 'INDEFINIDA',
--    o que marcou TODOS os enderecos antigos como INDEFINIDA, inclusive os
--    que ja possuiam latitude/longitude validas geradas em geocodings anteriores.
--  - Consequencia: anuncios antigos com coordenadas reais foram excluidos do
--    filtro por raio (que exige precisao_localizacao != 'INDEFINIDA' na pratica,
--    ja que o filtro tambem checa latitude/longitude IS NOT NULL).
--
-- Acao:
--  - Marcar como ENDERECO_GEOCODIFICADO os registros que satisfazem TODOS:
--      a) precisao_localizacao = 'INDEFINIDA' (so corrige o que foi efeito da V13)
--      b) latitude e longitude NAO nulos
--      c) latitude e longitude diferentes de zero (descartando o lixo legado
--         que o NominatimService gravava como (0,0) silenciosamente antes da PR E.2)
--
-- Idempotencia:
--  - Migration segura para reexecucao mental (Flyway nao a rodara duas vezes,
--    mas o predicado WHERE garante que rodar manualmente outra vez tem efeito zero).
--
-- Cobertura validada via SELECT em producao antes da entrega (sanity check).

UPDATE enderecos
SET precisao_localizacao = 'ENDERECO_GEOCODIFICADO'
WHERE precisao_localizacao = 'INDEFINIDA'
  AND latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND latitude <> 0
  AND longitude <> 0;
