-- Renomeia categorias para os nomes curtos definidos pelo time (slugs mantidos
-- para nao quebrar URLs/filtros existentes) e remove as 6 categorias descontinuadas.
-- A FK anuncios.categoria_id e NOT NULL com RESTRICT: se alguma das categorias
-- removidas ainda tiver anuncio vinculado, o DELETE falha e a migration aborta
-- sem destruir dados (decisao: falhar em vez de reatribuir/excluir anuncios).

-- Renomeacoes (apenas as que de fato mudam de nome)
UPDATE categorias SET nome = 'Celulares'      WHERE slug = 'celulares-e-telefonia';
UPDATE categorias SET nome = 'Casa'           WHERE slug = 'casa-decoracao-e-utensilios';
UPDATE categorias SET nome = 'Esporte'        WHERE slug = 'esportes-e-fitness';
UPDATE categorias SET nome = 'Moda e Beleza'  WHERE slug = 'moda-e-beleza';
UPDATE categorias SET nome = 'Infantil'       WHERE slug = 'artigos-infantis';
UPDATE categorias SET nome = 'Pets'           WHERE slug = 'animais-de-estimacao';
UPDATE categorias SET nome = 'Hobbies'        WHERE slug = 'musica-e-hobbies';
UPDATE categorias SET nome = 'Agro'           WHERE slug = 'agro-e-industria';
UPDATE categorias SET nome = 'Eletrônicos'     WHERE slug = 'cameras-e-drones';
UPDATE categorias SET nome = 'Eletrodoméstico' WHERE slug = 'eletro';
UPDATE categorias SET nome = 'Construção'      WHERE slug = 'materiais-de-construcao';
UPDATE categorias SET nome = 'Escritório'      WHERE slug = 'escritorio-e-home-office';

-- Remocao das categorias descontinuadas
DELETE FROM categorias WHERE slug IN (
    'imoveis',
    'servicos',
    'vagas-de-emprego',
    'comercio',
    'tvs-e-video',
    'audio'
);
