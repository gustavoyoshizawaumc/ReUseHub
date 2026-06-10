-- Soft delete de avaliacoes removidas pela moderacao.
--
-- Motivacao:
--  - A remocao de avaliacao pela moderacao era um DELETE fisico. Sem rastro no
--    banco, o usuario conseguia recriar a mesma avaliacao (o guard
--    existsByAvaliadorIdAndAnuncioId voltava a retornar false), reabrindo o
--    conteudo que tinha sido removido.
--  - Com removido_em, a linha permanece e bloqueia a recriacao (guard + unique
--    constraint avaliador+anuncio), mas e ignorada na media de reputacao, no
--    perfil publico e na fila de moderacao.
--
-- Semantica:
--  removido_em IS NULL      => avaliacao ativa
--  removido_em IS NOT NULL  => removida pela moderacao (data da remocao)

ALTER TABLE avaliacoes
    ADD COLUMN removido_em TIMESTAMP;
