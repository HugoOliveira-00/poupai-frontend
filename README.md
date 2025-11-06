# PoupAí - Gestão de Finanças Pessoais

<div align="center">

![PoupAí](https://img.shields.io/badge/PoupAí-Finanças_Pessoais-8B5CF6?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Em_Produção-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**Uma aplicação web moderna e intuitiva para controle financeiro pessoal**

[Demo ao Vivo](https://poupai-frontend.vercel.app) • [Instalar PWA](#instalação-como-pwa) • [Reportar Bug](https://github.com/HugoOliveira-00/poupai-frontend/issues)

</div>

---

## Sobre o Projeto

**PoupAí** é uma aplicação web progressiva (PWA) desenvolvida para ajudar usuários a gerenciar suas finanças pessoais de forma simples e eficiente. Com uma interface moderna e intuitiva, o app oferece controle completo sobre receitas, despesas, investimentos e metas financeiras.

### Objetivo

Democratizar o acesso a ferramentas de gestão financeira, oferecendo uma solução gratuita, sem anúncios e 100% focada na privacidade do usuário, com todos os dados armazenados localmente.

---

## Funcionalidades Principais

### Gestão Financeira
- **Controle de Receitas e Despesas** - Categorização automática e personalizada
- **Dashboard Interativo** - Visualização em tempo real do saldo e fluxo de caixa
- **Gráficos e Relatórios** - Análise visual de gastos por categoria e período
- **Gestão de Contas** - Múltiplas contas bancárias e carteiras
- **Metas Financeiras** - Defina e acompanhe objetivos de economia
- **Transações Recorrentes** - Automatize lançamentos mensais

### Mercado Financeiro
- **Cotações em Tempo Real** - Ações, moedas, criptomoedas e commodities
- **Índices Globais** - Acompanhamento de principais mercados mundiais
- **Notícias Financeiras** - Feed atualizado do mercado
- **Histórico de Ativos** - Gráficos de evolução de preços
- **Maiores Altas e Baixas** - Destaques do mercado

### Investimentos
- **Carteira de Investimentos** - Gerencie ações, fundos, criptos e renda fixa
- **Cálculo de Rentabilidade** - ROI automático e histórico de performance
- **Diversificação** - Análise de distribuição de ativos
- **Acompanhamento de Dividendos** - Registro de proventos recebidos

### Experiência Mobile
- **PWA (Progressive Web App)** - Instale como app nativo
- **Modo Escuro** - Interface adaptativa e confortável
- **Totalmente Responsivo** - Funciona perfeitamente em qualquer dispositivo
- **Offline First** - Funciona sem conexão com internet
- **Notificações Push** - Alertas de vencimentos e metas

### Segurança e Privacidade
- **Dados Locais** - Todas as informações armazenadas no dispositivo
- **Sem Cadastro de Dados Pessoais** - Privacidade total
- **Sem Anúncios** - Experiência limpa e focada
- **Backup e Exportação** - Exporte seus dados em PDF ou Excel

---

## Tecnologias Utilizadas

### Frontend
- **HTML5** - Estrutura semântica e moderna
- **CSS3** - Animações, gradientes e design responsivo
- **JavaScript (Vanilla)** - Lógica de aplicação pura, sem frameworks pesados

### Bibliotecas e APIs
- **Chart.js** - Gráficos interativos e responsivos
- **Phosphor Icons** - Ícones modernos e leves
- **jsPDF** - Geração de relatórios em PDF
- **SheetJS (XLSX)** - Exportação para Excel
- **API Backend Própria** - Integração com dados de mercado financeiro

### Infraestrutura
- **Vercel** - Hospedagem e deploy contínuo
- **PWA** - Service Worker para funcionamento offline
- **LocalStorage** - Persistência de dados no cliente
- **Google Cloud Run** - Backend para APIs de mercado financeiro

---

## Estrutura do Projeto

```
poupai-frontend/
├── index.html              # Página principal da aplicação
├── style.css               # Estilos globais e componentes
├── script.js               # Lógica da aplicação
├── vercel.json            # Configuração de deploy Vercel
├── .gitignore             # Arquivos ignorados pelo Git
└── README.md              # Documentação do projeto
```

### Arquitetura da Aplicação

**PoupAí** é uma Single Page Application (SPA) organizada em três telas principais:

1. **Landing Page** - Página inicial com apresentação do app
2. **Autenticação** - Tela de login/cadastro (dados locais)
3. **Dashboard** - Interface principal com todas as funcionalidades

---

## Como Usar

### Acesso Online
Simplesmente acesse: **[poupai-frontend.vercel.app](https://poupai-frontend.vercel.app)**

### Instalação como PWA

#### No Celular (Android/iOS):
1. Acesse o site pelo navegador
2. Toque no menu do navegador (⋮ ou share icon)
3. Selecione "Adicionar à tela inicial" ou "Instalar app"
4. Pronto! Use como um app nativo

#### No Desktop (Chrome/Edge):
1. Acesse o site
2. Clique no ícone de instalação na barra de endereço (+)
3. Confirme a instalação
4. O app será adicionado ao seu sistema

---

## Desenvolvimento Local

### Pré-requisitos
- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Editor de código (VS Code recomendado)
- Servidor HTTP local (opcional, mas recomendado)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/HugoOliveira-00/poupai-frontend.git

# Entre no diretório
cd poupai-frontend

# Abra com Live Server ou qualquer servidor HTTP
# Exemplo com Python:
python -m http.server 8000

# Ou com Node.js (http-server):
npx http-server -p 8000
```

Acesse em: `http://localhost:8000`

---

## Configuração

### Backend API
O app se conecta a uma API backend para dados de mercado financeiro:

```javascript
const BACKEND_URL = 'https://poupai-backend-694972193726.southamerica-east1.run.app';
```

### Endpoints Disponíveis
- `/api/mercado/acoes` - Cotações de ações
- `/api/mercado/moedas` - Câmbio de moedas
- `/api/mercado/criptomoedas` - Preços de criptomoedas
- `/api/mercado/commodities` - Cotações de commodities
- `/api/mercado/indices-globais` - Índices mundiais
- `/api/noticias/mercado` - Notícias financeiras

---

## Personalização

### Tema e Cores
O app utiliza um tema escuro moderno com gradientes roxos. Cores principais:

```css
--primary: #8B5CF6;        /* Roxo principal */
--background: #000000;      /* Preto */
--surface: #1a1a1a;        /* Cinza escuro */
--accent: #10b981;         /* Verde para positivos */
--danger: #ef4444;         /* Vermelho para negativos */
```

### Fontes
- **Inter** - Fonte principal (Google Fonts)

---

## Funcionalidades Técnicas

### PWA Features
- Instalável em qualquer dispositivo
- Funciona offline
- Atualização automática em background
- Ícones adaptativos para diferentes plataformas
- Theme color customizado (#000000)

### Otimizações
- Lazy loading de recursos
- Minificação e compressão
- Fallback para CDNs (Chart.js, ícones)
- Cache inteligente de dados
- Carregamento progressivo

### Responsividade
- Mobile First Design
- Breakpoints para tablet e desktop
- Touch-friendly em dispositivos móveis
- Layout fluido e adaptativo

---

## Contribuindo

Contribuições são bem-vindas! Se você quiser melhorar o PoupAí:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

### Diretrizes
- Mantenha o código limpo e documentado
- Teste em diferentes dispositivos e navegadores
- Siga o padrão de código existente
- Adicione comentários quando necessário

---

## Reportar Problemas

Encontrou um bug? Abra uma [issue](https://github.com/HugoOliveira-00/poupai-frontend/issues) descrevendo:
- O problema encontrado
- Passos para reproduzir
- Comportamento esperado vs atual
- Screenshots (se possível)
- Navegador e dispositivo utilizados

---

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## Autor

**Hugo Oliveira**

- GitHub: [@HugoOliveira-00](https://github.com/HugoOliveira-00)
- Projeto: [poupai-frontend](https://github.com/HugoOliveira-00/poupai-frontend)

---

## Agradecimentos

- Chart.js pela excelente biblioteca de gráficos
- Phosphor Icons pelos ícones modernos
- Vercel pela hospedagem gratuita
- Comunidade open source pelo apoio

---

## Roadmap Futuro

- Sincronização em nuvem (opcional)
- Integração com Open Banking
- Importação de extratos bancários
- Relatórios de Imposto de Renda
- Planejamento de aposentadoria
- Simulador de investimentos
- Compartilhamento de despesas (racha de contas)
- Suporte a múltiplos idiomas

---

<div align="center">

**Se este projeto te ajudou, considere dar uma estrela!**

Desenvolvido por [Hugo Oliveira](https://github.com/HugoOliveira-00)

</div>
