# JibLog

## Pré-requisitos

- [Node.js](https://nodejs.org/) (recomendado: versão LTS)
- [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) (extensão do VS Code, para servir o frontend)

---

## Configuração do ambiente

Na raiz do projeto, crie um arquivo `.env` com as seguintes variáveis:

```env
DATABASE_URL="file:./prisma/dev.db"
PORT=3030
SECRET_KEY="sua_chave_secreta"
JWT_EXPIRATION='15d'
CLIENT_URL="http://localhost:5500"
GOOGLE_MAPS_API_KEY="sua_chave_do_google_maps"
```

> A `GOOGLE_MAPS_API_KEY` é necessária para o funcionamento do rastreamento de pedidos.

---

## Executando o projeto

### 1. Instalar dependências

```bash
npm install
```

### 2. Inicializar o banco de dados

```bash
npx prisma migrate dev
```

### 3. Iniciar o backend

```bash
npm start
```

O servidor estará disponível em `http://localhost:3030`.

### 4. Abrir o frontend

Abra o arquivo `client/index.html` com a opção **"Open with Live Server"** no VS Code.  
Caso a URL apareça como `127.0.0.1`, substitua por `localhost` para que os cookies de autenticação funcionem corretamente.

---

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm start` | Inicia o servidor com hot-reload (ts-node-dev) |
| `npx prisma migrate dev` | Aplica as migrations no banco de dados |
| `npx prisma studio` | Abre o Prisma Studio para inspecionar o banco de dados |

---

## Executando os testes

O projeto utiliza **Jest** + **ts-jest** para testes unitários e de integração/E2E.

### Rodar todos os testes

```bash
npm test
```

### Rodar com relatório de cobertura

```bash
npm run test:coverage
```

O relatório será gerado na pasta `coverage/` e exibido no terminal. A cobertura mínima exigida é de **80%**.

### Rodar em modo watch (re-executa ao salvar)

```bash
npm run test:watch
```

### Estrutura dos testes

```
__tests__/
├── unit/
│   ├── Deliverer/   # DelivererService (create, updateRegion, delete)
│   ├── Order/       # OrderService (create, updateStatus)
│   └── Product/     # ProductService
└── integration/
    ├── user.e2e.test.ts      # Fluxo criação → login → myAccount
    ├── order.e2e.test.ts     # Fluxo produto → pedido → estoque
    └── deliverer.e2e.test.ts # Fluxo completo do entregador
```

> O mock global do Prisma está em `__mocks__/prisma.ts` e é aplicado automaticamente em todos os testes.

