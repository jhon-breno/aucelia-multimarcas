# Loja Multimarcas - Pagamentos Mercado Pago

Este projeto está configurado para:

- Receber pagamentos online com Checkout Pro do Mercado Pago (cartão/boleto/PIX via página oficial do MP).
- Gerar PIX no PDV (caixa) com QR Code e Copia e Cola em tempo real.

## Arquitetura de Segurança

- O token secreto do Mercado Pago fica somente no backend ([loja-backend/server.js](loja-backend/server.js)).
- O frontend chama apenas endpoints do backend.
- A API usa:
  - CORS por lista de origens permitidas
  - `helmet` para headers de segurança
  - `express-rate-limit` para limitar abuso
  - validação de payload e valores de pagamento
  - chave de idempotência por requisição

## 1. Configurar Variáveis de Ambiente

### Frontend

1. Crie `.env` na raiz com base em [.env.example](.env.example).
2. Defina no mínimo:

```env
VITE_BACKEND_URL=http://localhost:3000
```

Opcional para produção, caso queira fornecer a Public Key sem depender do painel admin:

```env
VITE_MERCADO_PAGO_PUBLIC_KEY=APP_USR-...
```

Em produção, se o frontend estiver publicado separado do backend (ex.: Firebase Hosting para o site e Render/Railway para a API), `VITE_BACKEND_URL` deve apontar para a URL pública do backend. Isso é necessário para:

- pagamentos (`/api/pix` e `/api/checkout/preference`)
- proxy de imagens externas bloqueadas por hotlink, como `photo.yupoo.com`

Exemplo:

```env
VITE_BACKEND_URL=https://seu-backend.exemplo.com
```

### Backend

1. Crie `loja-backend/.env` com base em [loja-backend/.env.example](loja-backend/.env.example).
2. Defina no mínimo:

```env
PORT=3000
MP_ACCESS_TOKEN=TEST-OU-APP_USR-...
FRONTEND_PUBLIC_URL=http://localhost:5173
FRONTEND_URLS=http://localhost:5173
```

## 2. Instalar Dependências

Na raiz do projeto:

```bash
npm install
```

No backend:

```bash
cd loja-backend
npm install
```

## 3. Subir a Aplicação

Terminal 1 (backend):

```bash
cd loja-backend
npm run dev
```

Terminal 2 (frontend):

```bash
npm run dev
```

## 4. Endpoints de Pagamento

- `POST /api/pix`: cria cobrança PIX e retorna QR Code + Copia e Cola.
- `POST /api/checkout/preference`: cria preferência do Checkout Pro para pagamentos online.
- `GET /api/health`: valida se backend está online e se token MP está configurado.

## 5. Fluxos no App

- Checkout online:
  - PIX: gera QR Code imediatamente no app.
  - Cartão/Boleto: redireciona para checkout oficial do Mercado Pago.

- PDV:
  - Ao selecionar PIX, gera QR Code real do Mercado Pago para pagamento no caixa.

## Observações Importantes

- Nunca coloque `MP_ACCESS_TOKEN` no frontend.
- Use token `TEST-...` em homologação e `APP_USR-...` em produção.
- O endpoint `GET /api/health` agora retorna `mpMode` para confirmar se a API está em `sandbox` ou `production`.
- Para receber confirmação automática de status, configure `MP_WEBHOOK_URL` no backend e um endpoint de webhook.
- Se o frontend estiver no Firebase Hosting, a regra atual reescreve tudo para `index.html`. Isso significa que `/api/*` não funciona no mesmo domínio sem uma configuração adicional de proxy/rewrite para o backend.

## 6. Checklist de Produção

1. No arquivo local [loja-backend/.env.example](loja-backend/.env.example), use como base para configurar `MP_ACCESS_TOKEN=APP_USR-...` no seu `loja-backend/.env`.
2. No arquivo local [.env.example](.env.example), use como base para configurar `VITE_BACKEND_URL` com a URL pública da API.
3. Se for usar componentes/client SDK do Mercado Pago, configure `VITE_MERCADO_PAGO_PUBLIC_KEY=APP_USR-...` no `.env` do frontend ou salve a Public Key pelo painel administrativo.
4. Suba o backend e valide `GET /api/health`; o campo `mpMode` precisa vir como `production`.

## 7. Banco + Backend no Firebase

Este projeto agora esta preparado para rodar no Firebase com:

- Frontend no Firebase Hosting
- Backend Express em Firebase Functions (`/api/*`)
- Banco no Cloud Firestore com regras em `firestore.rules`

### 7.1. Pre-requisitos

1. Instale o Firebase CLI:

```bash
npm install -g firebase-tools
```

2. Faça login:

```bash
firebase login
```

### 7.2. Instalar dependencias

Na raiz:

```bash
npm install
```

No backend/functions:

```bash
cd loja-backend
npm install
```

### 7.3. Criar/configurar banco (Firestore)

1. No console do Firebase, habilite o Firestore em modo de producao.
2. Escolha a regiao recomendada para o Brasil (ex.: `southamerica-east1`).
3. Publique regras e indices deste repositorio:

```bash
npm run firebase:deploy:db
```

### 7.4. Configurar segredo do backend (Mercado Pago)

Defina o token como segredo de Cloud Functions:

```bash
firebase functions:secrets:set MP_ACCESS_TOKEN
```

Opcionalmente, defina variaveis adicionais no ambiente da Function:

- `FRONTEND_PUBLIC_URL=https://aucelia-multimarcas.web.app`
- `FRONTEND_URLS=https://aucelia-multimarcas.web.app,https://aucelia-multimarcas.firebaseapp.com`

### 7.5. Deploy do backend e frontend

1. Gere o build do frontend:

```bash
npm run build
```

2. Faça deploy completo:

```bash
npm run firebase:deploy
```

### 7.6. URL do backend no frontend

Como o Hosting faz rewrite de `/api/**` para a Function, voce pode usar no frontend:

- `VITE_BACKEND_URL=` (vazio, mesma origem)

Ou manter URL absoluta, se quiser apontar para outro backend.

## 8. Backend no Render (alternativa ao Firebase Functions)

Se voce vai manter o banco no Firebase, mas hospedar a API no Render, use este fluxo.

### 8.1. Arquivos ja preparados

- Configuracao Render Blueprint: [render.yaml](render.yaml)
- Exemplo de env frontend: [.env.example](.env.example)
- Exemplo de env backend: [loja-backend/.env.example](loja-backend/.env.example)

### 8.2. Criar o servico no Render

1. Suba este repositorio para GitHub.
2. No Render, clique em New + > Blueprint e selecione o repositorio.
3. O Render vai ler [render.yaml](render.yaml) e criar o servico `aucelia-multimarcas-backend`.

### 8.3. Configurar variaveis no Render

No painel do servico Web no Render, adicione:

- `MP_ACCESS_TOKEN=APP_USR-...` (ou `TEST-...` em homologacao)
- `FRONTEND_PUBLIC_URL=https://SEU-FRONTEND`
- `FRONTEND_URLS=https://SEU-FRONTEND,http://localhost:5173`
- `MP_WEBHOOK_URL=https://SEU-BACKEND.onrender.com/api/webhook` (opcional)

### 8.4. Apontar frontend para Render

No `.env` da raiz do frontend:

```env
VITE_BACKEND_URL=https://SEU-BACKEND.onrender.com
```

Depois, gere novo build e publique o frontend:

```bash
npm run build
firebase deploy --only hosting
```

### 8.5. Teste rapido

Abra no navegador:

- `https://SEU-BACKEND.onrender.com/api/health`

Esperado:

- `ok: true`
- `mpConfigured: true` (se token foi configurado)
