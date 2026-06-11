# ReUseHub

Plataforma web gratuita de doacao e troca de itens usados.

Projeto Final de Curso do Bacharelado em Sistemas de Informacao da Universidade de Mogi das Cruzes.

## Visao geral

O ReUseHub foi criado para aproximar pessoas que desejam dar um novo destino a itens usados em bom estado. A proposta da plataforma e facilitar doacoes e trocas de forma simples, segura e acessivel, incentivando o reaproveitamento de produtos e reduzindo o descarte desnecessario.

Mais do que um marketplace, o projeto busca fortalecer praticas de consumo consciente e economia circular, criando um ambiente em que objetos que perderam valor para uma pessoa possam continuar sendo uteis para outra.

## Problema que o projeto busca enfrentar

Muitos itens ainda funcionais acabam sem uso, ocupando espaco ou sendo descartados antes do tempo. Ao mesmo tempo, ha pessoas que precisam desses produtos, mas nem sempre conseguem acesso facil ou barato a eles.

O ReUseHub surge como resposta a esse cenario, oferecendo uma solucao digital para:

- estimular o reaproveitamento de bens;
- reduzir desperdicio e descarte inadequado;
- incentivar relacoes de troca e doacao dentro da comunidade;
- ampliar o acesso a produtos usados em boas condicoes.

## Objetivo geral

Desenvolver uma plataforma web responsiva que permita a publicacao, busca, negociacao e acompanhamento de anuncios de doacao e troca, com foco em usabilidade, seguranca e confianca entre os usuarios.

## Objetivos especificos

- permitir cadastro e autenticacao de usuarios;
- disponibilizar publicacao e gerenciamento de anuncios;
- facilitar a busca de itens por filtros relevantes, como categoria e localizacao;
- permitir contato entre usuarios interessados;
- oferecer mecanismos de reputacao e avaliacao;
- apoiar a moderacao da plataforma para manter a qualidade e a seguranca do ambiente;
- contribuir para praticas alinhadas a sustentabilidade e ao consumo consciente.

## Justificativa

O projeto foi pensado a partir de uma necessidade real: existem muitos itens pouco utilizados, mas ainda valiosos, que poderiam circular novamente em vez de serem descartados. Nesse contexto, uma plataforma voltada especificamente para doacao e troca se torna relevante por combinar impacto social, beneficio economico e consciencia ambiental.

Do ponto de vista academico, o ReUseHub tambem permite aplicar conceitos importantes de engenharia de software, arquitetura de sistemas, seguranca, persistencia de dados, experiencia do usuario e testes automatizados em um problema com utilidade pratica.

## Principais funcionalidades

- cadastro, login e controle de acesso por perfil;
- criacao e gerenciamento de anuncios de doacao e troca;
- busca de itens com filtros;
- chat entre usuarios;
- envio e recebimento de interesses e propostas;
- sistema de avaliacoes e reputacao;
- moderacao de conteudo e acompanhamento administrativo;
- paginas informativas relacionadas a uso da plataforma e privacidade.

## Tecnologias utilizadas

### Backend

- Java 21
- Spring Boot
- Spring Security
- JWT para autenticacao
- JPA
- PostgreSQL
- MongoDB
- JUnit e Mockito para testes

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Chart.js
- Vitest e Testing Library para testes

### Apoio e integracoes

- Docker Compose para ambiente local
- ViaCEP para apoio a endereco e localizacao
- AWS S3 para armazenamento de arquivos

## Por que essas tecnologias foram escolhidas

As tecnologias usadas no projeto foram escolhidas por combinarem maturidade, boa documentacao e aderencia ao tipo de problema que o ReUseHub resolve.

- Java com Spring Boot oferece uma base solida para regras de negocio, seguranca e criacao de APIs.
- PostgreSQL atende bem os dados estruturados da aplicacao.
- MongoDB se encaixa melhor em fluxos que exigem flexibilidade documental, como comunicacao e registros especificos.
- React com TypeScript ajuda a construir uma interface moderna, reutilizavel e mais segura em manutencao.
- Vitest, Testing Library, JUnit e Mockito apoiam a validacao do comportamento da aplicacao por meio de testes automatizados.

## Publico-alvo

O ReUseHub foi pensado para pessoas que desejam:

- doar itens que nao usam mais;
- propor trocas de produtos usados;
- encontrar objetos em boas condicoes sem depender apenas de compra;
- participar de uma comunidade mais colaborativa e sustentavel.

## Impacto esperado

Com o ReUseHub, espera-se incentivar o reaproveitamento de itens, diminuir o desperdicio e ampliar o acesso a produtos usados de forma organizada e confiavel. O projeto tambem busca mostrar como a tecnologia pode ser usada para apoiar praticas mais conscientes no dia a dia.

## Equipe

- Gustavo Yoshizawa dos Santos
- Guilherme Yoshizawa dos Santos

Orientador: Prof. Bruno Messias Aguiar  
Coorientador: Prof. Alessandro Aparecido da Silva

## Consideracoes finais

O ReUseHub representa a uniao entre desenvolvimento de software e responsabilidade social. A plataforma foi concebida para atender uma necessidade atual, com foco em reutilizacao, interacao entre usuarios e criacao de valor por meio da tecnologia.
