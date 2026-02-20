# Setup Docker para BarberFlow SaaS

Este documento descreve como configurar e executar o BarberFlow SaaS com Docker.

## Pré-requisitos

- Docker 20.10+
- Docker Compose 2.0+
- 2GB de RAM mínimo
- 5GB de espaço em disco

## Arquitetura

O sistema é composto por dois containers:

1. **wppconnect** - Servidor WPPConnect para gerenciar sessões WhatsApp
   - Porta: 3333
   - Responsável por: Gerar QR Code, conectar WhatsApp, enviar mensagens

2. **app** - Aplicação Node.js principal
   - Porta: 3000
   - Responsável por: API tRPC, banco de dados, lógica de negócio

## Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env.docker` com as seguintes variáveis:

```bash
# Banco de dados
DATABASE_URL=mysql://user:password@db:3306/barber_saas

# JWT
JWT_SECRET=seu-secret-jwt-aqui

# OAuth Manus
VITE_APP_ID=seu-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# WPPConnect
WPPCONNECT_API_URL=http://wppconnect:3333
WEBHOOK_URL=http://app:3000
```

### 2. Build das Imagens

```bash
# Build das imagens Docker
docker-compose build

# Ou com cache limpo
docker-compose build --no-cache
```

### 3. Iniciar os Containers

```bash
# Iniciar em background
docker-compose up -d

# Ou iniciar com logs visíveis
docker-compose up

# Verificar status
docker-compose ps
```

### 4. Parar os Containers

```bash
# Parar containers
docker-compose down

# Parar e remover volumes
docker-compose down -v
```

## Uso

### Acessar a Aplicação

- URL: http://localhost:3000
- API WPPConnect: http://localhost:3333

### Logs

```bash
# Ver logs da aplicação
docker-compose logs app

# Ver logs do WPPConnect
docker-compose logs wppconnect

# Ver logs em tempo real
docker-compose logs -f app

# Ver logs dos últimas 100 linhas
docker-compose logs --tail=100 app
```

### Executar Comandos

```bash
# Executar comando na aplicação
docker-compose exec app pnpm db:push

# Executar shell na aplicação
docker-compose exec app sh

# Executar testes
docker-compose exec app pnpm test
```

## Troubleshooting

### WPPConnect não conecta

1. Verificar se a porta 3333 está disponível
2. Verificar logs: `docker-compose logs wppconnect`
3. Aumentar timeout: Editar `WPPCONNECT_API_URL` timeout

### Aplicação não conecta ao WPPConnect

1. Verificar se WPPConnect está rodando: `docker-compose ps`
2. Verificar conectividade: `docker-compose exec app curl http://wppconnect:3333/api/health`
3. Verificar variável `WPPCONNECT_API_URL`

### Erro de permissão no Chrome

1. Aumentar limite de arquivos abertos: `ulimit -n 65536`
2. Executar com `--cap-add=SYS_ADMIN`

## Performance

### Otimizações Recomendadas

1. **Alocação de Memória**
   ```bash
   # Aumentar memória para WPPConnect
   docker-compose exec wppconnect free -h
   ```

2. **Volumes**
   - Use volumes locais para melhor performance
   - Evite NFS para sessões do WPPConnect

3. **Rede**
   - Use bridge network (padrão)
   - Evite host network para segurança

## Desenvolvimento

### Build Local

```bash
# Build local sem Docker
pnpm install
pnpm dev

# Com WPPConnect em Docker
docker-compose up wppconnect
WPPCONNECT_API_URL=http://localhost:3333 pnpm dev
```

### Debug

```bash
# Iniciar com debug
docker-compose exec app node --inspect=0.0.0.0:9229 dist/server/_core/index.js

# Conectar debugger em http://localhost:9229
```

## Deployment

Para deployment em produção:

1. Usar variáveis de ambiente seguras
2. Habilitar HTTPS
3. Configurar backup de volumes
4. Usar reverse proxy (nginx/traefik)
5. Monitorar recursos (CPU, memória, disco)

## Suporte

Para problemas ou dúvidas:

1. Verificar logs: `docker-compose logs`
2. Consultar documentação: https://wppconnect.io
3. Abrir issue no repositório
