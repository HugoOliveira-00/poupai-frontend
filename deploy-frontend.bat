@echo off
REM Script de Deploy do Frontend PoupAI no Google Cloud Run (Windows)
REM Data: Novembro 2025

setlocal enabledelayedexpansion

REM Configurações
set PROJECT_ID=poupai-2025
set REGION=southamerica-east1
set SERVICE_NAME=poupai-frontend
set IMAGE_NAME=gcr.io/%PROJECT_ID%/poupai-frontend:latest

echo.
echo ========================================
echo 🚀 Deploy do PoupAI Frontend
echo ========================================
echo Projeto: %PROJECT_ID%
echo Região: %REGION%
echo Serviço: %SERVICE_NAME%
echo ========================================
echo.

REM 1. Configurar projeto
echo 📋 Configurando projeto Google Cloud...
gcloud config set project %PROJECT_ID%
if %ERRORLEVEL% neq 0 (
    echo ❌ Erro ao configurar projeto
    exit /b 1
)

REM 2. Habilitar APIs
echo.
echo 🔧 Habilitando APIs necessárias...
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

REM 3. Build da imagem
echo.
echo 🏗️  Construindo imagem Docker...
gcloud builds submit --tag %IMAGE_NAME% .
if %ERRORLEVEL% neq 0 (
    echo ❌ Erro no build da imagem
    exit /b 1
)

REM 4. Deploy no Cloud Run
echo.
echo ☁️  Fazendo deploy no Cloud Run...
gcloud run deploy %SERVICE_NAME% ^
  --image %IMAGE_NAME% ^
  --platform managed ^
  --region %REGION% ^
  --allow-unauthenticated ^
  --port 8080 ^
  --memory 256Mi ^
  --cpu 1 ^
  --timeout 60 ^
  --max-instances 5 ^
  --min-instances 0

if %ERRORLEVEL% neq 0 (
    echo ❌ Erro no deploy
    exit /b 1
)

REM 5. Obter URL
echo.
echo ✅ Deploy concluído com sucesso!
echo.
for /f "delims=" %%i in ('gcloud run services describe %SERVICE_NAME% --platform managed --region %REGION% --format "value(status.url)"') do set SERVICE_URL=%%i
echo 🌐 URL do Frontend: %SERVICE_URL%
echo.
echo 📝 Acesse a aplicação em: %SERVICE_URL%
echo.
echo ⚠️  IMPORTANTE: Atualize o script.js com a URL do backend!
echo.
echo ========================================

endlocal
