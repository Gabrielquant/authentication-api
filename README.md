# Authentication API

API de autenticação construída com [NestJS](https://nestjs.com/), [Prisma](https://www.prisma.io/) e PostgreSQL. Oferece registro, login com JWT (access + refresh), atualização de perfil, recuperação de senha por e-mail e controle de acesso por roles (USER, ADMIN, AUDITOR). Documentação Swagger em `/api`.

## Tecnologias

- **NestJS** – framework Node.js
- **Prisma** – ORM e migrations
- **PostgreSQL** – banco de dados
- **JWT** – tokens de acesso e refresh
- **Argon2** – hash de senhas
- **Resend** – envio de e-mails (verificação/reset de senha)
- **Biome** – lint e formatação
- **Swagger** – documentação da API

---

## Scripts do projeto

| Script | Descrição |
|--------|-----------|
| `pnpm run build` | Compila o projeto (saída em `dist/`). |
| `pnpm run start` | Inicia a aplicação em modo produção (usa o build em `dist/`). |
| `pnpm run dev` | Inicia em modo desenvolvimento com watch (recompila ao alterar arquivos). |
| `pnpm run start:debug` | Inicia em modo debug com watch (útil para depuração no VS Code/Cursor). |
| `pnpm run start:prod` | Roda o binário compilado com `node dist/main` (após `build`). |
| `pnpm run format` | Formata arquivos em `src/` e `test/` com Prettier. |
| `pnpm run lint` | Executa o Biome para checagem de código (lint + regras). |
| `pnpm run lint:fix` | Formata e aplica correções automáticas do Biome. |
| `pnpm run test` | Roda os testes unitários com Jest. |
| `pnpm run test:watch` | Roda os testes em modo watch (re-executa ao salvar). |
| `pnpm run test:cov` | Roda os testes e gera relatório de cobertura. |
| `pnpm run test:debug` | Roda os testes com Node em modo inspect (para debug). |
| `pnpm run test:e2e` | Roda os testes end-to-end (config em `test/jest-e2e.json`). |

---

## CI (GitHub Actions)

O workflow em `.github/workflows/ci.yml` é disparado em **push** e **pull request** na branch `main`:

1. **Job `build`**  
   - Checkout, setup pnpm 9 e Node 20  
   - `pnpm install --frozen-lockfile`  
   - `pnpm run build`  

2. **Job `lint`** (depende de `build`)  
   - Mesmo setup  
   - `pnpm run lint`  

Garante que o projeto compile e passe no lint antes de mergear.

---

## Rodando o projeto localmente

### 1. Pré-requisitos

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Docker](https://www.docker.com/) e Docker Compose (para o PostgreSQL)

### 2. Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto. Exemplo:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/authdb"
PORT=3000
RESEND_API="re_xxx"                    # API key do Resend (envio de e-mail)
TOKEN_PEPPER="uma-string-secreta"      # Usado no hash de tokens (ex.: reset de senha)
RESET_PASSWORD_TOKEN_TTL_MIN=15       # TTL do token de reset de senha em minutos
```

### 3. Chaves JWT (RS256)

A API usa JWT com algoritmo RS256. Crie a pasta `keys/` na raiz e gere um par de chaves:

```bash
mkdir -p keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
```

Os arquivos devem ser `keys/private.pem` e `keys/public.pem`.

### 4. Subir o banco com Docker Compose

Na raiz do repositório:

```bash
docker compose up -d
```

Isso sobe o PostgreSQL 15 na porta `5432`, usuário/senha `postgres`, banco `authdb`. O volume `postgres_data` persiste os dados.

### 5. Instalar dependências

```bash
pnpm install
```

### 6. Gerar o Prisma Client e rodar as migrations

```bash
npx prisma generate
npx prisma migrate dev
```

- `prisma generate` gera o client em `node_modules/@prisma/client`.  
- `prisma migrate dev` aplica as migrations em `prisma/migrations` e mantém o banco sincronizado com o `schema.prisma`.

Se for a primeira vez, `migrate dev` pode pedir um nome para a migration; você pode usar algo como `init` ou deixar o nome sugerido.

### 7. Iniciar a API

```bash
pnpm run dev
```

A API sobe em `http://localhost:3000` (ou na porta definida em `PORT`). A documentação Swagger fica em:

**http://localhost:3000/api**

---

## Resumo dos comandos (copiar e colar)

```bash
# 1. Subir o banco
docker compose up -d

# 2. Dependências
pnpm install

# 3. Chaves JWT (se ainda não tiver keys/private.pem e keys/public.pem)
mkdir -p keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem

# 4. Prisma
npx prisma generate
npx prisma migrate dev

# 5. Rodar a API
pnpm run dev
```

Depois acesse **http://localhost:3000/api** para ver os endpoints e testar a API.
