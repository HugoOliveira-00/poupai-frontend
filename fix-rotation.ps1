# Script para corrigir media queries para suportar rotacao de tela
$filePath = "c:\Temp\poupai-frontend\style.css"

# Le o conteudo do arquivo
$content = Get-Content $filePath -Raw

# Substitui os media queries simples por versoes que detectam landscape
$content = $content -replace '@media \(max-width: 768px\) \{', '@media (max-width: 768px), screen and (max-height: 896px) and (orientation: landscape) {'

# Salva o arquivo
$content | Set-Content $filePath -NoNewline

Write-Host "Media queries atualizados com sucesso!"
Write-Host "Agora o layout mobile sera mantido mesmo em landscape"
