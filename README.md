# SGLD — Sistema de Gestão de Documentos

Aplicação para gerenciamento de documentos de condomínios, blocos, vencimentos e arquivos associados.

## Recursos

- Autenticação com login e cadastro de usuários.
- Cadastro de condomínios e blocos.
- Cadastro, edição, filtro e exclusão de documentos.
- Upload de PDF, imagens e arquivos do Office.
- Dashboard com indicadores, gráficos e próximos vencimentos.
- API em Node.js/Express e PostgreSQL.
- Execução completa via Docker Compose.

## Tecnologias

- Frontend: React, Vite e Chart.js.
- Backend: Node.js, Express, Sequelize e PostgreSQL.
- Infraestrutura: Docker, Docker Compose e Nginx.

## Estrutura

```text
38-SGLD/
├── backend/              # API, regras de negócio e persistência
├── frontend/             # Interface React
├── compose.yml           # Serviços Docker
└── .env.example          # Modelo de variáveis para Docker
```

## Executar com Docker

### 1. Configure as variáveis

Crie um arquivo `.env` na raiz do projeto, usando `.env.example` como modelo:

```env
POSTGRES_DB=sgld
POSTGRES_USER=postgres
POSTGRES_PASSWORD=defina-uma-senha-segura
JWT_SECRET=defina-uma-chave-longa-e-aleatoria
```

### 2. Inicie os serviços

```bash
docker compose up --build
```

Para manter os serviços em segundo plano:

```bash
docker compose up -d --build
```

### 3. Acesse

- Sistema: [http://localhost:5173](http://localhost:5173)
- API: [http://localhost:3001/api/health](http://localhost:3001/api/health)

Para encerrar os serviços:

```bash
docker compose down
```

Os dados do PostgreSQL e os uploads ficam em volumes Docker e são preservados ao reiniciar os contêineres.

## Executar localmente

### Backend

Crie `backend/.env`:

```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://USUARIO:SENHA@localhost:5432/NOME_DO_BANCO
JWT_SECRET=defina-uma-chave-longa-e-aleatoria
```

Instale as dependências e inicie a API:

```bash
cd backend
pnpm install
pnpm start
```

### Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

O Vite encaminha chamadas `/api` ao backend local na porta `3001`.

## Credenciais iniciais

Quando o banco está vazio, a API cria um usuário inicial:

```text
E-mail: admin@sgld.com.br
Senha: 123456
```

Troque essa senha antes de disponibilizar o sistema a terceiros.

## Publicação na Oracle Cloud

Para uma demonstração sem custo, use uma VM Always Free `VM.Standard.A1.Flex` da Oracle Cloud com Docker instalado.

1. Crie uma VM Ubuntu ou Oracle Linux com IP público.
2. Libere as portas `22`, `80` e `443` nas regras de rede da Oracle.
3. Copie o projeto para a VM e crie o arquivo `.env` na raiz.
4. Execute `docker compose up -d --build`.

> Para produção, publique apenas o Nginx nas portas 80/443. Não exponha diretamente as portas do PostgreSQL ou da API.

## Variáveis de ambiente

| Variável | Uso |
| --- | --- |
| `POSTGRES_DB` | Nome do banco criado pelo Docker. |
| `POSTGRES_USER` | Usuário do PostgreSQL. |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL. |
| `DATABASE_URL` | String de conexão usada pelo backend fora do Docker. |
| `JWT_SECRET` | Chave para assinar sessões de usuários. |
| `VITE_API_URL` | URL da API no build do frontend; o padrão é `/api`. |

## Segurança

- Nunca versione arquivos `.env`.
- Use senhas fortes em PostgreSQL e `JWT_SECRET` em produção.
- Faça backup regular do volume PostgreSQL e da pasta de uploads.
- Restrinja o acesso SSH e use HTTPS ao disponibilizar o sistema publicamente.
