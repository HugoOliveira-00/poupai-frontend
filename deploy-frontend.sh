#!/bin/bash

# Script de Deploy do Frontend PoupAI no Google Cloud Run
# Data: Novembro 2025

set -e  # Para o script em caso de erro

# Configurações
PROJECT_ID="poupai-2025"
REGION="southamerica-east1"
SERVICE_NAME="poupai-frontend"
IMAGE_NAME="gcr.io/${PROJECT_ID}/poupai-frontend:latest"

echo "🚀 Iniciando deploy do PoupAI Frontend..."
echo "================================================"
echo "Projeto: ${PROJECT_ID}"
echo "Região: ${REGION}"
echo "Serviço: ${SERVICE_NAME}"
echo "================================================"

# 1. Configurar projeto do GCloud
echo ""
echo "📋 Configurando projeto Google Cloud..."
gcloud config set project ${PROJECT_ID}

# 2. Habilitar APIs necessárias (caso ainda não estejam)
echo ""
echo "🔧 Habilitando APIs necessárias..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# 3. Build da imagem Docker
echo ""
echo "🏗️  Construindo imagem Docker..."
gcloud builds submit --tag ${IMAGE_NAME} .

# 4. Deploy no Cloud Run
echo ""
echo "☁️  Fazendo deploy no Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --port 8080 \
  --memory 256Mi \
  --cpu 1 \
  --timeout 60 \
  --max-instances 5 \
  --min-instances 0

# 5. Obter URL do serviço
echo ""
echo "✅ Deploy concluído com sucesso!"
echo ""
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --platform managed --region ${REGION} --format 'value(status.url)')
echo "🌐 URL do Frontend: ${SERVICE_URL}"
echo ""
echo "📝 Acesse a aplicação em: ${SERVICE_URL}"
echo ""
echo "⚠️  IMPORTANTE: Atualize o script.js com a URL do backend!"
echo ""
echo "================================================"
