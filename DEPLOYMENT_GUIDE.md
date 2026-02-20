# BarberFlow SaaS - Guia de Deploy

## Pré-requisitos

- Node.js 18+ 
- npm ou pnpm
- Banco de dados MySQL/TiDB
- Conta Manus para OAuth
- Credenciais Google OAuth (opcional)

## Variáveis de Ambiente

Crie um arquivo `.env.production` com as seguintes variáveis:

```env
# Database
DATABASE_URL=mysql://user:password@host:port/database

# Authentication
JWT_SECRET=seu-secret-muito-seguro-aqui
VITE_APP_ID=seu-app-id-manus
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im

# Owner Info
OWNER_OPEN_ID=seu-open-id
OWNER_NAME=seu-nome

# Built-in APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
BUILT_IN_FORGE_API_KEY=sua-chave-api
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge
VITE_FRONTEND_FORGE_API_KEY=sua-chave-frontend

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret
GOOGLE_REDIRECT_URI=https://seu-dominio.com/api/oauth/google/callback

# Node Environment
NODE_ENV=production
PORT=3000
```

## Instalação e Build

### 1. Clonar Repositório
```bash
git clone <seu-repositorio>
cd barber-saas
```

### 2. Instalar Dependências
```bash
pnpm install
```

### 3. Configurar Banco de Dados
```bash
# Executar migrations
pnpm db:push

# (Opcional) Seed com dados iniciais
pnpm db:seed
```

### 4. Build para Produção
```bash
pnpm build
```

### 5. Iniciar Servidor
```bash
# Desenvolvimento
pnpm dev

# Produção
pnpm start
```

## Deploy em Plataformas Comuns

### Manus (Recomendado)
BarberFlow foi desenvolvido especificamente para Manus e oferece integração perfeita.

1. Conecte seu repositório GitHub
2. Configure variáveis de ambiente no painel Manus
3. Deploy automático a cada push

### Railway
```bash
# 1. Instale Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Link projeto
railway link

# 4. Deploy
railway up
```

### Render
```bash
# 1. Conecte seu repositório GitHub
# 2. Crie novo Web Service
# 3. Configure Build Command: pnpm install && pnpm build
# 4. Configure Start Command: pnpm start
# 5. Adicione variáveis de ambiente
```

### Docker
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# Build
docker build -t barber-saas .

# Run
docker run -p 3000:3000 --env-file .env.production barber-saas
```

## Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados migrado
- [ ] Build sem erros
- [ ] Testes passando (`pnpm test`)
- [ ] Linting sem problemas (`pnpm lint`)
- [ ] HTTPS habilitado
- [ ] Backups configurados
- [ ] Monitoramento ativo
- [ ] Logs centralizados
- [ ] Alertas configurados

## Monitoramento Pós-Deploy

### Verificar Saúde
```bash
curl https://seu-dominio.com/health
```

### Logs
```bash
# Manus
manus logs -f

# Docker
docker logs -f container-id

# Railway
railway logs -f
```

### Métricas
- Taxa de erro
- Tempo de resposta
- Uso de CPU/Memória
- Conexões de banco de dados

## Troubleshooting

### Erro de Conexão com Banco de Dados
```bash
# Verificar string de conexão
echo $DATABASE_URL

# Testar conexão
mysql -h host -u user -p database
```

### Erro de OAuth
- Verificar `VITE_APP_ID` e `OAUTH_SERVER_URL`
- Confirmar redirect URI registrado em Manus
- Limpar cookies do navegador

### Erro de Build
```bash
# Limpar cache
rm -rf node_modules .next dist
pnpm install
pnpm build
```

## Rollback

Se algo der errado:

```bash
# Manus
manus rollback <version-id>

# Docker
docker run -p 3000:3000 barber-saas:previous-tag

# Railway
railway rollback
```

## Performance

### Otimizações Recomendadas
1. Habilitar compressão gzip
2. Usar CDN para assets estáticos
3. Implementar cache HTTP
4. Otimizar imagens
5. Usar database connection pooling

### Exemplo nginx.conf
```nginx
server {
    listen 443 ssl http2;
    server_name seu-dominio.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/trpc {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Segurança

### Essencial
- [ ] HTTPS obrigatório
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo
- [ ] Validação de input
- [ ] Proteção contra CSRF
- [ ] Headers de segurança

### Headers de Segurança
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'
```

## Backup

```bash
# Backup diário do banco de dados
0 2 * * * mysqldump -u user -p password database > /backups/db-$(date +\%Y\%m\%d).sql

# Backup para S3
0 3 * * * aws s3 cp /backups/db-$(date +\%Y\%m\%d).sql s3://seu-bucket/backups/
```

## Suporte

Para problemas com deploy, consulte:
- [Documentação Manus](https://docs.manus.im)
- [GitHub Issues](https://github.com/seu-repo/issues)
- [Discord Community](https://discord.gg/seu-servidor)
