-- Adiciona o campo precisao_localizacao em enderecos.
--
-- Motivacao:
--  - O geocoding pode falhar (servico fora, CEP recem-criado, etc.) e ate agora o
--    sistema gravava (0,0) silenciosamente, poluindo o filtro de busca por distancia.
--  - Com este campo, sabemos a origem da coordenada e podemos:
--    * ENDERECO_GEOCODIFICADO: lat/lng vieram do geocoder, podem ser usadas em raio
--    * INDEFINIDA: geocoder falhou; lat/lng ficam NULL e o anuncio sai do filtro por raio
--
-- Valor default 'INDEFINIDA' para enderecos antigos. O job de retry assincrono
-- (PR futura) podera refinar esses registros depois.

ALTER TABLE enderecos
    ADD COLUMN precisao_localizacao VARCHAR(30) NOT NULL DEFAULT 'INDEFINIDA';

-- Indice parcial: acelera a busca por anuncios elegiveis a filtro de distancia.
CREATE INDEX IF NOT EXISTS idx_enderecos_coordenadas_validas
    ON enderecos (latitude, longitude)
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
