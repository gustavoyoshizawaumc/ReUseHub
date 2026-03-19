# ReUseHub

Sistema web para intermediação de doações e trocas de itens usados.

---

## Tecnologias

### Backend

- Java 21
- Spring Boot
- Spring Security (JWT)
- Spring Data JPA
- Spring Data MongoDB

### Frontend

- React
- TypeScript
- Tailwind CSS

### Banco de Dados

- PostgreSQL (dados estruturados)
- MongoDB (dados não estruturados)

---

## Arquitetura

- Monolito Modular
- API REST
- Frontend desacoplado (SPA)

---

## Ambiente de Desenvolvimento

O projeto utiliza Docker para subir os bancos de dados localmente.

### Subir bancos

```bash
docker-compose up -d
```
