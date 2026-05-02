<div align="center">

# Cine Thgiin API

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

API REST para **catálogo cinematográfico** — modelagem relacional, listagens com filtros, contrato HTTP estável e operação com Docker.

**[Destaques](#destaques-técnicos)** · **[Stack](#stack)** · **[Como rodar](#como-rodar)** · **[Documentação](#documentação)** · **[Estrutura](#estrutura-do-código)**

</div>

---

## Visão geral

**Pacote / repositório:** `cine-thgiin-api` (veja `name` em `package.json`).

Este repositório é um **projeto de portfólio** pensado para mostrar como uma API **NestJS** conversa com **PostgreSQL** via **Prisma**, com foco em **clareza de domínio**, **observabilidade** e **qualidade de entrega** (testes, migrations, OpenAPI).

| Em uma linha | |
|:---|:---|
| **Domínio** | Filmes e gêneros com relação **N:N**, CRUD e listagem rica. |
| **Qualidade** | Validação em camadas, erros padronizados, `requestId` para correlação. |
| **Entrega** | Docker Compose, migrations no deploy do container, Swagger em `/docs`. |

### Fluxo lógico

Diagrama em texto (renderiza no GitHub — **não exige print nem imagem**):

```mermaid
flowchart LR
  Client[Cliente / HTTP]
  API[NestJS · /api/v1]
  ORM[Prisma]
  DB[(PostgreSQL)]
  Docs["Swagger · /docs"]
  Client --> API
  API --> ORM
  ORM --> DB
  Client -.->|contrato OpenAPI| Docs
```

---

## Sobre o projeto

O **Cine Thgiin** expõe um catálogo de filmes com **relação N:N entre filmes e gêneros**, **paginação**, **filtros combinados** (ano, nota, gênero), **busca textual** (`q`), **soft delete** (`deletedAt`), **logs com tempo de resposta** e **filtro global de exceções** com payload JSON consistente. A prioridade é **consultas previsíveis**, **contrato REST versionado** (`/api/v1`) e **boas práticas** de validação, seeds e testes.

---

## Destaques técnicos

**Modelagem e dados**

- Relação **Many-to-Many** real (Filmes ↔ Gêneros) com **Prisma** e PostgreSQL.
- **Soft delete** para preservar histórico sem expor registros removidos nas listagens padrão.

**Listagem e consulta**

- Filtros por **ano**, **nota** e **gênero**; busca **case-insensitive** em título/descrição; **ordenação** e **paginação** configuráveis.

**Operação e DX**

- **Correlation ID** (`requestId` / `X-Request-Id`) e logs com **duração em ms** por requisição.
- **Global exception filter**: respostas de erro uniformes (`statusCode`, `timestamp`, `path`, `message`, `requestId`, etc.).
- **Swagger (OpenAPI 3)** organizado em **`/docs`**.

**Arquitetura**

- Módulos por domínio (controllers, services, DTOs), **Joi** para env, **class-validator** nos DTOs.
- **Docker Compose**: API + Postgres; **migrations** aplicadas no startup do app (`prisma migrate deploy`).

---

## Stack

| Camada | Tecnologias |
|--------|-------------|
| Runtime / linguagem | **Node.js** · **TypeScript** (strict) |
| Framework | **NestJS** 11 |
| Persistência | **Prisma** 6 · **PostgreSQL** 16 |
| Validação | **class-validator** · **class-transformer** · **Joi** (variáveis de ambiente) |
| Documentação | **Swagger** / OpenAPI 3 |
| Testes | **Jest** · **Supertest** (unitário + e2e) |
| Infra | **Docker** · **Docker Compose** |

---

## Como rodar

### Com Docker (recomendado)

1. Instale o [Docker](https://docs.docker.com/get-docker/).
2. Na raiz do repositório:

```bash
docker compose up --build
```

3. Com o stack no ar, o Postgres fica disponível e a API aplica **migrations** ao subir. Para carregar o **seed** (28 filmes de demonstração), com `DATABASE_URL` apontando para o banco do Compose:

```bash
cp .env.example .env   # ajuste DATABASE_URL se necessário
npx prisma generate
npm run db:seed
```

4. Abra a documentação:

```text
http://localhost:3000/docs
```

| Serviço | Endereço |
|---------|----------|
| API | [http://localhost:3000](http://localhost:3000) |
| Swagger | [http://localhost:3000/docs](http://localhost:3000/docs) |
| PostgreSQL | `localhost:5432` · database `cinearquivo` |

---

### Sem Docker (desenvolvimento local)

**Pré-requisitos:** Node.js ≥ 18.19, npm ≥ 9, PostgreSQL acessível.

```bash
git clone <url-do-repositório>
cd cine-thgiin-api
npm install
cp .env.example .env
```

Configure `DATABASE_URL` em `.env` (ex.: `postgresql://postgres:postgres@localhost:5432/cinearquivo?schema=public`).

```bash
npx prisma generate
npm run migrate:dev
npm run db:seed
npm run start:dev
```

A API sobe em **http://localhost:3000** com reload (`nest start --watch`).

---

## Documentação

| Recurso | URL |
|---------|-----|
| **Swagger UI** | **http://localhost:3000/docs** |
| **OpenAPI JSON** | http://localhost:3000/docs-json |

Rotas REST sob o prefixo **`/api/v1`** (ex.: `GET /api/v1/movies`). A UI do Swagger permanece em **`/docs`**, fora do prefixo da API — padrão comum em NestJS.

Exemplos:

```bash
curl -sS http://localhost:3000/api/v1/health
curl -sS "http://localhost:3000/api/v1/movies?page=1&limit=10&q=matrix"
```

---

## Estrutura do código

```text
cine-thgiin-api/
├── prisma/
│   ├── schema.prisma       # Movie, Genre, relação N:N
│   ├── migrations/
│   └── seed.ts             # Gêneros + filmes de demonstração
├── src/
│   ├── main.ts
│   ├── app.module.ts       # Filtros e interceptors globais
│   ├── bootstrap/          # CORS, Swagger, request-id, prefixo /api/v1
│   ├── config/             # Validação Joi (env)
│   ├── common/             # Prisma, HttpExceptionFilter, LoggerInterceptor
│   ├── core/
│   └── modules/            # health, movies (CRUD, listagem, testes)
├── test/
├── Dockerfile
├── docker-compose.yml
└── package.json
```

| Diretório | Papel |
|-----------|--------|
| `modules/` | Features por domínio — controllers, services, DTOs. |
| `common/` | Prisma, **filtro de erros**, **interceptor de log**. |
| `config/` | **Joi** para `DATABASE_URL`, `PORT`, `NODE_ENV`, etc. |
| `bootstrap/` | Montagem única: Swagger, pipes, middleware de `requestId`. |

---

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run start:dev` | API em modo desenvolvimento (watch). |
| `npm run build` | Compilação para `dist/`. |
| `npm run test` | Testes unitários. |
| `npm run test:e2e` | Testes end-to-end. |
| `npm run lint` | ESLint. |
| `npm run migrate:dev` | Migrations em ambiente de desenvolvimento. |
| `npm run db:seed` | Popula o banco (28 filmes + gêneros). |
| `npx prisma studio` | UI para inspecionar dados. |

---

## Licença

Projeto de portfólio — defina a licença ao publicar.

---

<div align="center">

**Cine Thgiin API** — backend claro, testável e pronto para revisão técnica.

</div>
