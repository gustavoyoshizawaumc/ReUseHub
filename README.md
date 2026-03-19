<div align="center">

# ReUseHub

**Plataforma web gratuita de doação e troca de itens usados**

Projeto Final de Curso — Bacharelado em Sistemas de Informação  
Universidade de Mogi das Cruzes · 2026

[![Java](https://img.shields.io/badge/Java-21-orange?style=flat-square&logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-brightgreen?style=flat-square&logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/)

</div>

---

## 📋 Sobre o Projeto

O **ReUseHub** é um sistema web responsivo que conecta pessoas que desejam **doar** ou **trocar** itens usados, promovendo a economia circular e o consumo consciente. A plataforma oferece:

- Cadastro e autenticação de usuários com controle de acesso por perfil (Admin, Moderador, Usuário)
- Publicação e gerenciamento de anúncios de doação e troca
- Busca com filtros por categoria e localização geográfica
- Sistema de destaque de anúncios por relevância e atividade
- Chat direto entre usuários
- Sistema de avaliações e reputação
- Dashboard analítico para administradores
- Conformidade com a LGPD

---

## 👥 Equipe

| Integrante | Módulos Responsáveis |
|---|---|
| **Gustavo Yoshizawa dos Santos** | Autenticação (JWT/RBAC), Chat, Avaliações e Reputação |
| **Guilherme Yoshizawa dos Santos** | Anúncios, Motor de Busca e Filtros, Sistema de Destaque |

**Orientador:** Prof. Bruno Messias Aguiar  
**Coorientador:** Prof. Alessandro Aparecido da Silva

---

## 🏗️ Arquitetura

O sistema adota uma arquitetura de **Monolito Modular** no backend — única instância de deploy com módulos internamente coesos e independentes — e um frontend desacoplado como **SPA (Single Page Application)**, comunicando-se via API RESTful.

```
Frontend (React SPA)
        │
        │  REST API (JSON / JWT)
        ▼
Backend (Spring Boot — Monolito Modular)
 ├── Módulo: Autenticação
 ├── Módulo: Anúncios
 ├── Módulo: Busca e Localização
 ├── Módulo: Relevância
 ├── Módulo: Chat
 └── Módulo: Avaliações
        │
        ├── PostgreSQL (dados estruturados)
        └── MongoDB    (chat, logs, recomendações)
```

---

## 🛠️ Stack Tecnológica

### Backend
| Tecnologia | Versão | Finalidade |
|---|---|---|
| Java | 21 | Linguagem principal |
| Spring Boot | 3.x | Framework backend |
| Spring Security + JWT | — | Autenticação e autorização |
| Spring Data JPA | — | Persistência relacional |
| Spring Data MongoDB | — | Persistência documental |
| PostgreSQL | 16 | Banco relacional |
| MongoDB | 7.x | Banco de documentos |
| JUnit + Mockito | — | Testes automatizados |

### Frontend
| Tecnologia | Versão | Finalidade |
|---|---|---|
| React.js | 18 | Biblioteca de UI |
| TypeScript | 5.x | Tipagem estática |
| Tailwind CSS | 3.x | Estilização utilitária |
| React Router | 6.x | Roteamento SPA |
| Chart.js | — | Gráficos no dashboard |

### APIs Externas
| API | Finalidade |
|---|---|
| ViaCEP | Validação e preenchimento de endereço por CEP |
| OpenStreetMap Nominatim | Geocodificação para filtros de localização |

---

## 📁 Estrutura do Repositório

```
ReUseHub/
├── backend/                          # Spring Boot — Monolito Modular
│   └── src/main/java/com/reusehub/
│       ├── auth/                     # Módulo de autenticação
│       │   ├── controller/
│       │   ├── service/
│       │   ├── repository/
│       │   ├── model/
│       │   └── dto/
│       ├── listings/                 # Módulo de anúncios
│       ├── search/                   # Módulo de busca e localização
│       ├── relevance/                # Módulo de relevância
│       ├── chat/                     # Módulo de chat (MongoDB)
│       ├── reviews/                  # Módulo de avaliações
│       ├── shared/                   # Componentes compartilhados
│       │   ├── config/               # Configs (Security, CORS, JWT...)
│       │   ├── exception/            # Tratamento global de exceções
│       │   └── util/
│       └── ReUseHubApplication.java
│
├── frontend/                         # React SPA
│   └── src/
│       ├── components/               # Componentes reutilizáveis
│       ├── pages/                    # Páginas da aplicação
│       ├── hooks/                    # Custom hooks
│       ├── services/                 # Chamadas à API
│       ├── types/                    # Tipos TypeScript
│       └── utils/                   # Funções utilitárias
│
├── docs/                             # Documentação do projeto
│   ├── ReUseHub.docx                 # Documento principal (PFC)
│   ├── diagramas/
│   └── wireframes/
│
├── .github/
│   ├── PULL_REQUEST_TEMPLATE.md      # Template de Pull Request
│   └── CODEOWNERS                    # Responsáveis por módulos
│
├── docker-compose.yml                # PostgreSQL + MongoDB local
├── .gitignore
└── README.md
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Java 21+
- Node.js 20+
- Docker e Docker Compose

### 1. Clonar o repositório
```bash
git clone https://github.com/gustavoyoshizawaumc/ReUseHub.git
cd ReUseHub
```

### 2. Subir os bancos de dados
```bash
docker-compose up -d
```

### 3. Rodar o backend
```bash
cd backend
./mvnw spring-boot:run
# API disponível em http://localhost:8080
```

### 4. Rodar o frontend
```bash
cd frontend
npm install
npm run dev
# App disponível em http://localhost:5173
```

---

## 🌿 Fluxo de Branches (Git Flow)

```
main          ← código estável, entrega final
  └── develop ← integração contínua
        ├── feature/auth        (Gustavo)
        ├── feature/chat        (Gustavo)
        ├── feature/reviews     (Gustavo)
        ├── feature/listings    (Guilherme)
        ├── feature/search      (Guilherme)
        ├── feature/relevance   (Guilherme)
        └── feature/login-screen (compartilhada)

hotfix/nome-do-bug ← nasce de main, merge em main e develop
```

**Regras:**
- Ninguém commita direto em `main` ou `develop`
- Todo merge acontece via **Pull Request** com aprovação do outro integrante
- `main` só recebe merges de `develop` quando a versão estiver estável

### Convenção de commits

```
feat(módulo): descrição curta
fix(módulo): descrição curta
docs: descrição
test(módulo): descrição
refactor(módulo): descrição
```

**Exemplos:**
```bash
git commit -m "feat(auth): implementa autenticação JWT com refresh token"
git commit -m "fix(chat): corrige duplicação de mensagens no MongoDB"
git commit -m "test(listings): adiciona testes unitários para criação de anúncio"
```

---

## ✅ Módulos e Status

| Módulo | Responsável | Status |
|---|---|---|
| Tela de Login | Compartilhado | 🔲 Não iniciado |
| Autenticação (JWT + RBAC) | Gustavo | 🔲 Não iniciado |
| Anúncios (CRUD) | Guilherme | 🔲 Não iniciado |
| Motor de Busca e Filtros | Guilherme | 🔲 Não iniciado |
| Sistema de Destaque | Guilherme | 🔲 Não iniciado |
| Chat (MongoDB) | Gustavo | 🔲 Não iniciado |
| Avaliações e Reputação | Gustavo | 🔲 Não iniciado |
| Dashboard Analítico | Compartilhado | 🔲 Não iniciado |
| Segurança / LGPD | Compartilhado | 🔲 Não iniciado |
| Testes Automatizados | Compartilhado | 🔲 Não iniciado |

---

## 📄 Licença

Projeto acadêmico desenvolvido para fins educacionais — Universidade de Mogi das Cruzes, 2026.
