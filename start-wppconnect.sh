#!/bin/bash

# Script para iniciar WPPConnect em Docker
# Uso: ./start-wppconnect.sh

set -e

echo "🐳 Iniciando WPPConnect em Docker..."

# Parar containers existentes
echo "🛑 Parando containers existentes..."
sudo docker stop wppconnect-server 2>/dev/null || true
sudo docker rm wppconnect-server 2>/dev/null || true

# Build da imagem WPPConnect
echo "🔨 Building imagem WPPConnect..."
sudo docker build -f Dockerfile.wppconnect -t wppconnect-server:latest .

# Criar rede Docker se não existir
echo "🌐 Criando rede Docker..."
sudo docker network create barber-network 2>/dev/null || true

# Iniciar WPPConnect
echo "🚀 Iniciando container WPPConnect..."
sudo docker run -d \
  --name wppconnect-server \
  --network barber-network \
  -p 3333:3333 \
  -v /tmp/wppconnect-sessions:/app/sessions \
  -e NODE_ENV=production \
  -e PORT=3333 \
  wppconnect-server:latest

echo "✅ WPPConnect iniciado com sucesso!"
echo "📍 URL: http://localhost:3333"
echo "🔗 API disponível em: http://localhost:3333/api"
echo ""
echo "Para parar o container, execute:"
echo "  sudo docker stop wppconnect-server"
echo ""
echo "Para ver logs, execute:"
echo "  sudo docker logs -f wppconnect-server"
