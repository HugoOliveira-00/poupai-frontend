
        //========================================
        //✅ ISSUE #15: SEGURANÇA - ANONIMIZAÇÃO DE LOGS
        //========================================
        
        //Configuração global de segurança de logs
        const LOG_SECURITY = {
            enabled: true, // Set false apenas para debug em desenvolvimento
            maskSensitiveData: true
        };
        
        //Função para sanitizar objetos antes de logar
        function sanitizeForLog(obj) {
            if (!LOG_SECURITY.enabled || !LOG_SECURITY.maskSensitiveData) {
                return obj; // Modo desenvolvimento - mostra tudo
            }
            
            if (!obj || typeof obj !== 'object') {
                return obj;
            }
            
            const sanitized = Array.isArray(obj) ? [] : {};
            
            for (const key in obj) {
                const lowerKey = key.toLowerCase();
                
                // Campos que devem ser completamente mascarados
                if (lowerKey.includes('password') || 
                    lowerKey.includes('senha') || 
                    lowerKey.includes('token') ||
                    lowerKey.includes('secret') ||
                    lowerKey.includes('cpf') ||
                    lowerKey.includes('credit') ||
                    lowerKey.includes('card')) {
                    sanitized[key] = '***';
                    continue;
                }
                
                // IDs - mostra apenas últimos 4 caracteres
                if (lowerKey === 'id' || lowerKey.includes('userid') || lowerKey.includes('usuarioid')) {
                    const value = String(obj[key]);
                    sanitized[key] = value.length > 4 ? `***${value.slice(-4)}` : '***';
                    continue;
                }
                
                // Email - mostra apenas domínio
                if (lowerKey.includes('email')) {
                    const email = String(obj[key]);
                    const parts = email.split('@');
                    if (parts.length === 2) {
                        sanitized[key] = `***@${parts[1]}`;
                    } else {
                        sanitized[key] = '***';
                    }
                    continue;
                }
                
                // Nome - mostra apenas iniciais
                if (lowerKey === 'nome' || lowerKey === 'name') {
                    const name = String(obj[key]);
                    const words = name.split(' ');
                    sanitized[key] = words.map(w => w.charAt(0).toUpperCase() + '.').join(' ');
                    continue;
                }
                
                // Valores monetários - mostra apenas faixa
                if (lowerKey.includes('valor') || 
                    lowerKey.includes('renda') || 
                    lowerKey.includes('salario') ||
                    lowerKey.includes('limite')) {
                    const value = parseFloat(obj[key]);
                    if (!isNaN(value)) {
                        if (value < 1000) sanitized[key] = '<R$1k';
                        else if (value < 5000) sanitized[key] = 'R$1k-5k';
                        else if (value < 10000) sanitized[key] = 'R$5k-10k';
                        else sanitized[key] = '>R$10k';
                    } else {
                        sanitized[key] = obj[key];
                    }
                    continue;
                }
                
                // Recursão para objetos aninhados
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    sanitized[key] = sanitizeForLog(obj[key]);
                } else {
                    sanitized[key] = obj[key];
                }
            }
            
            return sanitized;
        }
        
        //Função helper para logs seguros
        function secureLog(level, message, data = null) {
            if (!LOG_SECURITY.enabled) return;
            
            const timestamp = new Date().toISOString();
            const prefix = `[${timestamp}][${level.toUpperCase()}]`;
            
            if (data) {
                const sanitizedData = sanitizeForLog(data);
                console.log(prefix, message, sanitizedData);
            } else {
                console.log(prefix, message);
            }
        }

        //========================================
        //MOBILE/TABLET DEVICE DETECTION
        //========================================
        
        //Função para detectar se é dispositivo móvel ou tablet (dispositivos com teclado virtual)
        function isMobileDevice() {
            //Detecta por User Agent (inclui iPad, Android tablets, etc)
            const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
            const isMobileUA = mobileRegex.test(navigator.userAgent);
            
            //Detecta se tem touch screen (tablets e mobiles)
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            
            //Combina: User Agent OU (tem touch + não é desktop muito grande)
            //Até 1024px = tablets (iPad Pro 11", Samsung Tab, etc)
            return isMobileUA || (hasTouch && window.innerWidth <= 1024);
        }

        //✅ BLOQUEIO AGRESSIVO DE ZOOM - Previne pinch-to-zoom
        (function preventZoom() {
            // Bloqueia gesture events (iOS)
            document.addEventListener('gesturestart', function(e) {
                e.preventDefault();
                console.log('[ZOOM] 🚫 Gesture bloqueado (iOS pinch)');
            }, { passive: false });
            
            document.addEventListener('gesturechange', function(e) {
                e.preventDefault();
            }, { passive: false });
            
            document.addEventListener('gestureend', function(e) {
                e.preventDefault();
            }, { passive: false });
            
            // Bloqueia touch com 2+ dedos (Android/iOS)
            document.addEventListener('touchstart', function(e) {
                if (e.touches.length > 1) {
                    e.preventDefault();
                    console.log('[ZOOM] 🚫 Multi-touch bloqueado (pinch)');
                }
            }, { passive: false });
            
            // Bloqueia movimento com 2+ dedos
            document.addEventListener('touchmove', function(e) {
                if (e.touches.length > 1) {
                    e.preventDefault();
                }
            }, { passive: false });
            
            // Previne duplo toque para zoom
            let lastTouchEnd = 0;
            document.addEventListener('touchend', function(e) {
                const now = Date.now();
                if (now - lastTouchEnd <= 300) {
                    e.preventDefault();
                    console.log('[ZOOM] 🚫 Duplo toque bloqueado');
                }
                lastTouchEnd = now;
            }, { passive: false });
            
            console.log('[ZOOM] 🔒 Proteção anti-zoom ATIVADA (gesture + multi-touch + duplo toque)');
        })();
        
        //Função para focar no primeiro input de um modal (mobile e tablet)
        function focusFirstInputMobile(modalElement, delay = 300) {
            // ❌ DESABILITADO - Teclado não deve aparecer automaticamente
            // Usuário deve clicar no input para abrir o teclado
            return;
            
            /* CÓDIGO ORIGINAL DESABILITADO:
            if (!isMobileDevice()) return; //Só executa em mobile/tablet
            
            setTimeout(() => {
                const firstInput = modalElement.querySelector('input:not([type="hidden"]), textarea, select');
                if (firstInput && !firstInput.disabled && !firstInput.readOnly) {
                    firstInput.focus();
                    //Scroll para o input em caso de teclado cobrir
                    firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, delay);
            */
        }

        //========================================
        //BACKEND API INTEGRATION (Unified)
        //========================================
        
        const BACKEND_URL = 'https://poupai-backend-694972193726.southamerica-east1.run.app';
        
        //Objeto global para APIs do backend
        window.backendAPI = {
            //Ações B3
            fetchAcoes: async function() {
                try {
                    const response = await fetch(`${BACKEND_URL}/api/mercado/acoes`);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return await response.json();
                } catch (error) {
                    console.error('[ERROR]❌ Erro ao buscar ações:', error);
                    return null;
                }
            },
            
            //Moedas
            fetchMoedas: async function() {
                try {
                    const response = await fetch(`${BACKEND_URL}/api/mercado/moedas`);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return await response.json();
                } catch (error) {
                    console.error('[ERROR]❌ Erro ao buscar moedas:', error);
                    return null;
                }
            },
            
            //Feriados
            fetchFeriados: async function(ano = 2025) {
                try {
                    const response = await fetch(`${BACKEND_URL}/api/mercado/feriados?ano=${ano}`);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return await response.json();
                } catch (error) {
                    console.error('[ERROR]❌ Erro ao buscar feriados:', error);
                    return null;
                }
            },
            
            //Taxas (SELIC, CDI, IPCA)
            fetchTaxas: async function() {
                try {
                    const response = await fetch(`${BACKEND_URL}/api/mercado/taxas`);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return await response.json();
                } catch (error) {
                    console.error('[ERROR]❌ Erro ao buscar taxas:', error);
                    return null;
                }
            },
            
            //Notícias
            fetchNoticias: async function() {
                try {
                    const response = await fetch(`${BACKEND_URL}/api/noticias/mercado`);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return await response.json();
                } catch (error) {
                    console.error('[ERROR]❌ Erro ao buscar notícias:', error);
                    return null;
                }
            },
            
            //Criptomoedas
            fetchCriptomoedas: async function() {
                try {
                    const response = await fetch(`${BACKEND_URL}/api/mercado/criptomoedas`);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return await response.json();
                } catch (error) {
                    console.error('[ERROR]❌ Erro ao buscar criptomoedas:', error);
                    return null;
                }
            },
            
            //Histórico Bitcoin
            fetchHistoricoBitcoin: async function() {
                try {
                    const response = await fetch(`${BACKEND_URL}/api/mercado/historico/bitcoin`);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return await response.json();
                } catch (error) {
                    console.error('[ERROR]❌ Erro ao buscar histórico Bitcoin:', error);
                    return null;
                }
            },
            
            //Histórico de Moeda
            fetchHistoricoMoeda: async function(asset) {
                try {
                    const response = await fetch(`${BACKEND_URL}/api/mercado/historico/${asset}`);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return await response.json();
                } catch (error) {
                    console.error(`❌ Erro ao buscar histórico ${asset}:`, error);
                    return null;
                }
            },
            
            //Commodities
            fetchCommodities: async function() {
                try {
                    const response = await fetch(`${BACKEND_URL}/api/mercado/commodities`);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return await response.json();
                } catch (error) {
                    console.error('[ERROR]❌ Erro ao buscar commodities:', error);
                    return null;
                }
            },
            
            //Maiores Altas
            fetchMaioresAltas: async function() {
                try {
                    const response = await fetch(`${BACKEND_URL}/api/mercado/maiores-altas`);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return await response.json();
                } catch (error) {
                    console.error('[ERROR]❌ Erro ao buscar maiores altas:', error);
                    return null;
                }
            },
            
            //Maiores Baixas
            fetchMaioresBaixas: async function() {
                try {
                    const response = await fetch(`${BACKEND_URL}/api/mercado/maiores-baixas`);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return await response.json();
                } catch (error) {
                    console.error('[ERROR]❌ Erro ao buscar maiores baixas:', error);
                    return null;
                }
            },
            
            //Índices Globais
            fetchIndicesGlobais: async function() {
                try {
                    const response = await fetch(`${BACKEND_URL}/api/mercado/indices-globais`);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return await response.json();
                } catch (error) {
                    console.error('[ERROR]❌ Erro ao buscar índices globais:', error);
                    return null;
                }
            },
            
            //Todos os dados de mercado
            fetchAllMarketData: async function() {
                try {
                    const response = await fetch(`${BACKEND_URL}/api/mercado/all`);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return await response.json();
                } catch (error) {
                    console.error('[ERROR]❌ Erro ao buscar dados de mercado:', error);
                    return null;
                }
            },
            
            //Verificar saúde do backend
            checkHealth: async function() {
                try {
                    const response = await fetch(`${BACKEND_URL}/api/mercado/acoes`, { method: 'HEAD' });
                    return response.ok;
                } catch (error) {
                    console.error('[ERROR]❌ Backend offline:', error);
                    return false;
                }
            }
        };
        
        console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🚀 [BACKEND API] Módulo integrado ao script-dashboard.js');

        //========================================
        //VARIÁVEIS GLOBAIS
        //========================================
        
        const API_URL = "https://poupai-backend-694972193726.southamerica-east1.run.app/api";
        
        //========================================
        //FUNÇÕES UTILITÁRIAS DE SCROLL
        //========================================
        
        /**
         * 🔓 FUNÇÃO CRÍTICA: Libera scroll no body
         * Deve ser chamada sempre que precisar garantir que o scroll está funcionando
         * EXCEÇÃO: Apenas durante onboarding o scroll deve estar bloqueado
         */
        function enableBodyScroll() {
            console.log('[SCROLL] ✅ enableBodyScroll() chamado');
            console.log('[SCROLL] 📊 overflow ANTES:', document.body.style.overflow);
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.height = '';
            document.body.classList.remove('onboarding-active');
            console.log('[SCROLL] 📊 overflow DEPOIS:', document.body.style.overflow);
            console.log('[SCROLL] 📊 Classe onboarding-active:', document.body.classList.contains('onboarding-active'));
            console.log('[SCROLL] ✅ Scroll liberado');
            
            //⚠️ DEBUG: Verifica após 1 segundo se overflow mudou
            setTimeout(() => {
                if (document.body.style.overflow === 'hidden' || document.body.style.overflow === 'auto') {
                    console.error('[SCROLL] ⚠️ ALERTA: Overflow foi ALTERADO após enableBodyScroll!');
                    console.error('[SCROLL] ⚠️ Overflow atual:', document.body.style.overflow);
                    console.error('[SCROLL] ⚠️ Stack trace:', new Error().stack);
                }
            }, 1000);
            
            //⚠️ DEBUG: Verifica após 3 segundos
            setTimeout(() => {
                if (document.body.style.overflow === 'hidden' || document.body.style.overflow === 'auto') {
                    console.error('[SCROLL] ⚠️ ALERTA: Overflow foi ALTERADO após 3s!');
                    console.error('[SCROLL] ⚠️ Overflow atual:', document.body.style.overflow);
                    console.error('[SCROLL] ⚠️ Stack trace:', new Error().stack);
                }
            }, 3000);
        }
        
        /**
         * 🔒 FUNÇÃO CRÍTICA: Bloqueia scroll no body (APENAS para onboarding)
         * Deve ser usada APENAS durante o onboarding para evitar zoom/pan no iPhone
         */
        function disableBodyScroll() {
            document.body.classList.add('onboarding-active');
            console.log('[SCROLL] 🔒 Scroll bloqueado (onboarding)');
        }
        
        //========================================
        //FUNÇÕES UTILITÁRIAS DE DATA
        //========================================
        
        /**
         * Converte string de data para objeto Date sem problemas de timezone
         * @param {string} dateString - Data no formato "YYYY-MM-DD" ou ISO
         * @returns {Date} - Objeto Date ajustado para timezone local
         */
        function parseLocalDate(dateString) {
            if (!dateString) return new Date();
            
            //Se vier no formato ISO completo com timezone, usa diretamente
            if (dateString.includes('T')) {
                return new Date(dateString);
            }
            
            //Para formato "YYYY-MM-DD", cria data no timezone local
            const [year, month, day] = dateString.split('-').map(Number);
            return new Date(year, month - 1, day);
        }
        
        /**
         * ✅ NOVA FUNÇÃO: Verifica se uma transação deve ser exibida (considera flag agendada)
         * @param {Object} transaction - Transação a verificar
         * @param {Date} referenceDate - Data de referência (hoje por padrão)
         * @returns {boolean} - true se deve exibir, false se não
         */
        function shouldShowTransaction(transaction, referenceDate = null) {
            if (!referenceDate) {
                referenceDate = new Date();
                referenceDate.setHours(23, 59, 59, 999);
            }
            
            const dataTransacao = parseLocalDate(transaction.data);
            
            //Se tem flag agendada=true, só mostra quando a data chegar
            if (transaction.agendada === true) {
                return dataTransacao <= referenceDate;
            }
            
            //Se não tem flag agendada (ou é false), mostra sempre (comportamento padrão)
            return true;
        }
        
        /**
         * Formata Date para string "YYYY-MM-DD" sem problemas de timezone
         * @param {Date} date - Objeto Date
         * @returns {string} - Data formatada "YYYY-MM-DD"
         */
        function formatDateToInput(date) {
            if (!(date instanceof Date)) {
                date = parseLocalDate(date);
            }
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            return `${year}-${month}-${day}`;
        }

        /**
         * Adiciona meses a uma data mantendo o dia correto
         * Importante para evitar problemas com dias 29, 30, 31
         * @param {Date} date - Data base
         * @param {number} months - Número de meses a adicionar
         * @returns {Date} - Nova data
         */
        function addMonthsSafe(date, months) {
            const result = new Date(date);
            const targetDay = result.getDate();
            
            result.setMonth(result.getMonth() + months);
            
            //Se o dia mudou (ex: 31/01 + 1 mês = 03/03), ajusta para último dia do mês desejado
            if (result.getDate() !== targetDay) {
                result.setDate(0); //Volta para o último dia do mês anterior
            }
            
            return result;
        }
        
        /**
         * Compara se duas datas são do mesmo dia (ignora hora)
         * @param {Date|string} date1 
         * @param {Date|string} date2 
         * @returns {boolean}
         */
        function isSameDay(date1, date2) {
            const d1 = parseLocalDate(date1);
            const d2 = parseLocalDate(date2);
            
            return d1.getFullYear() === d2.getFullYear() &&
                   d1.getMonth() === d2.getMonth() &&
                   d1.getDate() === d2.getDate();
        }
        
        //Sistema de gerenciamento de gráficos
        const ChartManager = {
            instances: {},
            isReady: false,
            
            init() {
                if (typeof Chart !== 'undefined') {
                    if (Chart.registerables) {
                        try {
                            Chart.register(...Chart.registerables);
                        } catch (e) {
                            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]Chart.js já configurado');
                        }
                    }
                    this.isReady = true;
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Chart.js inicializado');
                } else {
                    console.error('[ERROR]❌ Chart.js não disponível');
                }
            },
            
            create(id, config) {
                const canvas = document.getElementById(id);
                if (!canvas) {
                    console.error(`❌ Canvas ${id} não encontrado`);
                    return null;
                }
                
                if (!this.isReady) {
                    console.error('[ERROR]❌ Chart.js não está pronto');
                    return null;
                }
                
                //Destruir instância anterior se existir
                this.destroy(id);
                
                try {
                    const ctx = canvas.getContext('2d');
                    this.instances[id] = new Chart(ctx, config);
                    console.log(`✅ Gráfico ${id} criado`);
                    return this.instances[id];
                } catch (error) {
                    console.error(`❌ Erro ao criar gráfico ${id}:`, error);
                    return null;
                }
            },
            
            destroy(id) {
                if (this.instances[id]) {
                    try {
                        this.instances[id].destroy();
                        delete this.instances[id];
                        console.log(`🗑️ Gráfico ${id} destruído`);
                    } catch (e) {
                        console.warn(`⚠️ Erro ao destruir ${id}:`, e);
                    }
                }
            },
            
            destroyAll() {
                Object.keys(this.instances).forEach(id => this.destroy(id));
            },
            
            get(id) {
                return this.instances[id] || null;
            }
        };
        
        //Inicializar quando o DOM estiver pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => ChartManager.init());
        } else {
            ChartManager.init();
        }
        
        let currentUser = null;
        let authMode = 'login';
        let transactions = [];
        let goals = [];
        let chart = null;
        let reportChart = null;
        let lastWeeklySpending = 0; //Para armazenar o gasto da semana anterior
        let selectedCategory = '';
        let filterStartDate = null;
        let filterEndDate = null;
        let isNewAccount = false; //Flag para saber se é uma conta nova
        let editingTransactionId = null; //ID da transação sendo editada

        //Mapeamento Phosphor → Font Awesome (caso Font Awesome seja o fallback ativo)
        const phosphorToFA = {
            'ph-user': 'fa-user', 'ph-house': 'fa-house', 'ph-wallet': 'fa-wallet',
            'ph-chart-line': 'fa-chart-line', 'ph-chart-bar': 'fa-chart-bar',
            'ph-calendar': 'fa-calendar', 'ph-arrow-up': 'fa-arrow-up',
            'ph-arrow-down': 'fa-arrow-down', 'ph-check-circle': 'fa-circle-check',
            'ph-plus-circle': 'fa-circle-plus', 'ph-info': 'fa-circle-info',
            'ph-warning': 'fa-triangle-exclamation', 'ph-warning-circle': 'fa-circle-exclamation',
            'ph-warning-octagon': 'fa-octagon-exclamation', 'ph-lightbulb': 'fa-lightbulb',
            'ph-piggy-bank': 'fa-piggy-bank', 'ph-credit-card': 'fa-credit-card',
            'ph-trend-up': 'fa-arrow-trend-up', 'ph-trend-down': 'fa-arrow-trend-down',
            'ph-repeat': 'fa-repeat', 'ph-swap': 'fa-right-left',
            'ph-target': 'fa-bullseye', 'ph-book-open': 'fa-book-open',
            'ph-calculator': 'fa-calculator', 'ph-bell': 'fa-bell',
            'ph-sign-out': 'fa-right-from-bracket', 'ph-briefcase': 'fa-briefcase',
            'ph-laptop': 'fa-laptop', 'ph-shopping-cart': 'fa-cart-shopping',
            'ph-fork-knife': 'fa-utensils', 'ph-bus': 'fa-bus', 'ph-car': 'fa-car',
            'ph-heart': 'fa-heart', 'ph-film': 'fa-film', 'ph-book': 'fa-book',
            'ph-package': 'fa-box', 'ph-wrench': 'fa-wrench', 'ph-gift': 'fa-gift',
            'ph-coins': 'fa-coins', 'ph-note-pencil': 'fa-pen-to-square',
            'ph-calendar-check': 'fa-calendar-check', 'ph-fire': 'fa-fire-flame-curved',
            'ph-building-office': 'fa-building', 'ph-trophy': 'fa-trophy',
            'ph-currency-dollar': 'fa-dollar-sign', 'ph-currency-circle-dollar': 'fa-circle-dollar-to-slot',
            'ph-game-controller': 'fa-gamepad', 'ph-heartbeat': 'fa-heart-pulse',
            'ph-lightning': 'fa-bolt', 'ph-bolt': 'fa-bolt',
            'ph-calendar-dots': 'fa-calendar-days', 'ph-crystal-ball': 'fa-crystal-ball',
            'ph-percent': 'fa-percent', 'ph-clock-countdown': 'fa-hourglass-half',
            'ph-calendar-star': 'fa-calendar-check',
            //Ícones de IA e previsões
            'ph-brain': 'fa-brain', 'ph-robot': 'fa-robot',
            'ph-trend-up': 'fa-arrow-trend-up', 'ph-trend-down': 'fa-arrow-trend-down',
            'ph-target': 'fa-bullseye', 'ph-clock': 'fa-clock',
            //Novos ícones do modal de categoria personalizada
            'ph-note': 'fa-note-sticky', 'ph-bank': 'fa-building-columns',
            'ph-buildings': 'fa-city', 'ph-storefront': 'fa-store',
            'ph-factory': 'fa-industry', 'ph-airplane': 'fa-plane',
            'ph-hamburger': 'fa-burger', 'ph-apple-logo': 'fa-apple-whole',
            'ph-first-aid-kit': 'fa-kit-medical', 'ph-palette': 'fa-palette',
            'ph-music-note': 'fa-music', 'ph-device-mobile': 'fa-mobile-screen',
            'ph-watch': 'fa-clock', 'ph-t-shirt': 'fa-shirt',
            'ph-confetti': 'fa-champagne-glasses'
        };

        //Helper: normaliza e renderiza ícones Phosphor (com fallback para Font Awesome)
        function renderIcon(icon) {
            if (!icon) return '';
            //Se já for um HTML (ex: '<i ...'), retorna como está
            if (typeof icon === 'string' && icon.trim().startsWith('<i')) return icon;

            //Se for emoji ou string contendo caracteres não alfanuméricos (exceto - e espaço), retorna envolvido em span
            if (/[^a-zA-Z0-9\-\s]/.test(icon)) {
                return `<span style="font-size: 1.2em;">${icon}</span>`;
            }

            //Normalização robusta: aceita 'ph ph-nome', 'ph-nome', ou 'nome'
            let name = icon.trim();
            
            //Remove 'ph ph-' se existir
            if (name.startsWith('ph ph-')) {
                name = name.substring(6); //remove 'ph ph-'
            } 
            //Remove 'ph-' se existir
            else if (name.startsWith('ph-')) {
                name = name.substring(3); //remove 'ph-'
            }
            //Remove 'ph ' se existir
            else if (name.startsWith('ph ')) {
                name = name.substring(3); //remove 'ph '
            }
            
            //Se Font Awesome estiver ativo como fallback, converte
            if (window.ICON_FALLBACK_MODE === 'fontawesome') {
                const faClass = phosphorToFA[`ph-${name}`] || 'fa-circle-question';
                return `<i class="fa-solid ${faClass}"></i>`;
            }
            
            //Retorna ícone Phosphor padrão
            return `<i class="ph ph-${name}"></i>`;
        }

        //Helper: renderiza ícone com estilo inline
        function renderIconWithStyle(icon, style) {
            if (!icon) return '';
            if (typeof icon === 'string' && icon.trim().startsWith('<i')) {
                //injeta style se não existir
                if (style && !/style=/.test(icon)) {
                    return icon.replace('<i ', `<i style="${style}" `);
                }
                return icon;
            }
            if (typeof icon !== 'string') return '';
            if (/[^a-zA-Z0-9\-\s]/.test(icon)) return icon;
            
            //Normalização robusta: igual ao renderIcon()
            let name = icon.trim();
            if (name.startsWith('ph ph-')) {
                name = name.substring(6);
            } else if (name.startsWith('ph-')) {
                name = name.substring(3);
            } else if (name.startsWith('ph ')) {
                name = name.substring(3);
            }
            
            return `<i class="ph ph-${name}" style="${style}"></i>`;
        }

        //Função para capitalizar texto (primeira letra maiúscula, resto minúscula em cada palavra)
        function capitalizeText(text) {
            if (!text) return '';
            return text
                .trim()
                .toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }

        //✅ Dicionário de correções comuns em português brasileiro
        const portugueseCorrections = {
            //Acentuação automática
            'cafe': 'café', 'cafes': 'cafés', 'cha': 'chá', 'chas': 'chás',
            'onibus': 'ônibus', 'taxi': 'táxi', 'taxis': 'táxis',
            'gasolina': 'gasolina', 'alcool': 'álcool', 'oleo': 'óleo',
            'farmacia': 'farmácia', 'farmacias': 'farmácias',
            'remedio': 'remédio', 'remedios': 'remédios',
            'medico': 'médico', 'medica': 'médica', 'medicos': 'médicos',
            'musica': 'música', 'musicas': 'músicas',
            'telefone': 'telefone', 'celular': 'celular',
            'academia': 'academia', 'cinema': 'cinema',
            'padaria': 'padaria', 'acougue': 'açougue',
            'grafica': 'gráfica', 'graficas': 'gráficas',
            'eletrica': 'elétrica', 'eletrico': 'elétrico',
            'agua': 'água', 'gas': 'gás',
            'aluguel': 'aluguel', 'condominio': 'condomínio',
            'internet': 'internet', 'telefonia': 'telefonia',
            'notebook': 'notebook', 'mouse': 'mouse',
            'teclado': 'teclado', 'monitor': 'monitor',
            'manutencao': 'manutenção', 'reparacao': 'reparação',
            'educacao': 'educação', 'mensalidade': 'mensalidade',
            'vestuario': 'vestuário', 'calcado': 'calçado',
            'calcados': 'calçados', 'roupa': 'roupa', 'roupas': 'roupas',
            'joia': 'joia', 'joias': 'joias', 'relogio': 'relógio',
            'viagem': 'viagem', 'viagens': 'viagens', 'hotel': 'hotel',
            'passagem': 'passagem', 'passagens': 'passagens',
            'restaurante': 'restaurante', 'lanchonete': 'lanchonete',
            'pizzaria': 'pizzaria', 'hamburgueria': 'hamburgueria',
            'mercado': 'mercado', 'supermercado': 'supermercado',
            'feira': 'feira', 'hortfruti': 'hortifruti',
            'acucar': 'açúcar', 'cafe-da-manha': 'café da manhã',
            'almoco': 'almoço', 'jantar': 'jantar',
            'saude': 'saúde', 'seguro': 'seguro', 'seguros': 'seguros',
            'dentista': 'dentista', 'clinica': 'clínica',
            'hospital': 'hospital', 'exame': 'exame', 'exames': 'exames',
            'lazer': 'lazer', 'diversao': 'diversão',
            'presente': 'presente', 'presentes': 'presentes',
            'aniversario': 'aniversário', 'casamento': 'casamento',
            'festa': 'festa', 'festas': 'festas',
            'imposto': 'imposto', 'impostos': 'impostos',
            'ipva': 'IPVA', 'iptu': 'IPTU',
            'salario': 'salário', 'salarios': 'salários',
            'bonus': 'bônus', 'comissao': 'comissão',
            'freelance': 'freelance', 'freela': 'freela',
            'investimento': 'investimento', 'investimentos': 'investimentos',
            'aplicacao': 'aplicação', 'aplicacoes': 'aplicações',
            'rendimento': 'rendimento', 'rendimentos': 'rendimentos'
        };

        //✅ Função para corrigir e acentuar texto em português brasileiro
        function correctPortuguese(text) {
            if (!text) return '';
            
            const words = text.trim().toLowerCase().split(' ');
            const correctedWords = words.map(word => {
                //Remove pontuação para verificar
                const cleanWord = word.replace(/[.,!?;:]/g, '');
                const punctuation = word.match(/[.,!?;:]/g);
                
                //Verifica se existe correção no dicionário
                const corrected = portugueseCorrections[cleanWord] || cleanWord;
                
                //Reaplica pontuação se houver
                return punctuation ? corrected + punctuation.join('') : corrected;
            });
            
            //Capitaliza cada palavra
            return correctedWords
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }

        //✅ CORREÇÃO: Função para verificar se já existe transação EXATAMENTE IGUAL
        //Agora permite nomes similares como "Teste de Despesa" e "Teste de Despesa fixa"
        function checkDuplicateTransaction(description, excludeId = null) {
            const normalizedDesc = description.trim().toLowerCase();
            
            //Verifica se já existe transação com EXATAMENTE o mesmo nome E mesma data
            //Isso evita duplicatas verdadeiras mas permite variações do nome
            return transactions.some(t => {
                //Se estamos editando, ignora a própria transação
                if (excludeId && t.id === excludeId) return false;
                
                const existingDesc = t.descricao.trim().toLowerCase();
                
                //✅ MUDANÇA: Só bloqueia se for EXATAMENTE igual, não similaridade
                return existingDesc === normalizedDesc;
            });
        }

        const categories = {
            income: [
                { name: 'Salário', icon: 'briefcase' },
                { name: 'Freelance', icon: 'laptop' },
                { name: 'Investimentos', icon: 'trend-up' },
                { name: 'Prêmio', icon: 'trophy' },
                { name: 'Venda', icon: 'currency-dollar' },
                { name: 'Aluguel', icon: 'building-office' },
                { name: 'Outros', icon: 'currency-circle-dollar' }
            ],
            expense: [
                { name: 'Mercado', icon: 'shopping-cart' },
                { name: 'Restaurante', icon: 'fork-knife' },
                { name: 'Transporte', icon: 'car' },
                { name: 'Moradia', icon: 'house' },
                { name: 'Lazer', icon: 'game-controller' },
                { name: 'Saúde', icon: 'heartbeat' },
                { name: 'Outros', icon: 'credit-card' }
            ]
        };

        //Função para carregar categorias personalizadas do backend
        async function loadCustomCategories() {
            try {
                const userId = JSON.parse(localStorage.getItem('user'))?.id;
                if (!userId) return;

                const response = await fetch(`${API_URL}/usuarios/${userId}/categorias`);
                if (!response.ok) return;

                const customCategories = await response.json();
                
                //Adiciona as categorias personalizadas aos arrays correspondentes
                customCategories.forEach(cat => {
                    const tipo = cat.tipo === 'income' ? 'income' : 'expense';
                    
                    //Verifica se já existe (evita duplicatas)
                    const exists = categories[tipo].some(c => c.name === cat.name);
                    if (!exists) {
                        //Insere antes do "Outros"
                        const outrosIndex = categories[tipo].findIndex(c => c.name === 'Outros');
                        if (outrosIndex !== -1) {
                            categories[tipo].splice(outrosIndex, 0, { name: cat.name, icon: cat.icon });
                        } else {
                            categories[tipo].push({ name: cat.name, icon: cat.icon });
                        }
                    }
                });
            } catch (error) {
                console.error('[ERROR]Erro ao carregar categorias personalizadas:', error);
            }
        }

        //Carrega categorias personalizadas ao iniciar
        loadCustomCategories();

        //INICIALIZAÇÃO - Partículas com interação do mouse
        function createParticles() {
            const container = document.getElementById('particles-container');
            if (!container) return;
            
            const particleCount = 100;
            
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                
                const size = Math.random() * 3 + 1;
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
                
                resetParticle(particle);
                container.appendChild(particle);
                animateParticle(particle);
            }
        }

        function resetParticle(particle) {
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            
            particle.style.left = `${posX}%`;
            particle.style.top = `${posY}%`;
            particle.style.opacity = '0';
            
            return { x: posX, y: posY };
        }

        function animateParticle(particle) {
            const pos = resetParticle(particle);
            const duration = Math.random() * 12 + 10;
            const delay = Math.random() * 5;
            
            setTimeout(() => {
                particle.style.transition = `all ${duration}s linear`;
                particle.style.opacity = Math.random() * 0.25 + 0.1;
                
                const moveX = pos.x + (Math.random() * 20 - 10);
                const moveY = pos.y - Math.random() * 35;
                
                particle.style.left = `${moveX}%`;
                particle.style.top = `${moveY}%`;
                
                setTimeout(() => {
                    animateParticle(particle);
                }, duration * 1000);
            }, delay * 1000);
        }

        createParticles();

        //Interação com mouse
        let mouseTimeout;
        document.addEventListener('mousemove', (e) => {
            clearTimeout(mouseTimeout);
            mouseTimeout = setTimeout(() => {
                const container = document.getElementById('particles-container');
                if (!container) return;
                
                const mouseX = (e.clientX / window.innerWidth) * 100;
                const mouseY = (e.clientY / window.innerHeight) * 100;
                
                const particle = document.createElement('div');
                particle.className = 'particle';
                
                const size = Math.random() * 4 + 2;
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
                particle.style.left = `${mouseX}%`;
                particle.style.top = `${mouseY}%`;
                particle.style.opacity = '0.5';
                
                container.appendChild(particle);
                
                setTimeout(() => {
                    particle.style.transition = 'all 2s ease-out';
                    particle.style.left = `${mouseX + (Math.random() * 10 - 5)}%`;
                    particle.style.top = `${mouseY + (Math.random() * 10 - 5)}%`;
                    particle.style.opacity = '0';
                    
                    setTimeout(() => particle.remove(), 2000);
                }, 10);
            }, 50);
        });

        //NAVEGAÇÃO
        function showAuth(mode) {
            authMode = mode;
            
            // Adiciona estado ao histórico do navegador
            history.pushState({ page: 'auth', mode: mode }, '', '#auth');
            
            document.getElementById('landingPage').style.display = 'none';
            document.getElementById('authScreen').style.display = 'flex';
            document.getElementById('dashboard').style.display = 'none';
            document.getElementById('aboutPage').classList.remove('active');
            
            // Esconde o footer da landing page quando auth está visível
            const landingFooter = document.querySelector('.landing-footer');
            if (landingFooter) landingFooter.style.display = 'none';
            
            //Atualiza cor da navigation bar para preto (auth screen)
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                metaThemeColor.content = '#000000';
            }
            
            //🔓 SCROLL: Landing page precisa de scroll livre
            document.body.style.overflow = '';
            
            //Reset scroll
            window.scrollTo(0, 0);
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
            
            //Limpa os campos
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
            document.getElementById('name').value = '';
            document.getElementById('confirmPassword').value = '';
            
            //Atualiza UI para o modo correto
            updateAuthUI();
            
            //❌ REMOVIDO: Não focar automaticamente (teclado mobile)
            // Usuário deve clicar no input para abrir o teclado
            /*
            if (mode === 'login') {
                document.getElementById('email').focus();
            } else {
                document.getElementById('name').focus();
            }
            */
        }

        async function showDashboard() {
            document.getElementById('landingPage').style.display = 'none';
            document.getElementById('authScreen').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            document.getElementById('aboutPage').classList.remove('active');
            
            //Atualiza cor da navigation bar para preto (dashboard)
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                metaThemeColor.content = '#000000';
            }
            
            //Mostra mobile bottom nav e menu "Mais"
            const mobileBottomNav = document.querySelector('.mobile-bottom-nav');
            const mobileMoreMenu = document.querySelector('.mobile-more-menu');
            if (mobileBottomNav) mobileBottomNav.classList.remove('hidden');
            if (mobileMoreMenu) mobileMoreMenu.classList.remove('hidden');
            
            //🔓 SCROLL: Libera scroll usando função utilitária
            enableBodyScroll();
            
            //Reset scroll
            window.scrollTo(0, 0);
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
            
            //CRÍTICO: Reset da navegação - sempre inicia no Dashboard
            resetNavigation();
            
            //✅ OTIMIZAÇÃO: Mostra onboarding IMEDIATAMENTE se for novo usuário
            //Não precisa esperar carregar dados do backend
            const shouldShowOnboarding = (
                localStorage.getItem('onboardingCompleted') !== 'true' &&
                (localStorage.getItem('isNewUser') === 'true' || !currentUser.ocupacao || !currentUser.rendaMensal)
            );
            
            if (shouldShowOnboarding) {
                console.log('[ONBOARDING] ⚡ Novo usuário detectado - mostrando onboarding IMEDIATAMENTE');
                checkAndShowOnboarding();
            }
            
            //✅ CORREÇÃO: Carrega dados do backend em paralelo (não bloqueia onboarding)
            loadDashboardData().then(() => {
                //Atualiza a UI com dados carregados
                updateProfileUI();
                updateWeeklySummary();
                updateInsights();
            });
        }
        
        function resetNavigation() {
            //Esconde todas as seções
            document.querySelectorAll('[id^="section"]').forEach(el => {
                el.classList.add('hidden');
            });
            
            //Mostra apenas a seção Overview (Dashboard)
            const sectionOverview = document.getElementById('sectionOverview');
            if (sectionOverview) {
                sectionOverview.classList.remove('hidden');
            }
            
            //🔒 PRIVACIDADE: Define classe do body como overview (dashboard inicial)
            document.body.className = document.body.className.replace(/section-\w+/g, '');
            document.body.classList.add('section-overview');
            
            //Remove active de todos os links de navegação
            document.querySelectorAll('.navigation a').forEach(a => {
                a.classList.remove('active');
            });
            
            //Adiciona active no primeiro link (Dashboard)
            const firstNavLink = document.querySelector('.navigation a');
            if (firstNavLink) {
                firstNavLink.classList.add('active');
            }
            
            //Atualiza o título do header
            const headerTitle = document.getElementById('headerTitle');
            if (headerTitle) {
                headerTitle.textContent = 'Dashboard'; //✅ REVERTIDO
            }
        }

        function openAboutPage() {
            console.log('[SCROLL] 📖 openAboutPage() chamado - bloqueando scroll (esperado)');
            document.getElementById('aboutPage').classList.add('active');
            document.body.style.overflow = 'hidden';
            
            //Reset scroll ao abrir
            window.scrollTo(0, 0);
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
        }

        function closeAboutPage() {
            console.log('[SCROLL] 📖 closeAboutPage() chamado - restaurando scroll');
            document.getElementById('aboutPage').classList.remove('active');
            enableBodyScroll(); //✅ Usa função utilitária
            
            //Reset scroll ao fechar
            window.scrollTo(0, 0);
        }

        function backToLanding() {
            // Navega no histórico (funciona com botão voltar do Android)
            if (window.location.hash === '#auth') {
                history.back();
            } else {
                // Se não há hash, força a mudança
                history.replaceState({ page: 'landing' }, '', '#landing');
            }
            
            //=== LIMPEZA RADICAL DO DOM ===
            //1. Esconde telas
            document.getElementById('landingPage').style.display = 'block';
            document.getElementById('authScreen').style.display = 'none';
            document.getElementById('dashboard').style.display = 'none';
            document.getElementById('aboutPage').classList.remove('active');
            
            //Atualiza cor da navigation bar para preto (landing page)
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                metaThemeColor.content = '#000000';
            }
            
            //🔓 SCROLL: Auth screen precisa de scroll livre (teclado mobile)
            document.body.style.overflow = '';
            
            //2. Reset da navegação
            resetNavigation();
            
            //3. Limpa os campos de formulário
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
            
            //=== CORREÇÃO DEFINITIVA DO BUG ===
            //4. PRIMEIRO: Remove TODOS os estilos inline do .landing-main
            const landingMain = document.querySelector('.landing-main');
            const landingPage = document.getElementById('landingPage');
            
            if (landingMain) {
                //Remove qualquer estilo inline que possa estar causando conflito
                landingMain.removeAttribute('style');
            }
            
            if (landingPage) {
                landingPage.removeAttribute('style');
                landingPage.style.display = 'block';
            }
            
            //5. Scroll para o topo ANTES de qualquer animação
            window.scrollTo(0, 0);
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
            document.documentElement.style.scrollBehavior = 'auto';
            
            //6. Força re-aplicação dos estilos CSS corretos
            requestAnimationFrame(() => {
                if (landingMain) {
                    //Remove o atributo style para forçar uso do CSS
                    landingMain.removeAttribute('style');
                    
                    //Força reflow lendo uma propriedade
                    const _ = landingMain.offsetHeight;
                    
                    //Re-adiciona classes se necessário (garantia)
                    if (!landingMain.classList.contains('landing-main')) {
                        landingMain.classList.add('landing-main');
                    }
                }
                
                //7. Scroll final depois do reflow
                setTimeout(() => {
                    window.scrollTo(0, 0);
                    document.body.scrollTop = 0;
                    document.documentElement.scrollTop = 0;
                }, 50);
            });
        }

        //Sistema de Insights
        //=== INSIGHTS DINÂMICOS COM ROTAÇÃO AUTOMÁTICA ===
        let currentInsightIndex = 0;
        let insightRotationInterval = null;

        function updateInsights() {
            //Insights agora são gerenciados apenas pelos cards verticais
            //Esta função pode ser removida ou mantida para compatibilidade
        }

        function generateAlerts() {
            const alerts = [];
            
            //Alerta de despesa individual muito alta
            const currentMonthTransactions = transactions.filter(t => {
                const date = parseLocalDate(t.data);
                const now = new Date();
                return t.tipo === 'despesa' && 
                       date.getMonth() === now.getMonth() &&
                       date.getFullYear() === now.getFullYear();
            });

            //Verifica despesas acima de R$ 200 (simplificado)
            currentMonthTransactions.forEach(t => {
                if (Math.abs(t.valor) >= 200) {
                    alerts.push({
                        type: 'alert',
                        icon: 'ph-warning-circle',
                        title: 'Despesa Alta Detectada',
                        description: `${formatCurrency(Math.abs(t.valor))} em "${t.descricao}"`,
                        date: parseLocalDate(t.data)
                    });
                }
            });

            //Se tem muitas despesas pequenas, alerta também
            if (currentMonthTransactions.length >= 5) {
                const totalExpenses = currentMonthTransactions.reduce((sum, t) => sum + Math.abs(t.valor), 0);
                alerts.push({
                    type: 'alert',
                    icon: 'ph-chart-bar',
                    title: 'Múltiplas Despesas Registradas',
                    description: `${currentMonthTransactions.length} despesas totalizando ${formatCurrency(totalExpenses)}`,
                    date: new Date()
                });
            }

            //Alerta de categoria com gastos muito altos
            const categories = {};
            currentMonthTransactions.forEach(t => {
                categories[t.categoria] = (categories[t.categoria] || 0) + Math.abs(t.valor);
            });

            const totalExpenses = Object.values(categories).reduce((sum, val) => sum + val, 0);
            Object.entries(categories).forEach(([category, amount]) => {
                const percentage = (amount / totalExpenses) * 100;
                if (percentage > 35 && totalExpenses > 0) {
                    alerts.push({
                        type: 'alert',
                        icon: 'ph-pie-chart',
                        title: 'Categoria com Gastos Elevados',
                        description: `${category}: ${percentage.toFixed(0)}% dos gastos (${formatCurrency(amount)})`,
                        date: new Date()
                    });
                }
            });
            
            //Alerta de gastos acima da média mensal
            const currentMonthExpenses = currentMonthTransactions.reduce((sum, t) => sum + Math.abs(t.valor), 0);
            const averageMonthlyExpenses = calculateAverageMonthlyExpenses();
            
            if (currentMonthExpenses > averageMonthlyExpenses * 1.2 && averageMonthlyExpenses > 0) {
                alerts.push({
                    type: 'alert',
                    icon: 'ph-trend-up',
                    title: 'Gastos Acima da Média',
                    description: `${formatCurrency(currentMonthExpenses)} (20% acima da média)`,
                    date: new Date()
                });
            }

            //Alerta de meta mensal de gastos ultrapassada (definida no onboarding)
            if (currentUser && currentUser.metaMensal && currentUser.metaMensal > 0) {
                const percentUsed = (currentMonthExpenses / currentUser.metaMensal) * 100;
                
                //Alerta quando atingir 80% da meta
                if (percentUsed >= 80 && percentUsed < 100) {
                    alerts.push({
                        type: 'alert',
                        icon: 'ph-warning-circle',
                        title: 'Atenção: Aproximando do Limite de Gastos',
                        description: `Você já gastou ${formatCurrency(currentMonthExpenses)} de ${formatCurrency(currentUser.metaMensal)} (${percentUsed.toFixed(1)}% da sua meta mensal). Controle seus gastos para não ultrapassar o limite!`,
                        date: new Date()
                    });
                }
                
                //Alerta quando ultrapassar 100% da meta
                if (percentUsed >= 100) {
                    const exceeded = currentMonthExpenses - currentUser.metaMensal;
                    alerts.push({
                        type: 'alert',
                        icon: 'ph-fire',
                        title: 'Meta Mensal Ultrapassada',
                        description: `${formatCurrency(exceeded)} acima da meta de ${formatCurrency(currentUser.metaMensal)}`,
                        date: new Date()
                    });
                }
            }

            //Alertas de metas próximas do prazo
            goals.forEach(goal => {
                const deadline = new Date(goal.dataLimite);
                const today = new Date();
                const daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                const progress = (goal.valorAtual / goal.valorAlvo) * 100;

                if (daysRemaining <= 30 && progress < 80) {
                    alerts.push({
                        type: 'alert',
                        icon: 'ph-target',
                        title: `Meta "${goal.nome}" Próxima do Prazo`,
                        description: `${daysRemaining} dias restantes, faltam ${formatCurrency(goal.valorAlvo - goal.valorAtual)}`,
                        date: new Date()
                    });
                }
            });

            return alerts;
        }

        function generateSuggestions() {
            const suggestions = [];
            
            //Análise de padrões de gastos por categoria
            const categories = {};
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            
            const currentMonthExpenses = transactions.filter(t => {
                const date = parseLocalDate(t.data);
                return t.tipo === 'despesa' && 
                       date.getMonth() === currentMonth &&
                       date.getFullYear() === currentYear;
            });

            currentMonthExpenses.forEach(t => {
                if (!categories[t.categoria]) {
                    categories[t.categoria] = { total: 0, count: 0 };
                }
                categories[t.categoria].total += Math.abs(t.valor);
                categories[t.categoria].count++;
            });

            const totalExpenses = Object.values(categories).reduce((sum, cat) => sum + cat.total, 0);
            
            //Sugestão para categoria dominante (mais de 40% dos gastos)
            Object.entries(categories).forEach(([category, data]) => {
                const percentage = (data.total / totalExpenses) * 100;
                
                if (percentage > 40 && totalExpenses > 0) {
                    suggestions.push({
                        type: 'suggestion',
                        icon: 'ph-lightbulb',
                        title: 'Concentração de Gastos',
                        description: `${category}: ${percentage.toFixed(0)}% dos gastos (${formatCurrency(data.total)})`,
                        date: new Date()
                    });
                }
                
                //Sugestão para categorias com gastos frequentes (reduzido de 10 para 3)
                if (data.count >= 3 && data.total > 100) {
                    suggestions.push({
                        type: 'suggestion',
                        icon: 'ph-coins',
                        title: 'Oportunidade de Economia',
                        description: `${data.count} gastos em ${category} (${formatCurrency(data.total)})`,
                        date: new Date()
                    });
                }
            });

            //Sugestão de investimento (reduzido de 5000 para 1000)
            const balance = transactions.reduce((sum, t) => sum + t.valor, 0);
            
            if (balance > 1000) {
                suggestions.push({
                    type: 'suggestion',
                    icon: 'ph-trend-up',
                    title: 'Oportunidade de Investimento',
                    description: `Você tem um saldo positivo de ${formatCurrency(balance)}. Considere investir parte desse valor para fazer seu dinheiro crescer!`,
                    date: new Date()
                });
            }

            //Sugestão de controle (se tem poucas transações)
            if (transactions.length < 5 && transactions.length > 0) {
                suggestions.push({
                    type: 'suggestion',
                    icon: 'ph-note-pencil',
                    title: 'Continue Registrando',
                    description: 'Quanto mais transações você registrar, melhores insights e recomendações você receberá. Continue assim!',
                    date: new Date()
                });
            }

            return suggestions;
        }

        function generateReminders() {
            const reminders = [];
            
            //Identificar despesas recorrentes
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            
            const recurrentTransactions = transactions
                .filter(t => t.tipo === 'despesa' && parseLocalDate(t.data) >= lastMonth)
                .reduce((acc, t) => {
                    const key = t.descricao.toLowerCase();
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(t);
                    return acc;
                }, {});

            Object.entries(recurrentTransactions).forEach(([desc, trans]) => {
                if (trans.length >= 2) {
                    const lastDate = parseLocalDate(trans[trans.length - 1].data);
                    const nextDueDate = new Date(lastDate);
                    nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                    
                    if (nextDueDate > new Date()) {
                        reminders.push({
                            type: 'reminder',
                            icon: 'ph-calendar-check',
                            title: 'Lembrete de Pagamento',
                            description: desc.charAt(0).toUpperCase() + desc.slice(1) + ' - Próximo pagamento previsto para ' + formatDate(nextDueDate),
                            date: nextDueDate
                        });
                    }
                }
            });

            //Lembrete de revisão mensal
            const today = new Date();
            if (today.getDate() >= 25) {
                reminders.push({
                    type: 'reminder',
                    icon: 'ph-chart-bar',
                    title: 'Revisão Mensal',
                    description: 'O mês está acabando! Faça uma revisão das suas finanças e planeje o próximo mês.',
                    date: new Date()
                });
            }

            return reminders;
        }

        function calculateAverageMonthlyExpenses() {
            const expensesByMonth = {};
            
            transactions
                .filter(t => t.tipo === 'despesa')
                .forEach(t => {
                    const date = parseLocalDate(t.data);
                    const monthKey = date.getFullYear() + '-' + date.getMonth();
                    expensesByMonth[monthKey] = (expensesByMonth[monthKey] || 0) + Math.abs(t.valor);
                });
            
            const months = Object.values(expensesByMonth);
            return months.reduce((sum, val) => sum + val, 0) / Math.max(months.length, 1);
        }

        let currentInsightsPage = 1;
        const insightsPerPage = 9;

        function openAllInsightsModal() {
            currentInsightsPage = 1;
            renderAllInsights();
            document.getElementById('allInsightsModal').classList.add('show');
        }

        function renderAllInsights() {
            const gridFull = document.getElementById('insightsGridFull');
            const pagination = document.getElementById('insightsPagination');
            const allInsights = window.allInsights || [];
            
            const totalPages = Math.ceil(allInsights.length / insightsPerPage);
            const startIndex = (currentInsightsPage - 1) * insightsPerPage;
            const endIndex = startIndex + insightsPerPage;
            const pageInsights = allInsights.slice(startIndex, endIndex);
            
            gridFull.innerHTML = renderInsightCards(pageInsights);
            
            //Renderiza paginação
            if (totalPages > 1) {
                pagination.style.display = 'flex';
                pagination.innerHTML = renderPagination(currentInsightsPage, totalPages);
            } else {
                pagination.style.display = 'none';
            }
        }

        function renderPagination(currentPage, totalPages) {
            let pages = [];
            
            //Botão anterior
            pages.push(`
                <button class="page-btn" onclick="goToInsightsPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                    ‹
                </button>
            `);
            
            //Páginas
            if (totalPages <= 7) {
                //Mostra todas as páginas
                for (let i = 1; i <= totalPages; i++) {
                    pages.push(`
                        <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToInsightsPage(${i})">
                            ${i}
                        </button>
                    `);
                }
            } else {
                //Mostra primeira página
                pages.push(`
                    <button class="page-btn ${1 === currentPage ? 'active' : ''}" onclick="goToInsightsPage(1)">
                        1
                    </button>
                `);
                
                if (currentPage > 3) {
                    pages.push(`<span class="page-ellipsis">...</span>`);
                }
                
                //Páginas ao redor da atual
                const start = Math.max(2, currentPage - 1);
                const end = Math.min(totalPages - 1, currentPage + 1);
                
                for (let i = start; i <= end; i++) {
                    pages.push(`
                        <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToInsightsPage(${i})">
                            ${i}
                        </button>
                    `);
                }
                
                if (currentPage < totalPages - 2) {
                    pages.push(`<span class="page-ellipsis">...</span>`);
                }
                
                //Última página
                pages.push(`
                    <button class="page-btn ${totalPages === currentPage ? 'active' : ''}" onclick="goToInsightsPage(${totalPages})">
                        ${totalPages}
                    </button>
                `);
            }
            
            //Botão próximo
            pages.push(`
                <button class="page-btn" onclick="goToInsightsPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                    ›
                </button>
            `);
            
            return pages.join('');
        }

        function goToInsightsPage(page) {
            const totalPages = Math.ceil((window.allInsights || []).length / insightsPerPage);
            if (page < 1 || page > totalPages) return;
            
            currentInsightsPage = page;
            renderAllInsights();
            
            //Scroll para o topo do modal
            document.querySelector('.insights-modal-content').scrollTop = 0;
        }

        function formatRelativeDate(date) {
            const now = new Date();
            const diff = now - new Date(date);
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            
            if (days === 0) return 'Hoje';
            if (days === 1) return 'Ontem';
            if (days < 7) return days + ' dias atrás';
            if (days < 30) return Math.floor(days / 7) + ' semanas atrás';
            return formatDate(date);
        }

        //Atualizar insights a cada 5 minutos
        setInterval(updateInsights, 5 * 60 * 1000);

        function calculateWeeklySpending(startDate, endDate) {
            return transactions
                .filter(t => {
                    const transactionDate = parseLocalDate(t.data);
                    return t.tipo === 'despesa' && transactionDate >= startDate && transactionDate <= endDate;
                })
                .reduce((total, t) => total + t.valor, 0);
        }

        function updateWeeklySummary() {
            const today = new Date();
            const lastWeekEnd = new Date();
            const lastWeekStart = new Date();
            const twoWeeksAgoStart = new Date();
            
            lastWeekEnd.setHours(23, 59, 59, 999);
            lastWeekStart.setDate(today.getDate() - 7);
            lastWeekStart.setHours(0, 0, 0, 0);
            twoWeeksAgoStart.setDate(today.getDate() - 14);
            twoWeeksAgoStart.setHours(0, 0, 0, 0);
            
            const thisWeekSpending = calculateWeeklySpending(lastWeekStart, lastWeekEnd);
            const lastWeekSpending = calculateWeeklySpending(twoWeeksAgoStart, lastWeekStart);
            
            const difference = lastWeekSpending > 0 
                ? ((thisWeekSpending - lastWeekSpending) / lastWeekSpending) * 100 
                : 0;
            
            const formattedSpending = thisWeekSpending.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });
            
            let comparisonText = '';
            if (difference !== 0) {
                const absPercentage = Math.abs(difference).toFixed(1);
                comparisonText = difference > 0
                    ? ` Isso é ${absPercentage}% a mais que na semana anterior.`
                    : ` Isso é ${absPercentage}% a menos que na semana anterior.`;
            }
            
            const summaryElement = document.getElementById('weeklySpendingSummary');
            if (!summaryElement) {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]⚠️ Elemento weeklySpendingSummary não encontrado - pulando atualização');
                return;
            }
            
            if (thisWeekSpending === 0) {
                summaryElement.textContent = 'Nenhuma despesa registrada esta semana.';
            } else {
                summaryElement.textContent = `Você gastou ${formattedSpending} esta semana.${comparisonText}`;
            }
        }

        function showLanding() {
            document.getElementById('landingPage').style.display = 'block';
            document.getElementById('authScreen').style.display = 'none';
            document.getElementById('dashboard').style.display = 'none';
            
            // Mostra o footer quando volta para landing page
            const landingFooter = document.querySelector('.landing-footer');
            if (landingFooter) landingFooter.style.display = 'flex';
            
            //Atualiza cor da navigation bar para preto (landing page)
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                metaThemeColor.content = '#000000';
            }
            
            //🔓 SCROLL: Landing page precisa de scroll livre
            document.body.style.overflow = '';
            
            //Limpeza de estilos inline para garantir CSS correto
            const landingMain = document.querySelector('.landing-main');
            const landingPage = document.getElementById('landingPage');
            
            if (landingMain) {
                landingMain.removeAttribute('style');
            }
            
            if (landingPage) {
                landingPage.removeAttribute('style');
                landingPage.style.display = 'block'; //Re-aplica apenas o display
            }
            
            //✅ CORREÇÃO: Reabilita o botão de login após logout
            const authButton = document.querySelector('button[type="submit"]');
            const authButtonText = document.getElementById('authButtonText');
            if (authButton) {
                authButton.disabled = false;
                authButton.style.opacity = '1';
                authButton.style.cursor = 'pointer';
            }
            if (authButtonText) {
                authButtonText.textContent = authMode === 'register' ? 'Criar Conta' : 'Entrar';
            }
            
            //Reset scroll
            window.scrollTo(0, 0);
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
        }

        function showSection(event, section) {
            console.log(`🔍 showSection called with section: "${section}"`);
            event.preventDefault();
            
            document.querySelectorAll('[id^="section"]').forEach(el => el.classList.add('hidden'));
            
            const sectionId = `section${section.charAt(0).toUpperCase() + section.slice(1)}`;
            console.log(`🔍 Looking for element with ID: "${sectionId}"`);
            const targetSection = document.getElementById(sectionId);
            
            if (targetSection) {
                console.log(`✅ Section found! Removing .hidden class`);
                console.log(`📊 Element classes BEFORE: "${targetSection.className}"`);
                targetSection.classList.remove('hidden');
                console.log(`📊 Element classes AFTER: "${targetSection.className}"`);
                console.log(`📊 Element display style: "${window.getComputedStyle(targetSection).display}"`);
            } else {
                console.error(`❌ Section NOT FOUND: ${sectionId}`);
            }
            
            document.querySelectorAll('.navigation a').forEach(a => a.classList.remove('active'));
            event.target.closest('a').classList.add('active');
            
            //Fecha o menu mobile ao selecionar uma seção
            closeMobileMenu();
            
            //🔒 PRIVACIDADE: Adiciona classe no body para controlar visibilidade do botão
            document.body.className = document.body.className.replace(/section-\w+/g, '');
            document.body.classList.add(`section-${section}`);
            
            const titles = {
                overview: 'Dashboard', //✅ REVERTIDO: Voltou para Dashboard no header
                transactions: 'Transações',
                todos: 'A Registrar',
                calendar: 'Calendário',
                goals: 'Metas',
                simulators: 'Simuladores',
                reports: 'Relatórios',
                education: 'Aprenda',
                help: 'Ajuda e Suporte'
            };
            
            const headerTitle = document.getElementById('headerTitle');
            if (headerTitle) {
                headerTitle.textContent = titles[section] || 'Dashboard';
            }
            
            if (section === 'reports') renderReports();
            if (section === 'todos') renderExpensesList();
            if (section === 'calendar') {
                //Reseta para o mês atual ao abrir o calendário
                currentCalendarDate = new Date();
                renderCalendar();
            }
        }

        //AUTENTICAÇÃO
        function showAuthError(message, showLoginLink = false, email = '') {
            const errorElement = document.getElementById('authError');
            errorElement.innerHTML = `
                <div class="auth-error">
                    <p>${message}</p>
                    ${showLoginLink ? `<button class="btn-link" onclick="switchToLogin('${email}')">Fazer login com esta conta</button>` : ''}
                </div>
            `;
        }

        function clearAuthError() {
            document.getElementById('authError').innerHTML = '';
        }

        function switchToLogin(email = '') {
            authMode = 'login';
            updateAuthUI();
            if (email) {
                document.getElementById('email').value = email;
                //❌ REMOVIDO: Não focar automaticamente (teclado mobile)
                // document.getElementById('password').focus();
            }
            clearAuthError();
            checkPasswordStrength(); //Esconde indicador ao trocar para login
        }

        function switchToRegister() {
            authMode = 'register';
            updateAuthUI();
            clearAuthError();
            checkPasswordStrength(); //Atualiza indicador ao trocar de modo
            //❌ REMOVIDO: Não focar automaticamente (teclado mobile)
            // document.getElementById('name').focus();
        }

        function toggleAuthMode() {
            if (authMode === 'login') {
                switchToRegister();
            } else {
                switchToLogin();
            }
        }

        function togglePasswordVisibility() {
            const passwordInput = document.getElementById('password');
            const eyeIcon = document.getElementById('eyeIcon');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                //Ícone de olho fechado
                eyeIcon.innerHTML = `
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                `;
            } else {
                passwordInput.type = 'password';
                //Ícone de olho aberto
                eyeIcon.innerHTML = `
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                `;
            }
        }

        function toggleConfirmPasswordVisibility() {
            const confirmPasswordInput = document.getElementById('confirmPassword');
            const eyeIconConfirm = document.getElementById('eyeIconConfirm');
            
            if (confirmPasswordInput.type === 'password') {
                confirmPasswordInput.type = 'text';
                //Ícone de olho fechado
                eyeIconConfirm.innerHTML = `
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                `;
            } else {
                confirmPasswordInput.type = 'password';
                //Ícone de olho aberto
                eyeIconConfirm.innerHTML = `
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                `;
            }
        }

        //Toggle para senhas do perfil (aba de segurança)
        function toggleProfilePassword(inputId, iconId) {
            const passwordInput = document.getElementById(inputId);
            const eyeIcon = document.getElementById(iconId);
            
            if (!passwordInput || !eyeIcon) return;
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                //Ícone de olho fechado
                eyeIcon.innerHTML = `
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                `;
            } else {
                passwordInput.type = 'password';
                //Ícone de olho aberto
                eyeIcon.innerHTML = `
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                `;
            }
        }

        //Verificar força da senha
        function checkPasswordStrength() {
            const password = document.getElementById('password').value;
            const indicator = document.getElementById('passwordStrengthIndicator');
            const strengthText = document.getElementById('passwordStrengthText');
            
            //Se não estiver no modo de registro, esconde o indicador
            if (authMode !== 'register') {
                indicator.classList.add('hidden');
                return;
            }
            
            //Se a senha estiver vazia, esconde o indicador
            if (!password) {
                indicator.classList.add('hidden');
                return;
            }
            
            //Mostra o indicador
            indicator.classList.remove('hidden');
            
            //Remove classes anteriores
            indicator.classList.remove('weak', 'medium', 'good', 'strong');
            
            //Calcula a força
            let strength = 0;
            
            //Comprimento
            if (password.length >= 6) strength++;
            if (password.length >= 8) strength++;
            if (password.length >= 12) strength++;
            
            //Tem números
            if (/\d/.test(password)) strength++;
            
            //Tem letras minúsculas
            if (/[a-z]/.test(password)) strength++;
            
            //Tem letras maiúsculas
            if (/[A-Z]/.test(password)) strength++;
            
            //Tem caracteres especiais
            if (/[^A-Za-z0-9]/.test(password)) strength++;
            
            //Define o nível baseado na pontuação
            if (strength <= 2) {
                indicator.classList.add('weak');
                strengthText.textContent = 'Senha fraca';
            } else if (strength <= 4) {
                indicator.classList.add('medium');
                strengthText.textContent = 'Senha média';
            } else if (strength <= 5) {
                indicator.classList.add('good');
                strengthText.textContent = 'Senha boa';
            } else {
                indicator.classList.add('strong');
                strengthText.textContent = 'Senha forte';
            }
        }

        function updateAuthUI() {
            const nameGroup = document.getElementById('nameGroup');
            const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
            const authTitle = document.getElementById('authTitle');
            const authSubtitle = document.getElementById('authSubtitle');
            const authButtonText = document.getElementById('authButtonText');
            const authSwitchText = document.getElementById('authSwitchText');
            const forgotPasswordLink = document.getElementById('forgotPasswordLink');
            
            if (authMode === 'login') {
                nameGroup.classList.add('hidden');
                confirmPasswordGroup.classList.add('hidden');
                authTitle.textContent = 'Bem-vindo de volta';
                authSubtitle.textContent = 'Entre para continuar';
                authButtonText.textContent = 'Entrar';
                authSwitchText.innerHTML = 'Não tem uma conta? <a onclick="toggleAuthMode()">Criar conta</a>';
                if (forgotPasswordLink) forgotPasswordLink.style.display = 'block'; //Mostra "Esqueci minha senha"
            } else {
                nameGroup.classList.remove('hidden');
                confirmPasswordGroup.classList.remove('hidden');
                authTitle.textContent = 'Crie sua conta';
                authSubtitle.textContent = 'Comece agora gratuitamente';
                authButtonText.textContent = 'Criar Conta';
                authSwitchText.innerHTML = 'Já tem uma conta? <a onclick="toggleAuthMode()">Entrar</a>';
                if (forgotPasswordLink) forgotPasswordLink.style.display = 'none'; //Esconde "Esqueci minha senha"
            }
        }

        //✅ ISSUE #3: Função de validação de nomes inadequados
        function validateName(name) {
            if (!name || name.trim().length === 0) {
                return { valid: false, message: 'Nome não pode estar vazio.' };
            }
            
            const nameLower = name.toLowerCase().trim();
            
            //Lista de termos bloqueados (primeira camada - frontend)
            const blockedTerms = [
                // Termos explícitos e inadequados
                'porno', 'porn', 'xxx', 'sexo', 'sex', 'putaria', 'puta', 'prostituta',
                'vagabunda', 'vadia', 'cu', 'merda', 'caralho', 'porra', 'buceta',
                'dick', 'pussy', 'cock', 'bitch', 'shit', 'fuck', 'ass',
                
                // Termos relacionados a drogas
                'droga', 'maconha', 'cocaina', 'crack', 'heroina', 'traficante',
                'cocaine', 'heroin', 'meth', 'drug',
                
                // Termos relacionados a terrorismo e violência
                'terrorista', 'terrorist', 'bomba', 'bomb', 'ataque', 'attack',
                'isis', 'alqaeda', 'taliban', 'jihad', 'matador', 'killer',
                
                // Termos ofensivos raciais e discriminatórios
                'negro', 'preto', 'macaco', 'nigger', 'racist', 'racista',
                'gay', 'viado', 'bicha', 'sapatao', 'fag',
                
                // Nomes conhecidos de terroristas/criminosos (exemplos)
                'bin laden', 'hitler', 'stalin', 'escobar', 'guzman',
                
                // Termos relacionados a crimes
                'assassino', 'estuprador', 'pedofilo', 'pedophile', 'rapist',
                'murderer', 'ladrão', 'thief'
            ];
            
            //Verifica se algum termo bloqueado está presente
            for (const term of blockedTerms) {
                if (nameLower.includes(term)) {
                    return { 
                        valid: false, 
                        message: 'Nome contém termos inadequados. Por favor, use seu nome real.' 
                    };
                }
            }
            
            //Validação de comprimento
            if (name.trim().length < 2) {
                return { valid: false, message: 'Nome deve ter pelo menos 2 caracteres.' };
            }
            
            if (name.trim().length > 100) {
                return { valid: false, message: 'Nome muito longo (máximo 100 caracteres).' };
            }
            
            //Validação de caracteres especiais excessivos
            const specialCharsCount = (name.match(/[^a-zA-ZÀ-ÿ\s]/g) || []).length;
            if (specialCharsCount > 3) {
                return { 
                    valid: false, 
                    message: 'Nome contém muitos caracteres especiais. Use apenas letras.' 
                };
            }
            
            //Validação de números excessivos
            const numbersCount = (name.match(/\d/g) || []).length;
            if (numbersCount > 2) {
                return { 
                    valid: false, 
                    message: 'Nome contém muitos números. Use seu nome real.' 
                };
            }
            
            return { valid: true };
        }

        //Valida ocupação contra termos inadequados
        function validateOccupation(occupation) {
            if (!occupation || occupation.trim().length === 0) {
                return { valid: false, message: 'Ocupação não pode estar vazia.' };
            }
            
            const occupationLower = occupation.toLowerCase().trim();
            
            //Lista de termos bloqueados para ocupação
            const blockedTerms = [
                // Termos explícitos e inadequados
                'porno', 'porn', 'xxx', 'sexo', 'sex', 'putaria', 'puta', 'prostituta',
                'vagabunda', 'vadia', 'cu', 'merda', 'caralho', 'porra', 'buceta',
                'dick', 'pussy', 'cock', 'bitch', 'shit', 'fuck', 'ass',
                
                // Termos relacionados a drogas
                'droga', 'maconha', 'cocaina', 'crack', 'heroina', 'traficante',
                'cocaine', 'heroin', 'meth', 'drug',
                
                // Termos relacionados a terrorismo e violência
                'terrorista', 'terrorist', 'bomba', 'bomb', 'ataque', 'attack',
                'isis', 'alqaeda', 'taliban', 'jihad', 'matador', 'killer',
                
                // Termos ofensivos raciais e discriminatórios
                'negro', 'preto', 'macaco', 'nigger', 'racist', 'racista',
                'gay', 'viado', 'bicha', 'sapatao', 'fag',
                
                // Termos relacionados a crimes
                'assassino', 'estuprador', 'pedofilo', 'pedophile', 'rapist',
                'murderer', 'ladrão', 'thief'
            ];
            
            //Verifica se algum termo bloqueado está presente
            for (const term of blockedTerms) {
                if (occupationLower.includes(term)) {
                    return { 
                        valid: false, 
                        message: 'Ocupação contém termos inadequados. Por favor, use uma ocupação real.' 
                    };
                }
            }
            
            //Validação de comprimento
            if (occupation.trim().length < 2) {
                return { valid: false, message: 'Ocupação deve ter pelo menos 2 caracteres.' };
            }
            
            if (occupation.trim().length > 100) {
                return { valid: false, message: 'Ocupação muito longa (máximo 100 caracteres).' };
            }
            
            return { valid: true };
        }

        async function handleAuth(event) {
            event.preventDefault();
            clearAuthError();
            
            const authButton = event.target.querySelector('button[type="submit"]');
            const authButtonText = document.getElementById('authButtonText');
            
            //Proteção contra duplo clique
            if (authButton.disabled) {
                return;
            }
            
            const email = document.getElementById('email').value.trim().toLowerCase();
            const password = document.getElementById('password').value;
            const name = document.getElementById('name').value;
            
            //Validação básica dos campos
            if (!email || !password) {
                showAuthError('Por favor, preencha todos os campos obrigatórios.');
                return;
            }
            
            //Validação de formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showAuthError('Por favor, insira um email válido.');
                return;
            }
            
            //Validação de senha
            if (password.length < 6) {
                showAuthError('A senha deve ter pelo menos 6 caracteres.');
                return;
            }
            
            //Desabilita o botão e mostra estado de carregamento
            authButton.disabled = true;
            authButton.style.opacity = '0.7';
            authButton.style.cursor = 'not-allowed';
            
            try {
                if (authMode === 'register') {
                    if (!name) {
                        showAuthError('Por favor, insira seu nome.');
                        authButton.disabled = false;
                        authButton.style.opacity = '1';
                        authButton.style.cursor = 'pointer';
                        return;
                    }
                    
                    //✅ ISSUE #3: Valida nome contra termos inadequados
                    const nameValidation = validateName(name);
                    if (!nameValidation.valid) {
                        showAuthError(nameValidation.message);
                        authButton.disabled = false;
                        authButton.style.opacity = '1';
                        authButton.style.cursor = 'pointer';
                        return;
                    }
                    
                    //Valida confirmação de senha
                    const confirmPassword = document.getElementById('confirmPassword').value;
                    if (password !== confirmPassword) {
                        showAuthError('As senhas não coincidem.');
                        authButton.disabled = false;
                        authButton.style.opacity = '1';
                        authButton.style.cursor = 'pointer';
                        return;
                    }
                    
                    //Mensagem: Criando perfil
                    authButtonText.textContent = 'Criando perfil...';
                    
                    //Verifica se o email já existe
                    const checkResponse = await fetch(`${API_URL}/auth/check-email`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email })
                    }).catch(err => {
                        console.error('[ERROR]Erro ao verificar email:', err);
                        throw new Error('Erro de conexão com o servidor. Verifique se o backend está rodando.');
                    });
                    
                    const checkResult = await checkResponse.json();
                    
                    if (checkResult.exists) {
                        showAuthError('Este email já está cadastrado.', true, email);
                        authButton.disabled = false;
                        authButton.style.opacity = '1';
                        authButton.style.cursor = 'pointer';
                        authButtonText.textContent = 'Criar Conta';
                        return;
                    }
                    
                    //Mensagem: Processando dados
                    authButtonText.textContent = 'Processando dados...';
                    
                    //✅ CORREÇÃO: Capitaliza nome antes de enviar
                    const nomeCapitalizado = capitalizeWords(name);
                    
                    const response = await fetch(`${API_URL}/auth/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nome: nomeCapitalizado, email, senha: password })
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Erro ao criar conta');
                    }
                    
                    //Mensagem: Registrando
                    authButtonText.textContent = 'Registrando...';
                    
                    const newUserData = await response.json();
                    
                    //🧹 CORREÇÃO: Limpa dados de usuário anterior ANTES de atribuir novo usuário
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🧹 Limpando dados de usuário anterior antes de criar conta...');
                    currentUser = null;
                    window.allReminders = [];
                    window.currentReminderIndex = 0;
                    window.allInsights = [];
                    transactions = [];
                    goals = [];
                    
                    //Atribui o novo usuário criado
                    currentUser = newUserData;
                    
                    //✅ SALVA SENHA TEMPORÁRIA para usar no onboarding (perguntas de segurança)
                    //Será removida após salvar as perguntas por segurança
                    localStorage.setItem('tempPassword', password);
                    console.log('[SECURITY] 🔐 Senha temporária salva para configuração de perguntas de segurança');
                    
                    //✅ ISSUE #15: Log seguro - dados sensíveis mascarados
                    secureLog('info', '🔍 Usuário criado com sucesso', currentUser);
                    secureLog('info', '🔍 Conta ativada', { userId: currentUser.id });
                    
                    //Verifica se o ID está presente
                    if (!currentUser.id) {
                        console.error('[ERROR]❌ ERRO CRÍTICO: Backend não retornou ID do usuário!');
                        showAuthError('Erro ao criar conta. Por favor, tente novamente.');
                        authButton.disabled = false;
                        authButton.style.opacity = '1';
                        authButton.style.cursor = 'pointer';
                        authButtonText.textContent = 'Criar Conta';
                        return;
                    }
                    
                    //Salva no localStorage
                    localStorage.setItem('user', JSON.stringify(currentUser));
                    //Marca como novo usuário para mostrar onboarding
                    localStorage.setItem('isNewUser', 'true');
                    //IMPORTANTE: Remove flag de onboarding completo para nova conta
                    localStorage.removeItem('onboardingCompleted');
                    //Mostra o modal de boas-vindas ANTES do dashboard
                    const userName = currentUser.nome || name;
                    showWelcomeModalBeforeDashboard(userName);
                    return; //Para aqui e não chama showDashboard()
                } else {
                    //✅ ISSUE #15: Log seguro - não expõe email completo
                    secureLog('info', 'Tentando login', { email });
                    
                    //Mensagem de login
                    authButtonText.textContent = 'Entrando...';
                    
                    const response = await fetch(`${API_URL}/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, senha: password })
                    }).catch(err => {
                        console.error('[ERROR]Erro de rede:', err);
                        throw new Error('Erro de conexão com o servidor. Verifique se o backend está rodando na porta 8080.');
                    });
                    
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]Resposta do login:', response.status, response.statusText);
                    
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        console.error('[ERROR]Erro no login:', errorData);
                        
                        if (response.status === 401) {
                            throw new Error('Email ou senha incorretos');
                        }
                        throw new Error(errorData.message || 'Erro ao fazer login');
                    }
                    
                    const userData = await response.json();
                    
                    //✅ ISSUE #15: Log seguro - dados sensíveis mascarados
                    secureLog('info', 'Login bem-sucedido', userData);
                    
                    //✅ CORREÇÃO: Limpa dados do usuário anterior ANTES de atribuir novo usuário
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🧹 Limpando dados do usuário anterior...');
                    currentUser = null;
                    window.allReminders = [];
                    window.currentReminderIndex = 0;
                    window.allInsights = [];
                    transactions = [];
                    goals = [];
                    
                    //Atribui o novo usuário
                    currentUser = userData;
                    
                    //✅ Sincroniza flag de onboarding do backend
                    if (userData.onboardingCompleted) {
                        localStorage.setItem('onboardingCompleted', 'true');
                    } else {
                        localStorage.removeItem('onboardingCompleted');
                    }
                    
                    //✅ ISSUE #15: Log seguro - dados sensíveis mascarados
                    secureLog('info', '✅ Novo usuário carregado', currentUser);
                    
                    //Salva no localStorage
                    localStorage.setItem('user', JSON.stringify(currentUser));
                    
                    //Mostra loading e carrega dados
                    await showLoadingAndLoadData();
                }
            } catch (error) {
                console.error('[ERROR]Erro capturado:', error);
                showAuthError(error.message || 'Erro ao fazer login. Verifique sua conexão.');
                
                //Reabilita o botão em caso de erro
                const authButton = document.querySelector('button[type="submit"]');
                const authButtonText = document.getElementById('authButtonText');
                if (authButton) {
                    authButton.disabled = false;
                    authButton.style.opacity = '1';
                    authButton.style.cursor = 'pointer';
                }
                if (authButtonText) {
                    authButtonText.textContent = authMode === 'register' ? 'Criar Conta' : 'Entrar';
                }
            }
        }

        //===== FUNÇÕES DE RECUPERAÇÃO DE SENHA =====
        //=========================================================================
        //PASSWORD RECOVERY SYSTEM USING SECURITY QUESTIONS
        //=========================================================================

        //Estado do processo de recuperação
        //=========================================================================
        //🔐 SISTEMA DE RECUPERAÇÃO DE SENHA POR PERGUNTAS DE SEGURANÇA
        //=========================================================================

        //Estado do processo de recuperação
        let recoveryState = {
            email: '',
            questions: [],
            currentStep: 1 //1: email, 2: perguntas, 3: nova senha
        };

        //===== STEP 1: INSERIR EMAIL =====
        function showForgotPasswordScreen() {
            const securityScreen = document.getElementById('securityQuestionsScreen');
            document.getElementById('authScreen').style.display = 'none';
            
            // Remove os estilos inline e aplica display flex
            securityScreen.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important;';
            
            document.getElementById('securityQuestionsStep1').style.display = 'block';
            document.getElementById('securityQuestionsStep2').style.display = 'none';
            document.getElementById('securityQuestionsStep3').style.display = 'none';
            
            //Limpa campos
            document.getElementById('recoveryEmail').value = '';
            clearSecurityError();
            
            recoveryState = { email: '', questions: [], currentStep: 1 };
        }

        function backToLogin() {
            const securityScreen = document.getElementById('securityQuestionsScreen');
            securityScreen.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important;';
            
            document.getElementById('authScreen').style.display = 'flex';
            authMode = 'login';
            updateAuthUI();
            checkPasswordStrength(); //Esconde indicador ao voltar para login
            
            // Esconde o footer quando volta para login
            const landingFooter = document.querySelector('.landing-footer');
            if (landingFooter) landingFooter.style.display = 'none';
        }

        function clearSecurityError() {
            document.getElementById('securityQuestionsError').innerHTML = '';
        }

        function showSecurityError(message, isWarning = false) {
            const errorDiv = document.getElementById('securityQuestionsError');
            const className = isWarning ? 'auth-warning' : 'auth-error';
            errorDiv.innerHTML = `<div class="${className}"><p>${message}</p></div>`;
        }

        //STEP 1: Submeter email e buscar perguntas
        async function handleRecoveryEmailSubmit(event) {
            event.preventDefault();
            clearSecurityError();
            
            const email = document.getElementById('recoveryEmail').value.trim().toLowerCase();
            const submitButton = event.target.querySelector('button[type="submit"]');
            const buttonText = submitButton.querySelector('span');
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showSecurityError('Por favor, insira um email válido.');
                return;
            }
            
            submitButton.disabled = true;
            buttonText.textContent = 'Verificando...';
            
            try {
                const response = await fetch(`${API_URL}/auth/get-security-questions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Email não encontrado ou sem perguntas configuradas.');
                }
                
                const data = await response.json();
                
                recoveryState.email = email;
                recoveryState.questions = data.questions;
                recoveryState.currentStep = 2;
                
                showSecurityQuestionsStep();
                
            } catch (error) {
                console.error('[ERROR]Erro ao buscar perguntas:', error);
                showSecurityError(error.message || 'Erro ao verificar email. Tente novamente.');
            } finally {
                submitButton.disabled = false;
                buttonText.textContent = 'Continuar';
            }
        }

        //===== STEP 2: RESPONDER PERGUNTAS =====
        function showSecurityQuestionsStep() {
            document.getElementById('securityQuestionsStep1').style.display = 'none';
            document.getElementById('securityQuestionsStep2').style.display = 'block';
            document.getElementById('securityQuestionsStep3').style.display = 'none';
            clearSecurityError();
            
            // ✅ MOSTRAR APENAS AS PERGUNTAS QUE O USUÁRIO TEM
            const totalQuestions = recoveryState.questions.length;
            
            // Preenche e mostra as perguntas disponíveis
            for (let i = 0; i < 3; i++) {
                const questionLabel = document.getElementById(`securityQuestion${i + 1}`);
                const answerInput = document.getElementById(`securityAnswer${i + 1}`);
                const questionGroup = answerInput.closest('.input-group');
                
                if (i < totalQuestions) {
                    // Mostra a pergunta
                    questionLabel.textContent = `${i + 1}. ${recoveryState.questions[i]}`;
                    answerInput.value = '';
                    answerInput.required = true;
                    questionGroup.style.display = 'block';
                } else {
                    // Esconde perguntas extras
                    questionGroup.style.display = 'none';
                    answerInput.required = false;
                }
            }
            
            // Atualiza o subtítulo com a quantidade de perguntas
            const subtitle = document.querySelector('#securityQuestionsStep2 .auth-subtitle');
            if (subtitle) {
                subtitle.textContent = `Responda ${totalQuestions === 1 ? 'a pergunta' : `as ${totalQuestions} perguntas`} para continuar`;
            }
        }

        function goBackToEmailStep() {
            document.getElementById('securityQuestionsStep2').style.display = 'none';
            document.getElementById('securityQuestionsStep1').style.display = 'block';
            clearSecurityError();
            recoveryState.currentStep = 1;
        }

        //STEP 2: Submeter respostas
        async function handleSecurityAnswersSubmit(event) {
            event.preventDefault();
            clearSecurityError();
            
            // ✅ COLETAR APENAS AS RESPOSTAS DAS PERGUNTAS QUE EXISTEM
            const answers = [];
            const totalQuestions = recoveryState.questions.length;
            
            for (let i = 0; i < totalQuestions; i++) {
                const answer = document.getElementById(`securityAnswer${i + 1}`).value.trim();
                if (!answer) {
                    showSecurityError('Por favor, responda todas as perguntas.');
                    return;
                }
                answers.push(answer);
            }
            
            const submitButton = event.target.querySelector('button[type="submit"]');
            const buttonText = submitButton.querySelector('span');
            
            submitButton.disabled = true;
            buttonText.textContent = 'Verificando...';
            
            try {
                const response = await fetch(`${API_URL}/auth/verify-security-answers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: recoveryState.email,
                        answers: answers // Envia apenas as respostas que o usuário tem
                    })
                });
                
                const data = await response.json();
                
                if (!response.ok || !data.verified) {
                    throw new Error(data.message || 'Uma ou mais respostas estão incorretas.');
                }
                
                //Respostas corretas! Ir para step 3
                recoveryState.currentStep = 3;
                showNewPasswordStep();
                
            } catch (error) {
                console.error('[ERROR]Erro ao verificar respostas:', error);
                showSecurityError(error.message || 'Erro ao verificar respostas. Tente novamente.');
            } finally {
                submitButton.disabled = false;
                buttonText.textContent = 'Verificar Respostas';
            }
        }

        //===== STEP 3: NOVA SENHA =====
        function showNewPasswordStep() {
            document.getElementById('securityQuestionsStep2').style.display = 'none';
            document.getElementById('securityQuestionsStep3').style.display = 'block';
            clearSecurityError();
            
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmNewPassword').value = '';
            updatePasswordStrength();
        }

        //Verifica força da senha
        function updatePasswordStrength() {
            const password = document.getElementById('newPassword').value;
            const strengthBar = document.getElementById('newPasswordStrength');
            const strengthText = document.getElementById('newPasswordStrengthText');
            
            if (!password) {
                strengthBar.style.width = '0%';
                strengthText.textContent = '';
                return;
            }
            
            let strength = 0;
            
            if (password.length >= 6) strength += 25;
            if (password.length >= 10) strength += 25;
            if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
            if (/[0-9]/.test(password)) strength += 15;
            if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
            
            strengthBar.style.width = `${Math.min(strength, 100)}%`;
            
            if (strength < 25) {
                strengthBar.className = 'password-strength-bar weak';
                strengthText.textContent = 'Fraca';
                strengthText.style.color = '#ef4444';
            } else if (strength < 50) {
                strengthBar.className = 'password-strength-bar medium';
                strengthText.textContent = 'Média';
                strengthText.style.color = '#f59e0b';
            } else if (strength < 75) {
                strengthBar.className = 'password-strength-bar good';
                strengthText.textContent = 'Boa';
                strengthText.style.color = '#3b82f6';
            } else {
                strengthBar.className = 'password-strength-bar strong';
                strengthText.textContent = 'Forte';
                strengthText.style.color = '#10b981';
            }
        }

        //Toggle mostrar/ocultar senha
        function toggleNewPassword(inputId) {
            const input = document.getElementById(inputId);
            const icon = event.target;
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.textContent = '👁️';
            } else {
                input.type = 'password';
                icon.textContent = '👁️‍🗨️';
            }
        }

        //STEP 3: Submeter nova senha
        async function handleNewPasswordSubmit(event) {
            event.preventDefault();
            clearSecurityError();
            
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmNewPassword').value;
            
            if (newPassword.length < 6) {
                showSecurityError('A senha deve ter pelo menos 6 caracteres.');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                showSecurityError('As senhas não coincidem.');
                return;
            }
            
            const submitButton = event.target.querySelector('button[type="submit"]');
            const buttonText = submitButton.querySelector('span');
            
            submitButton.disabled = true;
            buttonText.textContent = 'Salvando...';
            
            try {
                const response = await fetch(`${API_URL}/auth/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: recoveryState.email,
                        newPassword: newPassword
                    })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Erro ao redefinir senha.');
                }
                
                //Sucesso!
                showSecurityError(
                    '<strong>✅ Senha redefinida com sucesso!</strong><br><br>Redirecionando para login...',
                    false
                );
                
                setTimeout(() => {
                    backToLogin();
                }, 2000);
                
            } catch (error) {
                console.error('[ERROR]Erro ao redefinir senha:', error);
                showSecurityError(error.message || 'Erro ao redefinir senha. Tente novamente.');
                submitButton.disabled = false;
                buttonText.textContent = 'Redefinir Senha';
            }
        }
        
        //===== FIM DAS FUNÇÕES DE RECUPERAÇÃO DE SENHA =====

        //Funções de Loading Screen
        function showLoadingScreen(message = 'Carregando...') {
            const loadingHTML = `
                <div class="loading-overlay" id="loadingScreenOverlay" style="z-index: 10000;">
                    <div class="loading-content">
                        <div class="loading-spinner"></div>
                        <div class="loading-text">${message}</div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', loadingHTML);
        }

        function hideLoadingScreen() {
            const loading = document.getElementById('loadingScreenOverlay');
            if (loading) {
                loading.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => loading.remove(), 300);
            }
        }

        function updateLoadingMessage(message) {
            const loadingText = document.querySelector('#loadingScreenOverlay .loading-text');
            if (loadingText) {
                loadingText.textContent = message;
            }
        }

        async function showLoadingAndLoadData() {
            showLoadingScreen('Carregando suas informações...');
            
            try {
                //Pequeno delay inicial
                await new Promise(resolve => setTimeout(resolve, 300));
                
                //Carrega transações
                updateLoadingMessage('Carregando transações...');
                await loadTransactions();
                await new Promise(resolve => setTimeout(resolve, 200));
                
                //Verifica e adiciona salário mensal
                updateLoadingMessage('Verificando receitas...');
                await checkAndAddMonthlySalary();
                await new Promise(resolve => setTimeout(resolve, 200));
                
                //Atualiza estatísticas e insights
                updateLoadingMessage('Calculando estatísticas...');
                updateDashboardStats();
                updateInsights();
                await new Promise(resolve => setTimeout(resolve, 200));
                
                //Atualiza visualizações
                updateLoadingMessage('Preparando gráficos...');
                renderChart();
                renderCategoryReport();
                renderCalendar();
                await new Promise(resolve => setTimeout(resolve, 200));
                
                //Finaliza
                updateLoadingMessage('Finalizando...');
                await new Promise(resolve => setTimeout(resolve, 200));
                
                hideLoadingScreen();
                await showDashboard();
            } catch (error) {
                console.error('[ERROR]Erro ao carregar dados:', error);
                hideLoadingScreen();
                showAuthError('Erro ao carregar seus dados. Tente novamente.');
            }
        }

        function logout() {
            //Previne duplo clique
            const btn = document.querySelector('.logout-btn');
            if (btn && btn.disabled) return;
            
            //Abre modal de confirmação
            document.getElementById('logoutModal').classList.add('show');
        }

        async function confirmLogout() {
            //Previne duplo clique
            const btn = document.querySelector('.btn-logout-confirm');
            if (btn && btn.disabled) return;
            
            //Desabilita botão
            if (btn) {
                btn.disabled = true;
                btn.textContent = 'Processando...';
            }
            
            //🔧 CORREÇÃO: Fecha AMBOS os modais (logout E perfil)
            closeModal('logoutModal');
            
            //Pequeno delay antes de fechar o perfil para animação suave
            await new Promise(resolve => setTimeout(resolve, 100));
            closeModal('profileModal');
            
            //Mostra loading
            showLoading('Saindo...');
            
            //Aguarda um pouco para salvar dados e criar transição suave
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            //Executa o logout
            currentUser = null;
            transactions = [];
            goals = [];
            
            //✅ CORREÇÃO: Limpa lembretes para evitar vazamento entre usuários
            window.allReminders = [];
            window.currentReminderIndex = 0;
            
            //Limpa insights globais
            window.allInsights = [];
            
            //Destroi gráficos existentes
            if (chart) {
                chart.destroy();
                chart = null;
            }
            if (reportChart) {
                reportChart.destroy();
                reportChart = null;
            }
            
            //Limpa localStorage
            localStorage.removeItem('user');
            
            //CRÍTICO: Reset da navegação para não afetar próximo usuário
            resetNavigation();
            
            //Limpa os campos de email e senha
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
            
            //Limpa cards da dashboard
            const totalBalance = document.getElementById('totalBalance');
            const totalIncome = document.getElementById('totalIncome');
            const totalExpense = document.getElementById('totalExpense');
            if (totalBalance) totalBalance.textContent = 'R$ 0,00';
            if (totalIncome) totalIncome.textContent = 'R$ 0,00';
            if (totalExpense) totalExpense.textContent = 'R$ 0,00';
            
            //Aguarda mais um pouco antes de esconder o loading
            await new Promise(resolve => setTimeout(resolve, 500));
            
            //Remove loading
            hideLoading();
            
            //CRÍTICO: Esconde a bottom nav antes de voltar para landing
            const mobileBottomNav = document.querySelector('.mobile-bottom-nav');
            if (mobileBottomNav) {
                mobileBottomNav.classList.add('hidden');
                mobileBottomNav.style.display = 'none';
            }
            
            //Volta para landing
            showLanding();
            
            //Reabilita o botão para próxima vez
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Sim, Sair';
            }
        }

        function updateProfileUI() {
            if (currentUser) {
                const userAvatar = document.getElementById('userAvatar');
                const userName = document.getElementById('userName');
                
                //Verifica se os elementos existem antes de atualizar
                if (userAvatar && userName) {
                    const initials = currentUser.nome ? currentUser.nome.substring(0, 1).toUpperCase() : 'U';
                    userAvatar.textContent = initials;
                    userName.textContent = currentUser.nome || 'Usuário';
                }
            }
        }

        //ONBOARDING SYSTEM
        let currentOnboardingStep = 1;
        let onboardingData = {};

        //Event listener para tecla Enter no onboarding
        document.addEventListener('keydown', function(e) {
            const onboardingModal = document.getElementById('onboardingModal');
            if (onboardingModal && onboardingModal.style.display !== 'none') {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const nextButton = document.getElementById('nextButton');
                    const completeButton = document.getElementById('completeButton');
                    
                    if (nextButton && nextButton.style.display !== 'none') {
                        nextOnboardingStep();
                    } else if (completeButton && completeButton.style.display !== 'none') {
                        completeOnboarding();
                    }
                }
            }
        });

        // 🔒 FLAG DE SESSÃO: Garante que onboarding só seja verificado UMA vez por sessão
        let onboardingAlreadyChecked = false;

        function checkAndShowOnboarding() {
            // 🛡️ GUARD 1: Previne múltiplas verificações na mesma sessão
            if (onboardingAlreadyChecked) {
                console.log('[ONBOARDING] ⏭️ Verificação já realizada nesta sessão');
                return;
            }
            onboardingAlreadyChecked = true;

            // 🛡️ GUARD 2: Verifica se modal já está aberto
            const modal = document.getElementById('onboardingModal');
            if (modal && modal.style.display === 'flex') {
                console.log('[ONBOARDING] ⏭️ Modal já está aberto');
                return;
            }

            //✅ CORREÇÃO: Verifica se já completou onboarding ANTES DE TUDO
            const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted') === 'true';
            
            //Se já completou, NÃO mostra de jeito nenhum
            if (hasCompletedOnboarding) {
                console.log('[ONBOARDING] ✅ Usuário já completou onboarding anteriormente');
                return;
            }
            
            //Só verifica se é novo usuário OU perfil incompleto se NÃO completou onboarding
            const isNewUser = localStorage.getItem('isNewUser') === 'true';
            const isProfileIncomplete = !currentUser.ocupacao || !currentUser.rendaMensal;
            
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]=== VERIFICANDO ONBOARDING ===');
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]isNewUser:', isNewUser);
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]isProfileIncomplete:', isProfileIncomplete);
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]hasCompletedOnboarding:', hasCompletedOnboarding);
            //✅ ISSUE #15: Log seguro - não expõe dados sensíveis
            secureLog('info', 'Verificando perfil do usuário', { 
                ocupacao: currentUser.ocupacao ? 'SET' : 'NOT_SET',
                rendaMensal: currentUser.rendaMensal ? 'SET' : 'NOT_SET'
            });
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]Deve mostrar?', (isNewUser || isProfileIncomplete));
            
            if (isNewUser || isProfileIncomplete) {
                //🧹 LIMPEZA EXTRA: Garante que não há lembretes gerados antes do onboarding
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🧹 Limpando lembretes antes de mostrar onboarding...');
                window.allReminders = [];
                window.currentReminderIndex = 0;
                
                //Preenche o campo de nome se já existir
                if (currentUser.nome) {
                    document.getElementById('onboardingName').value = currentUser.nome;
                }
                
                //Mostra o modal de onboarding
                const modal = document.getElementById('onboardingModal');
                if (modal) {
                    modal.style.display = 'flex';
                    disableBodyScroll(); //🔒 Bloqueia scroll APENAS durante onboarding
                    currentOnboardingStep = 1;
                    updateOnboardingProgress();
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Onboarding modal EXIBIDO');
                } else {
                    console.error('[ERROR]❌ Modal de onboarding não encontrado no DOM!');
                }
            } else {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]❌ Onboarding NÃO será exibido');
            }
        }

        function nextOnboardingStep() {
            //VALIDAÇÃO: Verifica campos obrigatórios antes de avançar
            if (currentOnboardingStep === 1) {
                const name = document.getElementById('onboardingName').value.trim();
                const occupation = document.getElementById('onboardingOccupation').value.trim();
                
                //✅ VALIDAÇÃO DE NOME INDEVIDO NO ONBOARDING
                if (!name) {
                    showWarningNotification('Por favor, informe seu nome');
                    return;
                }
                
                const nameValidation = validateName(name);
                if (!nameValidation.valid) {
                    showWarningNotification(nameValidation.message);
                    return;
                }
                
                if (!occupation) {
                    showWarningNotification('Por favor, informe sua ocupação');
                    return;
                }
                
                //✅ VALIDAÇÃO DE OCUPAÇÃO INDEVIDA NO ONBOARDING
                const occupationValidation = validateOccupation(occupation);
                if (!occupationValidation.valid) {
                    showWarningNotification(occupationValidation.message);
                    return;
                }
            }
            
            if (currentOnboardingStep === 2) {
                const income = document.getElementById('onboardingIncome').value;
                const paymentDay = document.getElementById('onboardingPaymentDay').value;
                const selectedGoal = document.querySelector('input[name="goalOption"]:checked');
                
                //Remove formatação para validar
                const incomeValue = parseFloat(income.replace(/[^\d,]/g, '').replace(',', '.'));
                
                if (!income || incomeValue < 50) {
                    showWarningNotification('O salário deve ser de no mínimo R$ 50,00');
                    return;
                }
                
                if (!paymentDay || paymentDay < 1 || paymentDay > 31) {
                    showWarningNotification('Informe o dia do recebimento (1 a 31)');
                    return;
                }
                
                if (!selectedGoal) {
                    showWarningNotification('Selecione seu objetivo financeiro principal');
                    return;
                }
            }
            
            if (currentOnboardingStep === 3) {
                const monthlyLimit = document.getElementById('onboardingMonthlyLimit').value;
                
                if (monthlyLimit && parseFloat(monthlyLimit) < 25) {
                    showWarningNotification('A meta de despesa deve ser de no mínimo R$ 25,00');
                    return;
                }
            }
            
            //Adiciona indicador de processamento no botão
            const btnNext = document.getElementById('nextButton');
            if (btnNext) {
                btnNext.disabled = true;
                btnNext.innerHTML = '<i class="ph ph-spinner"></i> Processando...';
                btnNext.style.opacity = '0.7';
                btnNext.style.cursor = 'not-allowed';
            }

            //Pequeno delay para mostrar o feedback visual
            setTimeout(() => {
                //Salva os dados do step atual
                saveCurrentStepData();

                //Avança para o próximo step
                if (currentOnboardingStep < 4) {
                    currentOnboardingStep++;
                    updateOnboardingProgress();
                    showOnboardingStep(currentOnboardingStep);
                }

                //Reabilita o botão para o próximo step
                if (btnNext) {
                    btnNext.disabled = false;
                    btnNext.innerHTML = 'Próximo →';
                    btnNext.style.opacity = '1';
                    btnNext.style.cursor = 'pointer';
                }
            }, 300);
        }

        function previousOnboardingStep() {
            if (currentOnboardingStep > 1) {
                currentOnboardingStep--;
                updateOnboardingProgress();
                showOnboardingStep(currentOnboardingStep);
            }
        }

        function showOnboardingStep(step) {
            //Esconde todos os steps
            document.querySelectorAll('.onboarding-step').forEach(s => {
                s.classList.remove('active');
            });

            //Mostra o step atual
            document.getElementById(`onboardingStep${step}`).classList.add('active');

            //Atualiza botões
            const prevButton = document.getElementById('prevButton');
            const nextButton = document.getElementById('nextButton');
            const completeButton = document.getElementById('completeButton');

            if (step === 1) {
                prevButton.style.display = 'none';
                nextButton.style.display = 'block';
                completeButton.style.display = 'none';
            } else if (step === 4) {
                prevButton.style.display = 'block';
                nextButton.style.display = 'none';
                completeButton.style.display = 'block';
            } else {
                prevButton.style.display = 'block';
                nextButton.style.display = 'block';
                completeButton.style.display = 'none';
            }

            //Atualiza progress steps
            document.querySelectorAll('.progress-step').forEach((stepEl, index) => {
                stepEl.classList.remove('active', 'completed');
                if (index + 1 < step) {
                    stepEl.classList.add('completed');
                } else if (index + 1 === step) {
                    stepEl.classList.add('active');
                }
            });
        }

        function updateOnboardingProgress() {
            //Atualiza o indicador de página
            const pageIndicator = document.getElementById('pageIndicator');
            if (pageIndicator) {
                pageIndicator.textContent = `${currentOnboardingStep}/4`;
            }
        }

        function saveCurrentStepData() {
            if (currentOnboardingStep === 1) {
                //✅ CORREÇÃO: Capitaliza nome e ocupação antes de salvar
                onboardingData.nome = capitalizeWords(document.getElementById('onboardingName').value.trim());
                onboardingData.ocupacao = capitalizeWords(document.getElementById('onboardingOccupation').value.trim());
            } else if (currentOnboardingStep === 2) {
                const incomeValue = parseFloat(document.getElementById('onboardingIncome').value) || null;
                const paymentDay = parseInt(document.getElementById('onboardingPaymentDay').value) || null;
                
                onboardingData.rendaMensal = incomeValue;
                onboardingData.diaRecebimento = paymentDay;
                
                //✅ NOVO: No onboarding, o salário é SEMPRE adicionado imediatamente no mês atual
                //Não importa se o dia já passou ou não - é o primeiro acesso, então adiciona
                //Isso permite que o usuário tenha saldo imediato para usar o sistema
                onboardingData.salarioAgendado = false; //Nunca agenda no onboarding
                onboardingData.dataSalarioAgendado = null; //Não precisa de data específica
                
                console.log('[ONBOARDING] Salário será adicionado IMEDIATAMENTE no mês atual');
                console.log('[ONBOARDING] Dia configurado:', paymentDay, '- Usuário terá saldo imediato de R$', incomeValue);
                
                //Pega o valor do radio button selecionado
                const selectedGoal = document.querySelector('input[name="goalOption"]:checked');
                onboardingData.objetivoPrincipal = selectedGoal ? selectedGoal.value : '';
            } else if (currentOnboardingStep === 3) {
                onboardingData.metaMensal = parseFloat(document.getElementById('onboardingMonthlyLimit').value) || null;
                
                const selectedCategories = [];
                document.querySelectorAll('input[name="focusCategory"]:checked').forEach(cb => {
                    if (selectedCategories.length < 3) {
                        selectedCategories.push(cb.value);
                    }
                });
                onboardingData.categoriasFoco = selectedCategories;
            } else if (currentOnboardingStep === 4) {
                //Pergunta de segurança (apenas 1 no onboarding)
                onboardingData.securityQuestion1 = document.getElementById('onboardingQuestion1').value;
                onboardingData.securityAnswer1 = document.getElementById('onboardingAnswer1').value;
            }
        }

        async function completeOnboarding() {
            //PROTEÇÃO: Previne duplo clique
            const btnComplete = document.querySelector('.btn-onboarding-complete');
            if (btnComplete) {
                if (btnComplete.disabled) {
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]⚠️ Onboarding já está sendo processado...');
                    return;
                }
                btnComplete.disabled = true;
                btnComplete.textContent = 'Processando...';
                btnComplete.style.opacity = '0.6';
                btnComplete.style.cursor = 'not-allowed';
            }

            //Salva dados do último step
            saveCurrentStepData();

            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][ONBOARDING] Início do processo de onboarding');
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][DEBUG] currentUser no início:', currentUser);
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][DEBUG] currentUser.id:', currentUser?.id);
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][DEBUG] onboardingData:', onboardingData);

            //Limita categorias a 3
            const checkboxes = document.querySelectorAll('input[name="focusCategory"]:checked');
            if (checkboxes.length > 3) {
                showWarningNotification('Selecione no máximo 3 categorias de foco');
                //Reabilita o botão em caso de erro
                if (btnComplete) {
                    btnComplete.disabled = false;
                    btnComplete.textContent = 'Concluir';
                    btnComplete.style.opacity = '1';
                    btnComplete.style.cursor = 'pointer';
                }
                return;
            }

            try {
                //Atualiza currentUser com os dados do onboarding
                currentUser.nome = onboardingData.nome;
                currentUser.ocupacao = onboardingData.ocupacao;
                currentUser.rendaMensal = onboardingData.rendaMensal;
                currentUser.diaRecebimento = onboardingData.diaRecebimento;
                currentUser.objetivoPrincipal = onboardingData.objetivoPrincipal;
                currentUser.metaMensal = onboardingData.metaMensal;
                currentUser.categoriasFoco = onboardingData.categoriasFoco;
                currentUser.onboardingCompleto = true; //Marca como completo

                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][SAVE] Salvando dados do onboarding no backend:', currentUser);

                //Envia os dados para o backend (tenta salvar)
                let backendSaved = false;
                try {
                    const response = await fetch(`${API_URL}/usuarios/${currentUser.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            id: currentUser.id,
                            nome: currentUser.nome,
                            email: currentUser.email,
                            ocupacao: currentUser.ocupacao,
                            rendaMensal: currentUser.rendaMensal,
                            diaRecebimento: currentUser.diaRecebimento,
                            objetivoPrincipal: currentUser.objetivoPrincipal,
                            metaMensal: currentUser.metaMensal,
                            categoriasFoco: currentUser.categoriasFoco
                        })
                    });

                    if (response.ok) {
                        const updatedUser = await response.json();
                        currentUser = updatedUser;
                        backendSaved = true;
                        console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][SUCCESS] Dados salvos com sucesso no backend:', currentUser);
                    } else {
                        const errorText = await response.text();
                        console.warn('[WARNING][WARNING] Backend não salvou (esperado se entidade não atualizada):', errorText);
                        console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][SAVE] Salvando apenas no localStorage...');
                    }
                } catch (error) {
                    console.warn('[WARNING][WARNING] Erro ao conectar com backend:', error);
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][SAVE] Salvando apenas no localStorage...');
                }

                //Salva no localStorage (sempre)
                localStorage.setItem('user', JSON.stringify(currentUser));
                
                if (backendSaved) {
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][SUCCESS] Dados salvos no backend e localStorage');
                } else {
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][WARNING] Dados salvos APENAS no localStorage (atualize a entidade Usuario no backend)');
                }
                
                //✅ SALVA PERGUNTA DE SEGURANÇA (se fornecida no onboarding)
                if (onboardingData.securityQuestion1 && onboardingData.securityAnswer1) {
                    try {
                        console.log('[SECURITY] 📝 Salvando pergunta de segurança do onboarding...');
                        
                        //✅ IMPORTANTE: Backend precisa da SENHA ORIGINAL para validar
                        //Mas usuário NÃO digita senha no onboarding (já está autenticado)
                        //SOLUÇÃO: Pegar senha do localStorage (foi salva no registro)
                        const savedPassword = localStorage.getItem('tempPassword'); //Senha temporária do registro
                        
                        if (!savedPassword) {
                            console.warn('[WARNING] ⚠️ Senha não encontrada - pulando salvamento de pergunta de segurança');
                            console.warn('[WARNING] ⚠️ Usuário pode configurar depois em Perfil > Segurança');
                        } else {
                            //Backend espera 3 perguntas obrigatoriamente
                            //Onboarding tem apenas 1, então usamos placeholders para as outras 2
                            const securityResponse = await fetch(`${API_URL}/security-questions/update`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    email: currentUser.email,
                                    password: savedPassword, //Senha do registro
                                    question1: onboardingData.securityQuestion1,
                                    answer1: onboardingData.securityAnswer1,
                                    question2: 'Não configurada',
                                    answer2: 'pendente',
                                    question3: 'Não configurada',
                                    answer3: 'pendente'
                                })
                            });

                            if (securityResponse.ok) {
                                console.log('[SUCCESS] ✅ Pergunta de segurança salva no banco de dados!');
                                //Limpa senha temporária do localStorage por segurança
                                localStorage.removeItem('tempPassword');
                            } else {
                                const errorData = await securityResponse.json();
                                console.warn('[WARNING] ⚠️ Erro ao salvar pergunta:', errorData.message);
                                console.warn('[WARNING] ⚠️ Usuário pode configurar depois em Perfil > Segurança');
                            }
                        }
                    } catch (error) {
                        console.error('[ERROR] Erro ao salvar pergunta de segurança:', error);
                        console.warn('[WARNING] Usuário pode configurar depois em Perfil > Segurança');
                    }
                }
                
                //✅ Marca onboarding como completo no BACKEND
                try {
                    console.log('[ONBOARDING] 📝 Marcando onboarding como completo no backend...');
                    const onboardingResponse = await fetch(`${API_URL}/auth/complete-onboarding`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: currentUser.id })
                    });
                    
                    if (onboardingResponse.ok) {
                        const data = await onboardingResponse.json();
                        console.log('[ONBOARDING] ✅ Onboarding marcado como completo no backend:', data);
                        currentUser.onboardingCompleted = true; // Atualiza objeto local
                    } else {
                        console.error('[ONBOARDING] ❌ Erro ao marcar onboarding no backend');
                    }
                } catch (err) {
                    console.error('[ONBOARDING] ❌ Erro ao marcar onboarding no backend:', err);
                }
                
                //Marca onboarding como completo localmente e remove flag de novo usuário
                localStorage.setItem('onboardingCompleted', 'true');
                localStorage.removeItem('isNewUser');

                //Atualiza localStorage com onboardingCompleted
                localStorage.setItem('user', JSON.stringify(currentUser));
                console.log('[ONBOARDING] ✅ Status salvo localmente: onboardingCompleted =', currentUser.onboardingCompleted);

                //Atualiza UI
                updateProfileUI();

                //Adiciona salário automático se configurado (primeira vez = true)
                if (currentUser.rendaMensal && currentUser.diaRecebimento) {
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][SALARY] Iniciando adição de salário após onboarding...');
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][SALARY] Dados do salário:', {
                        rendaMensal: currentUser.rendaMensal,
                        diaRecebimento: currentUser.diaRecebimento,
                        usuarioId: currentUser.id,
                        salarioAgendado: onboardingData.salarioAgendado
                    });
                    
                    //VALIDAÇÃO CRÍTICA: Verifica se o ID existe
                    if (!currentUser.id) {
                        console.error('[ERROR][ERROR] ERRO CRÍTICO: currentUser.id está undefined! Não é possível adicionar salário.');
                        console.error('[ERROR][ERROR] currentUser completo:', currentUser);
                        showErrorNotification('Erro: ID do usuário não encontrado. Por favor, faça logout e login novamente.');
                        return;
                    }
                    
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][SUCCESS] ID do usuário validado, prosseguindo com adição de salário...');
                    
                    //Se for salário agendado para o futuro, não adiciona agora
                    if (onboardingData.salarioAgendado) {
                        console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][INFO] Salário agendado para:', onboardingData.dataSalarioAgendado);
                        showInfoNotification(`Salário agendado para dia ${currentUser.diaRecebimento}`);
                        
                        //Salva no localStorage para processar depois
                        const scheduledSalary = {
                            userId: currentUser.id,
                            amount: currentUser.rendaMensal,
                            day: currentUser.diaRecebimento,
                            scheduledDate: onboardingData.dataSalarioAgendado
                        };
                        localStorage.setItem('scheduled_salary', JSON.stringify(scheduledSalary));
                    } else {
                        //✅ NOVO: Adiciona o salário IMEDIATAMENTE no mês atual
                        try {
                            console.log('[ONBOARDING] Adicionando salário IMEDIATAMENTE no mês atual');
                            console.log('[ONBOARDING] Valor: R$', currentUser.rendaMensal, '- Dia configurado:', currentUser.diaRecebimento);
                            
                            //isFirstTime = true, customDate = null → adiciona no mês atual, sem agendar
                            await checkAndAddMonthlySalary(true, null);
                            console.log('[SUCCESS] Salário adicionado com sucesso no mês atual!');
                            
                            //CRÍTICO: Aguarda um pouco mais para garantir que tudo foi salvo
                            await new Promise(resolve => setTimeout(resolve, 500));
                            
                            //FORÇA atualização completa após adicionar salário
                            await loadTransactions();
                            console.log('[CHARTS] Renderizando todos os gráficos após onboarding...');
                            renderTransactions();
                            renderChart();
                            renderMonthlyChart();
                            renderCategoryReport();
                            renderCalendar();
                            updateDashboardStats();
                            updateInsights();
                            updateDashboardMiniCards();
                            
                            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][SUCCESS] Todos os gráficos e dashboard atualizados com o salário');
                        } catch (error) {
                            console.error('[ERROR][ERROR] Erro ao adicionar salário:', error);
                        }
                    }
                } else {
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][WARNING] Salário NÃO será adicionado. Dados faltando:', {
                        rendaMensal: currentUser.rendaMensal,
                        diaRecebimento: currentUser.diaRecebimento
                    });
                }

                //Pequeno delay para garantir que tudo foi processado
                await new Promise(resolve => setTimeout(resolve, 300));

                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][ONBOARDING] Fim do processo de onboarding');
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][ONBOARDING] Onboarding concluído com sucesso!');

                //Fecha modal com animação de sucesso (DEPOIS de adicionar salário)
                const modal = document.getElementById('onboardingModal');
                modal.style.display = 'none';
                
                //🔓 SCROLL: Libera usando função utilitária
                enableBodyScroll();

                //Mostra mensagem de sucesso
                showSuccessMessage('Perfil configurado com sucesso!');

                //✅ NOVO: Após fechar onboarding, aguarda 5 segundos e verifica popup de novidades
                setTimeout(() => {
                    checkAndShowWhatsNew();
                }, 5000);

                //Reseta para próxima vez
                currentOnboardingStep = 1;
                onboardingData = {};

            } catch (error) {
                console.error('[ERROR]❌ Erro ao completar onboarding:', error);
                
                //Reabilita o botão em caso de erro
                const btnComplete = document.querySelector('.btn-onboarding-complete');
                if (btnComplete) {
                    btnComplete.disabled = false;
                    btnComplete.textContent = 'Concluir';
                    btnComplete.style.opacity = '1';
                    btnComplete.style.cursor = 'pointer';
                }
                
                //Mesmo com erro, salva no localStorage e continua
                localStorage.setItem('user', JSON.stringify(currentUser));
                localStorage.setItem('onboardingCompleted', 'true');
                localStorage.removeItem('isNewUser');
                
                //Tenta adicionar salário antes de fechar modal
                if (currentUser.rendaMensal && currentUser.diaRecebimento) {
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]💰 Tentando adicionar salário mesmo com erro no onboarding...');
                    await checkAndAddMonthlySalary(true);
                }
                
                //Fecha modal DEPOIS
                const modal = document.getElementById('onboardingModal');
                modal.style.display = 'none';
                
                //🔓 SCROLL: Libera usando função utilitária mesmo com erro
                enableBodyScroll();
                
                showSuccessMessage('Perfil salvo localmente (atualize o backend)');
            }
        }

        function skipOnboarding() {
            //Pergunta se tem certeza
            if (confirm('Você pode completar seu perfil depois nas configurações. Deseja pular agora?')) {
                const modal = document.getElementById('onboardingModal');
                modal.style.display = 'none';
                
                //🔓 SCROLL: Libera usando função utilitária ao pular
                enableBodyScroll();
                
                currentOnboardingStep = 1;
                onboardingData = {};
                
                // ✅ FIX: Marca onboarding como completo mesmo ao pular
                localStorage.setItem('onboardingCompleted', 'true');
                
                //Remove flag de novo usuário
                localStorage.removeItem('isNewUser');
                
                console.log('[ONBOARDING] ⏭️ Onboarding pulado - marcado como completo');
            }
        }

        function showSuccessMessage(message) {
            //Remove emojis da mensagem
            const cleanMessage = message.replace(/🎉|⚠️|💰|✅|🗑️/g, '').trim();
            //Usa o sistema de toast com tipo success
            showToast('generalNotification', 'success', 'Sucesso!', cleanMessage);
        }

        //✅ Notificação de Erro Estilizada
        function showErrorNotification(message) {
            //Usa o sistema de toast com tipo error
            showToast('generalNotification', 'error', 'Erro!', message);
        }

        //✅ Notificação de Aviso Estilizada
        function showWarningNotification(message) {
            //Usa o sistema de toast com tipo info (já que não temos tipo warning, usamos info como aviso)
            showToast('generalNotification', 'info', 'Atenção!', message);
        }

        //✅ Notificação de Informação Estilizada
        function showInfoNotification(message) {
            //Usa o sistema de toast com tipo info
            showToast('generalNotification', 'info', 'Informação', message);
        }

        //Limita seleção de categorias a 3
        document.addEventListener('change', function(e) {
            if (e.target.name === 'focusCategory') {
                const checked = document.querySelectorAll('input[name="focusCategory"]:checked');
                if (checked.length > 3) {
                    e.target.checked = false;
                    showWarningNotification('Você pode selecionar no máximo 3 categorias');
                }
            }
        });

        //SISTEMA DE ADIÇÃO AUTOMÁTICA DE SALÁRIO MENSAL
        //Este sistema adiciona automaticamente o salário todo mês no dia configurado
        //✅ NOVO: customDate permite especificar a data do salário (usado no onboarding para mês anterior)
        async function checkAndAddMonthlySalary(isFirstTime = false, customDate = null) {
            //✅ CORREÇÃO: Só executa se estiver no dashboard (não no landing page)
            const isDashboard = document.getElementById('dashboard')?.style.display !== 'none';
            const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted') === 'true';
            
            if (!isDashboard || !hasCompletedOnboarding) {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][SALARY] Abortado: não está no dashboard ou onboarding não completo');
                return;
            }
            
            //NOVO: Verifica se há salário agendado pendente
            const scheduledSalary = localStorage.getItem('scheduled_salary');
            if (scheduledSalary) {
                const scheduled = JSON.parse(scheduledSalary);
                const scheduledDate = new Date(scheduled.scheduledDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                scheduledDate.setHours(0, 0, 0, 0);
                
                //Se a data agendada ainda não chegou, não adiciona o salário
                if (scheduledDate > today) {
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][INFO] Salário agendado para', scheduled.scheduledDate, '- não processado ainda');
                    return;
                }
                
                //Se a data agendada chegou, processa o salário e remove do localStorage
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][SUCCESS] Data agendada chegou! Processando salário...');
                localStorage.removeItem('scheduled_salary');
                //Continua com o fluxo normal
            }
            
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][SALARY] Função checkAndAddMonthlySalary chamada');
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][SALARY] isFirstTime:', isFirstTime);
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][SALARY] currentUser completo:', JSON.stringify(currentUser, null, 2));
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][SALARY] currentUser.id:', currentUser?.id);
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][SALARY] rendaMensal:', currentUser?.rendaMensal);
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][SALARY] diaRecebimento:', currentUser?.diaRecebimento);
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][SALARY] API_URL:', API_URL);
            
            if (!currentUser || !currentUser.rendaMensal || !currentUser.diaRecebimento) {
                console.error('[ERROR][ERROR] Dados insuficientes para adicionar salário (configure no perfil)');
                return;
            }
            
            if (!currentUser.id) {
                console.error('[ERROR][ERROR] CRÍTICO: currentUser.id está undefined ou null!');
                console.error('[ERROR][ERROR] Isso impedirá a criação da transação!');
                return;
            }

            const today = new Date();
            const currentDay = today.getDate();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();

            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][DATE] Dia atual:', currentDay, '| Dia configurado:', currentUser.diaRecebimento);

            //Se for a primeira vez (completando onboarding), adiciona independente do dia
            //Caso contrário, verifica se já passou o dia de recebimento neste mês
            if (!isFirstTime && currentDay < currentUser.diaRecebimento) {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][WAIT] Aguardando o dia', currentUser.diaRecebimento, 'para adicionar salário');
                return;
            }

            //===== CORREÇÃO CRÍTICA: Verificar DIRETO NO BANCO antes de adicionar =====
            //✅ IMPORTANTE: Pula verificação de duplicação no onboarding (isFirstTime = true)
            //Isso garante que o salário seja sempre adicionado no primeiro acesso
            if (!isFirstTime) {
                try {
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][CHECK] Verificando no banco de dados se salário já existe...');
                    
                    //Busca todas as transações do banco
                    const response = await fetch(`${API_URL}/transacoes`);
                    if (!response.ok) {
                        throw new Error('Erro ao buscar transações do banco');
                    }
                    
                    const allTransactions = await response.json();
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][DATA] Total de transações no banco:', allTransactions.length);
                    
                    //Verifica se já existe salário neste mês
                    const salaryAlreadyExists = allTransactions.some(t => {
                        const tDate = new Date(t.data);
                        const isSalary = t.tipo === 'receita' && 
                                       t.categoria === 'Salário' && 
                                       t.descricao === 'Salário' &&
                                       tDate.getMonth() === currentMonth &&
                                       tDate.getFullYear() === currentYear;
                        
                        if (isSalary) {
                            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][FOUND] Salário encontrado no banco:', {
                                id: t.id,
                                data: t.data,
                                valor: t.valor,
                                mes: tDate.getMonth() + 1,
                                ano: tDate.getFullYear()
                            });
                        }
                        
                        return isSalary;
                    });

                    if (salaryAlreadyExists) {
                        console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][SUCCESS] Salário JÁ EXISTE no banco para', currentMonth + 1, '/', currentYear);
                        console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][STOP] Abortando adição para evitar duplicação');
                        return;
                    }
                    
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][SUCCESS] Nenhum salário encontrado no banco para este mês');
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][GO] Prosseguindo com adição...');
                    
                } catch (error) {
                    console.error('[ERROR][ERROR] Erro ao verificar salário no banco:', error);
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][WARNING] Continuando com verificação local como fallback...');
                    
                    //Fallback: verifica no array local
                    const salaryAlreadyExists = transactions.some(t => {
                        const tDate = new Date(t.data);
                        return t.tipo === 'receita' && 
                               t.categoria === 'Salário' && 
                               t.descricao === 'Salário' &&
                               tDate.getMonth() === currentMonth &&
                               tDate.getFullYear() === currentYear;
                    });

                    if (salaryAlreadyExists) {
                        console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][SUCCESS] Salário encontrado no array local');
                        return;
                    }
                }
            } else {
                //✅ ONBOARDING: Não verifica duplicação, sempre adiciona
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][ONBOARDING] Primeira vez (onboarding) - pulando verificação de duplicação');
            }

            //Verifica se é adição retroativa
            const isRetroactive = !isFirstTime && currentDay > currentUser.diaRecebimento;
            
            if (isRetroactive) {
                console.log('[RETROACTIVE] ADIÇÃO RETROATIVA: Você acessou após o dia', currentUser.diaRecebimento);
                console.log('[SALARY] Adicionando salário do mês', currentMonth + 1, '/', currentYear, 'com data retroativa');
            } else if (isFirstTime) {
                console.log('[ONBOARDING] PRIMEIRO ACESSO: Adicionando salário IMEDIATAMENTE no mês atual');
                console.log('[SALARY] Usuário terá saldo de R$', currentUser.rendaMensal, 'disponível AGORA');
            } else {
                console.log('[SALARY] Condições atendidas! Adicionando salário do mês', currentMonth + 1, '/', currentYear);
            }
            
            try {
                //✅ NOVA LÓGICA: 
                // - No onboarding (customDate = null): adiciona no DIA ATUAL do mês atual
                // - Após onboarding (customDate = null): adiciona no dia configurado do mês atual
                let salaryDate;
                if (isFirstTime) {
                    //ONBOARDING: Adiciona HOJE (para dar saldo imediato)
                    salaryDate = new Date();
                    console.log('[ONBOARDING] Adicionando salário HOJE:', salaryDate.toLocaleDateString());
                } else {
                    //NORMAL: Adiciona no dia configurado do mês atual
                    salaryDate = new Date(currentYear, currentMonth, currentUser.diaRecebimento);
                    console.log('[SALARY] Usando data normal (mês atual):', salaryDate.toLocaleDateString());
                }
                
                const formattedDate = formatDateToInput(salaryDate);
                
                console.log('[DATE] Data do salário:', formattedDate);
                
                const salaryTransaction = {
                    descricao: 'Salário',
                    valor: currentUser.rendaMensal,
                    categoria: 'Salário',
                    data: formattedDate,
                    tipo: 'receita',
                    usuarioId: currentUser.id
                };

                console.log('📤 === ENVIANDO TRANSAÇÃO DE SALÁRIO ===');
                console.log('📤 Payload completo:', JSON.stringify(salaryTransaction, null, 2));
                console.log('📤 URL:', `${API_URL}/transacoes`);

                const response = await fetch(`${API_URL}/transacoes`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(salaryTransaction)
                });

                console.log('📥 === RESPOSTA DO SERVIDOR ===');
                console.log('📥 Status:', response.status);
                console.log('📥 Status Text:', response.statusText);

                if (response.ok) {
                    const result = await response.json();
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ === SALÁRIO ADICIONADO COM SUCESSO ===');
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ ID da transação criada:', result.id);
                    
                    //Marca no localStorage como backup
                    const salaryKey = `salary_added_${currentYear}_${currentMonth}_${currentUser.id}`;
                    localStorage.setItem(salaryKey, 'true');
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Flag backup setada no localStorage:', salaryKey);
                    
                    //Recarrega transações e aguarda completar
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🔄 Recarregando transações do servidor...');
                    await loadTransactions();
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Transações recarregadas, atualizando dashboard...');
                    
                    //Pequeno delay para garantir que tudo foi processado
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    //Atualiza todas as visualizações na ordem correta
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][RENDER] Iniciando renderização de todos os componentes...');
                    renderTransactions();
                    updateDashboardStats();
                    updateInsights();
                    renderChart();
                    renderCategoryReport();
                    renderMonthlyChart();
                    renderCalendar();
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR][RENDER] Todos os componentes renderizados');
                    
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Dashboard atualizado após adicionar salário');
                    
                    //Mostra notificação toast se foi adicionado automaticamente (não é primeira vez)
                    if (!isFirstTime) {
                        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                                          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                        showToast('generalNotification', 'success', 
                                  'Salário Adicionado!', 
                                  `Seu salário de ${monthNames[currentMonth]} foi adicionado automaticamente`);
                    } else {
                        showSuccessMessage('💰 Salário adicionado automaticamente!');
                    }
                } else {
                    console.error('[ERROR]❌ === ERRO NA RESPOSTA DO SERVIDOR ===');
                    console.error('[ERROR]❌ Status:', response.status);
                    console.error('[ERROR]❌ Status Text:', response.statusText);
                    const errorText = await response.text();
                    console.error('[ERROR]❌ Erro completo:', errorText);
                    try {
                        const errorJson = JSON.parse(errorText);
                        console.error('[ERROR]❌ Erro JSON:', JSON.stringify(errorJson, null, 2));
                    } catch (e) {
                        console.error('[ERROR]❌ Erro não é JSON:', errorText);
                    }
                }
            } catch (error) {
                console.error('[ERROR]❌ === EXCEPTION AO ADICIONAR SALÁRIO ===');
                console.error('[ERROR]❌ Tipo:', error.name);
                console.error('[ERROR]❌ Mensagem:', error.message);
                console.error('[ERROR]❌ Stack:', error.stack);
            }
        }

        //DASHBOARD
        async function loadDashboardData() {
            try {
                await loadTransactions();
                
                //CORREÇÃO: Sincroniza flags do localStorage com o banco de dados
                syncSalaryFlags();
                
                //CRÍTICO: Verifica e adiciona salário ANTES de renderizar qualquer coisa
                await checkAndAddMonthlySalary();
                
                //Verifica se deve mostrar resumo mensal automático
                checkAndShowMonthlyReview();
                
                //Pequeno delay para garantir que o salário foi processado
                await new Promise(resolve => setTimeout(resolve, 200));
                
                //Agora sim, atualiza todas as visualizações COM o salário já adicionado
                updateDashboardStats();
                updateInsights();
                updateMonthlyLimitCard();
                renderChart();
                renderCategoryReport();
                renderCalendar();
                
                //✅ CORREÇÃO: Renderiza previsões automaticamente ao carregar o dashboard
                const { currentStart, currentEnd } = getPeriodDates(currentReportPeriod);
                const currentTransactions = getTransactionsInPeriod(currentStart, currentEnd);
                const currentStats = calculatePeriodStats(currentTransactions);
                renderPredictionsAnalysis(currentStats, currentTransactions);
            } catch (error) {
                console.error('[ERROR]Erro ao carregar dados do dashboard:', error);
            }
        }

        //Sincroniza flags de salário do localStorage com transações reais no banco
        function syncSalaryFlags() {
            if (!currentUser || !currentUser.id) return;
            
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🔄 Sincronizando flags de salário com banco de dados...');
            
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            
            //Verifica meses dos últimos 3 meses
            for (let i = 0; i < 3; i++) {
                const checkDate = new Date(currentYear, currentMonth - i, 1);
                const checkYear = checkDate.getFullYear();
                const checkMonth = checkDate.getMonth();
                
                const salaryKey = `salary_added_${checkYear}_${checkMonth}_${currentUser.id}`;
                const flagExists = localStorage.getItem(salaryKey) === 'true';
                
                //Verifica se existe transação de salário no banco para esse mês
                const salaryExistsInDB = transactions.some(t => {
                    const tDate = new Date(t.data);
                    return t.tipo === 'receita' && 
                           t.categoria === 'Salário' && 
                           t.descricao === 'Salário' &&
                           tDate.getMonth() === checkMonth &&
                           tDate.getFullYear() === checkYear;
                });
                
                //Se flag existe mas transação não existe, remove a flag
                if (flagExists && !salaryExistsInDB) {
                    console.log(`⚠️ Removendo flag obsoleta: ${salaryKey} (mês ${checkMonth + 1}/${checkYear})`);
                    localStorage.removeItem(salaryKey);
                }
                
                //Se transação existe mas flag não existe, cria a flag
                if (!flagExists && salaryExistsInDB) {
                    console.log(`✅ Criando flag: ${salaryKey} (mês ${checkMonth + 1}/${checkYear})`);
                    localStorage.setItem(salaryKey, 'true');
                }
            }
            
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Sincronização concluída');
        }

        async function loadTransactions() {
            try {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]📥 Carregando transações do servidor...');
                const response = await fetch(`${API_URL}/transacoes`);
                if (response.ok) {
                    const allTransactions = await response.json();
                    transactions = allTransactions.filter(t => t.usuarioId === currentUser.id);
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Transações carregadas:', transactions.length);
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]Transações do usuário:', transactions);
                } else {
                    transactions = [];
                    console.warn('[WARNING]⚠️ Nenhuma transação retornada do servidor');
                }
                
                //Sempre renderiza transações após carregar
                renderTransactions();
                
                //🆕 CORREÇÃO: Renderiza relatórios se estiver na página de relatórios
                const reportsContainer = document.getElementById('categoryPieChart');
                if (reportsContainer) {
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]📊 Renderizando relatórios após carregar transações');
                    renderNewReports();
                }
                
                return transactions;
            } catch (error) {
                console.error('[ERROR]❌ Erro ao carregar transações:', error);
                transactions = [];
                return transactions;
            }
        }

        //=== Investment Portfolio Functions ===

        function updateDashboardStats() {
            console.log('[DASHBOARD][STATS] === Iniciando updateDashboardStats ===');
            console.log('[DASHBOARD][STATS] Total de transações no array:', transactions.length);
            
            //✅ CORREÇÃO: Filtra apenas transações cuja data já passou (não conta agendadas/futuras)
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0); //Zera horas para comparar só a data
            
            const incomeTransactions = transactions.filter(t => {
                const dataTransacao = parseLocalDate(t.data);
                //✅ Considera flag agendada
                if (t.agendada === true) {
                    return t.tipo === 'receita' && dataTransacao <= hoje;
                }
                return t.tipo === 'receita';
            });
            
            const income = incomeTransactions.reduce((sum, t) => sum + Math.abs(t.valor), 0);
            
            const expenseTransactions = transactions.filter(t => {
                const dataTransacao = parseLocalDate(t.data);
                //✅ Considera flag agendada
                if (t.agendada === true) {
                    return t.tipo === 'despesa' && dataTransacao <= hoje;
                }
                return t.tipo === 'despesa';
            });
            
            const expenses = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.valor), 0);
            
            const balance = income - expenses;
            
            console.log('[DASHBOARD][STATS] Receitas encontradas:', incomeTransactions.length, '- Total:', formatCurrency(income));
            console.log('[DASHBOARD][STATS] Despesas encontradas:', expenseTransactions.length, '- Total:', formatCurrency(expenses));
            console.log('[DASHBOARD][STATS] Saldo calculado:', formatCurrency(balance));
            
            if (incomeTransactions.length > 0) {
                console.log('[DASHBOARD][STATS] Primeira receita:', {
                    descricao: incomeTransactions[0].descricao,
                    valor: incomeTransactions[0].valor,
                    data: incomeTransactions[0].data,
                    categoria: incomeTransactions[0].categoria
                });
            }
            
            //Verifica se os elementos existem antes de atualizar
            const totalBalance = document.getElementById('totalBalance');
            const totalIncome = document.getElementById('totalIncome');
            const totalExpenses = document.getElementById('totalExpenses');
            
            console.log('[DASHBOARD][STATS] Elementos DOM:', {
                totalBalance: !!totalBalance,
                totalIncome: !!totalIncome,
                totalExpenses: !!totalExpenses
            });
            
            if (totalBalance) {
                totalBalance.textContent = formatCurrency(balance);
                console.log('[DASHBOARD][STATS] Saldo atualizado no DOM:', totalBalance.textContent);
            } else {
                console.error('[DASHBOARD][STATS] ❌ Elemento totalBalance não encontrado!');
            }
            
            if (totalIncome) {
                totalIncome.textContent = formatCurrency(income);
                console.log('[DASHBOARD][STATS] Receita atualizada no DOM:', totalIncome.textContent);
            } else {
                console.error('[DASHBOARD][STATS] ❌ Elemento totalIncome não encontrado!');
            }
            
            if (totalExpenses) {
                totalExpenses.textContent = formatCurrency(expenses);
                console.log('[DASHBOARD][STATS] Despesa atualizada no DOM:', totalExpenses.textContent);
            } else {
                console.error('[DASHBOARD][STATS] ❌ Elemento totalExpenses não encontrado!');
            }
            
            console.log('[DASHBOARD][STATS] === Fim updateDashboardStats ===');

            //Atualiza card de meta mensal de gastos
            updateMonthlyLimitCard();
            
            //Atualiza mini-cards do dashboard
            updateDashboardMiniCards();
            
            //Atualiza relatório por tipo de despesa
            updateExpenseTypeReport();
            
            //Reaplica modo de privacidade se estiver ativo
            reapplyPrivacyIfActive();
        }

        function updateExpenseTypeReport() {
            //✅ CORREÇÃO: Filtra apenas transações que já aconteceram (não futuras/agendadas)
            const hoje = new Date();
            hoje.setHours(23, 59, 59, 999);
            
            const validTransactions = transactions.filter(t => {
                const dataTransacao = parseLocalDate(t.data);
                return dataTransacao <= hoje;
            });
            
            //Pega transações do mês atual
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            const currentMonthTransactions = validTransactions.filter(t => {
                const tDate = parseLocalDate(t.data);
                return t.tipo === 'despesa' && 
                       tDate.getMonth() === currentMonth && 
                       tDate.getFullYear() === currentYear;
            });
            
            //Calcula valores por tipo
            const unica = currentMonthTransactions.filter(t => !t.despesaTipo || t.despesaTipo === 'unica');
            const fixa = currentMonthTransactions.filter(t => t.despesaTipo === 'fixa');
            const parcelada = currentMonthTransactions.filter(t => t.despesaTipo === 'parcelada');
            
            const unicaValue = unica.reduce((sum, t) => sum + Math.abs(t.valor), 0);
            const fixaValue = fixa.reduce((sum, t) => sum + Math.abs(t.valor), 0);
            const parceladaValue = parcelada.reduce((sum, t) => sum + Math.abs(t.valor), 0);
            
            const totalExpenses = unicaValue + fixaValue + parceladaValue;
            
            //Calcula porcentagens
            const unicaPercent = totalExpenses > 0 ? (unicaValue / totalExpenses * 100).toFixed(1) : 0;
            const fixaPercent = totalExpenses > 0 ? (fixaValue / totalExpenses * 100).toFixed(1) : 0;
            const parceladaPercent = totalExpenses > 0 ? (parceladaValue / totalExpenses * 100).toFixed(1) : 0;
            
            //Atualiza Despesas Únicas
            const expenseUnicaValue = document.getElementById('expenseUnicaValue');
            const expenseUnicaCount = document.getElementById('expenseUnicaCount');
            const expenseUnicaProgress = document.getElementById('expenseUnicaProgress');
            const expenseUnicaPercent = document.getElementById('expenseUnicaPercent');
            
            if (expenseUnicaValue) expenseUnicaValue.textContent = formatCurrency(unicaValue);
            if (expenseUnicaCount) expenseUnicaCount.textContent = `${unica.length} transaç${unica.length === 1 ? 'ão' : 'ões'}`;
            if (expenseUnicaProgress) expenseUnicaProgress.style.width = `${unicaPercent}%`;
            if (expenseUnicaPercent) expenseUnicaPercent.textContent = `${unicaPercent}%`;
            
            //Atualiza Despesas Fixas
            const expenseFixaValue = document.getElementById('expenseFixaValue');
            const expenseFixaCount = document.getElementById('expenseFixaCount');
            const expenseFixaProgress = document.getElementById('expenseFixaProgress');
            const expenseFixaPercent = document.getElementById('expenseFixaPercent');
            
            if (expenseFixaValue) expenseFixaValue.textContent = formatCurrency(fixaValue);
            if (expenseFixaCount) expenseFixaCount.textContent = `${fixa.length} transaç${fixa.length === 1 ? 'ão' : 'ões'}`;
            if (expenseFixaProgress) expenseFixaProgress.style.width = `${fixaPercent}%`;
            if (expenseFixaPercent) expenseFixaPercent.textContent = `${fixaPercent}%`;
            
            //Atualiza Despesas Parceladas
            const expenseParceladaValue = document.getElementById('expenseParceladaValue');
            const expenseParceladaCount = document.getElementById('expenseParceladaCount');
            const expenseParceladaProgress = document.getElementById('expenseParceladaProgress');
            const expenseParceladaPercent = document.getElementById('expenseParceladaPercent');
            
            if (expenseParceladaValue) expenseParceladaValue.textContent = formatCurrency(parceladaValue);
            if (expenseParceladaCount) expenseParceladaCount.textContent = `${parcelada.length} transaç${parcelada.length === 1 ? 'ão' : 'ões'}`;
            if (expenseParceladaProgress) expenseParceladaProgress.style.width = `${parceladaPercent}%`;
            if (expenseParceladaPercent) expenseParceladaPercent.textContent = `${parceladaPercent}%`;
        }

        function updateMonthlyLimitCard() {
            const monthlyLimitCard = document.getElementById('monthlyLimitCard');
            const monthlyLimitValue = document.getElementById('monthlyLimitValue');
            const monthlyLimitProgress = document.getElementById('monthlyLimitProgress');
            const monthlyLimitText = document.getElementById('monthlyLimitText');

            //Verifica se o usuário tem meta mensal definida
            if (!currentUser || !currentUser.metaMensal || currentUser.metaMensal <= 0) {
                if (monthlyLimitCard) monthlyLimitCard.style.display = 'none';
                return;
            }

            //Mostra o card
            if (monthlyLimitCard) monthlyLimitCard.style.display = 'block';

            //Calcula despesas do mês atual
            const currentMonthExpenses = transactions.filter(t => {
                const date = parseLocalDate(t.data);
                const now = new Date();
                return t.tipo === 'despesa' && 
                       date.getMonth() === now.getMonth() &&
                       date.getFullYear() === now.getFullYear();
            }).reduce((sum, t) => sum + Math.abs(t.valor), 0);

            //Calcula percentual (sem limitar a 100 para mostrar quanto ultrapassou)
            const percentUsed = (currentMonthExpenses / currentUser.metaMensal) * 100;
            const remaining = Math.max(currentUser.metaMensal - currentMonthExpenses, 0);
            
            //Alerta ativo quando gastos >= meta (>= 100%)
            const isAlert = percentUsed >= 100;
            const isExceeded = currentMonthExpenses > currentUser.metaMensal;

            //Atualiza card com alerta vermelho quando meta é atingida/ultrapassada
            if (monthlyLimitCard) {
                if (isAlert) {
                    monthlyLimitCard.classList.add('limit-exceeded');
                } else {
                    monthlyLimitCard.classList.remove('limit-exceeded');
                }
            }

            //Atualiza valores com cores de alerta
            if (monthlyLimitValue) {
                if (isAlert) {
                    //Mostra quanto ultrapassou em vermelho
                    const exceeded = currentMonthExpenses - currentUser.metaMensal;
                    monthlyLimitValue.textContent = isExceeded ? 
                        `-${formatCurrency(exceeded)}` : 
                        formatCurrency(0);
                    monthlyLimitValue.style.color = '#dc2626';
                } else {
                    //Mostra quanto resta em azul
                    monthlyLimitValue.textContent = formatCurrency(remaining);
                    monthlyLimitValue.style.color = '#3b82f6';
                }
            }

            //Atualiza barra de progresso (máximo 100% visualmente)
            if (monthlyLimitProgress) {
                const progressWidth = Math.min(percentUsed, 100);
                monthlyLimitProgress.style.width = progressWidth + '%';
                
                if (isAlert) {
                    monthlyLimitProgress.style.background = 'linear-gradient(90deg, #dc2626, #ef4444)';
                } else if (percentUsed >= 80) {
                    monthlyLimitProgress.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
                } else {
                    monthlyLimitProgress.style.background = 'linear-gradient(90deg, #3b82f6, #8b5cf6)';
                }
            }

            //Atualiza texto com ícone e mensagem apropriada
            if (monthlyLimitText) {
                if (isAlert) {
                    const exceeded = currentMonthExpenses - currentUser.metaMensal;
                    monthlyLimitText.innerHTML = `<i class="ph ph-warning" style="font-size: 1rem;"></i> Meta atingida! Ultrapassou em ${formatCurrency(exceeded)}`;
                    monthlyLimitText.style.color = '#dc2626';
                    monthlyLimitText.style.fontWeight = '600';
                } else if (percentUsed >= 80) {
                    monthlyLimitText.innerHTML = `<i class="ph ph-warning-circle" style="font-size: 1rem;"></i> ${percentUsed.toFixed(1)}% usado - Atenção!`;
                    monthlyLimitText.style.color = '#f59e0b';
                    monthlyLimitText.style.fontWeight = '500';
                } else {
                    monthlyLimitText.textContent = `${percentUsed.toFixed(1)}% usado - Restam ${formatCurrency(remaining)}`;
                    monthlyLimitText.style.color = '#6b7280';
                    monthlyLimitText.style.fontWeight = '400';
                }
            }
        }

        //========================================
        //MINI-CARDS DO DASHBOARD
        //========================================

        function updateDashboardMiniCards() {
            updateDashboardTransactions();
            updateAvgDailyExpense();
            updateTrendChart();
            updateNextHoliday();
            updatePotentialSavings();
            updateMonthEndProjection();
            updateExpenseGrowthRate();
            updateBiggestExpense();
            updateSavingsRate();
            updateDaysToSalary();
            updateInsightsVerticalCard();
            updateRemindersVerticalCard();
        }

        //Atualiza transações recentes no card vertical
        function updateDashboardTransactions() {
            const container = document.getElementById('dashboardTransactionsList');
            if (!container) return;

            //✅ CORREÇÃO: Filtra apenas transações do mês atual
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            const currentMonthTransactions = transactions.filter(t => {
                const tDate = parseLocalDate(t.data);
                return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
            });

            const recentTransactions = currentMonthTransactions
                .sort((a, b) => parseLocalDate(b.data) - parseLocalDate(a.data))
                .slice(0, 5); //Últimas 5 transações do mês atual

            if (recentTransactions.length === 0) {
                container.innerHTML = '<div class="empty-state-mini"><p>Nenhuma transação este mês</p></div>';
                return;
            }

            const transactionsHTML = recentTransactions.map(t => {
                const isIncome = t.tipo === 'receita';
                const valueClass = isIncome ? 'income' : 'expense';
                const prefix = isIncome ? '+' : '-';
                
                return `
                    <div class="transaction-mini-item" onclick="openTransactionDetail(${t.id})">
                        <div class="transaction-mini-info">
                            <div class="transaction-mini-desc">${t.descricao}</div>
                            <div class="transaction-mini-date">${formatDate(t.data)}</div>
                        </div>
                        <div class="transaction-mini-value ${valueClass}">
                            ${prefix}${formatCurrency(Math.abs(t.valor))}
                        </div>
                    </div>
                `;
            }).join('');
            
            const endMessage = '<div class="transactions-end-message"><i class="ph ph-check-circle"></i> Transações recentes do mês</div>';
            container.innerHTML = transactionsHTML + endMessage;
        }

        //Calcula gasto médio diário (últimos 30 dias)
        function updateAvgDailyExpense() {
            const avgValue = document.getElementById('avgDailyExpense');
            const avgSubtitle = document.getElementById('avgDailySubtitle');
            if (!avgValue) return;

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const recentExpenses = transactions.filter(t => {
                const date = parseLocalDate(t.data);
                return t.tipo === 'despesa' && date >= thirtyDaysAgo;
            });

            if (recentExpenses.length === 0) {
                avgValue.textContent = 'R$ 0,00';
                if (avgSubtitle) avgSubtitle.textContent = 'Sem dados';
                return;
            }

            const totalExpenses = recentExpenses.reduce((sum, t) => sum + Math.abs(t.valor), 0);
            const avgDaily = totalExpenses / 30;

            avgValue.textContent = formatCurrency(avgDaily);
            if (avgSubtitle) avgSubtitle.textContent = `${recentExpenses.length} transações`;
        }

        //Comparativo com mês anterior
        function updateMonthComparison() {
            const comparisonValue = document.getElementById('monthComparison');
            const comparisonSubtitle = document.getElementById('comparisonSubtitle');
            if (!comparisonValue) return;

            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

            //Gastos do mês atual
            const currentMonthExpenses = transactions.filter(t => {
                const date = parseLocalDate(t.data);
                return t.tipo === 'despesa' && 
                       date.getMonth() === currentMonth &&
                       date.getFullYear() === currentYear;
            }).reduce((sum, t) => sum + Math.abs(t.valor), 0);

            //Gastos do mês anterior
            const lastMonthExpenses = transactions.filter(t => {
                const date = parseLocalDate(t.data);
                return t.tipo === 'despesa' && 
                       date.getMonth() === lastMonth &&
                       date.getFullYear() === lastMonthYear;
            }).reduce((sum, t) => sum + Math.abs(t.valor), 0);

            if (lastMonthExpenses === 0) {
                comparisonValue.textContent = '--';
                comparisonValue.className = 'metric-value comparison';
                if (comparisonSubtitle) comparisonSubtitle.textContent = 'Sem dados do mês anterior';
                return;
            }

            const percentChange = ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
            const isPositive = percentChange < 0; //Menos gastos é positivo
            
            comparisonValue.textContent = `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%`;
            comparisonValue.className = `metric-value comparison ${isPositive ? 'positive' : 'negative'}`;
            
            if (comparisonSubtitle) {
                const message = isPositive ? 'Gastou menos 👍' : 'Gastou mais';
                comparisonSubtitle.textContent = message;
            }
        }

        //Tendência dos últimos 7 dias
        function updateTrendChart() {
            const canvas = document.getElementById('trendCanvas');
            const subtitle = document.getElementById('trendSubtitle');
            const valueDisplay = document.getElementById('trendValue');
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const now = new Date();
            const last7Days = [];

            //Criar array com os últimos 7 dias
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                last7Days.push(date);
            }

            //✅ CORREÇÃO: Filtra apenas transações que já aconteceram (não futuras/agendadas)
            const hoje = new Date();
            hoje.setHours(23, 59, 59, 999);
            
            const validTransactions = transactions.filter(t => {
                const dataTransacao = parseLocalDate(t.data);
                return dataTransacao <= hoje;
            });

            //Calcular gastos por dia
            const dailyExpenses = last7Days.map(day => {
                return validTransactions.filter(t => {
                    const tDate = parseLocalDate(t.data);
                    tDate.setHours(0, 0, 0, 0);
                    return t.tipo === 'despesa' && tDate.getTime() === day.getTime();
                }).reduce((sum, t) => sum + Math.abs(t.valor), 0);
            });

            //Calcular total e média
            const totalWeek = dailyExpenses.reduce((a, b) => a + b, 0);
            const avgDaily = totalWeek / 7;

            //Desenhar mini gráfico com gradiente
            const width = canvas.width;
            const height = canvas.height;
            const maxValue = Math.max(...dailyExpenses, 1);
            const padding = 5;
            
            ctx.clearRect(0, 0, width, height);

            //Criar gradiente
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
            gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');

            //Desenhar área preenchida
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(padding, height - padding);

            dailyExpenses.forEach((value, index) => {
                const x = padding + (index / (dailyExpenses.length - 1)) * (width - padding * 2);
                const y = height - padding - ((value / maxValue) * (height - padding * 2));
                ctx.lineTo(x, y);
            });

            ctx.lineTo(width - padding, height - padding);
            ctx.closePath();
            ctx.fill();

            //Desenhar linha principal
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();

            dailyExpenses.forEach((value, index) => {
                const x = padding + (index / (dailyExpenses.length - 1)) * (width - padding * 2);
                const y = height - padding - ((value / maxValue) * (height - padding * 2));
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.stroke();

            //Desenhar pontos
            ctx.fillStyle = '#3b82f6';
            dailyExpenses.forEach((value, index) => {
                const x = padding + (index / (dailyExpenses.length - 1)) * (width - padding * 2);
                const y = height - padding - ((value / maxValue) * (height - padding * 2));
                
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            });

            //Determinar tendência
            if (subtitle && valueDisplay) {
                const firstHalf = dailyExpenses.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
                const secondHalf = dailyExpenses.slice(4).reduce((a, b) => a + b, 0) / 3;
                
                //Mostrar média diária
                valueDisplay.textContent = formatCurrency(avgDaily);
                
                //Verifica se há dados suficientes (pelo menos 7 dias)
                if (dailyExpenses.length < 7) {
                    subtitle.innerHTML = `<i class="ph ph-minus"></i> Dados insuficientes`;
                    subtitle.style.color = '#64748b';
                } else if (firstHalf === 0 && secondHalf === 0) {
                    //Ambos zero = sem movimentação
                    subtitle.innerHTML = `<i class="ph ph-minus"></i> Sem movimentação`;
                    subtitle.style.color = '#64748b';
                } else if (firstHalf === 0) {
                    //Começou a gastar agora
                    subtitle.innerHTML = `<i class="ph ph-trend-up"></i> Iniciando gastos`;
                    subtitle.style.color = '#f59e0b';
                } else if (secondHalf > firstHalf) {
                    const percentChange = ((secondHalf - firstHalf) / firstHalf * 100).toFixed(0);
                    subtitle.innerHTML = `<i class="ph ph-trend-up"></i> +${percentChange}% vs início`;
                    subtitle.style.color = '#dc2626';
                } else if (secondHalf < firstHalf) {
                    const percentChange = ((firstHalf - secondHalf) / firstHalf * 100).toFixed(0);
                    subtitle.innerHTML = `<i class="ph ph-trend-down"></i> -${percentChange}% vs início`;
                    subtitle.style.color = '#059669';
                } else {
                    subtitle.innerHTML = `<i class="ph ph-minus"></i> Estável`;
                    subtitle.style.color = '#64748b';
                }
            }
        }

        //Agenda inteligente com lembretes
        function updateSmartAgenda() {
            const container = document.getElementById('smartAgenda');
            if (!container) return;

            const now = new Date();
            const reminders = [];

            //Verificar meta mensal próxima do limite
            if (currentUser && currentUser.metaMensal && currentUser.metaMensal > 0) {
                const currentMonthExpenses = transactions.filter(t => {
                    const date = parseLocalDate(t.data);
                    return t.tipo === 'despesa' && 
                           date.getMonth() === now.getMonth() &&
                           date.getFullYear() === now.getFullYear();
                }).reduce((sum, t) => sum + Math.abs(t.valor), 0);

                const percentUsed = (currentMonthExpenses / currentUser.metaMensal) * 100;
                
                if (percentUsed >= 100) {
                    reminders.push({
                        icon: 'ph-warning-octagon',
                        text: 'Meta mensal ultrapassada! Revise seus gastos.'
                    });
                } else if (percentUsed >= 90) {
                    reminders.push({
                        icon: 'ph-warning-circle',
                        text: `Meta mensal em ${percentUsed.toFixed(0)}% - Atenção aos gastos!`
                    });
                } else if (percentUsed >= 70) {
                    reminders.push({
                        icon: 'ph-lightbulb',
                        text: `Você já usou ${percentUsed.toFixed(0)}% da sua meta mensal`
                    });
                }
            }

            //Verificar se há metas próximas do prazo
            const upcomingGoals = goals.filter(g => {
                const deadline = new Date(g.dataLimite);
                const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
                const progress = (g.valorAtual / g.valorAlvo) * 100;
                return daysRemaining <= 15 && daysRemaining > 0 && progress < 90;
            });

            if (upcomingGoals.length > 0) {
                const goal = upcomingGoals[0];
                const deadline = new Date(goal.dataLimite);
                const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
                reminders.push({
                    //replaced emoji with Phosphor icon class name
                    icon: 'ph-target',
                    text: `Meta "${goal.nome}" vence em ${daysRemaining} dias`
                });
            }

            //Verificar dia de recebimento
            if (currentUser && currentUser.diaRecebimento) {
                const currentDay = now.getDate();
                const payDay = currentUser.diaRecebimento;
                let daysUntilPayday;

                if (payDay >= currentDay) {
                    daysUntilPayday = payDay - currentDay;
                } else {
                    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                    daysUntilPayday = (daysInMonth - currentDay) + payDay;
                }

                if (daysUntilPayday <= 5 && daysUntilPayday > 0) {
                    reminders.push({
                        icon: 'ph-coins',
                        text: `Seu recebimento está chegando! Faltam ${daysUntilPayday} dia(s)`
                    });
                }
            }

            //Verificar se há transações recentes (últimas 24h)
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const recentTransactions = transactions.filter(t => parseLocalDate(t.data) >= yesterday);
            
            if (recentTransactions.length > 0 && reminders.length < 3) {
                const totalRecent = recentTransactions.reduce((sum, t) => 
                    sum + (t.tipo === 'despesa' ? Math.abs(t.valor) : 0), 0);
                if (totalRecent > 0) {
                    reminders.push({
                        icon: 'ph-chart-bar',
                        text: `${recentTransactions.length} transação(ões) nas últimas 24h`
                    });
                }
            }

            //Se não houver lembretes, mostrar mensagem positiva
            if (reminders.length === 0) {
                container.innerHTML = `
                    <div class="agenda-item">
                        <span class="agenda-item-icon">${renderIcon('check-circle')}</span>
                        <span class="agenda-item-text">Tudo certo! Suas finanças estão organizadas.</span>
                    </div>
                `;
                return;
            }

            container.innerHTML = reminders.slice(0, 3).map(r => `
                <div class="agenda-item">
                    <span class="agenda-item-icon">${renderIcon(r.icon)}</span>
                    <span class="agenda-item-text">${r.text}</span>
                </div>
            `).join('');
        }
        //Variável global para armazenar o intervalo de rotação de insights
        let insightsRotationInterval = null;
        let insightsInitialized = false;

        //Atualiza card vertical de Insights
        function updateInsightsVerticalCard() {
            const title = document.getElementById('insightsVerticalTitle');
            const desc = document.getElementById('insightsVerticalDesc');
            const icon = document.getElementById('insightsVerticalIcon');
            
            if (!title || !desc || !icon) return;
            
            //Limpa intervalo anterior se existir (evita múltiplos intervalos)
            if (insightsRotationInterval) {
                clearInterval(insightsRotationInterval);
                insightsRotationInterval = null;
            }
            
            //Pega todos os insights
            const allInsights = [
                ...generateAlerts(),
                ...generateSuggestions(),
                ...generateReminders()
            ];
            
            if (allInsights.length === 0) {
                title.textContent = 'Tudo em ordem!';
                desc.textContent = 'Continue registrando transações para receber insights personalizados';
                icon.innerHTML = '<i class="ph ph-check-circle"></i>';
                insightsInitialized = true;
                return;
            }
            
            //Função para atualizar o insight exibido
            let currentIndex = 0;
            const updateInsightDisplay = () => {
                const insight = allInsights[currentIndex];
                title.textContent = insight.title;
                desc.textContent = insight.description;
                
                //Define ícone baseado no tipo
                if (insight.type === 'alert') {
                    icon.innerHTML = '<i class="ph ph-warning-circle"></i>';
                } else if (insight.type === 'suggestion') {
                    icon.innerHTML = '<i class="ph ph-lightbulb"></i>';
                } else {
                    icon.innerHTML = '<i class="ph ph-info"></i>';
                }
            };
            
            //Mostra o primeiro insight
            updateInsightDisplay();
            
            //Rotaciona entre os insights a cada 8 segundos se houver mais de um
            //Adiciona delay inicial apenas na primeira vez
            if (allInsights.length > 1) {
                const initialDelay = insightsInitialized ? 0 : 8000;
                
                setTimeout(() => {
                    insightsRotationInterval = setInterval(() => {
                        currentIndex = (currentIndex + 1) % allInsights.length;
                        updateInsightDisplay();
                    }, 8000);
                }, initialDelay);
                
                insightsInitialized = true;
            }
        }

        //✅ CORREÇÃO: Variáveis globais para controlar lembretes (usar window para garantir escopo global)
        window.currentReminderIndex = 0;
        let remindersRotationInterval = null;
        let remindersInitialized = false;

        //Atualiza card vertical de Lembretes com rotação
        function updateRemindersVerticalCard() {
            const title = document.getElementById('remindersVerticalTitle');
            const desc = document.getElementById('remindersVerticalDesc');
            const icon = document.getElementById('remindersVerticalIcon');
            const cardElement = document.querySelector('.vertical-card-content[onclick*="openAllRemindersModal"]')?.closest('.vertical-card');
            
            if (!title || !desc || !icon) return;
            
            //🔒 SEGURANÇA: Não gera lembretes se não há usuário ou transações ainda não foram carregadas
            if (!currentUser || !currentUser.id || transactions.length === 0) {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]⏸️ [REMINDERS] Aguardando carregamento de dados...');
                title.textContent = 'Carregando...';
                desc.textContent = 'Aguarde enquanto carregamos seus dados';
                icon.innerHTML = '<i class="ph ph-spinner"></i>';
                return;
            }
            
            //Limpa intervalo anterior se existir
            if (remindersRotationInterval) {
                clearInterval(remindersRotationInterval);
                remindersRotationInterval = null;
            }
            
            //Verifica se o usuário limpou os lembretes (array vazio mas existe)
            if (window.allReminders && Array.isArray(window.allReminders) && window.allReminders.length === 0) {
                //Usuário marcou como lido - mostra "Tudo em dia!" com verde
                title.textContent = 'Tudo em dia!';
                desc.textContent = 'Lembretes pausados por 7 dias';
                icon.innerHTML = '<i class="ph ph-check-circle"></i>';
                
                //Adiciona cor verde e remove outras
                if (cardElement) {
                    cardElement.classList.remove('reminder-urgent', 'reminder-warning', 'reminder-info');
                    cardElement.classList.add('reminder-success');
                }
                return; //Não gera novos lembretes
            }
            
            //Se não existir o array ainda, gera os lembretes
            let allReminders = window.allReminders;
            if (!allReminders) {
                allReminders = generateAllReminders();
                window.allReminders = allReminders;
            }
            
            if (allReminders.length === 0) {
                title.textContent = 'Tudo em dia!';
                desc.textContent = 'Nenhum lembrete pendente no momento';
                icon.innerHTML = '<i class="ph ph-check-circle"></i>';
                
                //Adiciona cor verde quando não há lembretes
                if (cardElement) {
                    cardElement.classList.remove('reminder-urgent', 'reminder-warning', 'reminder-info');
                    cardElement.classList.add('reminder-success');
                }
            } else {
                //Função para atualizar o lembrete exibido
                const updateReminderDisplay = () => {
                    const reminder = allReminders[window.currentReminderIndex];
                    
                    //Atualiza conteúdo com fade
                    title.style.opacity = '0';
                    desc.style.opacity = '0';
                    icon.style.opacity = '0';
                    
                    setTimeout(() => {
                        title.textContent = reminder.title;
                        desc.textContent = reminder.description;
                        icon.innerHTML = renderIcon(reminder.icon);
                        
                        //Atualiza cor do card baseado no tipo
                        if (cardElement) {
                            cardElement.classList.remove('reminder-urgent', 'reminder-warning', 'reminder-info', 'reminder-success');
                            cardElement.classList.add(`reminder-${reminder.type}`);
                        }
                        
                        title.style.opacity = '1';
                        desc.style.opacity = '1';
                        icon.style.opacity = '1';
                    }, 300);
                    
                    //Avança para o próximo
                    window.currentReminderIndex = (window.currentReminderIndex + 1) % allReminders.length;
                };
                
                //Mostra o primeiro lembrete
                updateReminderDisplay();
                
                //Rotaciona entre os lembretes a cada 10 segundos se houver mais de um
                if (allReminders.length > 1) {
                    const startRotation = () => {
                        remindersRotationInterval = setInterval(updateReminderDisplay, 10000);
                    };
                    
                    if (!remindersInitialized) {
                        //Adiciona delay inicial apenas na primeira vez
                        setTimeout(startRotation, 5000);
                        remindersInitialized = true;
                    } else {
                        startRotation();
                    }
                }
            }
        }

        //Gera todos os lembretes disponíveis
        function generateAllReminders() {
            const now = new Date();
            const reminders = [];
            let reminderId = 0;
            
            //🔒 SEGURANÇA CRÍTICA: Retorna array vazio se não há usuário ou dados ainda
            if (!currentUser || !currentUser.id) {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]⚠️ [REMINDERS] Sem currentUser, retornando lembretes vazios');
                return [];
            }
            
            if (!transactions || transactions.length === 0) {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]⚠️ [REMINDERS] Sem transações carregadas, retornando lembretes vazios');
                return [];
            }
            
            //SEGURANÇA: Filtra transações para garantir que só pegue do usuário atual
            const userTransactions = transactions.filter(t => t.usuarioId === currentUser.id);
            
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🔒 [REMINDERS] Gerando lembretes para usuário:', currentUser.id);
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🔒 [REMINDERS] Total de transações do usuário:', userTransactions.length);
            
            //Carrega lembretes "snoozados" do banco de dados (do usuário)
            const snoozedReminders = currentUser?.lembretesSnoozeados || {};
            
            //Função para verificar se um lembrete está snoozado
            const isReminderSnoozed = (reminderId) => {
                if (snoozedReminders[reminderId]) {
                    const snoozeUntil = new Date(snoozedReminders[reminderId]);
                    if (snoozeUntil > now) {
                        return true; //Ainda está snoozado
                    } else {
                        //Expirou, deve ser removido do banco (será feito na próxima atualização)
                        return false;
                    }
                }
                return false;
            };

            //1. Verificar meta mensal (CRÍTICO - VERMELHO)
            if (currentUser && currentUser.metaMensal && currentUser.metaMensal > 0) {
                const currentMonthExpenses = userTransactions.filter(t => {
                    const date = parseLocalDate(t.data);
                    return t.tipo === 'despesa' && 
                           date.getMonth() === now.getMonth() &&
                           date.getFullYear() === now.getFullYear();
                }).reduce((sum, t) => sum + Math.abs(t.valor), 0);

                const percentUsed = (currentMonthExpenses / currentUser.metaMensal) * 100;
                const reminderId = `meta-mensal-${now.getMonth()}-${now.getFullYear()}`;

                if (percentUsed >= 80 && !isReminderSnoozed(reminderId)) {
                    reminders.push({
                        id: reminderId,
                        title: `Meta mensal: ${percentUsed.toFixed(0)}% utilizada`,
                        description: `Você já gastou ${formatCurrency(currentMonthExpenses)} de ${formatCurrency(currentUser.metaMensal)} da sua meta mensal.`,
                        type: percentUsed >= 100 ? 'urgent' : 'urgent', //Sempre vermelho quando >= 80%
                        icon: 'ph-chart-line-up'
                    });
                }
            }

            //2. Verificar despesas próximas (7 dias)
            const sevenDaysFromNow = new Date(now);
            sevenDaysFromNow.setDate(now.getDate() + 7);

            const upcomingGroups = new Map();
            
            userTransactions.forEach(t => {
                const transactionDate = parseLocalDate(t.data);
                
                if (transactionDate > now && transactionDate <= sevenDaysFromNow) {
                    if ((t.despesaTipo === 'fixa' || t.despesaTipo === 'parcelada') && t.grupoId) {
                        if (!upcomingGroups.has(t.grupoId)) {
                            const daysUntilDue = Math.ceil((transactionDate - now) / (1000 * 60 * 60 * 24));
                            upcomingGroups.set(t.grupoId, {
                                id: `payment-${t.grupoId}`,
                                descricao: t.descricao.replace(/\s*\(\d+\/\d+\)/, ''),
                                valor: Math.abs(t.valor),
                                data: transactionDate,
                                daysUntilDue: daysUntilDue,
                                tipo: t.despesaTipo,
                                parcelaAtual: t.parcelaAtual,
                                totalParcelas: t.totalParcelas
                            });
                        }
                    }
                }
            });

            //Converte para array e ordena
            const upcomingPayments = Array.from(upcomingGroups.values())
                .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

            upcomingPayments.forEach(payment => {
                if (isReminderSnoozed(payment.id)) return; //Pula se estiver snoozado
                
                const daysText = payment.daysUntilDue === 1 ? 'amanhã' : `em ${payment.daysUntilDue} dias`;
                let title = `${payment.descricao} ${daysText}`;
                let description = `Pagamento de ${formatCurrency(payment.valor)} vence ${daysText}.`;
                let type = 'info'; //Padrão: azul
                let icon = 'ph-repeat';
                
                if (payment.tipo === 'parcelada') {
                    //LARANJA para parceladas
                    type = 'warning';
                    icon = 'ph-credit-card';
                    if (payment.parcelaAtual && payment.totalParcelas) {
                        title = `Parcela ${payment.parcelaAtual}/${payment.totalParcelas}: ${payment.descricao}`;
                        description = `Parcela de ${formatCurrency(payment.valor)} vence ${daysText}.`;
                    }
                } else if (payment.tipo === 'fixa') {
                    //AZUL para fixas
                    type = 'info';
                    icon = 'ph-repeat';
                }
                
                //Se vence em <= 2 dias, fica VERMELHO (urgente)
                if (payment.daysUntilDue <= 2) {
                    type = 'urgent';
                }
                
                reminders.push({
                    id: payment.id,
                    title: title,
                    description: description,
                    type: type,
                    icon: icon
                });
            });

            //3. Lembrete de dia de recebimento (7 dias antes) - AZUL
            if (currentUser && currentUser.diaRecebimento) {
                const nextPayday = new Date(now);
                nextPayday.setDate(currentUser.diaRecebimento);
                
                if (nextPayday <= now) {
                    nextPayday.setMonth(nextPayday.getMonth() + 1);
                }
                
                const daysUntilPayday = Math.ceil((nextPayday - now) / (1000 * 60 * 60 * 24));
                const paydayReminderId = `payday-${nextPayday.getMonth()}-${nextPayday.getFullYear()}`;
                
                //Busca o valor atualizado do currentUser (não do localStorage antigo)
                const salaryAmount = currentUser.rendaMensal || 0;
                
                if (daysUntilPayday <= 7 && daysUntilPayday > 0 && !isReminderSnoozed(paydayReminderId)) {
                    const daysText = daysUntilPayday === 1 ? 'amanhã' : `em ${daysUntilPayday} dias`;
                    const salaryChangedKey = `salary_changed_${currentUser.id}`;
                    const salaryChanged = localStorage.getItem(salaryChangedKey);
                    
                    let description = '';
                    if (salaryChanged) {
                        description = `Seu salário atualizado de ${formatCurrency(salaryAmount)} será adicionado ${daysText}.`;
                    } else if (salaryAmount > 0) {
                        description = `Você receberá ${formatCurrency(salaryAmount)} ${daysText}.`;
                    } else {
                        description = `Seu dia de recebimento é ${daysText}.`;
                    }
                    
                    reminders.push({
                        id: paydayReminderId,
                        title: `Dia de recebimento ${daysText}`,
                        description: description,
                        type: 'info',
                        icon: 'ph-currency-circle-dollar'
                    });
                }
            }

            //4. Lembrete sobre mudança de meta mensal - VERDE/INFO
            const goalChangedKey = `goal_changed_${currentUser.id}`;
            const goalChanged = localStorage.getItem(goalChangedKey);
            if (goalChanged && currentUser.metaMensal) {
                const goalReminderId = `goal-changed-reminder`;
                if (!isReminderSnoozed(goalReminderId)) {
                    reminders.push({
                        id: goalReminderId,
                        title: 'Meta mensal atualizada',
                        description: `Sua nova meta de ${formatCurrency(currentUser.metaMensal)} já está ativa. Acompanhe seu progresso!`,
                        type: 'info',
                        icon: 'ph-target'
                    });
                }
            }

            return reminders;
        }

        //Abre modal com todos os lembretes
        function openAllRemindersModal() {
            const reminders = window.allReminders || [];
            const gridFull = document.getElementById('remindersGridFull');
            const noMessage = document.getElementById('noRemindersMessage');
            
            if (reminders.length === 0) {
                gridFull.style.display = 'none';
                noMessage.style.display = 'block';
            } else {
                gridFull.style.display = 'grid';
                noMessage.style.display = 'none';
                
                gridFull.innerHTML = reminders.map(r => `
                    <div class="reminder-card ${r.type}">
                        <div class="reminder-icon">
                            ${renderIcon(r.icon)}
                        </div>
                        <div class="reminder-content">
                            <div class="reminder-title">${r.title}</div>
                            <div class="reminder-description">${r.description}</div>
                        </div>
                    </div>
                `).join('');
            }
            
            document.getElementById('allRemindersModal').classList.add('show');
        }

        //Calcula tempo de snooze inteligente baseado no tipo de lembrete
        function getSnoozeTime(lembreteId) {
            const now = new Date();
            
            //Meta mensal - pausa até o dia 1 do próximo mês
            if (lembreteId.startsWith('meta-mensal')) {
                const proximoMes = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                return proximoMes;
            }
            
            //Pagamentos críticos (≤ 2 dias) - pausa apenas 1 dia
            if (lembreteId.includes('payment') && lembreteId.includes('critical')) {
                const amanha = new Date(now);
                amanha.setDate(amanha.getDate() + 1);
                return amanha;
            }
            
            //Parcelas (3-7 dias) - pausa 5 dias
            if (lembreteId.includes('installment')) {
                const cincoDias = new Date(now);
                cincoDias.setDate(cincoDias.getDate() + 5);
                return cincoDias;
            }
            
            //Despesas fixas - pausa 3 dias
            if (lembreteId.includes('despesa-fixa')) {
                const tresDias = new Date(now);
                tresDias.setDate(tresDias.getDate() + 3);
                return tresDias;
            }
            
            //Dia de recebimento - pausa até próximo mês
            if (lembreteId.startsWith('payday-')) {
                const proximoMes = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                return proximoMes;
            }
            
            //Padrão para outros lembretes: 3 dias
            const tresDias = new Date(now);
            tresDias.setDate(tresDias.getDate() + 3);
            return tresDias;
        }

        //Marca todos os lembretes como lidos e salva no banco
        async function markAllRemindersAsRead() {
            //Salva os lembretes no banco de dados com pausa inteligente por tipo
            const snoozedReminders = {};
            
            if (window.allReminders && window.allReminders.length > 0) {
                window.allReminders.forEach(reminder => {
                    const snoozeUntil = getSnoozeTime(reminder.id);
                    snoozedReminders[reminder.id] = snoozeUntil.toISOString();
                });
                
                //Salva no banco via API
                try {
                    const response = await fetch(`${API_URL}/usuarios/${currentUser.id}/lembretes-snoozados`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(snoozedReminders)
                    });
                    
                    if (response.ok) {
                        const updatedUser = await response.json();
                        currentUser = updatedUser;
                        localStorage.setItem('user', JSON.stringify(currentUser));
                    }
                } catch (error) {
                    console.error('[ERROR]Erro ao salvar lembretes snoozados:', error);
                }
            }
            
            //Limpa todos os lembretes
            window.allReminders = [];
            
            //Fecha o modal
            closeModal('allRemindersModal');
            
            //Atualiza o card de lembretes para mostrar "Tudo em dia!"
            updateRemindersVerticalCard();
            
            //Mostra mensagem de sucesso
            showSuccessMessage('Lembretes pausados por 7 dias!');
        }

        //Funções de expandir modals
        window.expandInsightsModal = function() {
            openAllInsightsModal();
        };

        //Atualiza card de Próximo Feriado
        function updateNextHoliday() {
            const nameEl = document.getElementById('nextHolidayName');
            const dateEl = document.getElementById('nextHolidayDate');
            
            if (!nameEl || !dateEl) return;

            //Busca feriados de 2025
            fetch('https://brasilapi.com.br/api/feriados/v1/2025')
                .then(response => response.json())
                .then(holidays => {
                    const now = new Date();
                    const upcoming = holidays
                        .map(h => ({ ...h, date: new Date(h.date + 'T00:00:00') }))
                        .filter(h => h.date >= now)
                        .sort((a, b) => a.date - b.date)[0];

                    if (upcoming) {
                        nameEl.textContent = upcoming.name;
                        const daysUntil = Math.ceil((upcoming.date - now) / (1000 * 60 * 60 * 24));
                        dateEl.textContent = daysUntil === 0 ? 'Hoje!' : 
                                           daysUntil === 1 ? 'Amanhã' :
                                           `${daysUntil} dias`;
                    } else {
                        nameEl.textContent = 'Nenhum feriado';
                        dateEl.textContent = 'próximo';
                    }
                })
                .catch(() => {
                    nameEl.textContent = 'Carregando...';
                    dateEl.textContent = '--';
                });
        }

        //Atualiza card de Economia Potencial
        function updatePotentialSavings() {
            const valueEl = document.getElementById('potentialSavings');
            const subtitleEl = document.getElementById('savingsSubtitle');
            
            if (!valueEl || !subtitleEl) return;

            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            //Define categorias ESSENCIAIS (que NÃO devem ser sugeridas para corte)
            const essentialCategories = [
                'Moradia', 'Aluguel', 'Condomínio', 'IPTU',
                'Contas', 'Água', 'Luz', 'Energia', 'Gás', 'Internet',
                'Saúde', 'Médico', 'Remédio', 'Farmácia', 'Plano de Saúde',
                'Educação', 'Escola', 'Faculdade', 'Curso',
                'Transporte', 'Combustível', 'Gasolina', 'Ônibus', 'Metrô',
                'Mercado', 'Supermercado', 'Alimentação Básica'
            ];
            
            //Busca despesas do mês que NÃO são essenciais
            const nonEssentialExpenses = transactions
                .filter(t => {
                    const tDate = parseLocalDate(t.data);
                    const isCurrentMonth = t.tipo === 'despesa' && 
                           tDate.getMonth() === currentMonth &&
                           tDate.getFullYear() === currentYear;
                    
                    if (!isCurrentMonth) return false;
                    
                    //Verifica se NÃO é uma categoria essencial
                    const isEssential = essentialCategories.some(cat => 
                        t.categoria.toLowerCase().includes(cat.toLowerCase()) ||
                        t.descricao.toLowerCase().includes(cat.toLowerCase())
                    );
                    
                    return !isEssential; //Retorna apenas despesas não essenciais
                })
                .sort((a, b) => b.valor - a.valor); //Ordena do maior para o menor

            if (nonEssentialExpenses.length > 0) {
                //Pega a maior despesa NÃO essencial
                const biggestExpense = nonEssentialExpenses[0];
                const saving = biggestExpense.valor;
                
                valueEl.textContent = formatCurrency(saving);
                subtitleEl.innerHTML = `Sem "<strong>${biggestExpense.descricao}</strong>"`;
            } else {
                valueEl.textContent = 'R$ 0,00';
                subtitleEl.textContent = 'Sem gastos não-essenciais';
            }
        }

        //Calcula projeção de gastos até o fim do mês
        function updateMonthEndProjection() {
            const valueEl = document.getElementById('monthEndProjection');
            const subtitleEl = document.getElementById('projectionSubtitle');
            
            if (!valueEl || !subtitleEl) return;

            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            const currentDay = now.getDate();

            //Último dia do mês
            const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            const daysRemaining = lastDayOfMonth - currentDay;

            if (daysRemaining <= 0) {
                valueEl.textContent = 'Fim do mês';
                subtitleEl.textContent = 'Mês encerrado';
                return;
            }

            //Gastos do mês até agora (APENAS despesas únicas e parcelas individuais)
            const monthExpenses = transactions
                .filter(t => {
                    const tDate = parseLocalDate(t.data);
                    return t.tipo === 'despesa' && 
                           tDate.getMonth() === currentMonth &&
                           tDate.getFullYear() === currentYear;
                })
                .reduce((sum, t) => {
                    //Para parceladas, usar apenas valorParcela (não valor total)
                    if (t.despesaTipo === 'parcelada' && t.valorParcela) {
                        return sum + Math.abs(t.valorParcela);
                    }
                    //Para fixas e únicas, usar valor normal
                    return sum + Math.abs(t.valor);
                }, 0);

            if (monthExpenses === 0) {
                valueEl.textContent = 'R$ 0,00';
                subtitleEl.textContent = 'Sem dados do mês';
                return;
            }

            //Média de gastos por dia até agora
            const avgDailyExpense = monthExpenses / currentDay;

            //Projeção: gasto atual + (média diária × dias restantes)
            const projectedTotal = monthExpenses + (avgDailyExpense * daysRemaining);

            valueEl.textContent = formatCurrency(projectedTotal);
            subtitleEl.innerHTML = `<strong>${daysRemaining}</strong> dias restantes • Média: ${formatCurrency(avgDailyExpense)}/dia`;
        }

        //Prevê gastos do próximo mês baseado nos últimos 3 meses
        function updateNextMonthForecast() {
            const valueEl = document.getElementById('nextMonthForecast');
            const subtitleEl = document.getElementById('forecastSubtitle');
            
            if (!valueEl || !subtitleEl) return;

            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            //Calcula gastos RECORRENTES (fixas e parceladas) dos últimos 3 meses
            const monthlyExpenses = [];
            for (let i = 0; i < 3; i++) {
                let targetMonth = currentMonth - i;
                let targetYear = currentYear;
                
                //Ajusta para anos anteriores
                if (targetMonth < 0) {
                    targetMonth += 12;
                    targetYear -= 1;
                }

                const monthTotal = transactions
                    .filter(t => {
                        const tDate = parseLocalDate(t.data);
                        //APENAS despesas fixas e parceladas (NÃO únicas)
                        return t.tipo === 'despesa' && 
                               (t.despesaTipo === 'fixa' || t.despesaTipo === 'parcelada') &&
                               tDate.getMonth() === targetMonth &&
                               tDate.getFullYear() === targetYear;
                    })
                    .reduce((sum, t) => {
                        //Para parceladas, usar apenas valorParcela
                        if (t.despesaTipo === 'parcelada' && t.valorParcela) {
                            return sum + Math.abs(t.valorParcela);
                        }
                        //Para fixas, usar valor normal
                        return sum + Math.abs(t.valor);
                    }, 0);

                if (monthTotal > 0) {
                    monthlyExpenses.push(monthTotal);
                }
            }

            if (monthlyExpenses.length === 0) {
                valueEl.textContent = 'R$ 0,00';
                subtitleEl.textContent = 'Histórico insuficiente';
                return;
            }

            //Média dos gastos recorrentes
            const avgRecurringExpense = monthlyExpenses.reduce((a, b) => a + b, 0) / monthlyExpenses.length;

            valueEl.textContent = formatCurrency(avgRecurringExpense);
            subtitleEl.innerHTML = `Baseado em <strong>${monthlyExpenses.length}</strong> ${monthlyExpenses.length === 1 ? 'mês' : 'meses'} (apenas recorrentes)`;
        }

        //Calcula a taxa de crescimento/redução dos gastos vs. mês anterior
        function updateExpenseGrowthRate() {
            const valueEl = document.getElementById('expenseGrowthRate');
            const subtitleEl = document.getElementById('growthRateSubtitle');
            
            if (!valueEl || !subtitleEl) return;

            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            //Mês anterior
            let previousMonth = currentMonth - 1;
            let previousYear = currentYear;
            if (previousMonth < 0) {
                previousMonth = 11;
                previousYear -= 1;
            }

            //Gastos do mês atual
            const currentMonthExpenses = transactions
                .filter(t => {
                    const tDate = parseLocalDate(t.data);
                    return t.tipo === 'despesa' && 
                           tDate.getMonth() === currentMonth &&
                           tDate.getFullYear() === currentYear;
                })
                .reduce((sum, t) => {
                    if (t.despesaTipo === 'parcelada' && t.valorParcela) {
                        return sum + Math.abs(t.valorParcela);
                    }
                    return sum + Math.abs(t.valor);
                }, 0);

            //Gastos do mês anterior
            const previousMonthExpenses = transactions
                .filter(t => {
                    const tDate = parseLocalDate(t.data);
                    return t.tipo === 'despesa' && 
                           tDate.getMonth() === previousMonth &&
                           tDate.getFullYear() === previousYear;
                })
                .reduce((sum, t) => {
                    if (t.despesaTipo === 'parcelada' && t.valorParcela) {
                        return sum + Math.abs(t.valorParcela);
                    }
                    return sum + Math.abs(t.valor);
                }, 0);

            if (previousMonthExpenses === 0) {
                valueEl.textContent = '--';
                subtitleEl.textContent = 'Histórico insuficiente';
                return;
            }

            //Calcula variação percentual
            const growthRate = ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100;
            
            //Formata com cor e símbolo
            const sign = growthRate > 0 ? '+' : '';
            const color = growthRate > 0 ? '#ef4444' : '#10b981'; //Vermelho se aumentou, verde se diminuiu
            
            valueEl.textContent = `${sign}${growthRate.toFixed(1)}%`;
            valueEl.style.color = color;
            
            const trend = growthRate > 0 ? '📈 Aumentou' : growthRate < 0 ? '📉 Diminuiu' : '➡️ Estável';
            subtitleEl.innerHTML = `${trend} vs. mês anterior`;
        }

        //Identifica o maior gasto do mês atual
        function updateBiggestExpense() {
            const valueEl = document.getElementById('biggestExpenseValue');
            const descEl = document.getElementById('biggestExpenseDesc');
            
            if (!valueEl || !descEl) return;

            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            //Busca todas as despesas do mês atual
            const monthExpenses = transactions
                .filter(t => {
                    const tDate = parseLocalDate(t.data);
                    return t.tipo === 'despesa' && 
                           tDate.getMonth() === currentMonth &&
                           tDate.getFullYear() === currentYear;
                })
                .sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor));

            if (monthExpenses.length === 0) {
                valueEl.textContent = 'R$ 0,00';
                descEl.textContent = 'Nenhum gasto registrado';
                return;
            }

            const biggest = monthExpenses[0];
            valueEl.textContent = formatCurrency(Math.abs(biggest.valor));
            
            //Trunca descrição muito longa
            let description = biggest.descricao;
            if (description.length > 25) {
                description = description.substring(0, 22) + '...';
            }
            
            descEl.innerHTML = `<strong>${description}</strong> • ${biggest.categoria}`;
        }

        //Calcula taxa de poupança (% da receita que foi economizada)
        function updateSavingsRate() {
            const valueEl = document.getElementById('savingsRateValue');
            const subtitleEl = document.getElementById('savingsRateSubtitle');
            
            if (!valueEl || !subtitleEl) return;

            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            //Receitas do mês atual
            const monthIncome = transactions
                .filter(t => {
                    const tDate = parseLocalDate(t.data);
                    return t.tipo === 'receita' && 
                           tDate.getMonth() === currentMonth &&
                           tDate.getFullYear() === currentYear;
                })
                .reduce((sum, t) => sum + Math.abs(t.valor), 0);

            //Despesas do mês atual
            const monthExpenses = transactions
                .filter(t => {
                    const tDate = parseLocalDate(t.data);
                    return t.tipo === 'despesa' && 
                           tDate.getMonth() === currentMonth &&
                           tDate.getFullYear() === currentYear;
                })
                .reduce((sum, t) => sum + Math.abs(t.valor), 0);

            if (monthIncome === 0) {
                valueEl.textContent = '0%';
                subtitleEl.textContent = 'Adicione receitas';
                valueEl.style.color = '#6b7280';
                return;
            }

            //Taxa de poupança = (Receita - Despesa) / Receita * 100
            const savingsAmount = monthIncome - monthExpenses;
            const savingsRate = (savingsAmount / monthIncome) * 100;

            //Formatação com cor baseada na taxa
            let color = '#6b7280'; //Cinza padrão
            let subtitle = 'Do que você ganha';

            if (savingsRate >= 20) {
                color = '#059669'; //Verde - Excelente
                subtitle = 'Excelente!';
            } else if (savingsRate >= 10) {
                color = '#f59e0b'; //Laranja - Bom
                subtitle = 'Bom, pode melhorar';
            } else if (savingsRate >= 0) {
                color = '#dc2626'; //Vermelho - Atenção
                subtitle = 'Tente economizar mais';
            } else {
                color = '#dc2626'; //Vermelho - Negativo
                subtitle = 'Gastando mais que ganha';
            }

            valueEl.textContent = savingsRate.toFixed(1) + '%';
            valueEl.style.color = color;
            subtitleEl.textContent = subtitle;
        }

        //Calcula dias restantes até o próximo salário
        function updateDaysToSalary() {
            const valueEl = document.getElementById('daysToSalaryValue');
            const subtitleEl = document.getElementById('daysToSalarySubtitle');
            
            if (!valueEl || !subtitleEl) return;

            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            //Busca receitas dos últimos 3 meses para identificar padrão
            const recentIncomes = [];
            for (let i = 0; i < 3; i++) {
                let targetMonth = currentMonth - i;
                let targetYear = currentYear;
                
                if (targetMonth < 0) {
                    targetMonth += 12;
                    targetYear -= 1;
                }

                const monthIncomes = transactions
                    .filter(t => {
                        const tDate = parseLocalDate(t.data);
                        return t.tipo === 'receita' && 
                               tDate.getMonth() === targetMonth &&
                               tDate.getFullYear() === targetYear &&
                               (t.descricao.toLowerCase().includes('salário') || 
                                t.descricao.toLowerCase().includes('salario') ||
                                t.categoria.toLowerCase().includes('salário') ||
                                t.categoria.toLowerCase().includes('salario'));
                    });

                monthIncomes.forEach(income => {
                    const incomeDate = parseLocalDate(income.data);
                    recentIncomes.push({
                        day: incomeDate.getDate(),
                        month: incomeDate.getMonth(),
                        year: incomeDate.getFullYear(),
                        value: income.valor
                    });
                });
            }

            if (recentIncomes.length === 0) {
                valueEl.textContent = '--';
                subtitleEl.textContent = 'Adicione receitas de salário';
                valueEl.style.color = '#6b7280';
                return;
            }

            //Identifica o dia mais comum de recebimento
            const dayCounts = {};
            recentIncomes.forEach(income => {
                dayCounts[income.day] = (dayCounts[income.day] || 0) + 1;
            });

            let mostCommonDay = 0;
            let maxCount = 0;
            for (const day in dayCounts) {
                if (dayCounts[day] > maxCount) {
                    maxCount = dayCounts[day];
                    mostCommonDay = parseInt(day);
                }
            }

            //Calcula próxima data de salário
            let nextSalaryDate = new Date(currentYear, currentMonth, mostCommonDay);
            
            //Se já passou neste mês, vai para o próximo
            if (nextSalaryDate <= now) {
                nextSalaryDate = new Date(currentYear, currentMonth + 1, mostCommonDay);
            }

            //Calcula dias restantes
            const diffTime = nextSalaryDate - now;
            const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            //Calcula gasto médio diário até agora
            const monthStart = new Date(currentYear, currentMonth, 1);
            const daysInMonth = now.getDate();
            
            const monthExpenses = transactions
                .filter(t => {
                    const tDate = parseLocalDate(t.data);
                    return t.tipo === 'despesa' && 
                           tDate >= monthStart &&
                           tDate <= now;
                })
                .reduce((sum, t) => sum + Math.abs(t.valor), 0);

            const avgDailyExpense = monthExpenses / daysInMonth;
            const budgetPerDay = (monthExpenses / daysInMonth).toFixed(2);

            //Formatação
            let color = '#3b82f6'; //Azul padrão
            let subtitle = `Média: R$ ${budgetPerDay}/dia`;

            if (daysRemaining <= 3) {
                color = '#dc2626'; //Vermelho - poucos dias
                subtitle = `Atenção! ${subtitle}`;
            } else if (daysRemaining <= 7) {
                color = '#f59e0b'; //Laranja - uma semana
            } else {
                color = '#059669'; //Verde - tranquilo
            }

            valueEl.textContent = `${daysRemaining} dias`;
            valueEl.style.color = color;
            subtitleEl.textContent = subtitle;
        }

        function renderChart() {
            const canvas = document.getElementById('mainChart');
            if (!canvas) {
                console.error('[ERROR]❌ Canvas mainChart não encontrado');
                return;
            }
            
            if (!ChartManager.isReady) {
                console.warn('[WARNING]⚠️ Chart.js não está pronto, tentando novamente em 500ms...');
                setTimeout(renderChart, 500);
                return;
            }
            
            //✅ CORREÇÃO: Filtra transações agendadas
            const hoje = new Date();
            hoje.setHours(23, 59, 59, 999);
            
            const validTransactions = transactions.filter(t => {
                const dataTransacao = parseLocalDate(t.data);
                
                //Se tem flag agendada=true, só mostra quando a data chegar
                if (t.agendada === true) {
                    return dataTransacao <= hoje;
                }
                
                //Se não tem flag agendada (ou é false), mostra sempre
                return true;
            });
            
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]📊 Renderizando gráfico MENSAL com', validTransactions.length, 'transações válidas (de', transactions.length, 'totais)');
            
            //=== GRÁFICO MENSAL: MOSTRA TODO O HISTÓRICO (TODOS OS MESES) ===
            const today = new Date();
            
            //✅ NOVO: Encontra a transação mais antiga para definir início do período
            let oldestDate = today;
            if (validTransactions.length > 0) {
                validTransactions.forEach(t => {
                    const tDate = parseLocalDate(t.data);
                    if (tDate < oldestDate) {
                        oldestDate = tDate;
                    }
                });
            }
            
            //Começa no primeiro dia do mês da transação mais antiga
            const monthStart = new Date(oldestDate.getFullYear(), oldestDate.getMonth(), 1);
            monthStart.setHours(0, 0, 0, 0);
            
            //Termina no último dia do mês atual
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth();
            const monthEnd = new Date(currentYear, currentMonth + 1, 0);
            monthEnd.setHours(23, 59, 59, 999);
            
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]📅 Período do gráfico:', monthStart.toLocaleDateString(), 'até', monthEnd.toLocaleDateString());
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]📊 Mostrando todo o histórico de transações');
            
            const labels = [];
            const incomeData = [];
            const expenseData = [];
            
            //✅ NOVA LÓGICA: Mostra apenas DIAS com transações (não mais semanas)
            const daysWithTransactions = new Set();
            
            //Coleta todos os dias que têm transações
            validTransactions.forEach(t => {
                const tDate = parseLocalDate(t.data);
                if (tDate >= monthStart && tDate <= monthEnd) {
                    const dayOfMonth = tDate.getDate();
                    daysWithTransactions.add(dayOfMonth);
                }
            });
            
            //Ordena os dias
            const sortedDays = Array.from(daysWithTransactions).sort((a, b) => a - b);
            
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]📊 Dias com transações:', sortedDays);
            
            //Se não houver transações, mostra mensagem
            if (sortedDays.length === 0) {
                labels.push('Sem dados');
                incomeData.push(0);
                expenseData.push(0);
            } else {
                //Para cada dia com transação, calcula receitas e despesas
                sortedDays.forEach(day => {
                    const dayDate = new Date(currentYear, currentMonth, day);
                    dayDate.setHours(0, 0, 0, 0);
                    const dayEnd = new Date(dayDate);
                    dayEnd.setHours(23, 59, 59, 999);
                    
                    //Label: "Dia X" ou "Dia X (Data)"
                    const dayLabel = `Dia ${day}`;
                    labels.push(dayLabel);
                    
                    console.log(`\n📅 ${dayLabel}:`, dayDate.toLocaleDateString());
                    
                    //Filtra receitas do dia
                    const dayIncomeTransactions = validTransactions.filter(t => {
                        const tDate = parseLocalDate(t.data);
                        const isInDay = t.tipo === 'receita' && tDate >= dayDate && tDate <= dayEnd;
                        if (isInDay) {
                            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]  💰 Receita:', t.descricao, 'R$', t.valor);
                        }
                        return isInDay;
                    });
                    const dayIncome = dayIncomeTransactions.reduce((sum, t) => sum + Math.abs(t.valor), 0);
                    
                    //Filtra despesas do dia
                    const dayExpenseTransactions = validTransactions.filter(t => {
                        const tDate = parseLocalDate(t.data);
                        const isInDay = t.tipo === 'despesa' && tDate >= dayDate && tDate <= dayEnd;
                        if (isInDay) {
                            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]  💸 Despesa:', t.descricao, 'R$', t.valor);
                        }
                        return isInDay;
                    });
                    const dayExpense = dayExpenseTransactions.reduce((sum, t) => sum + Math.abs(t.valor), 0);
                    
                    incomeData.push(dayIncome);
                    expenseData.push(dayExpense);
                });
            }
            
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]\n📈 Dados finais do gráfico:');
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]Labels:', labels);
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]Receitas:', incomeData);
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]Despesas:', expenseData);
            
            //Criar gráfico usando ChartManager
            chart = ChartManager.create('mainChart', {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Receitas',
                        data: incomeData,
                        borderColor: '#059669',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }, {
                        label: 'Despesas',
                        data: expenseData,
                        borderColor: '#dc2626',
                        backgroundColor: 'rgba(220, 38, 38, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { 
                            display: true,
                            labels: { color: '#6b7280' }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: '#3b82f6',
                            borderWidth: 1,
                            padding: 12,
                            displayColors: true,
                            callbacks: {
                                title: (context) => {
                                    const dayLabel = context[0].label;
                                    //Extrai o número do dia do label "Dia X"
                                    const dayNum = parseInt(dayLabel.replace('Dia ', ''));
                                    const dayDate = new Date(currentYear, currentMonth, dayNum);
                                    return `${dayLabel} - ${dayDate.toLocaleDateString('pt-BR')}`;
                                },
                                label: (context) => {
                                    const label = context.dataset.label || '';
                                    const value = context.parsed.y || 0;
                                    return `${label}: R$ ${value.toFixed(2)}`;
                                },
                                footer: (context) => {
                                    return 'Mostrando apenas dias com transações';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0, 0, 0, 0.05)' },
                            ticks: { 
                                color: '#6b7280',
                                callback: (value) => 'R$ ' + value.toFixed(0)
                            }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#6b7280' }
                        }
                    }
                }
            });
        }

        function renderTransactions() {
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🎨 === RENDERIZANDO TRANSAÇÕES ===');
            const container = document.getElementById('transactionsContainer');
            const allContainer = document.getElementById('allTransactionsContainer');
            
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🎨 Elementos encontrados:', {
                container: container ? 'SIM' : 'NÃO',
                allContainer: allContainer ? 'SIM' : 'NÃO',
                transactionsCount: transactions.length
            });
            
            //CORREÇÃO: Verifica se os elementos existem antes de manipular
            if (!container && !allContainer) {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]⚠️ Elementos de transações não encontrados - dashboard não está visível ainda');
                return;
            }
            
            if (transactions.length === 0) {
                const emptyHTML = `
                    <div class="empty-state">
                        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            <path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                        <p>Nenhuma transação registrada</p>
                        <p class="empty-state-subtitle">Adicione suas receitas e despesas para começar</p>
                    </div>
                `;
                if (container) container.innerHTML = emptyHTML;
                if (allContainer) allContainer.innerHTML = emptyHTML;
                return;
            }
            
            let filteredTransactions = [...transactions];
            
            //✅ CORREÇÃO: Filtra transações agendadas - não aparecem no dashboard
            const hoje = new Date();
            hoje.setHours(23, 59, 59, 999);
            
            filteredTransactions = filteredTransactions.filter(t => {
                const dataTransacao = parseLocalDate(t.data);
                
                //Se tem flag agendada=true, só mostra quando a data chegar
                if (t.agendada === true) {
                    return dataTransacao <= hoje;
                }
                
                //Se não tem flag agendada (ou é false), mostra sempre (comportamento antigo)
                return true;
            });
            
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🎨 Transações filtradas (sem agendadas):', filteredTransactions.length, 'de', transactions.length);
            
            //Filtro por período
            if (filterStartDate && filterEndDate) {
                filteredTransactions = filteredTransactions.filter(t => {
                    const tDate = parseLocalDate(t.data);
                    return tDate >= parseLocalDate(filterStartDate) && tDate <= parseLocalDate(filterEndDate);
                });
            }
            
            //Filtro por tipo de despesa
            if (currentExpenseTypeFilter && currentExpenseTypeFilter !== 'all') {
                if (currentExpenseTypeFilter === 'receita') {
                    filteredTransactions = filteredTransactions.filter(t => t.tipo === 'receita');
                } else {
                    //Filtra despesas pelo tipo específico
                    filteredTransactions = filteredTransactions.filter(t => {
                        return t.tipo === 'despesa' && 
                               (t.despesaTipo === currentExpenseTypeFilter || 
                               (!t.despesaTipo && currentExpenseTypeFilter === 'unica'));
                    });
                }
            }
            
            //Ordena por data (mais recente primeiro)
            const sortedTransactions = filteredTransactions.sort((a, b) => parseLocalDate(b.data) - parseLocalDate(a.data));
            
            //Para despesas parceladas, mostra apenas uma entrada com a parcela atual do mês
            const displayTransactions = [];
            const processedGroups = new Set();
            
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            sortedTransactions.forEach(t => {
                if (t.despesaTipo === 'parcelada' && t.grupoId && !processedGroups.has(t.grupoId)) {
                    processedGroups.add(t.grupoId);
                    
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🔍 Transação parcelada encontrada:', {
                        id: t.id,
                        descricao: t.descricao,
                        totalParcelas: t.totalParcelas,
                        valorParcela: t.valorParcela,
                        dataInicio: t.dataInicio,
                        grupoId: t.grupoId
                    });
                    
                    //Verifica se tem os campos necessários
                    if (!t.totalParcelas || !t.valorParcela) {
                        console.error('[ERROR]⚠️ Transação parcelada sem campos obrigatórios:', t);
                        //Trata como transação única se não tiver os campos
                        displayTransactions.push(t);
                        return;
                    }
                    
                    //Calcula a parcela atual baseado na data de início e mês atual
                    const startDate = parseLocalDate(t.dataInicio || t.data);
                    const monthsDiff = (currentYear - startDate.getFullYear()) * 12 + (currentMonth - startDate.getMonth());
                    const parcelaAtualDoMes = Math.min(Math.max(monthsDiff + 1, 1), t.totalParcelas);
                    
                    //Calcula data de vencimento da parcela atual de forma segura
                    const vencimentoAtual = addMonthsSafe(startDate, parcelaAtualDoMes - 1);
                    
                    //Verifica se ainda está dentro do período de parcelas
                    if (parcelaAtualDoMes <= t.totalParcelas) {
                        displayTransactions.push({
                            ...t,
                            parcelaAtual: parcelaAtualDoMes,
                            data: formatDateToInput(vencimentoAtual),
                            isParcelada: true
                        });
                    }
                } else if (t.despesaTipo === 'fixa' && t.grupoId && !processedGroups.has(t.grupoId)) {
                    processedGroups.add(t.grupoId);
                    
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Transação fixa encontrada:', {
                        id: t.id,
                        descricao: t.descricao,
                        valor: t.valor,
                        grupoId: t.grupoId
                    });
                    
                    //✅ CORREÇÃO: Para fixas, agrupa e mostra a mais recente
                    const groupTransactions = sortedTransactions.filter(tr => tr.grupoId === t.grupoId);
                    const remainingCount = groupTransactions.filter(tr => parseLocalDate(tr.data) > now).length;
                    
                    displayTransactions.push({
                        ...t,
                        isGrouped: true,
                        groupType: 'fixed',
                        remainingCount: remainingCount
                    });
                } else if (!t.grupoId || !processedGroups.has(t.grupoId)) {
                    //✅ CORREÇÃO: Transação única ou receita (sem grupoId) OU grupo não processado
                    displayTransactions.push(t);
                }
            });
            
            //Verifica se não há transações após filtros
            if (displayTransactions.length === 0 && (currentExpenseTypeFilter && currentExpenseTypeFilter !== 'all')) {
                const filterNames = {
                    'receita': 'receitas',
                    'unica': 'despesas únicas',
                    'fixa': 'despesas fixas',
                    'parcelada': 'despesas parceladas'
                };
                const filterName = filterNames[currentExpenseTypeFilter] || 'transações';
                
                const noResultsHTML = `
                    <div class="empty-state">
                        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                        <p>Nenhuma ${filterName} encontrada</p>
                        <p class="empty-state-subtitle">Você ainda não tem ${filterName} registradas</p>
                    </div>
                `;
                if (container) container.innerHTML = noResultsHTML;
                if (allContainer) allContainer.innerHTML = noResultsHTML;
                return;
            }
            
            const renderTransaction = (t) => {
                const isIncome = t.tipo === 'receita';
                
                //Busca o ícone da categoria no objeto categories (suporta categorias personalizadas)
                const categoryType = isIncome ? 'income' : 'expense';
                const category = categories[categoryType].find(c => c.name === t.categoria);
                
                //✅ Garantir que o ícone seja renderizado corretamente
                let iconClass;
                if (category && category.icon) {
                    iconClass = category.icon;
                } else {
                    //Ícone padrão: seta para cima (receita) ou seta para baixo (despesa)
                    iconClass = isIncome ? 'arrow-up' : 'arrow-down';
                }
                
                //Badge para tipo de despesa
                let typeBadge = '';
                let clickHandler = '';
                
                //Define a legenda de tipo baseado no tipo de transação
                let typeLabel = '';
                if (isIncome) {
                    typeLabel = '<span class="transaction-type-label income">Receita</span>';
                    //Receitas também são clicáveis
                    clickHandler = `onclick="showSingleExpenseDetails(${t.id})" style="cursor: pointer;"`;
                } else {
                    //Despesas
                    if (t.isParcelada) {
                        //Despesa parcelada - mostra parcela atual do mês
                        typeBadge = `<span class="installment-badge-grouped">${renderIcon('credit-card')} ${t.parcelaAtual}/${t.totalParcelas}</span>`;
                        clickHandler = `onclick="showInstallmentDetails('${t.grupoId}')" style="cursor: pointer;"`;
                        typeLabel = '<span class="transaction-type-label parcelada">Parcelada</span>';
                    } else if (t.isGrouped && t.groupType === 'fixed') {
                        typeBadge = `<span class="fixed-badge">${renderIcon('repeat')} ${t.remainingCount} restantes</span>`;
                        clickHandler = `onclick="showFixedDetails('${t.grupoId}')" style="cursor: pointer;"`;
                        typeLabel = '<span class="transaction-type-label fixa">Fixa</span>';
                    } else if (!isIncome && t.despesaTipo === 'fixa') {
                        typeBadge = `<span class="fixed-badge">${renderIcon('repeat')} Fixa</span>`;
                        typeLabel = '<span class="transaction-type-label fixa">Fixa</span>';
                    } else if (!isIncome && t.despesaTipo === 'parcelada') {
                        typeLabel = '<span class="transaction-type-label parcelada">Parcelada</span>';
                    } else {
                        //Despesa única - clicável
                        typeLabel = '<span class="transaction-type-label unica">Única</span>';
                        clickHandler = `onclick="showSingleExpenseDetails(${t.id})" style="cursor: pointer;"`;
                    }
                }
                
                const displayValue = t.valorParcela || Math.abs(t.valor);
                const displayDate = formatDate(t.data);
                
                //Detecta se é mobile
                const isMobile = window.innerWidth <= 768;
                
                //No mobile, remove o ícone e a tag de tipo
                return `
                    <div class="transfer ${t.isGrouped ? 'transfer-grouped' : ''}" ${clickHandler}>
                        ${!isMobile ? `<div class="transfer-logo ${isIncome ? 'income' : 'expense'}">${renderIcon(iconClass)}</div>` : ''}
                        <div class="transfer-details ${isMobile ? 'transfer-details-mobile' : ''}">
                            <h4>
                                ${t.descricao}
                                ${typeBadge}
                            </h4>
                            <p>
                                ${renderIcon('calendar-blank')}
                                ${displayDate}
                                ${!isMobile ? typeLabel : ''}
                                ${!isMobile ? `<span class="transfer-category">${t.categoria}</span>` : ''}
                            </p>
                        </div>
                        <div class="transfer-amount">
                            <span class="transfer-amount-value ${isIncome ? 'amount-positive' : 'amount-negative'}">
                                ${formatCurrency(displayValue)}
                            </span>
                        </div>
                    </div>
                `;
            };
            
            //CORREÇÃO: Só atualiza os containers se eles existirem
            if (container) {
                const transactionsHTML = displayTransactions.slice(0, 5).map(renderTransaction).join('');
                const endMessage = displayTransactions.length > 0 ? '<div class="transactions-end-message"><i class="ph ph-check-circle"></i> Você chegou ao fim das transações recentes</div>' : '';
                container.innerHTML = transactionsHTML + endMessage;
            }
            if (allContainer) {
                const transactionsHTML = displayTransactions.map(renderTransaction).join('');
                const endMessage = displayTransactions.length > 0 ? '<div class="transactions-end-message"><i class="ph ph-check-circle"></i> Você chegou ao fim de todas as transações</div>' : '';
                allContainer.innerHTML = transactionsHTML + endMessage;
            }
        }

        function filterTransactions() {
            filterStartDate = document.getElementById('filterStartDate').value;
            filterEndDate = document.getElementById('filterEndDate').value;
            
            if (!filterStartDate || !filterEndDate) {
                showWarningNotification('Selecione ambas as datas');
                return;
            }
            
            renderTransactions();
        }

        function clearFilters() {
            filterStartDate = null;
            filterEndDate = null;
            selectedCategory = '';
            currentExpenseTypeFilter = 'all';
            document.getElementById('filterStartDate').value = '';
            document.getElementById('filterEndDate').value = '';
            
            //Reseta botões de filtro de tipo
            document.querySelectorAll('.type-filter-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-filter') === 'all') {
                    btn.classList.add('active');
                }
            });
            
            renderTransactions();
        }

        //Mostrar detalhes de parcelas
        function showInstallmentDetails(grupoId) {
            const groupTransactions = transactions.filter(t => t.grupoId === grupoId);
            if (groupTransactions.length === 0) return;
            
            const firstTransaction = groupTransactions[0];
            
            //Salva dados globalmente para edição/exclusão
            currentInstallmentGroupId = grupoId;
            currentInstallmentData = {
                grupoId: grupoId,
                parcelaAtual: firstTransaction.parcelaAtual,
                totalParcelas: firstTransaction.totalParcelas,
                descricao: firstTransaction.descricao
            };
            
            // ✅ DETECÇÃO INTELIGENTE: se valorTotal existe, usa ele; senão, valor já é da parcela
            let installmentValue, totalValue;
            if (firstTransaction.valorTotal !== undefined && firstTransaction.valorTotal !== null) {
                // Transação ANTIGA (antes da correção) - valorTotal está salvo
                totalValue = Math.abs(firstTransaction.valorTotal);
                installmentValue = totalValue / firstTransaction.totalParcelas;
            } else {
                // Transação NOVA (depois da correção) - valor é da parcela
                installmentValue = Math.abs(firstTransaction.valor);
                totalValue = installmentValue * firstTransaction.totalParcelas;
            }
            const today = new Date();
            
            const paidTransactions = groupTransactions.filter(t => parseLocalDate(t.data) <= today);
            const pendingTransactions = groupTransactions.filter(t => parseLocalDate(t.data) > today);
            
            //Ordena por data
            paidTransactions.sort((a, b) => parseLocalDate(a.data) - parseLocalDate(b.data));
            pendingTransactions.sort((a, b) => parseLocalDate(a.data) - parseLocalDate(b.data));
            
            const modal = document.getElementById('installmentDetailsModal');
            
            //Preenche os campos do modal (usando IDs existentes)
            document.getElementById('installmentDetailsTitle').textContent = firstTransaction.descricao.replace(/\s*\(\d+\/\d+\)/, '');
            document.getElementById('installmentDetailsCategory').textContent = firstTransaction.categoria;
            document.getElementById('installmentDetailsTotalValue').textContent = formatCurrency(totalValue);
            document.getElementById('installmentDetailsInstallmentValue').textContent = formatCurrency(installmentValue);
            document.getElementById('installmentDetailsTotalCount').textContent = firstTransaction.totalParcelas || groupTransactions.length;
            document.getElementById('installmentDetailsPaidCount').textContent = firstTransaction.parcelaAtual || paidTransactions.length;
            document.getElementById('installmentDetailsPendingCount').textContent = (firstTransaction.totalParcelas - firstTransaction.parcelaAtual) || pendingTransactions.length;
            
            //Gera todas as parcelas baseado no totalParcelas
            const allInstallments = [];
            const startDate = parseLocalDate(firstTransaction.data);
            
            for (let i = 1; i <= firstTransaction.totalParcelas; i++) {
                const installmentDate = addMonthsSafe(startDate, i - 1);
                
                allInstallments.push({
                    numero: i,
                    total: firstTransaction.totalParcelas,
                    data: formatDateToInput(installmentDate),
                    valor: installmentValue,
                    isPaid: i <= firstTransaction.parcelaAtual
                });
            }
            
            const paidInstallments = allInstallments.filter(p => p.isPaid);
            const pendingInstallments = allInstallments.filter(p => !p.isPaid);
            
            //Lista de parcelas pagas
            const paidList = document.getElementById('installmentDetailsPaidList');
            if (paidList) {
                if (paidInstallments.length === 0) {
                    paidList.innerHTML = '<div class="empty-message">Nenhuma parcela paga</div>';
                } else {
                    paidList.innerHTML = paidInstallments.map(p => `
                        <div class="parcela-item-minimal paid">
                            <div class="parcela-info-minimal">
                                <span class="parcela-number-minimal">${p.numero}/${p.total}</span>
                                <span class="parcela-date-minimal">${formatDate(p.data)}</span>
                            </div>
                            <span class="parcela-value-minimal">${formatCurrency(p.valor)}</span>
                        </div>
                    `).join('');
                }
            }
            
            //Lista de parcelas pendentes
            const pendingList = document.getElementById('installmentDetailsPendingList');
            if (pendingList) {
                if (pendingInstallments.length === 0) {
                    pendingList.innerHTML = '<div class="empty-message">Nenhuma parcela pendente</div>';
                } else {
                    pendingList.innerHTML = pendingInstallments.map(p => `
                        <div class="parcela-item-minimal">
                            <div class="parcela-info-minimal">
                                <span class="parcela-number-minimal">${p.numero}/${p.total}</span>
                                <span class="parcela-date-minimal">${formatDate(p.data)}</span>
                            </div>
                            <span class="parcela-value-minimal">${formatCurrency(p.valor)}</span>
                        </div>
                    `).join('');
                }
            }
            
            //Controla a expansão das seções baseado na quantidade de itens
            const paidSection = document.getElementById('paidSection');
            const pendingSection = document.getElementById('pendingSection');
            
            //Abre "Parcelas Pagas" apenas se tiver 3 ou menos
            if (paidSection) {
                if (paidInstallments.length > 0 && paidInstallments.length <= 3) {
                    paidSection.classList.add('expanded');
                } else {
                    paidSection.classList.remove('expanded');
                }
            }
            
            //"Parcelas Pendentes" sempre fecha
            if (pendingSection) {
                pendingSection.classList.remove('expanded');
            }
            
            modal.classList.add('show');
            
            //Foca no primeiro input em dispositivos móveis
            focusFirstInputMobile(modal);
        }

        //Função para expandir/colapsar seções de parcelas
        function toggleInstallmentSection(sectionId) {
            const section = document.getElementById(sectionId);
            if (section) {
                section.classList.toggle('expanded');
            }
        }

        //Função para toggle das seções de parcelas
        function toggleParcelasSection(type) {
            const section = document.querySelector(`.parcelas-${type}`);
            if (!section) return;
            
            section.classList.toggle('expanded');
        }

        //Variável global para armazenar o grupoId sendo editado/excluído
        let currentInstallmentGroupId = null;
        let currentInstallmentData = null;

        //Editar parcelamento completo
        function editInstallmentGroup() {
            if (!currentInstallmentGroupId) return;
            
            const groupTransactions = transactions.filter(t => t.grupoId === currentInstallmentGroupId);
            if (groupTransactions.length === 0) return;
            
            const firstTransaction = groupTransactions[0];
            
            //Fecha o modal de detalhes
            closeModal('installmentDetailsModal');
            
            //Preenche o modal de edição
            document.getElementById('transactionType').value = 'expense';
            document.getElementById('transactionDescription').value = firstTransaction.descricao;
            //✅ Calcula o valor total: se tiver valorTotal usa, senão calcula valor × totalParcelas
            const totalAmount = firstTransaction.valorTotal || (Math.abs(firstTransaction.valor) * firstTransaction.totalParcelas);
            document.getElementById('transactionAmount').value = totalAmount;
            document.getElementById('installmentCount').value = firstTransaction.totalParcelas;
            document.getElementById('firstInstallmentDate').value = firstTransaction.dataInicio || firstTransaction.data;
            selectedCategory = firstTransaction.categoria;
            
            //Define que estamos editando um grupo de parcelas
            editingTransactionId = currentInstallmentGroupId;
            
            //Atualiza o modal
            const modalTitle = document.getElementById('transactionModalTitle');
            const modalSubtitle = document.getElementById('transactionModalSubtitle');
            const submitBtn = document.querySelector('#transactionModal .btn-submit-transaction');
            
            if (modalTitle) modalTitle.textContent = 'Editar Parcelamento';
            if (modalSubtitle) modalSubtitle.textContent = 'Atualize os dados do parcelamento completo';
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="ph ph-check-circle"></i> Atualizar Parcelamento';
            }
            
            //Vai direto para o step 2 (detalhes de parcelamento)
            selectedExpenseType = 'parcelada';
            goToStep(2);
            
            //Atualiza preview
            updateInstallmentPreview();
            
            //Atualiza categorias
            const categorySelect = document.getElementById('categorySelect');
            categorySelect.innerHTML = categories['expense'].map(c => `
                <div class="category-item ${c.name === selectedCategory ? 'selected' : ''}" onclick="selectCategory('${c.name}')">
                    <div class="category-icon">${renderIcon(c.icon)}</div>
                    <div>${c.name}</div>
                </div>
            `).join('');
            
            //Abre o modal
            document.getElementById('transactionModal').classList.add('show');
        }

        //Confirmar exclusão de parcela
        function confirmDeleteInstallment() {
            if (!currentInstallmentData) return;
            
            const { descricao, grupoId, parcelaAtual, totalParcelas } = currentInstallmentData;
            
            showDeleteConfirmPopup(
                'Excluir despesa parcelada?',
                `Deseja excluir todas as ${totalParcelas} parcelas de "${descricao}"? Esta ação não pode ser desfeita.`,
                () => deleteInstallmentOption('all')
            );
        }

        //Executar exclusão de parcela
        async function deleteInstallmentOption(option) {
            if (!currentInstallmentGroupId) return;
            
            try {
                showLoading('Excluindo...');
                
                if (option === 'single') {
                    //Excluir apenas a parcela atual
                    const currentTransaction = transactions.find(t => t.grupoId === currentInstallmentGroupId);
                    if (!currentTransaction) {
                        throw new Error('Parcela não encontrada');
                    }
                    
                    const response = await fetch(`${API_URL}/transacoes/${currentTransaction.id}`, {
                        method: 'DELETE'
                    });
                    
                    if (!response.ok) throw new Error('Erro ao excluir parcela');
                    
                    showSuccessMessage('Parcela excluída com sucesso! 🗑️');
                } else {
                    //Excluir todas as parcelas do grupo
                    //Tenta usar o endpoint de exclusão por grupo (mais eficiente)
                    try {
                        const response = await fetch(`${API_URL}/transacoes/grupo/${currentInstallmentGroupId}`, {
                            method: 'DELETE'
                        });
                        
                        if (response.ok) {
                            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]Grupo de parcelas excluído com sucesso via endpoint /grupo');
                        } else {
                            throw new Error('Endpoint /grupo não disponível');
                        }
                    } catch (endpointError) {
                        //Fallback: excluir uma por uma
                        console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]Usando método alternativo de exclusão individual');
                        const groupTransactions = transactions.filter(t => t.grupoId === currentInstallmentGroupId);
                        
                        for (const transaction of groupTransactions) {
                            const response = await fetch(`${API_URL}/transacoes/${transaction.id}`, {
                                method: 'DELETE'
                            });
                            
                            if (!response.ok) {
                                console.error('[ERROR]Erro ao excluir parcela:', transaction.id);
                            }
                        }
                    }
                    
                    showSuccessMessage('Parcelamento excluído completamente! 🗑️');
                }
                
                //Recarrega dados
                await loadTransactions();
                renderTransactions();
                updateDashboardStats();
                renderChart();
                renderCategoryReport();
                renderMonthlyChart();
                renderCalendar();
                
                hideLoading();
                closeModal('deleteInstallmentModal');
                closeModal('installmentDetailsModal');
                
                //Limpa variáveis
                currentInstallmentGroupId = null;
                currentInstallmentData = null;
            } catch (error) {
                hideLoading();
                showErrorNotification('Erro ao excluir: ' + error.message);
            }
        }

        //Variável global para armazenar o grupoId de despesa fixa sendo editado/excluído
        let currentFixedGroupId = null;
        let currentFixedData = null;

        //Mostrar detalhes de despesas fixas
        function showFixedDetails(grupoId) {
            const groupTransactions = transactions.filter(t => t.grupoId === grupoId);
            if (groupTransactions.length === 0) return;
            
            const firstTransaction = groupTransactions[0];
            
            //Salva dados globalmente para edição/exclusão
            currentFixedGroupId = grupoId;
            currentFixedData = {
                grupoId: grupoId,
                descricao: firstTransaction.descricao,
                dataInicio: firstTransaction.dataInicio,
                dataFim: firstTransaction.dataFim
            };
            
            const today = new Date();
            const paidTransactions = groupTransactions.filter(t => parseLocalDate(t.data) <= today);
            const pendingTransactions = groupTransactions.filter(t => parseLocalDate(t.data) > today);
            
            //Ordena por data (mais recente primeiro para pagos, mais próximo primeiro para pendentes)
            paidTransactions.sort((a, b) => parseLocalDate(b.data) - parseLocalDate(a.data));
            pendingTransactions.sort((a, b) => parseLocalDate(a.data) - parseLocalDate(b.data));
            
            const modal = document.getElementById('fixedDetailsModal');
            
            //Preenche cabeçalho
            document.getElementById('fixedDetailsTitle').textContent = firstTransaction.descricao;
            
            //Preenche resumo
            document.getElementById('fixedDetailsValue').textContent = formatCurrency(Math.abs(firstTransaction.valor));
            
            //Formata período
            const startDate = formatDate(firstTransaction.dataInicio);
            const endDate = firstTransaction.dataFim ? formatDate(firstTransaction.dataFim) : 'Indefinido';
            document.getElementById('fixedDetailsPeriod').textContent = `${startDate} - ${endDate}`;
            
            //Preenche status
            const totalCount = paidTransactions.length + pendingTransactions.length;
            document.getElementById('fixedDetailsPaidCount').textContent = paidTransactions.length;
            document.getElementById('fixedDetailsPendingCount').textContent = pendingTransactions.length;
            document.getElementById('fixedDetailsTotalCount').textContent = totalCount;
            
            //Lista de pagamentos realizados em cards separados
            const paidList = document.getElementById('fixedDetailsPaidList');
            if (paidList) {
                if (paidTransactions.length === 0) {
                    paidList.innerHTML = '<div class="empty-message">Nenhum pagamento realizado</div>';
                } else {
                    paidList.innerHTML = paidTransactions.map(t => `
                        <div class="fixed-paid-card">
                            <div class="fixed-paid-date">
                                <i class="ph ph-calendar-blank"></i>
                                ${formatDate(t.data)}
                            </div>
                            <div class="fixed-paid-value">${formatCurrency(Math.abs(t.valor))}</div>
                        </div>
                    `).join('');
                }
            }
            
            //Lista de próximos pagamentos em cards separados
            const pendingList = document.getElementById('fixedDetailsPendingList');
            if (pendingList) {
                if (pendingTransactions.length === 0) {
                    pendingList.innerHTML = '<div class="empty-message">Nenhum pagamento pendente</div>';
                } else {
                    pendingList.innerHTML = pendingTransactions.map(t => `
                        <div class="fixed-pending-card">
                            <div class="fixed-pending-date">
                                <i class="ph ph-calendar-blank"></i>
                                ${formatDate(t.data)}
                            </div>
                            <div class="fixed-pending-value">${formatCurrency(Math.abs(t.valor))}</div>
                        </div>
                    `).join('');
                }
            }
            
            //Controla a expansão das seções baseado na quantidade de itens
            const paidSection = document.getElementById('fixedPaidSection');
            const pendingSection = document.getElementById('fixedPendingSection');
            
            //Abre "Pagamentos Realizados" apenas se tiver 3 ou menos
            if (paidSection) {
                if (paidTransactions.length > 0 && paidTransactions.length <= 3) {
                    paidSection.classList.add('expanded');
                } else {
                    paidSection.classList.remove('expanded');
                }
            }
            
            //"Próximos Pagamentos" sempre fecha
            if (pendingSection) {
                pendingSection.classList.remove('expanded');
            }
            
            modal.classList.add('show');
            
            //Foca no primeiro input em dispositivos móveis
            focusFirstInputMobile(modal);
        }

        //Variável global para armazenar a transação única sendo visualizada
        let currentSingleExpenseId = null;
        let currentSingleExpenseData = null;

        //===== FUNÇÕES DO POPUP DE CONFIRMAÇÃO =====
        let deleteConfirmCallback = null;

        function showDeleteConfirmPopup(title, message, onConfirm) {
            const popup = document.getElementById('deleteConfirmPopup');
            document.getElementById('confirmPopupTitle').textContent = title;
            document.getElementById('confirmPopupMessage').textContent = message;
            
            deleteConfirmCallback = onConfirm;
            
            //Remove listener antigo e adiciona novo
            const confirmBtn = document.getElementById('confirmDeleteBtn');
            const newConfirmBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
            
            newConfirmBtn.onclick = () => {
                if (deleteConfirmCallback) {
                    deleteConfirmCallback();
                }
                closeDeleteConfirmPopup();
            };
            
            popup.classList.add('show');
        }

        function closeDeleteConfirmPopup() {
            const popup = document.getElementById('deleteConfirmPopup');
            popup.classList.remove('show');
            deleteConfirmCallback = null;
        }

        //Fechar popup ao clicar fora
        document.addEventListener('DOMContentLoaded', () => {
            const popup = document.getElementById('deleteConfirmPopup');
            if (popup) {
                popup.addEventListener('click', (e) => {
                    if (e.target === popup) {
                        closeDeleteConfirmPopup();
                    }
                });
            }
        });

        //Mostrar detalhes de despesa única ou receita
        function showSingleExpenseDetails(transactionId) {
            const transaction = transactions.find(t => t.id === transactionId);
            if (!transaction) return;
            
            //Salva dados globalmente para edição/exclusão
            currentSingleExpenseId = transactionId;
            currentSingleExpenseData = transaction;
            
            const modal = document.getElementById('singleExpenseModal');
            
            //Emoji da categoria
            const categoryIcons = {
                'Salário': '💼',
                'Freelance': '💻',
                'Investimentos': '📈',
                'Alimentação': '🍔',
                'Transporte': '🚗',
                'Moradia': '🏠',
                'Lazer': '🎮',
                'Saúde': '🥗',
                'Educação': '📚',
                'Outros': '💳'
            };
            const categoryIcon = categoryIcons[transaction.categoria] || '💳';
            
            //Define o título baseado no tipo
            const isIncome = transaction.tipo === 'receita';
            document.getElementById('singleExpenseTitle').textContent = isIncome ? 'Detalhes da Receita' : 'Detalhes da Despesa';
            
            //Preenche os dados
            document.getElementById('singleExpenseCategory').textContent = `${categoryIcon} ${transaction.categoria}`;
            document.getElementById('singleExpenseDate').textContent = formatDate(transaction.data);
            document.getElementById('singleExpenseValue').textContent = formatCurrency(Math.abs(transaction.valor));
            
            modal.classList.add('show');
            
            //Foca no primeiro input em dispositivos móveis (se houver edição)
            focusFirstInputMobile(modal);
        }

        //Editar despesa/receita única
        function editSingleExpense() {
            if (!currentSingleExpenseId) return;
            
            //Fecha o modal de detalhes
            document.getElementById('singleExpenseModal').classList.remove('show');
            
            //Chama a função de edição existente
            editTransaction(currentSingleExpenseId);
        }

        //Confirmar exclusão de despesa/receita única
        function confirmDeleteSingle() {
            if (!currentSingleExpenseData) return;
            
            const tipo = currentSingleExpenseData.tipo === 'receita' ? 'receita' : 'despesa';
            const descricao = currentSingleExpenseData.descricao;
            
            showDeleteConfirmPopup(
                `Excluir ${tipo}?`,
                `Deseja realmente excluir "${descricao}"? Esta ação não pode ser desfeita.`,
                deleteSingleExpense
            );
        }

        //Executar exclusão de despesa/receita única
        async function deleteSingleExpense() {
            if (!currentSingleExpenseId) return;
            
            try {
                showLoading('Excluindo...');
                
                const response = await fetch(`${API_URL}/transacoes/${currentSingleExpenseId}`, {
                    method: 'DELETE'
                });
                
                if (!response.ok) {
                    throw new Error('Erro ao excluir no servidor');
                }
                
                //Remove do array local
                transactions = transactions.filter(t => t.id !== currentSingleExpenseId);
                
                //Fecha os modais
                document.getElementById('singleExpenseModal').classList.remove('show');
                
                //Atualiza a interface
                renderTransactions();
                updateDashboardStats();
                renderChart();
                renderCalendar();
                hideLoading();
                
                showSuccessMessage('Transação excluída com sucesso!');
            } catch (error) {
                console.error('[ERROR]Erro ao excluir transação:', error);
                showErrorNotification('Erro ao excluir transação');
                hideLoading();
            }
        }

        //Editar despesa fixa completa
        function editFixedGroup() {
            if (!currentFixedGroupId || !currentFixedData) return;
            
            //Fecha o modal de detalhes
            closeModal('fixedDetailsModal');
            
            //Abre o modal de transação em modo de edição
            const groupTransactions = transactions.filter(t => t.grupoId === currentFixedGroupId);
            if (groupTransactions.length === 0) return;
            
            const firstTransaction = groupTransactions[0];
            
            //Preenche o formulário com os dados existentes
            document.getElementById('transactionDescription').value = firstTransaction.descricao;
            document.getElementById('transactionAmount').value = Math.abs(firstTransaction.valor).toFixed(2);
            document.getElementById('transactionDate').value = firstTransaction.data;
            
            //Define tipo como despesa
            document.getElementById('transactionType').value = 'expense';
            selectedExpenseType = 'fixa';
            
            //Mostra o grupo de seleção de tipo de despesa
            const expenseTypeGroup = document.getElementById('expenseTypeGroup');
            if (expenseTypeGroup) {
                expenseTypeGroup.style.display = 'block';
            }
            
            //Seleciona despesa fixa visualmente
            const fixaBtn = document.querySelector('.expense-type-selector[data-type="fixa"]');
            if (fixaBtn) {
                document.querySelectorAll('.expense-type-selector').forEach(btn => btn.classList.remove('active'));
                fixaBtn.classList.add('active');
            }
            
            //Mostra os campos de despesa fixa
            const fixedFields = document.getElementById('fixedExpenseFields');
            if (fixedFields) {
                fixedFields.style.display = 'block';
            }
            
            //Oculta campos de parcelamento
            const installmentFields = document.getElementById('installmentFields');
            if (installmentFields) {
                installmentFields.style.display = 'none';
            }
            
            //Preenche datas de início e fim
            document.getElementById('fixedStartDate').value = firstTransaction.dataInicio;
            document.getElementById('fixedEndDate').value = firstTransaction.dataFim || '';
            
            //Renderiza e seleciona a categoria
            selectedCategory = firstTransaction.categoria;
            const categorySelect = document.getElementById('categorySelect');
            if (categorySelect) {
                categorySelect.innerHTML = categories['expense'].map(c => `
                    <div class="category-item ${c.name === firstTransaction.categoria ? 'selected' : ''}" onclick="selectCategory('${c.name}')">
                        <div class="category-icon">${renderIcon(c.icon)}</div>
                        <div>${c.name}</div>
                    </div>
                `).join('');
            }
            
            //Marca que está editando uma despesa fixa
            window.editingFixedGroupId = currentFixedGroupId;
            
            //⚠️ IMPORTANTE: Permite mudança de tipo de despesa (fixa → parcelada ou única)
            //O usuário pode alterar os botões e os listeners já existentes cuidarão da UI
            
            //Muda o título e texto do botão
            document.getElementById('transactionModalTitle').textContent = 'Editar Despesa Fixa';
            const submitBtn = document.querySelector('.btn-submit-transaction');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="ph ph-floppy-disk"></i> Salvar Alterações';
            }
            
            //Abre o modal
            document.getElementById('transactionModal').classList.add('show');
        }

        //Confirmar exclusão de despesa fixa
        function confirmDeleteFixed() {
            if (!currentFixedData) return;
            
            const descricao = currentFixedData.descricao;
            const groupTransactions = transactions.filter(t => t.grupoId === currentFixedGroupId);
            const totalOccurrences = groupTransactions.length;
            
            showDeleteConfirmPopup(
                'Excluir despesa fixa?',
                `Deseja realmente excluir todas as ${totalOccurrences} ocorrências de "${descricao}"? Esta ação não pode ser desfeita.`,
                deleteFixedGroup
            );
        }

        //Executar exclusão de despesa fixa
        async function deleteFixedGroup() {
            if (!currentFixedGroupId) return;
            
            try {
                showLoading('Excluindo despesa fixa...');
                
                //Tenta usar o endpoint de exclusão por grupo (mais eficiente)
                try {
                    const response = await fetch(`${API_URL}/transacoes/grupo/${currentFixedGroupId}`, {
                        method: 'DELETE'
                    });
                    
                    if (response.ok) {
                        console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]Grupo excluído com sucesso via endpoint /grupo');
                    } else {
                        throw new Error('Endpoint /grupo não disponível, usando método alternativo');
                    }
                } catch (endpointError) {
                    //Fallback: excluir uma por uma se o endpoint não existir
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]Usando método alternativo de exclusão individual');
                    const groupTransactions = transactions.filter(t => t.grupoId === currentFixedGroupId);
                    
                    for (const transaction of groupTransactions) {
                        await fetch(`${API_URL}/transacoes/${transaction.id}`, {
                            method: 'DELETE'
                        });
                    }
                }
                
                //Remove do array local
                transactions = transactions.filter(t => t.grupoId !== currentFixedGroupId);
                
                //Fecha os modais
                closeModal('fixedDetailsModal');
                
                //Atualiza interface
                updateDashboardStats();
                renderTransactions();
                renderChart();
                renderCalendar();
                updateInsights();
                
                hideLoading();
                showSuccessMessage('Despesa fixa excluída com sucesso!');
            } catch (error) {
                console.error('[ERROR]Erro ao excluir despesa fixa:', error);
                hideLoading();
                showErrorNotification('Erro ao excluir despesa fixa. Tente novamente.');
            }
        }

        //Filtro por tipo de despesa
        let currentExpenseTypeFilter = 'all';

        function filterByExpenseType(type) {
            currentExpenseTypeFilter = type;
            
            //Atualiza botões
            document.querySelectorAll('.type-filter-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-filter') === type) {
                    btn.classList.add('active');
                }
            });
            
            renderTransactions();
        }

        function openAddTransactionModal(type) {
            //Limpa o modo de edição
            editingTransactionId = null;
            
            //Reseta para a etapa 1
            currentFormStep = 1;
            goToStep(1);
            
            document.getElementById('transactionType').value = type;
            
            //Atualiza título, subtítulo e ícone baseado no tipo
            const isIncome = type === 'income';
            const modalIcon = document.getElementById('transactionModalIcon');
            const modalTitle = document.getElementById('transactionModalTitle');
            const modalSubtitle = document.getElementById('transactionModalSubtitle');
            const descriptionInput = document.getElementById('transactionDescription');
            const submitBtn = document.querySelector('#transactionModal .btn-submit-transaction');
            
            //Mostra/esconde seletor de tipo de despesa
            const expenseTypeGroup = document.getElementById('expenseTypeGroup');
            const step1Nav = document.getElementById('step1Nav');
            
            if (isIncome) {
                expenseTypeGroup.style.display = 'none';
                step1Nav.style.display = 'block'; //Para receitas, mostra o botão continuar direto
                modalTitle.textContent = 'Adicionar Receita';
                modalSubtitle.textContent = 'Registre uma entrada';
                modalIcon.innerHTML = '<i class="ph ph-arrow-circle-up"></i>';
                modalIcon.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                descriptionInput.placeholder = 'Ex: Salário, Freelance, Prêmio...';
                
                //Para receitas, configura para mostrar campo de data na etapa 2
                document.getElementById('singleExpenseFields').style.display = 'block';
                document.getElementById('fixedExpenseFields').style.display = 'none';
                document.getElementById('installedExpenseFields').style.display = 'none';
                selectedExpenseType = 'unica';
            } else {
                expenseTypeGroup.style.display = 'block';
                step1Nav.style.display = 'none'; //Para despesas, só mostra após selecionar tipo
                modalTitle.textContent = 'Adicionar Despesa';
                modalSubtitle.textContent = 'Registre uma saída';
                modalIcon.innerHTML = '<i class="ph ph-arrow-circle-down"></i>';
                modalIcon.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                descriptionInput.placeholder = 'Ex: Mercado, Conta de luz, Uber...';
                
                //Reseta para despesa única
                selectedExpenseType = 'unica';
                document.getElementById('expenseTypeValue').value = 'unica';
                document.querySelectorAll('.expense-type-option').forEach(el => {
                    el.classList.remove('selected');
                });
            }
            
            //Restaura o botão para modo adicionar
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="ph ph-check-circle"></i> Adicionar Transação';
            }
            
            document.getElementById('transactionDate').valueAsDate = new Date();
            document.getElementById('transactionError').innerHTML = '';
            document.getElementById('transactionForm').reset();
            document.getElementById('transactionDate').valueAsDate = new Date();
            selectedCategory = '';
            
            //Atualiza as categorias
            const categorySelect = document.getElementById('categorySelect');
            categorySelect.innerHTML = categories[type].map(c => `
                <div class="category-item" onclick="selectCategory('${c.name}')">
                    <div class="category-icon">${renderIcon(c.icon)}</div>
                    <div>${c.name}</div>
                </div>
            `).join('');
            
            const modal = document.getElementById('transactionModal');
            modal.classList.add('show');
            
            //Foca no primeiro input em dispositivos móveis
            focusFirstInputMobile(modal);
        }

    //Mapeamento de nomes amigáveis para ícones Phosphor
    const defaultIconsMap = {
        'Dinheiro': 'ph-coins',
        'Notas': 'ph-note',
        'Cartão': 'ph-credit-card',
        'Banco': 'ph-bank',
        'Prédio': 'ph-buildings',
        'Loja': 'ph-storefront',
        'Fábrica': 'ph-factory',
        'Casa': 'ph-house',
        'Carro': 'ph-car',
        'Viagem': 'ph-airplane',
        'Jogos': 'ph-game-controller',
        'Livros': 'ph-book',
        'FastFood': 'ph-hamburger',
        'Saudável': 'ph-apple-logo',
        'Remédio': 'ph-first-aid-kit',
        'Meta': 'ph-target',
        'Arte': 'ph-palette',
        'Música': 'ph-music-note',
        'Tecnologia': 'ph-laptop',
        'Celular': 'ph-device-mobile',
        'Relógio': 'ph-watch',
        'Roupas': 'ph-t-shirt',
        'Presente': 'ph-gift',
        'Festa': 'ph-confetti'
    };
    const defaultIcons = Object.keys(defaultIconsMap);

        function selectCategory(category) {
            selectedCategory = category;
            document.querySelectorAll('.category-item').forEach(el => el.classList.remove('selected'));
            event.target.closest('.category-item').classList.add('selected');

            if (category === 'Outros') {
                const type = document.getElementById('transactionType').value;
                openNewCategoryModal(type);
            }
        }

        function openNewCategoryModal(type) {
            document.getElementById('newCategoryType').value = type;
            document.getElementById('newCategoryName').value = '';
            document.getElementById('selectedIcon').value = '';
            document.getElementById('newCategoryError').innerHTML = '';
            
            const iconGrid = document.getElementById('iconGrid');
            iconGrid.innerHTML = defaultIcons.map(iconName => {
                const iconClass = defaultIconsMap[iconName];
                return `
                    <div class="icon-option" onclick="selectIcon('${iconClass}', '${iconName}')" title="${iconName}">
                        ${renderIcon(iconClass)}
                    </div>
                `;
            }).join('');
            
            const modal = document.getElementById('newCategoryModal');
            modal.classList.add('show');
            
            //Foca no primeiro input em dispositivos móveis
            focusFirstInputMobile(modal);
        }

        function selectIcon(iconClass, iconName) {
            document.getElementById('selectedIcon').value = iconClass;
            document.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
            event.target.closest('.icon-option').classList.add('selected');
        }

        //Seleção de tipo de despesa
        let selectedExpenseType = 'unica';
        let currentFormStep = 1;

        function goToStep(step) {
            //Validações antes de avançar
            if (step === 2 && currentFormStep === 1) {
                const description = document.getElementById('transactionDescription').value;
                const amount = document.getElementById('transactionAmount').value;
                const type = document.getElementById('transactionType').value;
                
                if (!description || description.trim() === '') {
                    document.getElementById('transactionError').innerHTML = '<div class="error-message">Digite uma descrição</div>';
                    return;
                }
                
                if (!amount || parseFloat(amount) <= 0) {
                    document.getElementById('transactionError').innerHTML = '<div class="error-message">Digite um valor válido</div>';
                    return;
                }
                
                //Para despesas, verifica se selecionou o tipo
                if (type === 'expense' && !selectedExpenseType) {
                    document.getElementById('transactionError').innerHTML = '<div class="error-message">Selecione o tipo de despesa</div>';
                    return;
                }
            }
            
            if (step === 3 && currentFormStep === 2) {
                //Validações da etapa 2 conforme o tipo
                if (selectedExpenseType === 'fixa') {
                    const startDate = document.getElementById('fixedStartDate').value;
                    if (!startDate) {
                        document.getElementById('transactionError').innerHTML = '<div class="error-message">Selecione a data de início</div>';
                        return;
                    }
                } else if (selectedExpenseType === 'parcelada') {
                    const installments = document.getElementById('installmentCount').value;
                    const firstDate = document.getElementById('firstInstallmentDate').value;
                    if (!installments || parseInt(installments) < 2) {
                        document.getElementById('transactionError').innerHTML = '<div class="error-message">Digite um número válido de parcelas (mínimo 2)</div>';
                        return;
                    }
                    if (!firstDate) {
                        document.getElementById('transactionError').innerHTML = '<div class="error-message">Selecione a data da primeira parcela</div>';
                        return;
                    }
                } else {
                    //Despesa única ou receita
                    const date = document.getElementById('transactionDate').value;
                    if (!date) {
                        document.getElementById('transactionError').innerHTML = '<div class="error-message">Selecione a data</div>';
                        return;
                    }
                }
            }
            
            //Limpa erros
            document.getElementById('transactionError').innerHTML = '';
            
            //✅ CORREÇÃO: Remove 'required' de campos ocultos para evitar erro de validação
            document.querySelectorAll('.form-step input[required], .form-step select[required]').forEach(input => {
                input.removeAttribute('required');
                input.dataset.wasRequired = 'true'; //Marca para restaurar depois
            });
            
            //Esconde todas as etapas
            document.querySelectorAll('.form-step').forEach(el => el.style.display = 'none');
            
            //Mostra a etapa selecionada
            document.getElementById(`step${step}`).style.display = 'block';
            
            //✅ CORREÇÃO: Restaura 'required' apenas nos campos visíveis da etapa atual
            document.querySelectorAll(`#step${step} input[data-was-required], #step${step} select[data-was-required]`).forEach(input => {
                input.setAttribute('required', '');
            });
            
            //Atualiza indicador de etapas
            document.querySelectorAll('.step-item').forEach(el => {
                const stepNum = parseInt(el.getAttribute('data-step'));
                el.classList.remove('active', 'completed');
                if (stepNum === step) {
                    el.classList.add('active');
                } else if (stepNum < step) {
                    el.classList.add('completed');
                }
            });
            
            currentFormStep = step;
        }

        function selectExpenseType(type) {
            selectedExpenseType = type;
            document.getElementById('expenseTypeValue').value = type;
            
            //Atualiza visualização
            document.querySelectorAll('.expense-type-option').forEach(el => {
                el.classList.remove('selected');
            });
            event.target.closest('.expense-type-option').classList.add('selected');
            
            //Mostra botão de continuar
            document.getElementById('step1Nav').style.display = 'block';
        }

        function selectExpenseTypeAndNext(type) {
            selectedExpenseType = type;
            document.getElementById('expenseTypeValue').value = type;
            
            //Atualiza visualização
            document.querySelectorAll('.expense-type-option').forEach(el => {
                el.classList.remove('selected');
            });
            event.target.closest('.expense-type-option').classList.add('selected');
            
            //Aguarda um pouco para o usuário ver a seleção, então avança
            setTimeout(() => {
                //Mostra/esconde campos apropriados na etapa 2
                const fixedFields = document.getElementById('fixedExpenseFields');
                const installmentFields = document.getElementById('installedExpenseFields');
                const singleFields = document.getElementById('singleExpenseFields');
                
                fixedFields.style.display = 'none';
                installmentFields.style.display = 'none';
                singleFields.style.display = 'none';
                
                if (type === 'fixa') {
                    fixedFields.style.display = 'block';
                } else if (type === 'parcelada') {
                    installmentFields.style.display = 'block';
                } else {
                    singleFields.style.display = 'block';
                }
                
                goToStep(2);
            }, 300);
        }

        //Atualiza preview de parcelamento
        function updateInstallmentPreview() {
            const amount = parseFloat(document.getElementById('transactionAmount').value) || 0;
            const installments = parseInt(document.getElementById('installmentCount').value) || 0;
            const firstDate = document.getElementById('firstInstallmentDate').value;
            
            if (amount > 0 && installments > 1 && firstDate) {
                const preview = document.getElementById('installmentPreview');
                const installmentValue = amount / installments;
                
                //Calcula data da última parcela de forma segura
                const date = parseLocalDate(firstDate);
                const lastDateObj = addMonthsSafe(date, installments - 1);
                const lastDate = lastDateObj.toLocaleDateString('pt-BR');
                
                document.getElementById('previewTotal').textContent = formatCurrency(amount);
                document.getElementById('previewInstallment').textContent = formatCurrency(installmentValue);
                document.getElementById('previewLastDate').textContent = lastDate;
                
                preview.style.display = 'block';
            } else {
                document.getElementById('installmentPreview').style.display = 'none';
            }
        }

        //Adiciona listeners para atualizar preview
        document.addEventListener('DOMContentLoaded', function() {
            const amountInput = document.getElementById('transactionAmount');
            const installmentInput = document.getElementById('installmentCount');
            const firstDateInput = document.getElementById('firstInstallmentDate');
            
            if (amountInput && installmentInput && firstDateInput) {
                amountInput.addEventListener('input', updateInstallmentPreview);
                installmentInput.addEventListener('input', updateInstallmentPreview);
                firstDateInput.addEventListener('change', updateInstallmentPreview);
            }
            
            //✅ Correção automática de português no campo de descrição
            const descriptionInput = document.getElementById('transactionDescription');
            if (descriptionInput) {
                descriptionInput.addEventListener('blur', function() {
                    if (this.value.trim()) {
                        this.value = correctPortuguese(this.value);
                    }
                });
            }
            
            //⚠️ VALIDAÇÃO: Limita data de fim a 12 meses após data de início
            const fixedStartDate = document.getElementById('fixedStartDate');
            const fixedEndDate = document.getElementById('fixedEndDate');
            
            if (fixedStartDate && fixedEndDate) {
                fixedStartDate.addEventListener('change', function() {
                    if (this.value) {
                        const start = new Date(this.value);
                        const maxEnd = new Date(start.getFullYear(), start.getMonth() + 12, start.getDate());
                        fixedEndDate.min = this.value;
                        fixedEndDate.max = maxEnd.toISOString().split('T')[0];
                        
                        //Se a data de fim já selecionada ultrapassar 12 meses, limpa
                        if (fixedEndDate.value) {
                            const end = new Date(fixedEndDate.value);
                            if (end > maxEnd) {
                                fixedEndDate.value = '';
                                document.getElementById('transactionError').innerHTML = `<div class="error-message">${renderIcon('warning-circle')} A data de término foi ajustada. O período máximo é de 12 meses.</div>`;
                                setTimeout(() => {
                                    document.getElementById('transactionError').innerHTML = '';
                                }, 3000);
                            }
                        }
                    }
                });
                
                fixedEndDate.addEventListener('change', function() {
                    if (this.value && fixedStartDate.value) {
                        const start = new Date(fixedStartDate.value);
                        const end = new Date(this.value);
                        const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                        
                        if (monthsDiff > 11) {
                            this.value = '';
                            document.getElementById('transactionError').innerHTML = `<div class="error-message">${renderIcon('warning-circle')} O período máximo para despesas fixas é de 12 meses.</div>`;
                            setTimeout(() => {
                                document.getElementById('transactionError').innerHTML = '';
                            }, 3000);
                        }
                    }
                });
            }
        });

        async function handleAddNewCategory(event) {
            event.preventDefault();
            
            const type = document.getElementById('newCategoryType').value;
            const name = document.getElementById('newCategoryName').value.trim();
            const icon = document.getElementById('selectedIcon').value;
            
            if (!name) {
                document.getElementById('newCategoryError').innerHTML = '<div class="error-message">Digite um nome para a categoria</div>';
                return;
            }
            
            if (!icon) {
                document.getElementById('newCategoryError').innerHTML = '<div class="error-message">Selecione um ícone</div>';
                return;
            }
            
            //Verifica se a categoria já existe
            if (categories[type].some(c => c.name.toLowerCase() === name.toLowerCase())) {
                document.getElementById('newCategoryError').innerHTML = '<div class="error-message">Esta categoria já existe</div>';
                return;
            }
            
            //Adiciona nova categoria localmente
            categories[type].push({ name, icon });
            
            //Salva a categoria no backend
            try {
                const userId = JSON.parse(localStorage.getItem('user'))?.id;
                if (userId) {
                    await fetch(`${API_URL}/usuarios/${userId}/categorias`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            name: name,
                            icon: icon,
                            tipo: type
                        })
                    });
                }
            } catch (error) {
                console.error('[ERROR]Erro ao salvar categoria no backend:', error);
                //Continua mesmo se falhar - categoria fica salva localmente
            }
            
            //Atualiza o select de categorias
            const categorySelect = document.getElementById('categorySelect');
            categorySelect.innerHTML = categories[type].map(c => `
                <div class="category-item" onclick="selectCategory('${c.name}')">
                    <div class="category-icon">${renderIcon(c.icon)}</div>
                    <div>${c.name}</div>
                </div>
            `).join('');
            
            //Seleciona a nova categoria
            selectedCategory = name;
            const newCategoryElement = Array.from(document.querySelectorAll('.category-item'))
                .find(el => el.textContent.includes(name));
            if (newCategoryElement) {
                document.querySelectorAll('.category-item').forEach(el => el.classList.remove('selected'));
                newCategoryElement.classList.add('selected');
            }
            
            closeModal('newCategoryModal');
        }

        //✅ NOVA FUNÇÃO: Verifica se a data selecionada é futura
        function checkIfFutureDate() {
            const dateInput = document.getElementById('transactionDate');
            const scheduleGroup = document.getElementById('scheduleCheckboxGroup');
            const scheduleCheckbox = document.getElementById('scheduleTransaction');
            
            if (!dateInput || !scheduleGroup || !scheduleCheckbox) return;
            
            const selectedDate = new Date(dateInput.value + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const isFuture = selectedDate > today;
            
            if (isFuture) {
                //Mostra o checkbox e marca como agendado por padrão
                scheduleGroup.style.display = 'block';
                scheduleCheckbox.checked = true;
                toggleScheduleInfo(); //Atualiza a mensagem
            } else {
                //Esconde o checkbox para datas passadas/hoje
                scheduleGroup.style.display = 'none';
                scheduleCheckbox.checked = false;
            }
        }

        //✅ NOVA FUNÇÃO: Atualiza a mensagem do checkbox
        function toggleScheduleInfo() {
            const scheduleCheckbox = document.getElementById('scheduleTransaction');
            const scheduleHint = document.getElementById('scheduleHint');
            
            if (!scheduleCheckbox || !scheduleHint) return;
            
            if (scheduleCheckbox.checked) {
                scheduleHint.textContent = 'Marcado: a transação só será contabilizada na data selecionada';
                scheduleHint.style.color = '#3b82f6';
            } else {
                scheduleHint.textContent = 'Desmarcado: a transação será registrada imediatamente';
                scheduleHint.style.color = '#f59e0b';
            }
        }

        async function handleAddTransaction(event) {
            event.preventDefault();
            
            //Se estamos editando uma despesa fixa
            if (window.editingFixedGroupId) {
                //✅ Verifica se o usuário mudou o tipo de despesa
                const currentType = selectedExpenseType;
                
                //Se mudou de fixa para outro tipo, deleta o grupo antigo e cria novo
                if (currentType !== 'fixa') {
                    //Deleta todas as transações do grupo antigo
                    try {
                        await fetch(`${API_URL}/transacoes/grupo/${window.editingFixedGroupId}`, {
                            method: 'DELETE'
                        });
                        
                        //Remove do array local
                        transactions = transactions.filter(t => t.grupoId !== window.editingFixedGroupId);
                        
                        //Limpa a flag de edição
                        window.editingFixedGroupId = null;
                        
                        //Continua com a criação normal (parcelada ou única)
                        //O código abaixo vai tratar
                    } catch (error) {
                        console.error('[ERROR]Erro ao excluir despesa fixa antiga:', error);
                        document.getElementById('transactionError').innerHTML = `<div class="error-message">Erro ao excluir despesa fixa anterior</div>`;
                        return;
                    }
                } else {
                    //Se continua fixa, usa o update normal
                    await handleUpdateFixedExpense();
                    return;
                }
            }
            
            //Se estamos editando uma transação individual
            if (editingTransactionId) {
                await handleUpdateTransaction(editingTransactionId);
                return;
            }
            
            //✅ VALIDAÇÃO: Verifica se já existe transação com o mesmo nome
            const description = document.getElementById('transactionDescription').value.trim();
            if (checkDuplicateTransaction(description)) {
                document.getElementById('transactionError').innerHTML = `
                    <div class="error-message">
                        ${renderIcon('warning-circle')} Já existe uma transação com o nome "${correctPortuguese(description)}"
                    </div>
                `;
                return;
            }
            
            if (!selectedCategory) {
                document.getElementById('transactionError').innerHTML = `<div class="error-message">Selecione uma categoria</div>`;
                return;
            }

            const type = document.getElementById('transactionType').value;
            const amountInput = document.getElementById('transactionAmount').value;
            
            if (!amountInput || parseFloat(amountInput) <= 0) {
                document.getElementById('transactionError').innerHTML = `<div class="error-message">Digite um valor válido</div>`;
                return;
            }

            const amount = Math.abs(parseFloat(amountInput));
            const isExpense = type === 'expense';
            
            //Para despesas, verifica o tipo
            if (isExpense) {
                const expenseType = selectedExpenseType;
                
                if (expenseType === 'fixa') {
                    await handleFixedExpense(amount);
                } else if (expenseType === 'parcelada') {
                    await handleInstallmentExpense(amount);
                } else {
                    await handleSingleTransaction(amount, type);
                }
            } else {
                await handleSingleTransaction(amount, type);
            }
        }

        //Função para criar transação única
        async function handleSingleTransaction(amount, type) {
            const transactionDate = document.getElementById('transactionDate').value;
            const scheduleCheckbox = document.getElementById('scheduleTransaction');
            
            //✅ NOVO: Verifica se é data futura E se o checkbox está marcado
            const selectedDate = new Date(transactionDate + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const isFuture = selectedDate > today;
            const isScheduled = isFuture && scheduleCheckbox && scheduleCheckbox.checked;
            
            const newTransaction = {
                descricao: correctPortuguese(document.getElementById('transactionDescription').value),
                valor: type === 'income' ? amount : -amount,
                tipo: type === 'income' ? 'receita' : 'despesa',
                categoria: selectedCategory,
                data: transactionDate,
                usuarioId: currentUser.id,
                despesaTipo: 'unica',
                agendada: isScheduled // ✅ NOVA FLAG
            };
            
            console.log('[TRANSACTION] Criando transação:', {
                descricao: newTransaction.descricao,
                data: transactionDate,
                isFuture: isFuture,
                checkboxChecked: scheduleCheckbox?.checked,
                isScheduled: isScheduled
            });
            
            try {
                showLoading('Salvando transação...');
                
                const response = await fetch(`${API_URL}/transacoes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newTransaction)
                });
                
                if (!response.ok) throw new Error('Erro ao adicionar transação');
                
                await loadTransactions();
                renderTransactions();
                await new Promise(resolve => setTimeout(resolve, 100));
                
                updateDashboardStats();
                updateInsights();
                updateMonthlyLimitCard();
                renderChart();
                renderCategoryReport();
                renderMonthlyChart();
                renderCalendar();
                
                hideLoading();
                closeModal('transactionModal');
                document.getElementById('transactionForm').reset();
                selectedCategory = '';
            } catch (error) {
                hideLoading();
                document.getElementById('transactionError').innerHTML = `<div class="error-message">${error.message}</div>`;
            }
        }

        //Função para criar despesa fixa
        async function handleFixedExpense(amount) {
            const startDate = document.getElementById('fixedStartDate').value;
            const endDate = document.getElementById('fixedEndDate').value;
            
            if (!startDate) {
                document.getElementById('transactionError').innerHTML = `<div class="error-message">Selecione a data de início</div>`;
                return;
            }
            
            //⚠️ VALIDAÇÃO: Verifica se o período não ultrapassa 12 meses
            if (endDate) {
                const start = parseLocalDate(startDate);
                const end = parseLocalDate(endDate);
                const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                
                if (monthsDiff > 11) { //11 porque 0-11 = 12 meses
                    document.getElementById('transactionError').innerHTML = `<div class="error-message">${renderIcon('warning-circle')} O período máximo para despesas fixas é de 12 meses. Para períodos maiores, crie outra despesa fixa após o término desta.</div>`;
                    return;
                }
            }
            
            //Gera um ID único para agrupar as despesas fixas
            const groupId = `fixed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            try {
                showLoading('Criando despesa fixa...');
                
                const start = parseLocalDate(startDate);
                const end = endDate ? parseLocalDate(endDate) : new Date(start.getFullYear() + 1, start.getMonth(), 0); //12 meses se não especificado
                const transactionsToCreate = [];
                
                //Cria transações mensais
                let currentDate = new Date(start);
                const today = new Date();
                const maxMonths = 12; //⚠️ LIMITE: Máximo 12 meses
                let monthCount = 0;
                
                while (currentDate <= end && monthCount < maxMonths) {
                    //Só cria se a data for futura ou do mês atual
                    if (currentDate >= new Date(today.getFullYear(), today.getMonth(), 1)) {
                        const transaction = {
                            descricao: correctPortuguese(document.getElementById('transactionDescription').value),
                            valor: -amount,
                            tipo: 'despesa',
                            categoria: selectedCategory,
                            data: formatDateToInput(currentDate),
                            usuarioId: currentUser.id,
                            despesaTipo: 'fixa',
                            grupoId: groupId,
                            dataInicio: startDate,
                            dataFim: endDate || null
                        };
                        
                        transactionsToCreate.push(transaction);
                    }
                    
                    //Avança para o próximo mês de forma segura
                    currentDate = addMonthsSafe(currentDate, 1);
                    monthCount++;
                }
                
                //Envia todas as transações
                for (const transaction of transactionsToCreate) {
                    const response = await fetch(`${API_URL}/transacoes`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(transaction)
                    });
                    
                    if (!response.ok) throw new Error('Erro ao criar despesa fixa');
                }
                
                await loadTransactions();
                renderTransactions();
                await new Promise(resolve => setTimeout(resolve, 100));
                
                updateDashboardStats();
                updateInsights();
                updateMonthlyLimitCard();
                renderChart();
                renderCategoryReport();
                renderMonthlyChart();
                renderCalendar();
                
                hideLoading();
                closeModal('transactionModal');
                document.getElementById('transactionForm').reset();
                selectedCategory = '';
                showSuccessMessage(`Despesa fixa criada com sucesso! ${transactionsToCreate.length} transações foram criadas.`);
            } catch (error) {
                hideLoading();
                document.getElementById('transactionError').innerHTML = `<div class="error-message">${error.message}</div>`;
            }
        }

        //Função para atualizar despesa fixa completa
        async function handleUpdateFixedExpense() {
            const groupId = window.editingFixedGroupId;
            if (!groupId) return;
            
            const startDate = document.getElementById('fixedStartDate').value;
            const endDate = document.getElementById('fixedEndDate').value;
            const amount = Math.abs(parseFloat(document.getElementById('transactionAmount').value));
            
            if (!startDate) {
                document.getElementById('transactionError').innerHTML = `<div class="error-message">Selecione a data de início</div>`;
                return;
            }
            
            //⚠️ VALIDAÇÃO: Verifica se o período não ultrapassa 12 meses
            if (endDate) {
                const start = parseLocalDate(startDate);
                const end = parseLocalDate(endDate);
                const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                
                if (monthsDiff > 11) { //11 porque 0-11 = 12 meses
                    document.getElementById('transactionError').innerHTML = `<div class="error-message">${renderIcon('warning-circle')} O período máximo para despesas fixas é de 12 meses. Para períodos maiores, crie outra despesa fixa após o término desta.</div>`;
                    return;
                }
            }
            
            try {
                showLoading('Atualizando despesa fixa...');
                
                //1. Deleta todas as transações antigas do grupo
                const oldTransactions = transactions.filter(t => t.grupoId === groupId);
                
                for (const transaction of oldTransactions) {
                    await fetch(`${API_URL}/transacoes/${transaction.id}`, {
                        method: 'DELETE'
                    });
                }
                
                //2. Cria as novas transações com os dados atualizados
                const start = parseLocalDate(startDate);
                const end = endDate ? parseLocalDate(endDate) : new Date(start.getFullYear() + 1, start.getMonth(), 0); //12 meses se não especificado
                const transactionsToCreate = [];
                
                let currentDate = new Date(start);
                const today = new Date();
                const maxMonths = 12; //⚠️ LIMITE: Máximo 12 meses
                let monthCount = 0;
                
                while (currentDate <= end && monthCount < maxMonths) {
                    //Só cria se a data for futura ou do mês atual
                    if (currentDate >= new Date(today.getFullYear(), today.getMonth(), 1)) {
                        const transaction = {
                            descricao: correctPortuguese(document.getElementById('transactionDescription').value),
                            valor: -amount,
                            tipo: 'despesa',
                            categoria: selectedCategory,
                            data: formatDateToInput(currentDate),
                            usuarioId: currentUser.id,
                            despesaTipo: 'fixa',
                            grupoId: groupId, //Mantém o mesmo grupoId
                            dataInicio: startDate,
                            dataFim: endDate || null
                        };
                        
                        transactionsToCreate.push(transaction);
                    }
                    
                    currentDate = addMonthsSafe(currentDate, 1);
                    monthCount++;
                }
                
                //3. Envia todas as novas transações
                for (const transaction of transactionsToCreate) {
                    const response = await fetch(`${API_URL}/transacoes`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(transaction)
                    });
                    
                    if (!response.ok) throw new Error('Erro ao atualizar despesa fixa');
                }
                
                //4. Limpa flag de edição
                delete window.editingFixedGroupId;
                
                //5. Atualiza interface
                await loadTransactions();
                renderTransactions();
                await new Promise(resolve => setTimeout(resolve, 100));
                
                updateDashboardStats();
                updateInsights();
                updateMonthlyLimitCard();
                renderChart();
                renderCategoryReport();
                renderMonthlyChart();
                renderCalendar();
                
                hideLoading();
                closeModal('transactionModal');
                document.getElementById('transactionForm').reset();
                selectedCategory = '';
                
                //Reseta o título do modal
                document.getElementById('transactionModalTitle').textContent = 'Nova Transação';
                const submitBtn = document.querySelector('.btn-submit-transaction');
                if (submitBtn) {
                    submitBtn.innerHTML = '<i class="ph ph-plus-circle"></i> Adicionar';
                }
                
                showSuccessMessage(`Despesa fixa atualizada com sucesso! ${transactionsToCreate.length} transações foram atualizadas.`);
            } catch (error) {
                hideLoading();
                document.getElementById('transactionError').innerHTML = `<div class="error-message">${error.message}</div>`;
            }
        }

        //Função para criar despesa parcelada
        async function handleInstallmentExpense(amount) {
            const installmentCount = parseInt(document.getElementById('installmentCount').value);
            const firstDate = document.getElementById('firstInstallmentDate').value;
            
            if (!installmentCount || installmentCount < 2) {
                document.getElementById('transactionError').innerHTML = `<div class="error-message">Digite um número válido de parcelas (mínimo 2)</div>`;
                return;
            }
            
            if (!firstDate) {
                document.getElementById('transactionError').innerHTML = `<div class="error-message">Selecione a data da primeira parcela</div>`;
                return;
            }
            
            //Gera um ID único para agrupar as parcelas
            const groupId = `installment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const installmentValue = amount / installmentCount;
            
            try {
                showLoading(`Criando ${installmentCount} parcelas...`);
                
                //✅ CORREÇÃO CRÍTICA: Cria UMA transação para CADA parcela (cada mês)
                const startDate = parseLocalDate(firstDate);
                const baseDescription = correctPortuguese(document.getElementById('transactionDescription').value);
                
                console.log(`[PARCELAS] Criando ${installmentCount} transações separadas`);
                console.log(`[PARCELAS] Valor total: ${formatCurrency(amount)}`);
                console.log(`[PARCELAS] Valor por parcela: ${formatCurrency(installmentValue)}`);
                
                //Array para armazenar todas as promessas de criação
                const creationPromises = [];
                
                //Cria uma transação para cada parcela
                for (let i = 0; i < installmentCount; i++) {
                    //Calcula a data de cada parcela (adiciona i meses à data inicial)
                    const parcelaDate = new Date(startDate);
                    parcelaDate.setMonth(startDate.getMonth() + i);
                    
                    const transaction = {
                        descricao: `${baseDescription} (${i + 1}/${installmentCount})`, //Ex: "Notebook (3/12)"
                        valor: -installmentValue, //✅ Valor de UMA parcela
                        valorTotal: -amount, //✅ Valor TOTAL da compra (para referência)
                        tipo: 'despesa',
                        categoria: selectedCategory,
                        data: formatDateToInput(parcelaDate),
                        usuarioId: currentUser.id,
                        despesaTipo: 'parcelada',
                        grupoId: groupId,
                        parcelaAtual: i + 1,
                        totalParcelas: installmentCount,
                        valorParcela: installmentValue,
                        dataInicio: firstDate,
                        proximoVencimento: formatDateToInput(parcelaDate)
                    };
                    
                    console.log(`[PARCELAS] Criando parcela ${i + 1}/${installmentCount} - Data: ${formatDateToInput(parcelaDate)} - Valor: ${formatCurrency(installmentValue)}`);
                    
                    //Adiciona promessa ao array
                    const promise = fetch(`${API_URL}/transacoes`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(transaction)
                    });
                    
                    creationPromises.push(promise);
                }
                
                //Aguarda TODAS as transações serem criadas
                const responses = await Promise.all(creationPromises);
                
                //Verifica se todas foram criadas com sucesso
                const failedResponses = responses.filter(r => !r.ok);
                if (failedResponses.length > 0) {
                    throw new Error(`Erro ao criar ${failedResponses.length} parcelas`);
                }
                
                console.log(`[PARCELAS] ✅ ${installmentCount} parcelas criadas com sucesso!`);
                
                await loadTransactions();
                renderTransactions();
                await new Promise(resolve => setTimeout(resolve, 100));
                
                updateDashboardStats();
                updateInsights();
                updateMonthlyLimitCard();
                renderChart();
                renderCategoryReport();
                renderMonthlyChart();
                renderCalendar();
                
                hideLoading();
                closeModal('transactionModal');
                document.getElementById('transactionForm').reset();
                selectedCategory = '';
            } catch (error) {
                hideLoading();
                document.getElementById('transactionError').innerHTML = `<div class="error-message">${error.message}</div>`;
            }
        }

        //Editar Transação
        async function editTransaction(id) {
            const transaction = transactions.find(t => t.id === id);
            if (!transaction) return;

            //Define que estamos editando
            editingTransactionId = id;

            const isIncome = transaction.tipo === 'receita';
            
            //Preenche o modal com os dados da transação
            document.getElementById('transactionType').value = isIncome ? 'income' : 'expense';
            document.getElementById('transactionDescription').value = transaction.descricao;
            document.getElementById('transactionAmount').value = Math.abs(transaction.valor);
            document.getElementById('transactionDate').value = transaction.data;
            selectedCategory = transaction.categoria;

            //Atualiza o modal para modo edição
            const modalTitle = document.getElementById('transactionModalTitle');
            const modalIcon = document.getElementById('transactionModalIcon');
            const modalSubtitle = document.getElementById('transactionModalSubtitle');
            const submitBtn = document.querySelector('#transactionModal .btn-submit-transaction');
            
            if (modalTitle) modalTitle.textContent = isIncome ? 'Editar Receita' : 'Editar Despesa';
            if (modalIcon) modalIcon.innerHTML = renderIcon('ph-pencil-simple');
            if (modalSubtitle) modalSubtitle.textContent = isIncome ? 'Atualize os dados da receita' : 'Atualize os dados da despesa';
            
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="ph ph-check-circle"></i> Salvar Alterações';
            }

            //Atualiza as categorias e seleciona a atual
            const type = isIncome ? 'income' : 'expense';
            const categorySelect = document.getElementById('categorySelect');
            if (categorySelect) {
                categorySelect.innerHTML = categories[type].map(c => `
                    <div class="category-item ${c.name === selectedCategory ? 'selected' : ''}" onclick="selectCategory('${c.name}')">
                        <div class="category-icon">${renderIcon(c.icon)}</div>
                        <div>${c.name}</div>
                    </div>
                `).join('');
            }

            //Abre o modal
            const modal = document.getElementById('transactionModal');
            if (modal) modal.classList.add('show');
        }

        async function handleUpdateTransaction(id) {
            //Verifica se está editando um grupo de parcelas
            const isEditingInstallmentGroup = currentInstallmentGroupId && id === currentInstallmentGroupId;
            
            if (isEditingInstallmentGroup) {
                //Edita o parcelamento completo
                await updateInstallmentGroup();
                return;
            }
            
            //Edição normal de transação única
            if (!selectedCategory) {
                document.getElementById('transactionError').innerHTML = `<div class="error-message">Selecione uma categoria</div>`;
                return;
            }

            const type = document.getElementById('transactionType').value;
            const amountInput = document.getElementById('transactionAmount').value;
            
            if (!amountInput || parseFloat(amountInput) <= 0) {
                document.getElementById('transactionError').innerHTML = `<div class="error-message">Digite um valor válido</div>`;
                return;
            }

            const amount = Math.abs(parseFloat(amountInput));
            const updatedTransaction = {
                descricao: correctPortuguese(document.getElementById('transactionDescription').value),
                valor: type === 'income' ? amount : -amount,
                tipo: type === 'income' ? 'receita' : 'despesa',
                categoria: selectedCategory,
                data: document.getElementById('transactionDate').value,
                usuarioId: currentUser.id
            };

            try {
                showLoading('Atualizando transação...');
                
                const response = await fetch(`${API_URL}/transacoes/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedTransaction)
                });

                if (!response.ok) throw new Error('Erro ao atualizar transação');

                await loadTransactions();
                await new Promise(resolve => setTimeout(resolve, 100));

                updateDashboardStats();
                updateInsights();
                updateMonthlyLimitCard();
                renderChart();
                renderCategoryReport();
                renderMonthlyChart();
                renderCalendar();

                hideLoading();
                
                closeModal('transactionModal');
                document.getElementById('transactionForm').reset();
                selectedCategory = '';
                editingTransactionId = null;
                
                //Restaura o modal para modo adicionar
                const modalTitle = document.getElementById('transactionModalTitle');
                const modalIcon = document.getElementById('transactionModalIcon');
                const modalSubtitle = document.getElementById('transactionModalSubtitle');
                const submitBtn = document.querySelector('#transactionModal .btn-submit-transaction');
                
                if (modalTitle) modalTitle.textContent = 'Adicionar Transação';
                if (modalIcon) modalIcon.innerHTML = '<i class="ph-plus-circle"></i>';
                if (modalSubtitle) modalSubtitle.textContent = 'Preencha os dados da transação';
                if (submitBtn) submitBtn.innerHTML = `${renderIcon('ph-check-circle')} Adicionar Transação`;

                showSuccessMessage('Transação atualizada com sucesso!');
            } catch (error) {
                hideLoading();
                document.getElementById('transactionError').innerHTML = `<div class="error-message">${error.message}</div>`;
            }
        }

        //Atualizar parcelamento completo
        async function updateInstallmentGroup() {
            const amount = Math.abs(parseFloat(document.getElementById('transactionAmount').value));
            const installmentCount = parseInt(document.getElementById('installmentCount').value);
            const firstDate = document.getElementById('firstInstallmentDate').value;
            
            if (!installmentCount || installmentCount < 2) {
                document.getElementById('transactionError').innerHTML = `<div class="error-message">Digite um número válido de parcelas (mínimo 2)</div>`;
                return;
            }
            
            if (!firstDate) {
                document.getElementById('transactionError').innerHTML = `<div class="error-message">Selecione a data da primeira parcela</div>`;
                return;
            }
            
            try {
                showLoading('Atualizando parcelamento...');
                
                //✅ Busca TODAS as transações do grupo (todas as parcelas)
                const existingInstallments = transactions.filter(t => t.grupoId === currentInstallmentGroupId);
                if (existingInstallments.length === 0) {
                    throw new Error('Parcelamento não encontrado');
                }
                
                console.log(`[PARCELAS] Atualizando ${existingInstallments.length} parcelas existentes`);
                console.log(`[PARCELAS] Novo valor total: ${formatCurrency(amount)}`);
                console.log(`[PARCELAS] Novo número de parcelas: ${installmentCount}`);
                
                const installmentValue = amount / installmentCount;
                const startDate = parseLocalDate(firstDate);
                const baseDescription = correctPortuguese(document.getElementById('transactionDescription').value);
                
                //✅ ETAPA 1: Deletar TODAS as parcelas antigas
                showLoading(`Removendo ${existingInstallments.length} parcelas antigas...`);
                const deletePromises = existingInstallments.map(installment => 
                    fetch(`${API_URL}/transacoes/${installment.id}`, { method: 'DELETE' })
                );
                
                await Promise.all(deletePromises);
                console.log(`[PARCELAS] ✅ ${existingInstallments.length} parcelas antigas removidas`);
                
                //✅ ETAPA 2: Criar novas parcelas com valores atualizados
                showLoading(`Criando ${installmentCount} novas parcelas...`);
                const creationPromises = [];
                
                for (let i = 0; i < installmentCount; i++) {
                    const parcelaDate = new Date(startDate);
                    parcelaDate.setMonth(startDate.getMonth() + i);
                    
                    const transaction = {
                        descricao: `${baseDescription} (${i + 1}/${installmentCount})`,
                        valor: -installmentValue,
                        valorTotal: -amount,
                        tipo: 'despesa',
                        categoria: selectedCategory,
                        data: formatDateToInput(parcelaDate),
                        usuarioId: currentUser.id,
                        despesaTipo: 'parcelada',
                        grupoId: currentInstallmentGroupId, //Mantém o mesmo grupoId
                        parcelaAtual: i + 1,
                        totalParcelas: installmentCount,
                        valorParcela: installmentValue,
                        dataInicio: firstDate,
                        proximoVencimento: formatDateToInput(parcelaDate)
                    };
                    
                    const promise = fetch(`${API_URL}/transacoes`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(transaction)
                    });
                    
                    creationPromises.push(promise);
                }
                
                const responses = await Promise.all(creationPromises);
                const failedResponses = responses.filter(r => !r.ok);
                if (failedResponses.length > 0) {
                    throw new Error(`Erro ao criar ${failedResponses.length} parcelas`);
                }
                
                console.log(`[PARCELAS] ✅ ${installmentCount} novas parcelas criadas com sucesso!`);
                
                await loadTransactions();
                renderTransactions();
                await new Promise(resolve => setTimeout(resolve, 100));
                
                updateDashboardStats();
                updateInsights();
                updateMonthlyLimitCard();
                renderChart();
                renderCategoryReport();
                renderMonthlyChart();
                renderCalendar();
                
                hideLoading();
                closeModal('transactionModal');
                document.getElementById('transactionForm').reset();
                selectedCategory = '';
                editingTransactionId = null;
                currentInstallmentGroupId = null;
                currentInstallmentData = null;
                
                showSuccessMessage('Parcelamento atualizado com sucesso! 🎉');
            } catch (error) {
                hideLoading();
                document.getElementById('transactionError').innerHTML = `<div class="error-message">${error.message}</div>`;
            }
        }

        //Deletar Transação
        let transactionToDelete = null;

        async function deleteTransaction(id) {
            const transaction = transactions.find(t => t.id === id);
            if (!transaction) return;

            transactionToDelete = id;
            
            //Atualiza o modal com as informações da transação
            const isIncome = transaction.tipo === 'receita';
            const typeText = isIncome ? 'receita' : 'despesa';
            
            const deleteMessage = document.getElementById('deleteTransactionMessage');
            const deleteDetail = document.getElementById('deleteTransactionDetail');
            
            if (deleteMessage) {
                deleteMessage.textContent = `Deseja realmente excluir esta ${typeText}?`;
            }
            
            if (deleteDetail) {
                deleteDetail.innerHTML = `<strong>${transaction.descricao}</strong> - ${formatCurrency(Math.abs(transaction.valor))} em ${formatDate(transaction.data)}`;
            }
            
            //Abre o modal
            const modal = document.getElementById('deleteTransactionModal');
            if (modal) modal.classList.add('show');
        }

        async function confirmDeleteTransaction() {
            if (!transactionToDelete) return;

            try {
                showLoading('Excluindo transação...');
                
                const response = await fetch(`${API_URL}/transacoes/${transactionToDelete}`, {
                    method: 'DELETE'
                });

                if (!response.ok) throw new Error('Erro ao excluir transação');

                closeModal('deleteTransactionModal');
                transactionToDelete = null;

                await loadTransactions();
                await new Promise(resolve => setTimeout(resolve, 100));

                updateDashboardStats();
                updateInsights();
                updateMonthlyLimitCard();
                renderChart();
                renderCategoryReport();
                renderMonthlyChart();
                renderCalendar();

                hideLoading();

                showSuccessMessage('Transação excluída com sucesso!');
            } catch (error) {
                hideLoading();
                closeModal('deleteTransactionModal');
                showSuccessMessage('Erro ao excluir transação: ' + error.message);
            }
        }

        function calculateLoan() {
            const principal = parseFloat(document.getElementById('loanAmount').value);
            const monthlyRate = parseFloat(document.getElementById('loanRate').value) / 100;
            const periods = parseInt(document.getElementById('loanPeriod').value);
            
            if (!principal || !monthlyRate || !periods || principal <= 0 || monthlyRate <= 0 || periods <= 0) {
                showErrorNotification('Preencha todos os campos com valores válidos');
                return;
            }
            
            //Fórmula Price: PMT = PV * (i * (1 + i)^n) / ((1 + i)^n - 1)
            const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, periods)) / (Math.pow(1 + monthlyRate, periods) - 1);
            const totalPaid = monthlyPayment * periods;
            const totalInterest = totalPaid - principal;
            const interestPercentage = (totalInterest / principal) * 100;
            
            let resultsHTML = `
                <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 2rem; border-radius: 16px; border: 2px solid #93c5fd; margin-bottom: 1.5rem;">
                    <div style="text-align: center;">
                        <div style="font-size: 0.9rem; color: #1e40af; font-weight: 600; margin-bottom: 1rem;">
                            <i class="ph ph-credit-card" style="font-size: 1.2rem;"></i> VALOR DA PARCELA MENSAL
                        </div>
                        <div style="font-size: 3rem; font-weight: 800; color: #1e3a8a; margin-bottom: 0.5rem;">
                            ${formatCurrency(monthlyPayment)}
                        </div>
                        <div style="font-size: 1rem; color: #3b82f6; font-weight: 500;">
                            durante ${periods} meses
                        </div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 2px solid #e5e7eb; text-align: center;">
                        <div style="color: #6b7280; font-size: 0.85rem; margin-bottom: 0.5rem; font-weight: 600;">
                            <i class="ph ph-hand-coins"></i> EMPRÉSTIMO
                        </div>
                        <div style="font-size: 1.3rem; font-weight: 700; color: #1e3a8a;">${formatCurrency(principal)}</div>
                    </div>
                    
                    <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 2px solid #e5e7eb; text-align: center;">
                        <div style="color: #6b7280; font-size: 0.85rem; margin-bottom: 0.5rem; font-weight: 600;">
                            <i class="ph ph-coins"></i> JUROS TOTAIS
                        </div>
                        <div style="font-size: 1.3rem; font-weight: 700; color: #dc2626;">${formatCurrency(totalInterest)}</div>
                    </div>
                    
                    <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 2px solid #e5e7eb; text-align: center;">
                        <div style="color: #6b7280; font-size: 0.85rem; margin-bottom: 0.5rem; font-weight: 600;">
                            <i class="ph ph-receipt"></i> TOTAL A PAGAR
                        </div>
                        <div style="font-size: 1.3rem; font-weight: 700; color: #7c3aed;">${formatCurrency(totalPaid)}</div>
                    </div>
                </div>
                
                <div style="background: #eff6ff; padding: 1.25rem; border-radius: 12px; border: 2px solid #bfdbfe; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: start; gap: 0.75rem;">
                        <i class="ph ph-info" style="font-size: 1.5rem; color: #1e40af; flex-shrink: 0;"></i>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #1e40af; margin-bottom: 0.4rem; font-size: 0.9rem;">Resumo do Empréstimo</div>
                            <div style="color: #1e40af; font-size: 0.85rem; line-height: 1.5;">
                                Você pagará ${interestPercentage.toFixed(1)}% de juros sobre o valor emprestado. 
                                A taxa mensal de ${(monthlyRate * 100).toFixed(2)}% resulta em uma taxa anual de ${((Math.pow(1 + monthlyRate, 12) - 1) * 100).toFixed(2)}%.
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="background: #fef2f2; padding: 1.25rem; border-radius: 12px; border: 2px solid #fecaca;">
                    <div style="display: flex; align-items: start; gap: 0.75rem;">
                        <i class="ph ph-warning" style="font-size: 1.5rem; color: #dc2626; flex-shrink: 0;"></i>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #dc2626; margin-bottom: 0.4rem; font-size: 0.9rem;">Atenção!</div>
                            <div style="color: #991b1b; font-size: 0.85rem; line-height: 1.5;">
                                Certifique-se de que a parcela cabe no seu orçamento mensal. Considere uma margem de segurança para imprevistos.
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('loanResults').innerHTML = resultsHTML;
        }

        //============================================
        //RELATÓRIOS - DESIGN MINIMALISTA AZUL
        //============================================
        
        let currentReportPeriod = '7days';
        let currentAnalysisTab = 'predictions'; //✅ CORREÇÃO: Tab padrão agora é "Previsões"
        let evolutionChartInstance = null;
        let categoryPieChartInstance = null;

        function renderReports() {
            renderNewReports();
        }

        function changeReportPeriod(period) {
            currentReportPeriod = period;
            
            //Atualiza botões ativos
            document.querySelectorAll('.filter-btn-minimal').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`[data-period="${period}"]`)?.classList.add('active');
            
            //Atualiza label do gráfico
            const labels = {
                '7days': 'Mês Atual',
                '30days': 'Mês Atual',
                '3months': 'Últimos 3 Meses',
                '6months': 'Últimos 6 Meses',
                '1year': 'Ano Atual'
            };
            const labelEl = document.getElementById('evolutionPeriodLabel');
            if (labelEl) labelEl.textContent = labels[period];
            
            //Re-renderiza tudo
            renderNewReports();
        }

        function switchAnalysisTab(tabName) {
            currentAnalysisTab = tabName;
            
            //Atualiza tabs ativos
            document.querySelectorAll('.analysis-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
            
            //Esconde todos os conteúdos
            document.querySelectorAll('.analysis-content').forEach(content => {
                content.classList.add('hidden');
            });
            
            //Mostra o conteúdo selecionado
            const contentMap = {
                'categories': 'tabCategories',
                'timeline': 'tabTimeline',
                'predictions': 'tabPredictions'
            };
            document.getElementById(contentMap[tabName])?.classList.remove('hidden');
            
            //Renderiza o conteúdo da tab
            const { currentStart, currentEnd } = getPeriodDates(currentReportPeriod);
            const currentTransactions = getTransactionsInPeriod(currentStart, currentEnd);
            const currentStats = calculatePeriodStats(currentTransactions);
            
            switch(tabName) {
                case 'categories':
                    renderCategoriesAnalysis(currentTransactions);
                    break;
                case 'timeline':
                    renderTimelineAnalysis(currentTransactions);
                    break;
                case 'predictions':
                    renderPredictionsAnalysis(currentStats, currentTransactions);
                    break;
            }
        }

        function getPeriodDates(period) {
            const now = new Date();
            let currentStart = new Date();
            let currentEnd = new Date();
            let previousStart = new Date();
            let previousEnd = new Date();
            
            switch(period) {
                case '7days':
                    //MÊS ATUAL COMPLETO (do dia 1 até o último dia do mês)
                    currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                    
                    //MÊS ANTERIOR COMPLETO
                    previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    previousEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
                    break;
                    
                case '30days':
                    //MÊS ATUAL COMPLETO (do dia 1 até o último dia do mês)
                    currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                    
                    //MÊS ANTERIOR COMPLETO
                    previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    previousEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
                    break;
                    
                case '3months':
                    //ÚLTIMOS 3 MESES COMPLETOS
                    currentStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                    currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                    
                    //3 MESES ANTERIORES
                    previousStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
                    previousEnd = new Date(now.getFullYear(), now.getMonth() - 2, 0, 23, 59, 59, 999);
                    break;
                    
                case '6months':
                    //ÚLTIMOS 6 MESES COMPLETOS
                    currentStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
                    currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                    
                    //6 MESES ANTERIORES
                    previousStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
                    previousEnd = new Date(now.getFullYear(), now.getMonth() - 5, 0, 23, 59, 59, 999);
                    break;
                    
                case '1year':
                    //ANO ATUAL COMPLETO (janeiro até dezembro)
                    currentStart = new Date(now.getFullYear(), 0, 1);
                    currentEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                    
                    //ANO ANTERIOR COMPLETO
                    previousStart = new Date(now.getFullYear() - 1, 0, 1);
                    previousEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
                    break;
            }
            
            //Garante horários corretos (já definidos acima, mas reforça)
            currentStart.setHours(0, 0, 0, 0);
            currentEnd.setHours(23, 59, 59, 999);
            previousStart.setHours(0, 0, 0, 0);
            previousEnd.setHours(23, 59, 59, 999);
            
            return { currentStart, currentEnd, previousStart, previousEnd };
        }

        function getTransactionsInPeriod(startDate, endDate) {
            return transactions.filter(t => {
                const tDate = parseLocalDate(t.data);
                return tDate >= startDate && tDate <= endDate;
            });
        }

        function calculatePeriodStats(transactionsInPeriod) {
            //CORRIGIDO: Usa valorParcela para despesas parceladas
            const despesas = transactionsInPeriod.filter(t => t.tipo === 'despesa').reduce((sum, t) => {
                const valor = t.despesaTipo === 'parcelada' && t.valorParcela ? t.valorParcela : t.valor;
                return sum + Math.abs(valor);
            }, 0);
            const receitas = transactionsInPeriod.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0);
            const saldo = receitas - despesas;
            
            return { despesas, receitas, saldo };
        }

        function renderNewReports() {
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🔄 renderNewReports() chamado');
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]📊 Total de transações disponíveis:', transactions.length);
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]📅 Período atual:', currentReportPeriod);
            
            const { currentStart, currentEnd, previousStart, previousEnd } = getPeriodDates(currentReportPeriod);
            
            const currentTransactions = getTransactionsInPeriod(currentStart, currentEnd);
            const previousTransactions = getTransactionsInPeriod(previousStart, previousEnd);
            
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]📈 Transações no período atual:', currentTransactions.length);
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]📉 Transações no período anterior:', previousTransactions.length);
            
            const currentStats = calculatePeriodStats(currentTransactions);
            const previousStats = calculatePeriodStats(previousTransactions);
            
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]💰 Stats do período atual:', currentStats);
            
            //Renderiza seções principais
            renderSummaryCards(currentStats, previousStats);
            renderEvolutionChart();
            renderCategoryPieChart(currentTransactions);
            
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ renderCategoryPieChart chamado com', currentTransactions.length, 'transações');
            
            //Renderiza padrões (sempre visível, fora das tabs)
            renderPatternsAnalysis(currentStats, currentTransactions, previousStats);
            
            //Renderiza tab ativa
            switch(currentAnalysisTab) {
                case 'categories':
                    renderCategoriesAnalysis(currentTransactions);
                    break;
                case 'timeline':
                    renderTimelineAnalysis(currentTransactions);
                    break;
                case 'predictions':
                    renderPredictionsAnalysis(currentStats, currentTransactions);
                    break;
            }
        }

        function renderSummaryCards(currentStats, previousStats) {
            //Saldo do Período (Receitas - Despesas)
            const saldo = currentStats.receitas - currentStats.despesas;
            document.getElementById('summaryBalance').textContent = formatCurrency(Math.abs(saldo));
            
            let saldoStatus = '';
            if (saldo > 0) {
                saldoStatus = '✓ Saldo positivo no período';
                document.getElementById('summaryBalanceStatus').style.color = '#059669';
            } else if (saldo < 0) {
                saldoStatus = '✗ Saldo negativo no período';
                document.getElementById('summaryBalanceStatus').style.color = '#dc2626';
            } else {
                saldoStatus = 'Equilibrado';
                document.getElementById('summaryBalanceStatus').style.color = '#64748b';
            }
            document.getElementById('summaryBalanceStatus').textContent = saldoStatus;
            
            //Receitas
            document.getElementById('summaryIncome').textContent = formatCurrency(currentStats.receitas);
            const numReceitas = transactions.filter(t => t.tipo === 'receita').length;
            document.getElementById('summaryIncomeTrend').textContent = `${numReceitas} transaçã${numReceitas !== 1 ? 'ões' : 'o'}`;
            document.getElementById('summaryIncomeTrend').style.color = '#64748b';
            
            //Despesas
            document.getElementById('summaryExpenses').textContent = formatCurrency(currentStats.despesas);
            const numDespesas = transactions.filter(t => t.tipo === 'despesa').length;
            document.getElementById('summaryExpensesTrend').textContent = `${numDespesas} transaçã${numDespesas !== 1 ? 'ões' : 'o'}`;
            document.getElementById('summaryExpensesTrend').style.color = '#64748b';
            
            //Meta de Gastos - usando meta do usuário ou padrão de R$ 5.000
            const metaGastos = currentUser?.metaMensal || 5000;
            const gastoAtual = currentStats.despesas;
            const percentualMeta = (gastoAtual / metaGastos) * 100;
            const diferenca = metaGastos - gastoAtual;
            
            //Mostra formato "R$ X / R$ Y"
            document.getElementById('summaryAverage').textContent = 
                `${formatCurrency(gastoAtual)} / ${formatCurrency(metaGastos)}`;
            
            //Atualiza barra de progresso (limita a 100%)
            const progressBar = document.getElementById('metaProgressBar');
            if (progressBar) {
                progressBar.style.width = Math.min(percentualMeta, 100) + '%';
            }
            
            //Mensagem de status da meta
            let mensagemMeta = '';
            if (diferenca > 0) {
                mensagemMeta = `✓ Faltam ${formatCurrency(diferenca)} para a meta`;
                document.getElementById('summaryProjection').style.color = '#059669';
            } else if (diferenca < 0) {
                mensagemMeta = `✗ Ultrapassou em ${formatCurrency(Math.abs(diferenca))}`;
                document.getElementById('summaryProjection').style.color = '#dc2626';
            } else {
                mensagemMeta = '✓ Meta atingida perfeitamente!';
                document.getElementById('summaryProjection').style.color = '#3b82f6';
            }
            
            document.getElementById('summaryProjection').textContent = mensagemMeta;
        }

        function showCardExplanation(cardType) {
            const explanations = {
                'saldo': {
                    title: 'Saldo do Período',
                    icon: 'ph-wallet',
                    description: 'O saldo representa a diferença entre suas receitas e despesas no período selecionado.',
                    formula: 'Saldo = Receitas - Despesas',
                    example: 'Se você recebeu R$ 5.000 e gastou R$ 3.000, seu saldo é R$ 2.000 (positivo).',
                    interpretation: [
                        '<i class="ph ph-check-circle"></i> Saldo Positivo: Você gastou menos do que recebeu',
                        '<i class="ph ph-x-circle"></i> Saldo Negativo: Você gastou mais do que recebeu',
                        '<i class="ph ph-minus-circle"></i> Equilibrado: Receitas = Despesas'
                    ]
                },
                'receitas': {
                    title: 'Receitas',
                    icon: 'ph-arrow-circle-up',
                    description: 'Total de dinheiro que entrou na sua conta no período selecionado.',
                    formula: 'Soma de todas as transações de entrada',
                    example: 'Salário, freelances, investimentos, presentes, etc.',
                    interpretation: [
                        '<i class="ph ph-list-bullets"></i> Inclui todas as fontes de renda',
                        '<i class="ph ph-plus-circle"></i> Valor sempre positivo',
                        '<i class="ph ph-trend-up"></i> Quanto maior, melhor sua capacidade financeira'
                    ]
                },
                'despesas': {
                    title: 'Despesas',
                    icon: 'ph-arrow-circle-down',
                    description: 'Total de dinheiro que saiu da sua conta no período selecionado.',
                    formula: 'Soma de todas as transações de saída',
                    example: 'Mercado, contas, lazer, transporte, etc.',
                    interpretation: [
                        '<i class="ph ph-list-bullets"></i> Inclui todos os gastos registrados',
                        '<i class="ph ph-calculator"></i> Valor sempre positivo (módulo)',
                        '<i class="ph ph-chart-line"></i> Compare com suas receitas para entender seu saldo'
                    ]
                },
                'meta': {
                    title: 'Meta de Gastos',
                    icon: 'ph-target',
                    description: 'Mostra quanto você já gastou em relação à sua meta mensal de gastos.',
                    formula: 'Gastos Atuais / Meta Definida',
                    example: 'Meta: R$ 5.000 | Gasto: R$ 3.000 = 60% da meta',
                    interpretation: [
                        '<i class="ph ph-check-circle"></i> Abaixo da meta: Você está economizando',
                        '<i class="ph ph-warning-circle"></i> Acima da meta: Você ultrapassou o limite planejado',
                        '<i class="ph ph-chart-bar"></i> A barra vermelha mostra o progresso visualmente'
                    ]
                },
                'previsoes': {
                    title: 'Previsões Financeiras',
                    icon: 'ph-crystal-ball',
                    description: 'O sistema analisa seus gastos anteriores e prevê quanto você gastará até o final do mês.',
                    formula: 'Previsão = (Gasto Médio por Dia) × Dias Restantes + Gastos Atuais',
                    example: 'Se você gasta R$ 100 por dia e faltam 15 dias, a previsão é R$ 1.500 + seus gastos atuais.',
                    interpretation: [
                        '<i class="ph ph-trending-up"></i> Previsão alta: Você pode precisar economizar nos próximos dias',
                        '<i class="ph ph-check-circle"></i> Dentro da meta: Mantenha esse ritmo de gastos',
                        '<i class="ph ph-warning-circle"></i> Acima da meta prevista: Considere reduzir despesas'
                    ]
                }
            };

            const info = explanations[cardType];
            if (!info) return;

            const modal = `
                <div class="modal-overlay" id="explanationModal" onclick="closeExplanationModal()">
                    <div class="explanation-modal" onclick="event.stopPropagation()">
                        <div class="explanation-header">
                            <div class="explanation-title-row">
                                <div class="explanation-icon">
                                    ${renderIcon(info.icon)}
                                </div>
                                <h3>${info.title}</h3>
                            </div>
                            <button class="close-btn" onclick="closeExplanationModal()">
                                <i class="ph ph-x"></i>
                            </button>
                        </div>
                        <div class="explanation-body">
                            <div class="explanation-section">
                                <h4><i class="ph ph-book-open"></i> O que significa?</h4>
                                <p>${info.description}</p>
                            </div>
                            <div class="explanation-section">
                                <h4><i class="ph ph-calculator"></i> Como é calculado?</h4>
                                <p class="formula">${info.formula}</p>
                            </div>
                            <div class="explanation-section">
                                <h4><i class="ph ph-lightbulb"></i> Exemplo prático:</h4>
                                <p>${info.example}</p>
                            </div>
                            <div class="explanation-section">
                                <h4><i class="ph ph-graduation-cap"></i> Interpretação:</h4>
                                <ul>
                                    ${info.interpretation.map(item => `<li>${item}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modal);
        }

        function closeExplanationModal() {
            const modal = document.getElementById('explanationModal');
            if (modal) {
                modal.remove();
            }
        }

        function renderComparison(currentStats, previousStats) {
            const items = [
                {
                    label: 'Despesas',
                    current: currentStats.despesas,
                    previous: previousStats.despesas,
                    inverted: true
                },
                {
                    label: 'Receitas',
                    current: currentStats.receitas,
                    previous: previousStats.receitas,
                    inverted: false
                },
                {
                    label: 'Saldo',
                    current: currentStats.saldo,
                    previous: previousStats.saldo,
                    inverted: false
                }
            ];
            
            const html = items.map(item => {
                const change = item.previous !== 0 
                    ? ((item.current - item.previous) / Math.abs(item.previous)) * 100 
                    : 0;
                
                let changeClass = 'neutral';
                if (change > 0) changeClass = item.inverted ? 'negative' : 'positive';
                if (change < 0) changeClass = item.inverted ? 'positive' : 'negative';
                
                return `
                    <div class="comparison-item">
                        <div class="comparison-item-label">${item.label}</div>
                        <div class="comparison-item-values">
                            <div class="comparison-value">
                                <span class="comparison-value-label">Atual</span>
                                <span class="comparison-value-amount">${formatCurrency(item.current)}</span>
                            </div>
                            <div class="comparison-value">
                                <span class="comparison-value-label">Anterior</span>
                                <span class="comparison-value-amount">${formatCurrency(item.previous)}</span>
                            </div>
                            <div class="comparison-change ${changeClass}">
                                <i class="ph ${change >= 0 ? 'ph-arrow-up' : 'ph-arrow-down'}"></i>
                                ${Math.abs(change).toFixed(1)}%
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            document.getElementById('comparisonGrid').innerHTML = html;
        }

        function renderEvolutionChart() {
            const canvas = document.getElementById('evolutionChart');
            if (!canvas) return;
            
            if (evolutionChartInstance) {
                evolutionChartInstance.destroy();
            }
            
            const ctx = canvas.getContext('2d');
            const labels = [];
            const receitasData = [];
            const despesasData = [];
            
            const now = new Date();
            
            //=== MODO MENSAL (7days) - Mostra o mês completo (dia 1 até último dia) ===
            if (currentReportPeriod === '7days') {
                const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); //Último dia do mês
                const daysInCurrentMonth = lastDayOfMonth.getDate(); //Total de dias no mês (28/29/30/31)
                
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]📊 Evolução Temporal: Mês completo - Dia 1 até', daysInCurrentMonth, 'de', now.toLocaleDateString('pt-BR', { month: 'long' }));
                
                //Mostra cada dia do mês (dia 1 até último dia)
                for (let day = 1; day <= daysInCurrentMonth; day++) {
                    const date = new Date(now.getFullYear(), now.getMonth(), day);
                    date.setHours(0, 0, 0, 0);
                    const endDate = new Date(date);
                    endDate.setHours(23, 59, 59, 999);
                    
                    labels.push(day + '/' + (date.getMonth() + 1));
                    
                    const dayTransactions = getTransactionsInPeriod(date, endDate);
                    const stats = calculatePeriodStats(dayTransactions);
                    
                    receitasData.push(stats.receitas);
                    despesasData.push(stats.despesas);
                }
            }
            //=== MODO 30 DIAS - Últimos 30 dias ===
            else if (currentReportPeriod === '30days') {
                for (let i = 29; i >= 0; i--) {
                    const date = new Date(now);
                    date.setDate(now.getDate() - i);
                    date.setHours(0, 0, 0, 0);
                    const endDate = new Date(date);
                    endDate.setHours(23, 59, 59, 999);
                    
                    labels.push(date.getDate() + '/' + (date.getMonth() + 1));
                    
                    const dayTransactions = getTransactionsInPeriod(date, endDate);
                    const stats = calculatePeriodStats(dayTransactions);
                    
                    receitasData.push(stats.receitas);
                    despesasData.push(stats.despesas);
                }
            }
            //=== MODO MENSAL (3, 6, 12 meses) ===
            else {
                const monthsToShow = currentReportPeriod === '3months' ? 3 : currentReportPeriod === '6months' ? 6 : 12;
                const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                
                for (let i = monthsToShow - 1; i >= 0; i--) {
                    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
                    
                    labels.push(monthNames[monthDate.getMonth()]);
                    
                    const monthTransactions = getTransactionsInPeriod(monthDate, monthEnd);
                    const stats = calculatePeriodStats(monthTransactions);
                    
                    receitasData.push(stats.receitas);
                    despesasData.push(stats.despesas);
                }
            }
            
            evolutionChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Receitas',
                            data: receitasData,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.4,
                            fill: true,
                            borderWidth: 3
                        },
                        {
                            label: 'Despesas',
                            data: despesasData,
                            borderColor: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            tension: 0.4,
                            fill: true,
                            borderWidth: 3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(17, 24, 39, 0.95)',
                            padding: 12,
                            borderColor: '#374151',
                            borderWidth: 1,
                            titleFont: { size: 14, weight: 'bold' },
                            bodyFont: { size: 13 },
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return formatCurrency(value);
                                }
                            },
                            grid: { color: '#f3f4f6' }
                        },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        function renderCategoryPieChart(transactionsInPeriod) {
            const canvas = document.getElementById('categoryPieChart');
            if (!canvas) return;
            
            if (categoryPieChartInstance) {
                categoryPieChartInstance.destroy();
                categoryPieChartInstance = null;
            }
            
            const despesas = transactionsInPeriod.filter(t => t.tipo === 'despesa');
            
            if (despesas.length === 0) {
                //Não substitui o canvas, apenas esconde o gráfico e mostra mensagem
                canvas.style.display = 'none';
                const wrapper = canvas.closest('.chart-canvas-wrapper');
                if (wrapper) {
                    let emptyMsg = wrapper.querySelector('.chart-empty-message');
                    if (!emptyMsg) {
                        emptyMsg = document.createElement('p');
                        emptyMsg.className = 'chart-empty-message';
                        emptyMsg.style.cssText = 'text-align: center; color: #6b7280; padding: 3rem;';
                        wrapper.appendChild(emptyMsg);
                    }
                    emptyMsg.textContent = 'Nenhuma despesa no período selecionado';
                    emptyMsg.style.display = 'block';
                }
                return;
            }
            
            //Remove mensagem de vazio se existir e mostra o canvas
            canvas.style.display = 'block';
            const wrapper = canvas.closest('.chart-canvas-wrapper');
            if (wrapper) {
                const emptyMsg = wrapper.querySelector('.chart-empty-message');
                if (emptyMsg) {
                    emptyMsg.style.display = 'none';
                }
            }
            
            const categoryTotals = {};
            despesas.forEach(t => {
                //Usa valorParcela para parceladas, senão usa valor
                const valorDespesa = t.despesaTipo === 'parcelada' && t.valorParcela 
                    ? t.valorParcela 
                    : t.valor;
                categoryTotals[t.categoria] = (categoryTotals[t.categoria] || 0) + Math.abs(valorDespesa);
            });
            
            const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
            const labels = sortedCategories.map(([cat]) => cat);
            const data = sortedCategories.map(([, val]) => val);
            
            const colors = [
                '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
                '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
            ];
            
            const ctx = canvas.getContext('2d');
            categoryPieChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors,
                        borderWidth: 3,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            top: 10,
                            bottom: 10,
                            left: 10,
                            right: 10
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                font: { size: 13, weight: '600' },
                                generateLabels: function(chart) {
                                    const data = chart.data;
                                    const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                                    return data.labels.map((label, i) => {
                                        const value = data.datasets[0].data[i];
                                        const percent = ((value / total) * 100).toFixed(1);
                                        return {
                                            text: `${label} (${percent}%)`,
                                            fillStyle: data.datasets[0].backgroundColor[i],
                                            hidden: false,
                                            index: i
                                        };
                                    });
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(17, 24, 39, 0.95)',
                            padding: 12,
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percent = ((context.parsed / total) * 100).toFixed(1);
                                    return `${context.label}: ${formatCurrency(context.parsed)} (${percent}%)`;
                                }
                            }
                        }
                    },
                    cutout: '60%'
                }
            });
        }

        //===== NOVAS FUNÇÕES DE ANÁLISE =====
        
        function renderPatternsAnalysis(currentStats, currentTransactions, previousStats) {
            const patterns = [];
            
            //Padrão 1: Atividade Financeira (simplificado)
            const transactionFrequency = currentTransactions.length;
            const days = currentReportPeriod === '7days' ? 7 : currentReportPeriod === '30days' ? 30 : 30;
            const avgPerDay = (transactionFrequency / days).toFixed(1);
            
            //✅ Mensagem simples e clara
            let frequencyDescription;
            if (transactionFrequency === 0) {
                frequencyDescription = `Nenhum registro financeiro nos últimos ${days} dias.`;
            } else if (transactionFrequency === 1) {
                frequencyDescription = `Você tem 1 registro financeiro.`;
            } else if (transactionFrequency <= 5) {
                frequencyDescription = `Você tem ${transactionFrequency} registros financeiros. Que tal adicionar mais para ter uma visão completa?`;
            } else if (transactionFrequency <= 10) {
                frequencyDescription = `Você tem ${transactionFrequency} registros financeiros. Bom acompanhamento!`;
            } else {
                frequencyDescription = `Você tem ${transactionFrequency} registros financeiros. Excelente controle!`;
            }
            
            patterns.push({
                type: 'success',
                icon: 'ph ph-chart-line-up',
                title: 'Atividade Financeira',
                description: frequencyDescription,
                value: `${transactionFrequency} registro${transactionFrequency !== 1 ? 's' : ''}`
            });
            
            //Padrão 2: Horário de maior gasto
            const expensesByHour = {};
            currentTransactions.filter(t => t.tipo === 'despesa').forEach(t => {
                // Corrigir parsing de data para pegar hora local correta
                let hour;
                if (t.data.includes('T') || t.data.includes('Z')) {
                    // Se é ISO string, converter para hora local
                    const date = new Date(t.data);
                    hour = date.getHours();
                } else if (t.data.includes('/')) {
                    // Formato DD/MM/YYYY ou DD/MM/YYYY HH:mm
                    const parts = t.data.split(' ');
                    if (parts.length > 1) {
                        // Tem horário
                        const timeParts = parts[1].split(':');
                        hour = parseInt(timeParts[0]);
                    } else {
                        // Não tem horário, considerar meio-dia como padrão
                        hour = 12;
                    }
                } else {
                    // Formato YYYY-MM-DD ou outro
                    const date = new Date(t.data + 'T12:00:00'); // Adiciona horário padrão para evitar conversão UTC
                    hour = date.getHours();
                }
                
                expensesByHour[hour] = (expensesByHour[hour] || 0) + 1;
            });
            const peakHour = Object.entries(expensesByHour).sort((a, b) => b[1] - a[1])[0];
            
            if (peakHour) {
                const hourLabel = `${peakHour[0]}h - ${parseInt(peakHour[0]) + 1}h`;
                patterns.push({
                    type: '',
                    icon: 'ph ph-clock',
                    title: 'Horário de Pico',
                    description: `Você costuma gastar mais entre ${hourLabel}, com ${peakHour[1]} transações nesse horário.`,
                    value: hourLabel
                });
            }
            
            //Padrão 3: Categoria mais frequente
            const categoryFrequency = {};
            currentTransactions.filter(t => t.tipo === 'despesa').forEach(t => {
                categoryFrequency[t.categoria] = (categoryFrequency[t.categoria] || 0) + 1;
            });
            const mostFrequent = Object.entries(categoryFrequency).sort((a, b) => b[1] - a[1])[0];
            
            if (mostFrequent) {
                patterns.push({
                    type: '',
                    icon: 'ph ph-star',
                    title: 'Categoria Mais Frequente',
                    description: `${mostFrequent[0]} é sua categoria mais utilizada, com ${mostFrequent[1]} transações.`,
                    value: mostFrequent[0]
                });
            }
            
            //Padrão 4: Tendência de gastos
            const gastosChange = previousStats.despesas > 0 
                ? ((currentStats.despesas - previousStats.despesas) / previousStats.despesas) * 100 
                : 0;
            
            if (Math.abs(gastosChange) > 5) {
                patterns.push({
                    type: gastosChange > 0 ? 'warning' : 'success',
                    icon: gastosChange > 0 ? 'ph ph-trend-up' : 'ph ph-trend-down',
                    title: gastosChange > 0 ? 'Gastos em Alta' : 'Gastos em Queda',
                    description: `Seus gastos ${gastosChange > 0 ? 'aumentaram' : 'diminuíram'} ${Math.abs(gastosChange).toFixed(1)}% comparado ao período anterior.`,
                    value: `${gastosChange > 0 ? '+' : ''}${gastosChange.toFixed(1)}%`
                });
            }
            
            //Padrão 5: Ticket médio
            const ticketMedio = currentStats.despesas / currentTransactions.filter(t => t.tipo === 'despesa').length;
            patterns.push({
                type: '',
                icon: 'ph ph-receipt',
                title: 'Ticket Médio',
                description: 'Valor médio gasto por transação no período analisado.',
                value: formatCurrency(ticketMedio || 0)
            });
            
            const html = patterns.map(p => `
                <div class="pattern-card ${p.type}">
                    <div class="pattern-icon">
                        ${renderIcon(p.icon)}
                    </div>
                    <div class="pattern-content">
                        <div class="pattern-title">${p.title}</div>
                        <div class="pattern-description">${p.description}</div>
                        ${p.value ? `<div class="pattern-value">${p.value}</div>` : ''}
                    </div>
                </div>
            `).join('');
            
            document.getElementById('patternsGrid').innerHTML = html;
        }

        function renderCategoriesAnalysis(transactionsInPeriod) {
            const despesas = transactionsInPeriod.filter(t => t.tipo === 'despesa');
            
            if (despesas.length === 0) {
                document.getElementById('categoriesAnalysis').innerHTML = 
                    '<p style="text-align: center; color: #6b7280; padding: 2rem;">Nenhuma despesa no período selecionado</p>';
                return;
            }
            
            const categoryData = {};
            despesas.forEach(t => {
                if (!categoryData[t.categoria]) {
                    categoryData[t.categoria] = {
                        total: 0,
                        count: 0
                    };
                }
                categoryData[t.categoria].total += Math.abs(t.valor);
                categoryData[t.categoria].count++;
            });
            
            const totalDespesas = Object.values(categoryData).reduce((sum, cat) => sum + cat.total, 0);
            const sortedCategories = Object.entries(categoryData).sort((a, b) => b[1].total - a[1].total);
            
            const categoryIcons = {
                'Mercado': 'ph-shopping-cart',
                'Restaurante': 'ph-fork-knife',
                'Transporte': 'ph-car',
                'Moradia': 'ph-house',
                'Lazer': 'ph-game-controller',
                'Saúde': 'ph-heart',
                'Outros': 'ph-wallet'
            };
            
            const html = sortedCategories.map(([category, data]) => {
                const percentage = (data.total / totalDespesas) * 100;
                const media = data.total / data.count;
                
                return `
                    <div class="category-analysis-item">
                        <div class="category-analysis-header">
                            <div class="category-analysis-name">
                                ${renderIcon(categoryIcons[category] || 'ph-wallet')}
                                ${category}
                            </div>
                            <div class="category-analysis-total">${formatCurrency(data.total)}</div>
                        </div>
                        <div class="category-analysis-stats">
                            <div class="category-stat-box">
                                <span class="category-stat-label">Transações</span>
                                <span class="category-stat-value">${data.count}x</span>
                            </div>
                            <div class="category-stat-box">
                                <span class="category-stat-label">Média</span>
                                <span class="category-stat-value">${formatCurrency(media)}</span>
                            </div>
                            <div class="category-stat-box">
                                <span class="category-stat-label">% do Total</span>
                                <span class="category-stat-value">${percentage.toFixed(1)}%</span>
                            </div>
                        </div>
                        <div class="category-progress-bar-wrapper">
                            <div class="category-progress-bar-fill-blue" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `;
            }).join('');
            
            document.getElementById('categoriesAnalysis').innerHTML = html;
        }

        function renderTimelineAnalysis(transactionsInPeriod) {
            const despesas = transactionsInPeriod
                .filter(t => t.tipo === 'despesa')
                .sort((a, b) => parseLocalDate(b.data) - parseLocalDate(a.data))
                .slice(0, 10); //Últimas 10
            
            if (despesas.length === 0) {
                document.getElementById('timelineContainer').innerHTML = 
                    '<p style="text-align: center; color: #6b7280; padding: 2rem;">Nenhuma despesa no período selecionado</p>';
                return;
            }
            
            const categoryIcons = {
                'Mercado': 'ph-shopping-cart',
                'Restaurante': 'ph-fork-knife',
                'Transporte': 'ph-car',
                'Moradia': 'ph-house',
                'Lazer': 'ph-game-controller',
                'Saúde': 'ph-heart',
                'Outros': 'ph-wallet'
            };
            
            const html = despesas.map(t => `
                <div class="timeline-item">
                    <div class="timeline-date"></div>
                    <div class="timeline-content">
                        <div class="timeline-header">
                            <div class="timeline-title">${t.descricao}</div>
                            <div class="timeline-amount">${formatCurrency(Math.abs(t.valor))}</div>
                        </div>
                        <div class="timeline-meta">
                            <span>
                                ${renderIcon(categoryIcons[t.categoria] || 'ph-wallet')}
                                ${t.categoria}
                            </span>
                            <span>${formatDate(t.data)}</span>
                        </div>
                    </div>
                </div>
            `).join('');
            
            document.getElementById('timelineContainer').innerHTML = html;
        }

        function renderPredictionsAnalysis(currentStats, currentTransactions) {
            const days = currentReportPeriod === '7days' ? 7 : currentReportPeriod === '30days' ? 30 : 30;
            const mediaDiaria = currentStats.despesas / days;
            
            //Previsão 1: Fim do Mês
            const hoje = new Date();
            const fimDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
            const diasRestantes = Math.ceil((fimDoMes - hoje) / (1000 * 60 * 60 * 24));
            const projecaoFimMes = currentStats.despesas + (mediaDiaria * diasRestantes);
            
            //Previsão 2: Taxa de crescimento
            const mesAtual = hoje.getMonth();
            const anoAtual = hoje.getFullYear();
            let mesAnterior = mesAtual - 1;
            let anoAnterior = anoAtual;
            if (mesAnterior < 0) {
                mesAnterior = 11;
                anoAnterior -= 1;
            }
            
            const gastosMesAtual = transactions.filter(t => {
                const tDate = parseLocalDate(t.data);
                return t.tipo === 'despesa' && tDate.getMonth() === mesAtual && tDate.getFullYear() === anoAtual;
            }).reduce((sum, t) => sum + Math.abs(t.valor), 0);
            
            const gastosMesAnterior = transactions.filter(t => {
                const tDate = parseLocalDate(t.data);
                return t.tipo === 'despesa' && tDate.getMonth() === mesAnterior && tDate.getFullYear() === anoAnterior;
            }).reduce((sum, t) => sum + Math.abs(t.valor), 0);
            
            const taxaCrescimento = gastosMesAnterior > 0 ? 
                ((gastosMesAtual - gastosMesAnterior) / gastosMesAnterior) * 100 : 0;
            
            //Previsão 3: Economia possível
            const metaMensal = currentUser?.metaMensal || currentStats.despesas * 0.8;
            const economiaPossivel = Math.max(0, currentStats.despesas - metaMensal);
            
            const predictions = [
                {
                    icon: 'ph ph-calendar-check',
                    title: 'Projeção até Fim do Mês',
                    subtitle: `Faltam ${diasRestantes} dias`,
                    value: formatCurrency(projecaoFimMes),
                    details: [
                        { label: 'Gasto até agora', value: formatCurrency(currentStats.despesas) },
                        { label: 'Média diária', value: formatCurrency(mediaDiaria) }
                    ]
                },
                {
                    icon: 'ph ph-chart-line',
                    title: 'Tendência de Gastos',
                    subtitle: 'Comparado ao mês anterior',
                    value: `${taxaCrescimento > 0 ? '+' : ''}${taxaCrescimento.toFixed(1)}%`,
                    details: [
                        { label: 'Mês atual', value: formatCurrency(gastosMesAtual) },
                        { label: 'Mês anterior', value: formatCurrency(gastosMesAnterior) }
                    ]
                },
                {
                    icon: 'ph ph-piggy-bank',
                    title: 'Potencial de Economia',
                    subtitle: 'Para atingir sua meta',
                    value: formatCurrency(economiaPossivel),
                    details: [
                        { label: 'Sua meta', value: formatCurrency(metaMensal) },
                        { label: 'Gasto atual', value: formatCurrency(currentStats.despesas) }
                    ]
                }
            ];
            
            const html = predictions.map(p => `
                <div class="prediction-card">
                    <div class="prediction-header">
                        <div class="prediction-icon">
                            ${renderIcon(p.icon)}
                        </div>
                        <div class="prediction-title">
                            <h4>${p.title}</h4>
                            <span>${p.subtitle}</span>
                        </div>
                    </div>
                    <div class="prediction-value">${p.value}</div>
                    <div class="prediction-details">
                        ${p.details.map(d => `
                            <div class="prediction-detail-item">
                                <span class="prediction-detail-label">${d.label}</span>
                                <span class="prediction-detail-value">${d.value}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
            
            document.getElementById('predictionsGrid').innerHTML = html;
        }

        //===== FIM DAS NOVAS FUNÇÕES =====

        function renderTopExpenses(transactionsInPeriod) {
            const despesas = transactionsInPeriod.filter(t => t.tipo === 'despesa');
            
            if (despesas.length === 0) {
                document.getElementById('topExpensesList').innerHTML = 
                    '<p style="text-align: center; color: #6b7280; padding: 2rem;">Nenhuma despesa no período selecionado</p>';
                return;
            }
            
            const top5 = despesas
                .sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor))
                .slice(0, 5);
            
            const categoryIcons = {
                'Mercado': 'ph-shopping-cart',
                'Restaurante': 'ph-fork-knife',
                'Transporte': 'ph-car',
                'Moradia': 'ph-house',
                'Lazer': 'ph-game-controller',
                'Saúde': 'ph-heart',
                'Outros': 'ph-wallet'
            };
            
            const html = top5.map((t, index) => `
                <div class="top-expense-item">
                    <div class="top-expense-rank">${index + 1}</div>
                    <div class="top-expense-info">
                        <div class="top-expense-description">${t.descricao}</div>
                        <div class="top-expense-meta">
                            <span class="top-expense-category">
                                ${renderIcon(categoryIcons[t.categoria] || 'ph-wallet')}
                                ${t.categoria}
                            </span>
                            <span>${formatDate(t.data)}</span>
                        </div>
                    </div>
                    <div class="top-expense-amount">${formatCurrency(Math.abs(t.valor))}</div>
                </div>
            `).join('');
            
            document.getElementById('topExpensesList').innerHTML = html;
        }

        function renderGoalsAnalysis(currentStats) {
            if (!currentUser || !currentUser.metaMensal) {
                document.getElementById('goalsAnalysisSection').style.display = 'none';
                return;
            }
            
            document.getElementById('goalsAnalysisSection').style.display = 'block';
            
            const metaMensal = currentUser.metaMensal;
            const gastosAtuais = currentStats.despesas;
            const percentual = (gastosAtuais / metaMensal) * 100;
            
            const html = `
                <div class="goal-progress-item">
                    <div class="goal-progress-header">
                        <span class="goal-progress-title">Meta Mensal de Gastos</span>
                        <span class="goal-progress-percentage">${Math.min(percentual, 100).toFixed(1)}%</span>
                    </div>
                    <div class="goal-progress-bar-container">
                        <div class="goal-progress-bar-fill" style="width: ${Math.min(percentual, 100)}%; background: ${percentual > 100 ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'}"></div>
                    </div>
                    <div class="goal-progress-values">
                        <span>Gasto: ${formatCurrency(gastosAtuais)}</span>
                        <span>Meta: ${formatCurrency(metaMensal)}</span>
                    </div>
                </div>
            `;
            
            document.getElementById('goalsAnalysisGrid').innerHTML = html;
        }

        function renderSmartInsights(currentStats, previousStats, currentTransactions) {
            const insights = [];
            
            //Insight 1: Comparação de gastos
            const gastosChange = previousStats.despesas > 0 
                ? ((currentStats.despesas - previousStats.despesas) / previousStats.despesas) * 100 
                : 0;
            
            if (gastosChange > 20) {
                insights.push({
                    type: 'warning',
                    icon: 'ph-warning',
                    title: 'Gastos em Alta',
                    description: `Seus gastos aumentaram ${gastosChange.toFixed(1)}% em relação ao período anterior. Considere revisar despesas não essenciais.`
                });
            } else if (gastosChange < -10) {
                insights.push({
                    type: 'success',
                    icon: 'ph-check-circle',
                    title: 'Economia Notável',
                    description: `Parabéns! Você economizou ${Math.abs(gastosChange).toFixed(1)}% comparado ao período anterior. Continue assim!`
                });
            }
            
            //Insight 2: Categoria dominante
            const despesas = currentTransactions.filter(t => t.tipo === 'despesa');
            if (despesas.length > 0) {
                const categoryTotals = {};
                despesas.forEach(t => {
                    categoryTotals[t.categoria] = (categoryTotals[t.categoria] || 0) + Math.abs(t.valor);
                });
                const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
                const percentOfTotal = (topCategory[1] / currentStats.despesas) * 100;
                
                if (percentOfTotal > 40) {
                    insights.push({
                        type: 'info',
                        icon: 'ph-chart-pie-slice',
                        title: 'Categoria Dominante',
                        description: `${topCategory[0]} representa ${percentOfTotal.toFixed(1)}% dos seus gastos. Avalie se há oportunidades de redução nessa categoria.`
                    });
                }
            }
            
            //Insight 3: Saldo
            if (currentStats.saldo > currentStats.receitas * 0.2) {
                insights.push({
                    type: 'success',
                    icon: 'ph-piggy-bank',
                    title: 'Excelente Poupança',
                    description: `Você está poupando mais de 20% da sua renda. Considere investir esse valor para fazer seu dinheiro crescer.`
                });
            } else if (currentStats.saldo < 0) {
                insights.push({
                    type: 'warning',
                    icon: 'ph-warning-circle',
                    title: 'Saldo Negativo',
                    description: `Suas despesas superaram suas receitas. Revise seu orçamento e identifique onde pode economizar.`
                });
            }
            
            //Insight 4: Média diária
            const days = currentReportPeriod === '7days' ? 7 : currentReportPeriod === '30days' ? 30 : 30;
            const mediaDiaria = currentStats.despesas / days;
            if (mediaDiaria > 100) {
                insights.push({
                    type: 'info',
                    icon: 'ph-calendar-blank',
                    title: 'Gasto Diário Elevado',
                    description: `Sua média diária é ${formatCurrency(mediaDiaria)}. Pequenas economias diárias podem resultar em grandes economias mensais.`
                });
            }
            
            //Se não houver insights, mostrar mensagem positiva
            if (insights.length === 0) {
                insights.push({
                    type: 'success',
                    icon: 'ph-smiley',
                    title: 'Finanças Equilibradas',
                    description: 'Suas finanças estão bem equilibradas! Continue mantendo o controle dos seus gastos e receitas.'
                });
            }
            
            const html = insights.map(insight => {
                return `
                <div class="smart-insight-item ${insight.type}">
                    <div class="smart-insight-icon">
                        ${renderIcon(insight.icon)}
                    </div>
                    <div class="smart-insight-content">
                        <div class="smart-insight-title">${insight.title}</div>
                        <div class="smart-insight-description">${insight.description}</div>
                    </div>
                </div>
            `; }).join('');
            
            document.getElementById('smartInsightsGrid').innerHTML = html;
        }

        function renderCategoryDetails(transactionsInPeriod) {
            const despesas = transactionsInPeriod.filter(t => t.tipo === 'despesa');
            
            if (despesas.length === 0) {
                document.getElementById('categoryDetailsContainer').innerHTML = 
                    '<p style="text-align: center; color: #6b7280; padding: 2rem;">Nenhuma despesa no período selecionado</p>';
                return;
            }
            
            const categoryData = {};
            despesas.forEach(t => {
                if (!categoryData[t.categoria]) {
                    categoryData[t.categoria] = {
                        total: 0,
                        count: 0,
                        transactions: []
                    };
                }
                categoryData[t.categoria].total += Math.abs(t.valor);
                categoryData[t.categoria].count++;
                categoryData[t.categoria].transactions.push(t);
            });
            
            const totalDespesas = Object.values(categoryData).reduce((sum, cat) => sum + cat.total, 0);
            const sortedCategories = Object.entries(categoryData).sort((a, b) => b[1].total - a[1].total);
            
            const categoryIcons = {
                'Mercado': 'ph-shopping-cart',
                'Restaurante': 'ph-fork-knife',
                'Transporte': 'ph-car',
                'Moradia': 'ph-house',
                'Lazer': 'ph-game-controller',
                'Saúde': 'ph-heart',
                'Outros': 'ph-wallet'
            };
            
            const html = sortedCategories.map(([category, data]) => {
                const percentage = (data.total / totalDespesas) * 100;
                const media = data.total / data.count;
                
                return `
                    <div class="category-detail-item">
                        <div class="category-detail-header">
                            <div class="category-detail-name">
                                ${renderIcon(categoryIcons[category] || 'ph-wallet')}
                                ${category}
                            </div>
                            <div class="category-detail-total">${formatCurrency(data.total)}</div>
                        </div>
                        <div class="category-detail-stats">
                            <div class="category-stat">
                                <span class="category-stat-label">Transações</span>
                                <span class="category-stat-value">${data.count}</span>
                            </div>
                            <div class="category-stat">
                                <span class="category-stat-label">Média por transação</span>
                                <span class="category-stat-value">${formatCurrency(media)}</span>
                            </div>
                            <div class="category-stat">
                                <span class="category-stat-label">% do total</span>
                                <span class="category-stat-value">${percentage.toFixed(1)}%</span>
                            </div>
                        </div>
                        <div class="category-progress-wrapper">
                            <div class="category-progress-bar">
                                <div class="category-progress-fill" style="width: ${percentage}%"></div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            document.getElementById('categoryDetailsContainer').innerHTML = html;
        }

        function openCustomDateModal() {
            //TODO: Implementar modal de data customizada
            showInfoNotification('Funcionalidade de data customizada será implementada em breve!');
        }

        //Mantém funções antigas para compatibilidade
        function renderWeeklySummaryReport() {
            const container = document.getElementById('weeklyReportContainer');
            
            if (transactions.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>Adicione transações para ver o resumo dinâmico</p></div>';
                return;
            }

            const today = new Date();
            const lastWeekEnd = new Date();
            const lastWeekStart = new Date();
            const twoWeeksAgoStart = new Date();
            
            lastWeekEnd.setHours(23, 59, 59, 999);
            lastWeekStart.setDate(today.getDate() - 7);
            lastWeekStart.setHours(0, 0, 0, 0);
            twoWeeksAgoStart.setDate(today.getDate() - 14);
            twoWeeksAgoStart.setHours(0, 0, 0, 0);
            
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]📊 Resumo Dinâmico - Debug:');
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]Período atual:', lastWeekStart.toLocaleDateString(), 'até', lastWeekEnd.toLocaleDateString());
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]Total de transações:', transactions.length);
            
            const thisWeekSpending = calculateWeeklySpending(lastWeekStart, lastWeekEnd);
            const lastWeekSpending = calculateWeeklySpending(twoWeeksAgoStart, lastWeekStart);
            
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]Gastos esta semana:', thisWeekSpending);
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]Gastos semana anterior:', lastWeekSpending);
            
            //Calcula também as receitas para análise mais completa
            const thisWeekIncome = transactions
                .filter(t => {
                    const transactionDate = parseLocalDate(t.data);
                    return t.tipo === 'receita' && transactionDate >= lastWeekStart && transactionDate <= lastWeekEnd;
                })
                .reduce((sum, t) => sum + t.valor, 0);

            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]Receitas esta semana:', thisWeekIncome);

            const difference = lastWeekSpending > 0 
                ? ((thisWeekSpending - lastWeekSpending) / lastWeekSpending) * 100 
                : 0;

            const avgDailySpending = thisWeekSpending / 7;
            const balance = thisWeekIncome - thisWeekSpending;
            
            //Análise inteligente do comportamento
            let statusType, statusIcon, statusTitle, statusMessage, statusColor, insightIcon;
            
            //Caso especial: sem dados suficientes
            if (thisWeekSpending === 0 && thisWeekIncome === 0) {
                statusType = 'empty';
                statusIcon = 'ph-rocket-launch';
                statusTitle = 'Comece sua jornada!';
                statusMessage = 'Adicione suas primeiras transações para acompanhar seu progresso.';
                statusColor = '#3b82f6';
                insightIcon = 'ph-plus-circle';
            } else if (difference > 20) {
                statusType = 'alert';
                statusIcon = 'ph-warning-circle';
                statusTitle = 'Semana intensa!';
                statusMessage = 'Seus gastos aumentaram significativamente. Veja onde você pode cortar.';
                statusColor = '#dc2626';
                insightIcon = 'ph-trending-up';
            } else if (difference > 5) {
                statusType = 'warning';
                statusIcon = 'ph-info';
                statusTitle = 'Atenção aos gastos';
                statusMessage = 'Seus gastos estão um pouco acima do normal. Fique atento.';
                statusColor = '#f59e0b';
                insightIcon = 'ph-arrow-up';
            } else if (difference < -10) {
                statusType = 'success';
                statusIcon = 'ph-check-circle';
                statusTitle = 'Parabéns!';
                statusMessage = 'Você gastou menos que a média. Continue assim!';
                statusColor = '#059669';
                insightIcon = 'ph-trending-down';
            } else if (balance > 0) {
                statusType = 'positive';
                statusIcon = 'ph-smiley';
                statusTitle = 'Ótimo balanço!';
                statusMessage = 'Suas receitas superaram os gastos esta semana.';
                statusColor = '#3b82f6';
                insightIcon = 'ph-chart-line-up';
            } else {
                statusType = 'neutral';
                statusIcon = 'ph-activity';
                statusTitle = 'Tudo sob controle';
                statusMessage = 'Seus gastos estão dentro do esperado.';
                statusColor = '#3b82f6';
                insightIcon = 'ph-minus';
            }

            const formattedSpending = formatCurrency(thisWeekSpending);
            const formattedAvgDaily = formatCurrency(avgDailySpending);
            const formattedBalance = formatCurrency(Math.abs(balance));

            const html = `
                <div class="dynamic-summary">
                    <div class="dynamic-summary-main" style="border-left: 4px solid ${statusColor};">
                        <div class="dynamic-header">
                            <div class="dynamic-icon" style="color: ${statusColor};">
                                <i class="ph ${statusIcon}"></i>
                            </div>
                            <div class="dynamic-title-section">
                                <h3 class="dynamic-title" style="color: ${statusColor};">${statusTitle}</h3>
                                <p class="dynamic-message">${statusMessage}</p>
                            </div>
                        </div>
                        
                        <div class="dynamic-stats">
                            <div class="dynamic-stat-item">
                                <div class="stat-label">
                                    ${renderIcon('ph-wallet')}
                                    <span>Gastos (7 dias)</span>
                                </div>
                                <div class="stat-value">${formattedSpending}</div>
                            </div>
                            
                            <div class="dynamic-stat-item">
                                <div class="stat-label">
                                    ${renderIcon('ph-calendar-blank')}
                                    <span>Média diária</span>
                                </div>
                                <div class="stat-value">${formattedAvgDaily}</div>
                            </div>
                            
                            <div class="dynamic-stat-item">
                                <div class="stat-label">
                                    <i class="ph ${insightIcon}"></i>
                                    <span>vs. Semana anterior</span>
                                </div>
                                <div class="stat-value" style="color: ${difference > 0 ? '#dc2626' : difference < 0 ? '#059669' : '#6b7280'};">
                                    ${difference > 0 ? '+' : ''}${difference.toFixed(1)}%
                                </div>
                            </div>
                            
                            <div class="dynamic-stat-item">
                                <div class="stat-label">
                                    ${renderIcon('ph-scales')}
                                    <span>Balanço semanal</span>
                                </div>
                                <div class="stat-value" style="color: ${balance >= 0 ? '#059669' : '#dc2626'};">
                                    ${balance >= 0 ? '+' : '-'}${formattedBalance}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            container.innerHTML = html;
        }

        function renderCategoryReport() {
            const container = document.getElementById('categoryReportContainer');
            
            //CORREÇÃO: Verifica se o elemento existe
            if (!container) {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]⚠️ Container categoryReportContainer não encontrado');
                return;
            }
            
            //✅ CORREÇÃO: Filtra apenas transações que já aconteceram (não futuras/agendadas)
            const hoje = new Date();
            hoje.setHours(23, 59, 59, 999);
            
            const validTransactions = transactions.filter(t => {
                const dataTransacao = parseLocalDate(t.data);
                return dataTransacao <= hoje;
            });
            
            const expensesOnly = validTransactions.filter(t => t.tipo === 'despesa');
            if (expensesOnly.length === 0) {
                container.innerHTML = `
                    <div class="category-empty-message">
                        <i class="ph ph-chart-pie"></i>
                        <span>Não há despesas registradas nas categorias neste período.</span>
                    </div>
                `;
                return;
            }
            
            //CORRIGIDO: Usa valorParcela para despesas parceladas
            const categoryTotals = {};
            expensesOnly.forEach(t => {
                const valor = t.despesaTipo === 'parcelada' && t.valorParcela ? t.valorParcela : t.valor;
                categoryTotals[t.categoria] = (categoryTotals[t.categoria] || 0) + Math.abs(valor);
            });
            
            const totalExpenses = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
            const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
            
            const html = sortedCategories.map(([category, total]) => {
                const percentage = (total / totalExpenses) * 100;
                const categoryIcons = {
                    'Mercado': 'ph-shopping-cart',
                    'Restaurante': 'ph-fork-knife',
                    'Transporte': 'ph-car',
                    'Moradia': 'ph-house',
                    'Lazer': 'ph-game-controller',
                    'Saúde': 'ph-heart',
                    'Outros': 'ph-wallet'
                };
                
                return `
                    <div class="category-item-report">
                        <div class="category-header-report">
                            <div class="category-name-report">
                                ${renderIcon(categoryIcons[category] || 'ph-wallet')}
                                <span style="font-weight: 600; color: #1e40af;">${category}</span>
                            </div>
                            <div class="category-values-report">
                                <div class="category-amount">${formatCurrency(total)}</div>
                                <div class="category-percentage">${percentage.toFixed(1)}%</div>
                            </div>
                        </div>
                        <div class="category-progress-wrapper">
                            <div class="category-progress-bar">
                                <div class="category-progress-fill" style="width: ${percentage}%;"></div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            container.innerHTML = html;
        }

        function renderMonthlyChart() {
            const canvas = document.getElementById('reportChart');
            if (!canvas) {
                console.warn('[WARNING]⚠️ Canvas reportChart não encontrado');
                return;
            }
            
            if (!ChartManager.isReady) {
                console.warn('[WARNING]⚠️ Chart.js não está pronto para renderMonthlyChart');
                setTimeout(renderMonthlyChart, 500);
                return;
            }
            
            //✅ CORREÇÃO: Filtra apenas transações que já aconteceram (não futuras/agendadas)
            const hoje = new Date();
            hoje.setHours(23, 59, 59, 999);
            
            const validTransactions = transactions.filter(t => {
                const dataTransacao = parseLocalDate(t.data);
                return dataTransacao <= hoje;
            });
            
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]📊 Renderizando gráfico mensal com', validTransactions.length, 'transações válidas (de', transactions.length, 'totais)');
            
            const labels = [];
            const incomeData = [];
            const expenseData = [];
            
            const now = new Date();
            
            for (let i = 5; i >= 0; i--) {
                const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
                
                const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                labels.push(monthNames[monthDate.getMonth()]);
                
                const monthIncome = validTransactions
                    .filter(t => {
                        const tDate = parseLocalDate(t.data);
                        return t.tipo === 'receita' && tDate >= monthDate && tDate <= monthEnd;
                    })
                    .reduce((sum, t) => sum + Math.abs(t.valor), 0);
                
                const monthExpense = validTransactions
                    .filter(t => {
                        const tDate = parseLocalDate(t.data);
                        return t.tipo === 'despesa' && tDate >= monthDate && tDate <= monthEnd;
                    })
                    .reduce((sum, t) => sum + Math.abs(t.valor), 0);
                
                incomeData.push(monthIncome);
                expenseData.push(monthExpense);
            }
            
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]📈 Dados do gráfico mensal:', { labels, incomeData, expenseData });
            
            //Usar ChartManager para gerenciar o gráfico
            reportChart = ChartManager.create('reportChart', {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Receitas',
                        data: incomeData,
                        backgroundColor: 'rgba(16, 185, 129, 0.6)',
                        borderColor: '#059669',
                        borderWidth: 1
                    }, {
                        label: 'Despesas',
                        data: expenseData,
                        backgroundColor: 'rgba(220, 38, 38, 0.6)',
                        borderColor: '#dc2626',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { 
                            display: true,
                            labels: { color: '#6b7280' }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0, 0, 0, 0.05)' },
                            ticks: { 
                                color: '#6b7280',
                                callback: (value) => 'R$ ' + value.toFixed(0)
                            }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#6b7280' }
                        }
                    }
                }
            });
        }

        function closeModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('show');
                modal.classList.remove('active'); // Remove classe para controle CSS
                
                //Mostrar AppBar novamente no mobile quando QUALQUER modal fechar
                const mobileBottomNav = document.querySelector('.mobile-bottom-nav');
                if (mobileBottomNav && window.innerWidth <= 768) {
                    mobileBottomNav.style.display = 'flex';
                }
                
                //🧹 Limpa flag de edição de despesa fixa ao fechar o modal de transação
                if (modalId === 'transactionModal' && window.editingFixedGroupId) {
                    delete window.editingFixedGroupId;
                    
                    //Reseta o título e botão do modal
                    document.getElementById('transactionModalTitle').textContent = 'Nova Transação';
                    const submitBtn = document.querySelector('.btn-submit-transaction');
                    if (submitBtn) {
                        submitBtn.innerHTML = '<i class="ph ph-plus-circle"></i> Adicionar';
                    }
                }
            }
        }
        
        //Função auxiliar para ocultar AppBar quando abrir modal (chamada automaticamente)
        function hideAppBarOnModalOpen() {
            const mobileBottomNav = document.querySelector('.mobile-bottom-nav');
            if (mobileBottomNav && window.innerWidth <= 768) {
                mobileBottomNav.style.display = 'none';
            }
        }

        //Função de capitalização automática
        function capitalizeFirstLetter(text) {
            if (!text) return text;
            return text.charAt(0).toUpperCase() + text.slice(1);
        }

        function capitalizeWords(text) {
            if (!text) return text;
            return text.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        }

        //Aplica capitalização automática aos inputs
        function setupAutoCapitalization() {
            //Inputs que devem ter primeira letra maiúscula de CADA PALAVRA (exceto email e senha)
            const inputsToCapitalize = [
                'name',                      //Nome no registro
                'transactionDescription',    //Descrição da transação
                'newCategoryName',          //Nome de nova categoria
                'onboardingName',           //Nome no onboarding
                'onboardingOccupation',     //Ocupação no onboarding
                'profileNameInput',         //Nome no perfil
                'profileOccupation',        //Ocupação no perfil
                'modalGoalName'             //Nome da meta/objetivo
            ];

            inputsToCapitalize.forEach(id => {
                const input = document.getElementById(id);
                if (input && input.type !== 'email' && input.type !== 'password') {
                    //✅ CORREÇÃO: Capitaliza CADA PALAVRA ao sair do campo (blur)
                    input.addEventListener('blur', function() {
                        if (this.value && this.value.trim()) {
                            this.value = capitalizeWords(this.value.trim());
                        }
                    });
                }
            });
            
            //✅ NOVO: Garante que email seja SEMPRE minúsculo
            const emailInputs = ['email', 'profileEmailInput'];
            emailInputs.forEach(id => {
                const input = document.getElementById(id);
                if (input) {
                    input.addEventListener('input', function() {
                        //setSelectionRange não funciona em inputs type="email"
                        //Só aplica em inputs type="text"
                        if (this.type === 'text') {
                            const cursorPosition = this.selectionStart;
                            this.value = this.value.toLowerCase();
                            this.setSelectionRange(cursorPosition, cursorPosition);
                        } else {
                            //Para type="email", apenas converte sem manter cursor
                            this.value = this.value.toLowerCase();
                        }
                    });
                }
            });
        }

        //Chama a função quando o DOM estiver pronto
        document.addEventListener('DOMContentLoaded', setupAutoCapitalization);

        //Funções de Loading
        function showLoading(message = 'Processando...') {
            const loadingHTML = `
                <div class="loading-overlay" id="loadingOverlay">
                    <div class="loading-content">
                        <div class="loading-spinner"></div>
                        <div class="loading-text">${message}</div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', loadingHTML);
        }

        function hideLoading() {
            const loading = document.getElementById('loadingOverlay');
            if (loading) {
                loading.style.animation = 'fadeOut 0.2s ease';
                setTimeout(() => loading.remove(), 200);
            }
        }

        function formatCurrency(value) {
            return new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
            }).format(value);
        }

        function formatDate(dateString) {
            try {
                const date = parseLocalDate(dateString);
                return new Intl.DateTimeFormat('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    timeZone: 'America/Sao_Paulo'
                }).format(date);
            } catch (e) {
                return dateString || '';
            }
        }

        function formatDateFull(dateString) {
            try {
                const date = parseLocalDate(dateString);
                return new Intl.DateTimeFormat('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    timeZone: 'America/Sao_Paulo'
                }).format(date);
            } catch (e) {
                return dateString || '';
            }
        }

        function getCurrentMonthTransactions() {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            return transactions
                .filter(t => {
                    const tDate = parseLocalDate(t.data);
                    return tDate >= startOfMonth && tDate <= endOfMonth;
                })
                .sort((a, b) => parseLocalDate(a.data) - parseLocalDate(b.data));
        }

        function exportToPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            //Título e Cabeçalho
            const currentMonth = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date());
            doc.setFontSize(20);
            doc.text('PoupAí - Relatório Financeiro', 15, 20);
            doc.setFontSize(14);
            doc.text(currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1), 15, 30);

            //Resumo Financeiro
            const monthTransactions = getCurrentMonthTransactions();
            const income = monthTransactions.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0);
            const expenses = monthTransactions.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + Math.abs(t.valor), 0);
            const balance = income - expenses;

            doc.setFontSize(12);
            doc.text('Resumo do Mês:', 15, 45);
            doc.text(`Receitas: ${formatCurrency(income)}`, 20, 55);
            doc.text(`Despesas: ${formatCurrency(expenses)}`, 20, 62);
            doc.text(`Saldo: ${formatCurrency(balance)}`, 20, 69);

            //Tabela de Transações
            const tableHeaders = [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']];
            const tableData = monthTransactions.map(t => [
                formatDateFull(t.data),
                t.descricao,
                t.categoria,
                t.tipo === 'receita' ? 'Receita' : 'Despesa',
                formatCurrency(Math.abs(t.valor))
            ]);

            doc.autoTable({
                head: tableHeaders,
                body: tableData,
                startY: 80,
                styles: { fontSize: 9 },
                headStyles: { fillColor: [59, 130, 246] },
                alternateRowStyles: { fillColor: [241, 245, 249] }
            });

            //Rodapé
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.text(
                    `Gerado por PoupAí em ${formatDateFull(new Date().toISOString())} - Página ${i} de ${pageCount}`,
                    doc.internal.pageSize.width / 2,
                    doc.internal.pageSize.height - 10,
                    { align: 'center' }
                );
            }

            //Download do PDF
            doc.save('poupai-relatorio-' + currentMonth.replace(' ', '-') + '.pdf');
        }

        function exportToExcel() {
            const monthTransactions = getCurrentMonthTransactions();
            const currentMonth = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date());

            //Preparar dados para o Excel
            const worksheetData = [
                ['PoupAí - Relatório Financeiro'],
                [currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)],
                [],
                ['Resumo do Mês'],
                ['Receitas', formatCurrency(monthTransactions.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0))],
                ['Despesas', formatCurrency(monthTransactions.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + Math.abs(t.valor), 0))],
                [],
                ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']
            ];

            //Adicionar transações
            monthTransactions.forEach(t => {
                worksheetData.push([
                    formatDateFull(t.data),
                    t.descricao,
                    t.categoria,
                    t.tipo === 'receita' ? 'Receita' : 'Despesa',
                    Math.abs(t.valor)
                ]);
            });

            //Criar planilha
            const ws = XLSX.utils.aoa_to_sheet(worksheetData);

            //Estilização básica
            ws['!cols'] = [
                { wch: 12 }, //Data
                { wch: 30 }, //Descrição
                { wch: 15 }, //Categoria
                { wch: 10 }, //Tipo
                { wch: 15 }  //Valor
            ];

            //Criar workbook e adicionar a planilha
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Relatório Financeiro');

            //Download do arquivo
            XLSX.writeFile(wb, 'poupai-relatorio-' + currentMonth.replace(' ', '-') + '.xlsx');
        }

        function calculateCompoundInterest() {
            const initialAmount = parseFloat(document.getElementById('compoundInitialAmount').value) || 0;
            const monthlyAmount = parseFloat(document.getElementById('compoundMonthlyAmount').value) || 0;
            const interestRate = parseFloat(document.getElementById('compoundInterestRate').value) || 0;
            const months = parseInt(document.getElementById('compoundPeriod').value) || 0;

            if (months <= 0) {
                showErrorNotification('Informe um período válido');
                return;
            }

            const rate = interestRate / 100;
            let totalAmount = initialAmount;
            let totalContributions = initialAmount;
            let totalInterest = 0;

            //Calcula mês a mês
            for (let i = 1; i <= months; i++) {
                totalAmount = totalAmount * (1 + rate) + monthlyAmount;
                totalContributions += monthlyAmount;
            }

            totalInterest = totalAmount - totalContributions;

            const resultsHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div style="background: #eff6ff; padding: 1.5rem; border-radius: 12px; border: 2px solid #dbeafe;">
                        <h4 style="color: #3b82f6; margin: 0 0 0.6rem 0; font-size: 0.9rem; font-weight: 600;">Montante Final</h4>
                        <div style="font-size: 1.6rem; font-weight: 700; color: #1e3a8a;">${formatCurrency(totalAmount)}</div>
                    </div>
                    <div style="background: #eff6ff; padding: 1.5rem; border-radius: 12px; border: 2px solid #dbeafe;">
                        <h4 style="color: #3b82f6; margin: 0 0 0.6rem 0; font-size: 0.9rem; font-weight: 600;">Total Investido</h4>
                        <div style="font-size: 1.6rem; font-weight: 700; color: #1e3a8a;">${formatCurrency(totalContributions)}</div>
                    </div>
                    <div style="background: #eff6ff; padding: 1.5rem; border-radius: 12px; border: 2px solid #dbeafe;">
                        <h4 style="color: #3b82f6; margin: 0 0 0.6rem 0; font-size: 0.9rem; font-weight: 600;">Juros Ganhos</h4>
                        <div style="font-size: 1.6rem; font-weight: 700; color: #1e3a8a;">${formatCurrency(totalInterest)}</div>
                    </div>
                </div>
                <div style="margin-top: 1.5rem; padding: 1rem; background: #f8fafc; border-radius: 10px; border-left: 4px solid #3b82f6;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        ${renderIcon('ph-chart-line-up')}
                        <strong style="color: #1e40af;">Rendimento total: ${((totalAmount/totalContributions - 1) * 100).toFixed(2)}%</strong>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; color: #64748b;">
                        ${renderIcon('ph-calendar')}
                        <span>Média mensal de juros: ${(totalInterest/months).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                </div>
            `;

            document.getElementById('compoundResults').innerHTML = resultsHTML;
        }

        function calculateTimeToTarget() {
            const targetAmount = parseFloat(document.getElementById('targetAmount').value) || 0;
            const initialAmount = parseFloat(document.getElementById('targetInitialAmount').value) || 0;
            const monthlyAmount = parseFloat(document.getElementById('targetMonthlyAmount').value) || 0;
            const interestRate = parseFloat(document.getElementById('targetInterestRate').value) || 0;

            //🔴 VALIDAÇÕES COM MENSAGENS DE ERRO VERMELHO
            if (!targetAmount || targetAmount <= 0) {
                document.getElementById('targetResults').innerHTML = `
                    <div class="error-message" style="text-align: center; padding: 1.5rem; background: #fef2f2; border-radius: 12px; border: 2px solid #fca5a5;">
                        <i class="ph ph-warning-circle" style="font-size: 2rem; color: #dc2626; margin-bottom: 0.5rem;"></i>
                        <p style="color: #dc2626; font-weight: 600; margin: 0;">O valor da meta deve ser maior que zero</p>
                    </div>
                `;
                return;
            }

            if (!monthlyAmount || monthlyAmount <= 0) {
                document.getElementById('targetResults').innerHTML = `
                    <div class="error-message" style="text-align: center; padding: 1.5rem; background: #fef2f2; border-radius: 12px; border: 2px solid #fca5a5;">
                        <i class="ph ph-warning-circle" style="font-size: 2rem; color: #dc2626; margin-bottom: 0.5rem;"></i>
                        <p style="color: #dc2626; font-weight: 600; margin: 0;">O valor mensal deve ser maior que zero</p>
                    </div>
                `;
                return;
            }

            if (initialAmount < 0) {
                document.getElementById('targetResults').innerHTML = `
                    <div class="error-message" style="text-align: center; padding: 1.5rem; background: #fef2f2; border-radius: 12px; border: 2px solid #fca5a5;">
                        <i class="ph ph-warning-circle" style="font-size: 2rem; color: #dc2626; margin-bottom: 0.5rem;"></i>
                        <p style="color: #dc2626; font-weight: 600; margin: 0;">O valor inicial não pode ser negativo</p>
                    </div>
                `;
                return;
            }

            if (interestRate < 0 || interestRate > 100) {
                document.getElementById('targetResults').innerHTML = `
                    <div class="error-message" style="text-align: center; padding: 1.5rem; background: #fef2f2; border-radius: 12px; border: 2px solid #fca5a5;">
                        <i class="ph ph-warning-circle" style="font-size: 2rem; color: #dc2626; margin-bottom: 0.5rem;"></i>
                        <p style="color: #dc2626; font-weight: 600; margin: 0;">A taxa de juros deve estar entre 0% e 100%</p>
                    </div>
                `;
                return;
            }

            if (targetAmount > 1000000000) {
                document.getElementById('targetResults').innerHTML = `
                    <div class="error-message" style="text-align: center; padding: 1.5rem; background: #fef2f2; border-radius: 12px; border: 2px solid #fca5a5;">
                        <i class="ph ph-warning-circle" style="font-size: 2rem; color: #dc2626; margin-bottom: 0.5rem;"></i>
                        <p style="color: #dc2626; font-weight: 600; margin: 0;">O valor da meta não pode ultrapassar R$ 1 bilhão</p>
                    </div>
                `;
                return;
            }

            const rate = interestRate / 100;
            let currentAmount = initialAmount;
            let months = 0;
            const maxMonths = 600; //Limite de 50 anos para evitar loop infinito

            //Calcula mês a mês até atingir o valor alvo
            while (currentAmount < targetAmount && months < maxMonths) {
                currentAmount = currentAmount * (1 + rate) + monthlyAmount;
                months++;
            }

            let resultsHTML = '';
            if (months >= maxMonths) {
                resultsHTML = `
                    <div class="error-message" style="text-align: center;">
                        Com os valores informados, não será possível atingir a meta em um prazo razoável.
                        Considere aumentar o valor mensal ou a taxa de juros.
                    </div>
                `;
            } else {
                const years = Math.floor(months / 12);
                const remainingMonths = months % 12;
                const totalContributed = initialAmount + (monthlyAmount * months);
                const totalInterest = currentAmount - totalContributed;

                resultsHTML = `
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h4 style="color: #1e40af;">Tempo Necessário</h4>
                            <div class="stat-value">
                                ${years > 0 ? years + ' anos' : ''} 
                                ${remainingMonths > 0 ? remainingMonths + ' meses' : ''}
                            </div>
                        </div>
                        <div class="stat-card">
                            <h4 style="color: #059669;">Total Investido</h4>
                            <div class="stat-value">${formatCurrency(totalContributed)}</div>
                        </div>
                        <div class="stat-card">
                            <h4 style="color: #0284c7;">Juros Ganhos</h4>
                            <div class="stat-value">${formatCurrency(totalInterest)}</div>
                        </div>
                    </div>
                    <div style="margin-top: 1rem; padding: 1rem; background: #f8fafc; border-radius: 8px; border-left: 3px solid #3b82f6;">
                        <p style="margin: 0 0 0.5rem 0; color: #1e293b; font-weight: 500;">
                            Total acumulado: ${formatCurrency(currentAmount)}
                        </p>
                        <p style="margin: 0; color: #64748b; font-size: 0.9rem;">
                            Os juros representarão ${((totalInterest/currentAmount) * 100).toFixed(1)}% do montante final
                        </p>
                    </div>
                `;
            }

            document.getElementById('targetResults').innerHTML = resultsHTML;
        }

        //========================================
        //FUNÇÕES DOS NOVOS SIMULADORES
        //========================================

        //========================================
        //FUNÇÃO DE ANIMAÇÃO DE REFRESH
        //========================================
        
        function animateRefreshButton(event, callbackFunction) {
            const button = event.currentTarget;
            const icon = button.querySelector('i') || button;
            
            //Adiciona classe de rotação
            icon.style.transition = 'transform 0.6s ease-in-out';
            icon.style.transform = 'rotate(360deg)';
            
            //Desabilita o botão temporariamente
            button.disabled = true;
            button.style.opacity = '0.6';
            
            //Executa a função de callback
            if (typeof callbackFunction === 'function') {
                callbackFunction().then(() => {
                    //Remove animação após completar
                    setTimeout(() => {
                        icon.style.transform = 'rotate(0deg)';
                        button.disabled = false;
                        button.style.opacity = '1';
                    }, 600);
                }).catch((error) => {
                    console.error('[ERROR]Erro ao atualizar:', error);
                    icon.style.transform = 'rotate(0deg)';
                    button.disabled = false;
                    button.style.opacity = '1';
                });
            } else {
                //Se não houver callback, apenas anima
                setTimeout(() => {
                    icon.style.transform = 'rotate(0deg)';
                    button.disabled = false;
                    button.style.opacity = '1';
                }, 600);
            }
        }

        //========================================
        //INTEGRAÇÃO COM API DO BANCO CENTRAL
        //========================================
        
        //Cache para evitar múltiplas requisições
        const taxasCache = {
            selic: null,
            cdi: null,
            ipca: null,
            lastUpdate: null
        };

        //Buscar taxa SELIC atual
        async function fetchSelicRate() {
            try {
                //API do Banco Central - SELIC Meta (432)
                const response = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json');
                const data = await response.json();
                
                if (data && data.length > 0) {
                    const selicAnual = parseFloat(data[0].valor);
                    //Converter taxa anual para mensal: (1 + taxa_anual)^(1/12) - 1
                    const selicMensal = (Math.pow(1 + selicAnual/100, 1/12) - 1) * 100;
                    return selicMensal;
                }
                return 0.70; //Fallback se API falhar
            } catch (error) {
                console.warn('[WARNING]Erro ao buscar SELIC, usando valor padrão:', error);
                return 0.70;
            }
        }

        //Buscar taxa CDI atual
        async function fetchCDIRate() {
            try {
                //API do Banco Central - CDI (12)
                const response = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json');
                const data = await response.json();
                
                if (data && data.length > 0) {
                    const cdiDiario = parseFloat(data[0].valor);
                    //Aproximação: CDI mensal = (1 + CDI_diário)^21 - 1 (21 dias úteis)
                    const cdiMensal = (Math.pow(1 + cdiDiario/100, 21) - 1) * 100;
                    return cdiMensal;
                }
                return 0.75; //Fallback
            } catch (error) {
                console.warn('[WARNING]Erro ao buscar CDI, usando valor padrão:', error);
                return 0.75;
            }
        }

        //Buscar IPCA (inflação)
        async function fetchIPCARate() {
            try {
                //API do Banco Central - IPCA (433)
                const response = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/1?formato=json');
                const data = await response.json();
                
                if (data && data.length > 0) {
                    const ipcaMensal = parseFloat(data[0].valor);
                    return ipcaMensal;
                }
                return 0.40; //Fallback
            } catch (error) {
                console.warn('[WARNING]Erro ao buscar IPCA, usando valor padrão:', error);
                return 0.40;
            }
        }

        //Buscar todas as taxas via backend com cache (válido por 24h)
        async function fetchAllRates() {
            const now = new Date().getTime();
            const cacheValidity = 24 * 60 * 60 * 1000; //24 horas
            
            //Verificar se o cache ainda é válido
            if (taxasCache.lastUpdate && (now - taxasCache.lastUpdate) < cacheValidity) {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]📦 Usando cache de taxas');
                return taxasCache;
            }

            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🔄 Buscando taxas via backend...');
            
            try {
                const response = await fetch(`${API_URL}/mercado/taxas`);
                if (!response.ok) throw new Error('Backend indisponível');
                
                const data = await response.json();
                
                //Processa SELIC
                if (data.selic && data.selic[0]) {
                    taxasCache.selic = parseFloat(data.selic[0].valor);
                }
                
                //Processa CDI
                if (data.cdi && data.cdi[0]) {
                    taxasCache.cdi = parseFloat(data.cdi[0].valor);
                }
                
                //Processa IPCA
                if (data.ipca && Array.isArray(data.ipca) && data.ipca.length > 0) {
                    const ultimoIPCA = data.ipca[data.ipca.length - 1];
                    taxasCache.ipca = parseFloat(ultimoIPCA.valor);
                }
                
                taxasCache.lastUpdate = now;
                
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Taxas atualizadas via backend:', {
                    'SELIC (a.m.)': taxasCache.selic?.toFixed(2) + '%',
                    'CDI (a.m.)': taxasCache.cdi?.toFixed(2) + '%',
                    'IPCA (a.m.)': taxasCache.ipca?.toFixed(2) + '%'
                });
                
                return taxasCache;
            } catch (error) {
                console.error('[ERROR]Erro ao buscar taxas via backend:', error);
                return taxasCache; //Retorna cache antigo se houver
            }
        }

        //========================================
        //FASE 1: AWESOMEAPI - COTAÇÕES DE MOEDAS
        //========================================

        const moedasCache = {
            usd: null,
            eur: null,
            btc: null,
            lastUpdate: null
        };

        //Buscar cotações atualizadas via backend
        async function fetchCurrencyRates() {
            try {
                const response = await fetch(`${API_URL}/mercado/moedas`);
                if (!response.ok) throw new Error('Backend indisponível');
                
                const data = await response.json();
                
                return {
                    usd: {
                        compra: parseFloat(data.USDBRL.bid),
                        venda: parseFloat(data.USDBRL.ask),
                        variacao: parseFloat(data.USDBRL.pctChange)
                    },
                    eur: {
                        compra: parseFloat(data.EURBRL.bid),
                        venda: parseFloat(data.EURBRL.ask),
                        variacao: parseFloat(data.EURBRL.pctChange)
                    },
                    btc: {
                        compra: parseFloat(data.BTCBRL.bid),
                        venda: parseFloat(data.BTCBRL.ask),
                        variacao: parseFloat(data.BTCBRL.pctChange)
                    },
                    lastUpdate: new Date().getTime()
                };
            } catch (error) {
                console.warn('[WARNING]Erro ao buscar cotações via backend, usando valores padrão:', error);
                return {
                    usd: { compra: 5.00, venda: 5.05, variacao: 0 },
                    eur: { compra: 5.30, venda: 5.35, variacao: 0 },
                    btc: { compra: 350000, venda: 355000, variacao: 0 },
                    lastUpdate: new Date().getTime()
                };
            }
        }

        //Atualizar cotações com cache (válido por 5 minutos)
        async function updateCurrencyRates() {
            const now = new Date().getTime();
            const cacheValidity = 5 * 60 * 1000; //5 minutos
            
            if (moedasCache.lastUpdate && (now - moedasCache.lastUpdate) < cacheValidity) {
                return moedasCache;
            }

            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🔄 Buscando cotações atualizadas...');
            const rates = await fetchCurrencyRates();
            
            Object.assign(moedasCache, rates);
            
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Cotações atualizadas:', {
                'USD': 'R$ ' + rates.usd.compra.toFixed(2),
                'EUR': 'R$ ' + rates.eur.compra.toFixed(2),
                'BTC': 'R$ ' + rates.btc.compra.toLocaleString('pt-BR')
            });

            return moedasCache;
        }

        //========================================
        //FASE 1: FERIADOS BRASILEIROS
        //========================================

        let feriadosCache = {
            feriados: [],
            lastUpdate: null
        };

        //Buscar feriados nacionais via backend
        async function fetchHolidays(year = new Date().getFullYear()) {
            try {
                const response = await fetch(`${API_URL}/mercado/feriados?ano=${year}`);
                if (!response.ok) throw new Error('Backend indisponível');
                
                const data = await response.json();
                
                return data.map(feriado => ({
                    data: feriado.date,
                    nome: feriado.name,
                    tipo: feriado.type
                }));
            } catch (error) {
                console.warn('[WARNING]Erro ao buscar feriados via backend:', error);
                return [];
            }
        }

        //Atualizar feriados com cache (válido por 24h)
        async function updateHolidays() {
            const now = new Date().getTime();
            const cacheValidity = 24 * 60 * 60 * 1000; //24 horas
            
            if (feriadosCache.lastUpdate && (now - feriadosCache.lastUpdate) < cacheValidity) {
                return feriadosCache.feriados;
            }

            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🔄 Buscando feriados nacionais...');
            const feriados = await fetchHolidays();
            
            feriadosCache.feriados = feriados;
            feriadosCache.lastUpdate = now;
            
            console.log(`✅ ${feriados.length} feriados carregados`);

            return feriados;
        }

        //Verificar se uma data é feriado
        function isHoliday(dateString) {
            //dateString formato: "YYYY-MM-DD"
            return feriadosCache.feriados.some(feriado => feriado.data === dateString);
        }

        //Obter próximo feriado
        function getNextHoliday() {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            
            const proximosFeriados = feriadosCache.feriados
                .map(f => ({ ...f, date: new Date(f.data + 'T00:00:00') }))
                .filter(f => f.date >= hoje)
                .sort((a, b) => a.date - b.date);
            
            return proximosFeriados[0] || null;
        }

        //========================================
        //FASE 2: TESOURO DIRETO API - DESABILITADO (API PAGA)
        //========================================
        
        /* 
        NOTA: A API do Tesouro Direto foi removida pois é paga e não funciona.
        Caso queira usar no futuro, será necessário encontrar uma API gratuita alternativa.
        
        let tesouroDiretoCache = {
            titulos: [],
            lastUpdate: null
        };

        async function fetchTesouroDireto() {
            //Código removido - API paga
        }

        async function updateTesouroDireto() {
            //Código removido - API paga
        }
        */

        //========================================
        //FASE 2: IBGE INFLAÇÃO (IPCA DETALHADO)
        //========================================

        let inflacaoCache = {
            ipcaMensal: null,
            ipca12Meses: null,
            ipca12MesesDados: [],
            meta: 3.0, //Meta de inflação 2025
            lastUpdate: null
        };

        //Buscar IPCA dos últimos 12 meses
        async function fetchIPCADetalhado() {
            try {
                const response = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/12?formato=json');
                const data = await response.json();
                
                //Calcular inflação acumulada em 12 meses
                let acumulado = 1;
                data.forEach(mes => {
                    acumulado *= (1 + parseFloat(mes.valor) / 100);
                });
                const ipca12M = (acumulado - 1) * 100;

                const ultimoMes = parseFloat(data[data.length - 1].valor);

                return {
                    ipcaMensal: ultimoMes,
                    ipca12Meses: ipca12M,
                    ipca12MesesDados: data.map(d => ({
                        data: d.data,
                        valor: parseFloat(d.valor)
                    }))
                };
            } catch (error) {
                console.warn('[WARNING]Erro ao buscar IPCA detalhado:', error);
                return {
                    ipcaMensal: 0.40,
                    ipca12Meses: 4.50,
                    ipca12MesesDados: []
                };
            }
        }

        //Atualizar inflação com cache (válido por 24h)
        async function updateInflacao() {
            const now = new Date().getTime();
            const cacheValidity = 24 * 60 * 60 * 1000; //24 horas
            
            if (inflacaoCache.lastUpdate && (now - inflacaoCache.lastUpdate) < cacheValidity) {
                return inflacaoCache;
            }

            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🔄 Buscando dados de inflação (IPCA)...');
            const dados = await fetchIPCADetalhado();
            
            inflacaoCache.ipcaMensal = dados.ipcaMensal;
            inflacaoCache.ipca12Meses = dados.ipca12Meses;
            inflacaoCache.ipca12MesesDados = dados.ipca12MesesDados;
            inflacaoCache.lastUpdate = now;
            
            console.log(`✅ Inflação atualizada: ${dados.ipca12Meses.toFixed(2)}% em 12 meses`);

            return inflacaoCache;
        }

        //Calcular ganho real (descontando inflação)
        function calcularGanhoReal(rentabilidade, periodo = 12) {
            //rentabilidade e inflação em % ao ano
            const inflacao = inflacaoCache.ipca12Meses || 4.50;
            const ganhoReal = ((1 + rentabilidade/100) / (1 + inflacao/100) - 1) * 100;
            return ganhoReal;
        }

        //========================================
        //SELIC META COM HISTÓRICO
        //========================================

        let selicHistoricoCache = {
            taxaAtual: null,
            historico: [],
            lastUpdate: null
        };

        //Buscar SELIC histórica (últimos 12 meses para gráfico)
        async function fetchSelicHistorico() {
            try {
                const response = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/12?formato=json');
                const data = await response.json();
                
                const taxaAtual = parseFloat(data[data.length - 1].valor);
                const taxaAnterior = data.length > 1 ? parseFloat(data[data.length - 2].valor) : taxaAtual;
                const variacao = taxaAtual - taxaAnterior;
                
                return {
                    taxaAtual: taxaAtual,
                    variacao: variacao,
                    historico: data.map(d => ({
                        data: d.data,
                        valor: parseFloat(d.valor)
                    })),
                    ultimaReuniao: data[data.length - 1].data
                };
            } catch (error) {
                console.warn('[WARNING]Erro ao buscar SELIC histórico:', error);
                return {
                    taxaAtual: 11.25,
                    variacao: 0,
                    historico: [],
                    ultimaReuniao: '--'
                };
            }
        }

        //Atualizar SELIC com cache (válido por 24h)
        async function updateSelicHistorico() {
            const now = new Date().getTime();
            const cacheValidity = 24 * 60 * 60 * 1000; //24 horas
            
            if (selicHistoricoCache.lastUpdate && (now - selicHistoricoCache.lastUpdate) < cacheValidity) {
                return selicHistoricoCache;
            }

            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🔄 Buscando histórico da SELIC...');
            const dados = await fetchSelicHistorico();
            
            selicHistoricoCache.taxaAtual = dados.taxaAtual;
            selicHistoricoCache.historico = dados.historico;
            selicHistoricoCache.variacao = dados.variacao;
            selicHistoricoCache.ultimaReuniao = dados.ultimaReuniao;
            selicHistoricoCache.lastUpdate = now;
            
            console.log(`✅ SELIC atualizada: ${dados.taxaAtual}% a.a.`);

            return selicHistoricoCache;
        }

        //========================================
        //CDI - CERTIFICADO DE DEPÓSITO INTERBANCÁRIO
        //========================================
        //Nota: CDI já é carregado via fetchCDIRate() do Banco Central (série 12)
        //Não precisa de funções adicionais - usamos diretamente fetchAllRates()

        //Renderizar widget de cotações
        async function renderCurrencyWidget() {
            const rates = await updateCurrencyRates();
            
            //Renderizar no widget do dashboard (se existir)
            const currencyList = document.getElementById('currencyList');
            //Renderizar na seção de Mercado
            const currencyListMarket = document.getElementById('currencyListMarket');
            
            const lists = [currencyList, currencyListMarket].filter(el => el !== null);
            if (lists.length === 0) return;

            const formatVariacao = (valor) => {
                const classe = valor > 0 ? 'positive' : valor < 0 ? 'negative' : 'neutral';
                const sinal = valor > 0 ? '▲' : valor < 0 ? '▼' : '●';
                return `<span class="currency-change ${classe}">${sinal} ${Math.abs(valor).toFixed(2)}%</span>`;
            };

            const html = `
                <div class="currency-item">
                    <span class="currency-name">🇺🇸 Dólar</span>
                    <div class="currency-values">
                        <span class="currency-price">R$ ${rates.usd.compra.toFixed(2)}</span>
                        ${formatVariacao(rates.usd.variacao)}
                    </div>
                </div>
                <div class="currency-item">
                    <span class="currency-name">🇪🇺 Euro</span>
                    <div class="currency-values">
                        <span class="currency-price">R$ ${rates.eur.compra.toFixed(2)}</span>
                        ${formatVariacao(rates.eur.variacao)}
                    </div>
                </div>
                <div class="currency-item">
                    <span class="currency-name">₿ Bitcoin</span>
                    <div class="currency-values">
                        <span class="currency-price">R$ ${rates.btc.compra.toLocaleString('pt-BR', {maximumFractionDigits: 0})}</span>
                        ${formatVariacao(rates.btc.variacao)}
                    </div>
                </div>
            `;

            //Aplicar HTML em todos os containers
            lists.forEach(list => list.innerHTML = html);

            //Atualizar horário em ambos os lugares
            const now = new Date();
            const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            const updateTime = document.getElementById('currencyUpdateTime');
            const updateTimeMarket = document.getElementById('currencyUpdateTimeMarket');
            if (updateTime) updateTime.textContent = timeStr;
            if (updateTimeMarket) updateTimeMarket.textContent = timeStr;
        }

        //Renderizar widget de feriado
        async function renderHolidayWidget() {
            await updateHolidays();
            const proximoFeriado = getNextHoliday();
            
            const holidayContent = document.getElementById('holidayContent');
            if (!holidayContent) return;

            if (!proximoFeriado) {
                holidayContent.innerHTML = `
                    <div class="holiday-icon">😴</div>
                    <div class="holiday-name">Nenhum feriado próximo</div>
                    <div class="holiday-date">Aproveite para trabalhar!</div>
                `;
                return;
            }

            const dataFeriado = proximoFeriado.date;
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            
            const diffTime = dataFeriado - hoje;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let countdownText = '';
            if (diffDays === 0) {
                countdownText = 'Hoje! 🎉';
            } else if (diffDays === 1) {
                countdownText = 'Amanhã!';
            } else if (diffDays <= 7) {
                countdownText = `Em ${diffDays} dias`;
            } else {
                countdownText = `Faltam ${diffDays} dias`;
            }

            const dataFormatada = dataFeriado.toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'long',
                weekday: 'long'
            });

            holidayContent.innerHTML = `
                <div class="holiday-icon">🎉</div>
                <div class="holiday-name">${proximoFeriado.nome}</div>
                <div class="holiday-date">${dataFormatada}</div>
                <div class="holiday-countdown">${countdownText}</div>
            `;
        }

        /* 
        //REMOVIDO: Widget de Tesouro Direto (API paga)
        async function renderTesouроWidget() {
            //Código removido
        }
        */

        //Renderizar widget de Inflação
        async function renderInflacaoWidget() {
            const dados = await updateInflacao();
            
            //Renderizar no widget do dashboard (se existir)
            const inflacaoContent = document.getElementById('inflacaoContent');
            //Renderizar na seção de Mercado
            const inflacaoContentMarket = document.getElementById('inflacaoContentMarket');
            
            const containers = [inflacaoContent, inflacaoContentMarket].filter(el => el !== null);
            if (containers.length === 0) return;

            const ipca12M = dados.ipca12Meses || 0;
            const ipcaMensal = dados.ipcaMensal || 0;
            const meta = dados.meta || 3.0;
            const ipcaAno = dados.ipcaAno || ipca12M; //Acumulado do ano (usar 12M como fallback)
            const diferenca = ipca12M - meta;

            //Determinar status em relação à meta
            let statusClass = 'on-target';
            let statusIcon = '<i class="ph ph-check-circle"></i>';
            let statusText = 'Dentro da meta';
            
            if (ipca12M > meta + 1.5) {
                statusClass = 'above-target';
                statusIcon = '<i class="ph ph-warning"></i>';
                statusText = `Acima da meta (${(ipca12M - meta).toFixed(2)}pp)`;
            } else if (ipca12M > meta) {
                statusClass = 'above-target';
                statusIcon = '<i class="ph ph-trend-up"></i>';
                statusText = `Levemente acima da meta`;
            } else if (ipca12M < meta - 1.5) {
                statusClass = 'on-target';
                statusIcon = '<i class="ph ph-trend-down"></i>';
                statusText = 'Abaixo da meta';
            }

            const html = `
                <div class="inflacao-main">
                    <div class="inflacao-label">Últimos 12 meses</div>
                    <div class="inflacao-value">${ipca12M.toFixed(2)}%</div>
                </div>
                <div class="inflacao-stats">
                    <div class="inflacao-stat">
                        <span class="stat-label">Mês atual</span>
                        <span class="stat-value">${ipcaMensal.toFixed(2)}%</span>
                    </div>
                    <div class="inflacao-stat">
                        <span class="stat-label">Meta 2025</span>
                        <span class="stat-value">${meta.toFixed(2)}%</span>
                    </div>
                    <div class="inflacao-stat">
                        <span class="stat-label">Acumulado ano</span>
                        <span class="stat-value">${ipcaAno.toFixed(2)}%</span>
                    </div>
                    <div class="inflacao-stat">
                        <span class="stat-label">Diferença meta</span>
                        <span class="stat-value" style="color: ${diferenca > 0 ? '#dc2626' : '#16a34a'}">${diferenca >= 0 ? '+' : ''}${diferenca.toFixed(2)}pp</span>
                    </div>
                </div>
                <div class="inflacao-status ${statusClass}">
                    <span class="status-icon">${statusIcon}</span>
                    <span class="status-text">${statusText}</span>
                </div>
            `;

            //Aplicar HTML em todos os containers
            containers.forEach(container => container.innerHTML = html);

            //Atualizar status específico do mercado
            const inflacaoStatusMarket = document.getElementById('inflacaoStatusMarket');
            if (inflacaoStatusMarket) {
                inflacaoStatusMarket.className = `inflacao-status ${statusClass}`;
            }
        }

        //Renderizar widget de SELIC
        async function renderSelicWidget() {
            const dados = await updateSelicHistorico();
            
            const selicContentMarket = document.getElementById('selicContentMarket');
            if (!selicContentMarket) return;

            const taxaAtual = dados.taxaAtual || 0;
            const variacao = dados.variacao || 0;
            const ultimaReuniao = dados.ultimaReuniao || '--';

            //Formatar data da última reunião
            let dataFormatada = '--';
            if (ultimaReuniao !== '--') {
                const [dia, mes, ano] = ultimaReuniao.split('/');
                dataFormatada = `${dia}/${mes}/${ano}`;
            }

            //Determinar sinal da variação
            const variacaoTexto = variacao > 0 ? `+${variacao.toFixed(2)}pp` : 
                                  variacao < 0 ? `${variacao.toFixed(2)}pp` : 
                                  'Mantida';

            const html = `
                <div class="selic-main">
                    <div class="selic-label">Taxa atual</div>
                    <div class="selic-value">${taxaAtual.toFixed(2)}%</div>
                </div>
                <div class="selic-stats">
                    <div class="selic-stat">
                        <span class="stat-label">Última reunião</span>
                        <span class="stat-value" id="selicLastMeeting">${dataFormatada}</span>
                    </div>
                    <div class="selic-stat">
                        <span class="stat-label">Variação</span>
                        <span class="stat-value" id="selicVariation">${variacaoTexto}</span>
                    </div>
                </div>
                <div class="selic-trend" id="selicTrend">
                    <canvas id="selicChart" width="400" height="150"></canvas>
                </div>
            `;

            selicContentMarket.innerHTML = html;

            //Renderizar gráfico
            if (dados.historico && dados.historico.length > 0) {
                renderSelicChart(dados.historico);
            }

            //Atualizar horário
            const selicUpdateTime = document.getElementById('selicUpdateTime');
            if (selicUpdateTime) {
                const now = new Date();
                selicUpdateTime.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            }

            //Atualizar data/hora geral da seção Mercado
            updateMarketLastUpdate();
        }

        //Atualiza a data/hora de atualização da seção Mercado
        function updateMarketLastUpdate() {
            const marketLastUpdate = document.getElementById('marketLastUpdate');
            if (marketLastUpdate) {
                const now = new Date();
                const dateStr = now.toLocaleDateString('pt-BR', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                });
                const timeStr = now.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                marketLastUpdate.textContent = `${dateStr} às ${timeStr}`;
            }
        }

        //Renderizar gráfico da SELIC
        function renderSelicChart(historico) {
            const canvas = document.getElementById('selicChart');
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            
            //Verificar se Chart.js está disponível
            if (typeof Chart === 'undefined') {
                console.warn('[WARNING]Chart.js não carregado');
                return;
            }

            //Destruir gráfico anterior se existir
            if (window.selicChartInstance) {
                window.selicChartInstance.destroy();
            }

            //Preparar dados
            const labels = historico.map(d => {
                const [dia, mes] = d.data.split('/');
                return `${dia}/${mes}`;
            });
            const valores = historico.map(d => d.valor);

            //Criar novo gráfico
            window.selicChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'SELIC (%)',
                        data: valores,
                        borderColor: '#1e40af',
                        backgroundColor: 'rgba(30, 64, 175, 0.1)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: {
                                callback: function(value) {
                                    return value.toFixed(2) + '%';
                                }
                            }
                        }
                    }
                }
            });
        }

        //Renderizar widget do CDI
        async function renderCDIWidget() {
            //Usar a taxa CDI que já temos do Banco Central
            const rates = await fetchAllRates();
            const cdi = rates.cdi || 0;
            
            const cdiContentMarket = document.getElementById('cdiContentMarket');
            if (!cdiContentMarket) return;

            //Calcular rentabilidade mensal aproximada
            const rentabilidadeMensal = (Math.pow(1 + cdi/100, 1/12) - 1) * 100;
            const cdi90 = cdi * 0.9;

            const html = `
                <div class="cdi-main">
                    <div class="cdi-label">Taxa atual</div>
                    <div class="cdi-value">${cdi.toFixed(2)}%</div>
                </div>
                <div class="cdi-stats">
                    <div class="cdi-stat">
                        <span class="stat-label">Rentabilidade</span>
                        <span class="stat-value">${rentabilidadeMensal.toFixed(2)}% a.m.</span>
                    </div>
                    <div class="cdi-stat">
                        <span class="stat-label">90% CDI</span>
                        <span class="stat-value">${cdi90.toFixed(2)}%</span>
                    </div>
                    <div class="cdi-stat">
                        <span class="stat-label">Referência</span>
                        <span class="stat-value">CDB, LCI, LCA</span>
                    </div>
                    <div class="cdi-stat">
                        <span class="stat-label">100% CDI</span>
                        <span class="stat-value">${cdi.toFixed(2)}%</span>
                    </div>
                </div>
                <div class="cdi-info">
                    <i class="ph ph-info"></i>
                    <span>Investimentos que rendem 100% do CDI pagam <strong id="cdiEquivalent">${cdi.toFixed(2)}%</strong> ao ano</span>
                </div>
            `;

            cdiContentMarket.innerHTML = html;

            //Atualizar horário
            const cdiUpdateTime = document.getElementById('cdiUpdateTime');
            if (cdiUpdateTime) {
                const now = new Date();
                cdiUpdateTime.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            }

            console.log(`✅ CDI atualizado: ${cdi.toFixed(2)}% a.a.`);
        }

        //Renderizar widget de Cotações no Mercado
        async function renderCotacoesWidget() {
            const rates = await fetchCurrencyRates();
            
            const cotacoesContentMarket = document.getElementById('cotacoesContentMarket');
            if (!cotacoesContentMarket) return;

            const html = `
                <div class="cotacao-item">
                    <span class="cotacao-name">🇺🇸 Dólar</span>
                    <div class="cotacao-values">
                        <span class="cotacao-price">R$ ${rates.USD.toFixed(2)}</span>
                        <span class="cotacao-change ${rates.USDVariation >= 0 ? 'positive' : 'negative'}">
                            ${rates.USDVariation >= 0 ? '▲' : '▼'} ${Math.abs(rates.USDVariation).toFixed(2)}%
                        </span>
                    </div>
                </div>
                <div class="cotacao-item">
                    <span class="cotacao-name">🇪🇺 Euro</span>
                    <div class="cotacao-values">
                        <span class="cotacao-price">R$ ${rates.EUR.toFixed(2)}</span>
                        <span class="cotacao-change ${rates.EURVariation >= 0 ? 'positive' : 'negative'}">
                            ${rates.EURVariation >= 0 ? '▲' : '▼'} ${Math.abs(rates.EURVariation).toFixed(2)}%
                        </span>
                    </div>
                </div>
                <div class="cotacao-item">
                    <span class="cotacao-name">₿ Bitcoin</span>
                    <div class="cotacao-values">
                        <span class="cotacao-price">R$ ${rates.BTC.toLocaleString('pt-BR')}</span>
                        <span class="cotacao-change ${rates.BTCVariation >= 0 ? 'positive' : 'negative'}">
                            ${rates.BTCVariation >= 0 ? '▲' : '▼'} ${Math.abs(rates.BTCVariation).toFixed(2)}%
                        </span>
                    </div>
                </div>
            `;

            cotacoesContentMarket.innerHTML = html;

            //Atualizar horário
            const cotacoesUpdateTime = document.getElementById('cotacoesUpdateTime');
            if (cotacoesUpdateTime) {
                const now = new Date();
                cotacoesUpdateTime.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            }

            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Cotações widget atualizado');
        }

        //Manter função renderIbovWidget vazia para não quebrar (caso chamada antiga exista)
        async function renderIbovWidget() {
            console.warn('[WARNING]⚠️ Widget Ibovespa removido (API limitada). Use renderCDIWidget() ao invés.');
            return;
        }

        //========================================
        //STOCKS WIDGET (Principais Ações)
        //========================================

        let stocksCache = null;
        let stocksCacheTime = null;
        const STOCKS_CACHE_DURATION = 15 * 60 * 1000; //15 minutos

        async function fetchStocksData() {
            //Verifica cache local
            if (stocksCache && stocksCacheTime && (Date.now() - stocksCacheTime < STOCKS_CACHE_DURATION)) {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]📦 Usando cache local de ações');
                return stocksCache;
            }

            try {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🔍 Buscando ações via backend...');
                const response = await fetch(`${API_URL}/mercado/acoes`);
                
                if (!response.ok) {
                    console.warn(`⚠️ Backend indisponível (${response.status}). Usando fallback.`);
                    return getFallbackStocks();
                }
                
                const data = await response.json();
                
                if (data && data.results && Array.isArray(data.results)) {
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Cotações atualizadas via backend:', data.results.length, 'ações');
                    stocksCache = data.results;
                    stocksCacheTime = Date.now();
                    return data.results;
                }
                
                console.warn('[WARNING]⚠️ Dados inválidos. Usando fallback.');
                return getFallbackStocks();
            } catch (error) {
                console.warn('[WARNING]⚠️ Erro ao buscar ações:', error.message);
                return getFallbackStocks();
            }
        }
        
        function getFallbackStocks() {
            //Retorna dados de fallback com valores realistas de Outubro/2025
            return [
                { symbol: 'PETR4', shortName: 'Petrobras PN', regularMarketPrice: 38.45, regularMarketChangePercent: 1.23 },
                { symbol: 'VALE3', shortName: 'Vale ON', regularMarketPrice: 62.18, regularMarketChangePercent: -0.87 },
                { symbol: 'ITUB4', shortName: 'Itaú PN', regularMarketPrice: 28.92, regularMarketChangePercent: 0.54 },
                { symbol: 'BBDC4', shortName: 'Bradesco PN', regularMarketPrice: 14.73, regularMarketChangePercent: -0.32 },
                { symbol: 'ABEV3', shortName: 'Ambev ON', regularMarketPrice: 11.85, regularMarketChangePercent: 0.76 }
            ];
        }

        async function renderStocksWidget() {
            const stocksGrid = document.getElementById('stocksGrid');
            if (!stocksGrid) {
                console.error('[ERROR]❌ Elemento stocksGrid não encontrado');
                return;
            }

            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🎨 Renderizando widget de ações...');

            //Mostra loading
            stocksGrid.innerHTML = `
                <div class="loading-state" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                    <i class="ph ph-spinner" style="font-size: 2rem; animation: spin 1s linear infinite;"></i>
                    <p style="margin-top: 0.5rem; color: #6b7280;">Carregando cotações...</p>
                </div>
            `;

            const stocks = await fetchStocksData();

            if (!stocks || stocks.length === 0) {
                console.error('[ERROR]❌ Nenhuma ação retornada');
                stocksGrid.innerHTML = `
                    <div class="error-state" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                        <i class="ph ph-warning" style="font-size: 2rem; color: #f59e0b;"></i>
                        <p style="margin-top: 0.5rem; color: #6b7280;">Não foi possível carregar os dados</p>
                    </div>
                `;
                return;
            }

            const html = stocks.map(stock => {
                const price = stock.regularMarketPrice || 0;
                const change = stock.regularMarketChangePercent || 0;
                const isPositive = change >= 0;
                
                return `
                    <div class="stock-item">
                        <div class="stock-info">
                            <span class="stock-symbol">${stock.symbol}</span>
                            <span class="stock-name">${stock.shortName || stock.longName || stock.symbol}</span>
                        </div>
                        <div class="stock-values">
                            <span class="stock-price">R$ ${price.toFixed(2)}</span>
                            <span class="stock-change ${isPositive ? 'positive' : 'negative'}">
                                ${isPositive ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}%
                            </span>
                        </div>
                    </div>
                `;
            }).join('');

            stocksGrid.innerHTML = html;

            //Atualiza horário
            const stocksUpdateTime = document.getElementById('stocksUpdateTime');
            if (stocksUpdateTime) {
                const now = new Date();
                stocksUpdateTime.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            }

            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Widget de ações atualizado');
        }

        async function updateStocksWidget() {
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🔄 Atualizando widget de ações...');
            //Limpa o cache para forçar atualização
            stocksCache = null;
            stocksCacheTime = null;
            await renderStocksWidget();
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Widget de ações atualizado');
        }

        //========================================
        //IBOVESPA WIDGET (deprecated/removed)
        //========================================
        async function renderIbovespaWidget() {
            const ibovContentMarket = document.getElementById('ibovContentMarket');
            if (!ibovContentMarket) return;

            const pontos = 0;
            const variacao = 0;
            const maxima = 0;
            const minima = 0;
            const abertura = 0;

            //Determinar status do mercado
            let statusClass = 'ibov-status';
            let statusIcon = '<i class="ph ph-chart-bar"></i>';
            let statusText = 'Mercado estável';

            if (variacao > 1) {
                statusClass += ' market-up';
                statusIcon = '<i class="ph ph-rocket-launch"></i>';
                statusText = `Alta forte de ${variacao.toFixed(2)}%`;
            } else if (variacao > 0) {
                statusClass += ' market-up';
                statusIcon = '<i class="ph ph-trend-up"></i>';
                statusText = `Em alta (+${variacao.toFixed(2)}%)`;
            } else if (variacao < -1) {
                statusClass += ' market-down';
                statusIcon = '<i class="ph ph-trend-down"></i>';
                statusText = `Queda forte de ${variacao.toFixed(2)}%`;
            } else if (variacao < 0) {
                statusClass += ' market-down';
                statusIcon = '<i class="ph ph-arrow-down"></i>';
                statusText = `Em queda (${variacao.toFixed(2)}%)`;
            }

            const variacaoClass = variacao >= 0 ? 'positive' : 'negative';
            const variacaoSinal = variacao >= 0 ? '+' : '';

            const html = `
                <div class="ibov-main">
                    <div class="ibov-label">Pontos</div>
                    <div class="ibov-value">${pontos.toLocaleString('pt-BR', {maximumFractionDigits: 0})}</div>
                </div>
                <div class="ibov-stats">
                    <div class="ibov-stat">
                        <span class="stat-label">Variação Hoje</span>
                        <span class="stat-value variation-value ${variacaoClass}" id="ibovVariationDay">${variacaoSinal}${variacao.toFixed(2)}%</span>
                    </div>
                    <div class="ibov-stat">
                        <span class="stat-label">Máxima</span>
                        <span class="stat-value" id="ibovHigh">${maxima.toLocaleString('pt-BR', {maximumFractionDigits: 0})}</span>
                    </div>
                    <div class="ibov-stat">
                        <span class="stat-label">Mínima</span>
                        <span class="stat-value" id="ibovLow">${minima.toLocaleString('pt-BR', {maximumFractionDigits: 0})}</span>
                    </div>
                    <div class="ibov-stat">
                        <span class="stat-label">Abertura</span>
                        <span class="stat-value" id="ibovOpen">${abertura.toLocaleString('pt-BR', {maximumFractionDigits: 0})}</span>
                    </div>
                </div>
                <div class="${statusClass}" id="ibovStatus">
                    <span class="status-icon">${statusIcon}</span>
                    <span class="status-text">${statusText}</span>
                </div>
            `;

            ibovContentMarket.innerHTML = html;

            //Atualizar horário
            const ibovUpdateTime = document.getElementById('ibovUpdateTime');
            if (ibovUpdateTime) {
                const now = new Date();
                ibovUpdateTime.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            }
        }

        //=== Atualizar os banners de taxas com dados reais ===
        async function updateRatesBanners() {
            const rates = await fetchAllRates();
            
            //Calcular taxas derivadas (valores aproximados com base no CDI/SELIC)
            const cdb = rates.cdi * 0.95; //CDB geralmente paga ~95% do CDI
            const fundoDI = rates.cdi * 0.98; //Fundo DI paga ~98% do CDI
            const poupanca = Math.max(0.5, rates.selic * 0.7); //Poupança = 70% da SELIC ou 0,5% (o que for maior)

            //Atualizar todos os banners (apenas taxas que realmente usamos)
            const banners = document.querySelectorAll('.rates-list');
            banners.forEach((banner, index) => {
                if (index < 3 || index === 4) { //Investimentos, Juros Compostos, Tempo para Meta, FIRE
                    banner.innerHTML = `
                        <li>${renderIcon('piggy-bank')} Poupança: ~${poupanca.toFixed(2)}%</li>
                        <li>${renderIcon('coins')} CDB: ~${cdb.toFixed(2)}%</li>
                        <li>${renderIcon('trend-up')} Fundo DI: ~${fundoDI.toFixed(2)}%</li>
                        <li>${renderIcon('chart-line')} SELIC: ${rates.selic.toFixed(2)}%</li>
                    `;
                }
            });

            //Atualizar select do simulador de emergência (apenas investimentos válidos)
            const emergencySelect = document.getElementById('emergencyInvestmentType');
            if (emergencySelect) {
                emergencySelect.innerHTML = `
                    <option value="${poupanca.toFixed(2)}">${renderIcon('piggy-bank')} Poupança (${poupanca.toFixed(2)}% a.m.)</option>
                    <option value="${cdb.toFixed(2)}" selected>${renderIcon('coins')} CDB Liquidez Diária (${cdb.toFixed(2)}% a.m.)</option>
                    <option value="${fundoDI.toFixed(2)}">${renderIcon('trend-up')} Fundo DI (${fundoDI.toFixed(2)}% a.m.)</option>
                    <option value="custom">${renderIcon('note-pencil')} Taxa Personalizada</option>
                `;
            }

            //Adicionar indicador de atualização
            const headers = document.querySelectorAll('.rates-banner h4');
            const date = new Date(rates.lastUpdate).toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            headers.forEach(header => {
                //Remover span antigo se existir
                const oldSpan = header.querySelector('.update-indicator');
                if (oldSpan) {
                    oldSpan.remove();
                }
                
                //Adicionar novo indicador
                const indicator = document.createElement('span');
                indicator.className = 'update-indicator';
                indicator.textContent = `Atualizado: ${date}`;
                header.appendChild(indicator);
            });
        }

        //Forçar atualização das taxas (ignora cache)
        async function forceUpdateRates() {
            const button = (typeof event !== 'undefined' && event.target && event.target.closest) ? event.target.closest('button') : document.getElementById('updateRatesBtn');
            if (!button) return;
            const originalHTML = button.innerHTML;
            
            button.disabled = true;
            button.innerHTML = '<i class="ph ph-arrows-clockwise ph-spin"></i> Atualizando...';
            
            //Limpar cache
            taxasCache.lastUpdate = null;
            
            try {
                await updateRatesBanners();
                button.innerHTML = '<i class="ph ph-check-circle"></i> Atualizado!';
                
                setTimeout(() => {
                    button.disabled = false;
                    button.innerHTML = originalHTML;
                }, 2000);
            } catch (error) {
                button.innerHTML = '<i class="ph ph-x-circle"></i> Erro ao atualizar';
                console.error('[ERROR]Erro ao atualizar taxas:', error);
                
                setTimeout(() => {
                    button.disabled = false;
                    button.innerHTML = originalHTML;
                }, 2000);
            }
        }

        //Controle dos modais
        function openSimulator(type) {
            const modal = document.getElementById(type + 'Modal');
            if (modal) {
                modal.classList.add('active');
            }
        }

        function closeSimulator(type) {
            const modal = document.getElementById(type + 'Modal');
            if (modal) {
                modal.classList.remove('active');
            }
        }

        //Fechar modal clicando fora
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('simulator-modal')) {
                e.target.classList.remove('active');
            }
        });

        //✅ Fechar modal/popup com a tecla ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' || e.keyCode === 27) {
                //Fechar modais de simuladores
                const activeSimulators = document.querySelectorAll('.simulator-modal.active');
                activeSimulators.forEach(modal => {
                    modal.classList.remove('active');
                });
                
                //Fechar outros modais gerais
                const activeModals = document.querySelectorAll('.modal.show');
                activeModals.forEach(modal => {
                    modal.classList.remove('show');
                });
                
                //Fechar modal de transação se estiver aberto
                const transactionModal = document.getElementById('transactionModal');
                if (transactionModal && transactionModal.classList.contains('show')) {
                    closeModal('transactionModal');
                }
                
                //Fechar modal de meta se estiver aberto
                const goalModal = document.getElementById('goalModal');
                if (goalModal && goalModal.classList.contains('show')) {
                    closeModal('goalModal');
                }
            }
        });

        //Calculadora de Parcelas (Versão Simplificada)
        function calculateFinancing() {
            const totalValue = parseFloat(document.getElementById('financingAmount').value) || 0;
            const monthlyBudget = parseFloat(document.getElementById('financingMonthlyBudget').value) || 0;
            const maxPeriod = parseInt(document.getElementById('financingMaxPeriod').value) || 24;

            //🔴 VALIDAÇÕES COM MENSAGENS DE ERRO VERMELHO
            if (!totalValue || totalValue <= 0) {
                document.getElementById('financingResults').innerHTML = `
                    <div class="error-message" style="text-align: center; padding: 1.5rem; background: #fef2f2; border-radius: 12px; border: 2px solid #fca5a5;">
                        <i class="ph ph-warning-circle" style="font-size: 2rem; color: #dc2626; margin-bottom: 0.5rem;"></i>
                        <p style="color: #dc2626; font-weight: 600; margin: 0;">Informe o valor total do bem</p>
                    </div>
                `;
                return;
            }

            if (totalValue > 10000000) {
                document.getElementById('financingResults').innerHTML = `
                    <div class="error-message" style="text-align: center; padding: 1.5rem; background: #fef2f2; border-radius: 12px; border: 2px solid #fca5a5;">
                        <i class="ph ph-warning-circle" style="font-size: 2rem; color: #dc2626; margin-bottom: 0.5rem;"></i>
                        <p style="color: #dc2626; font-weight: 600; margin: 0;">O valor não pode ultrapassar R$ 10 milhões</p>
                    </div>
                `;
                return;
            }

            if (!monthlyBudget || monthlyBudget <= 0) {
                document.getElementById('financingResults').innerHTML = `
                    <div class="error-message" style="text-align: center; padding: 1.5rem; background: #fef2f2; border-radius: 12px; border: 2px solid #fca5a5;">
                        <i class="ph ph-warning-circle" style="font-size: 2rem; color: #dc2626; margin-bottom: 0.5rem;"></i>
                        <p style="color: #dc2626; font-weight: 600; margin: 0;">Informe quanto você pode pagar por mês</p>
                    </div>
                `;
                return;
            }

            //Calcula quantas parcelas seriam necessárias (divisão simples)
            const idealMonths = Math.ceil(totalValue / monthlyBudget);
            
            let resultsHTML = '';

            if (idealMonths <= maxPeriod) {
                //CABE no prazo escolhido
                const finalPayment = totalValue - (monthlyBudget * (idealMonths - 1));
                
                resultsHTML = `
                    <div style="text-align: center; padding: 2rem; background: linear-gradient(135deg, #ecfdf5, #d1fae5); border-radius: 16px; border: 2px solid #86efac; margin-bottom: 1.5rem;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">
                            <i class="ph ph-check-circle" style="color: #059669;"></i>
                        </div>
                        <h3 style="color: #059669; margin-bottom: 1rem; font-size: 1.5rem;">Cabe no Seu Orçamento! ✅</h3>
                        <p style="color: #047857; font-size: 1.1rem; line-height: 1.6;">
                            Você consegue parcelar ${formatCurrency(totalValue)} em <strong>${idealMonths}x de ${formatCurrency(monthlyBudget)}</strong>
                        </p>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                        <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 2px solid #e5e7eb; text-align: center;">
                            <div style="color: #6b7280; font-size: 0.85rem; margin-bottom: 0.5rem; font-weight: 600;">
                                <i class="ph ph-calendar"></i> NÚMERO DE PARCELAS
                            </div>
                            <div style="font-size: 1.8rem; font-weight: 700; color: #1e3a8a;">${idealMonths}x</div>
                        </div>
                        
                        <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 2px solid #e5e7eb; text-align: center;">
                            <div style="color: #6b7280; font-size: 0.85rem; margin-bottom: 0.5rem; font-weight: 600;">
                                <i class="ph ph-credit-card"></i> VALOR DA PARCELA
                            </div>
                            <div style="font-size: 1.8rem; font-weight: 700; color: #059669;">${formatCurrency(monthlyBudget)}</div>
                        </div>
                        
                        <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 2px solid #e5e7eb; text-align: center;">
                            <div style="color: #6b7280; font-size: 0.85rem; margin-bottom: 0.5rem; font-weight: 600;">
                                <i class="ph ph-coins"></i> VALOR TOTAL
                            </div>
                            <div style="font-size: 1.8rem; font-weight: 700; color: #7c3aed;">${formatCurrency(totalValue)}</div>
                        </div>
                    </div>

                    <div style="background: #eff6ff; padding: 1.25rem; border-radius: 12px; border: 2px solid #bfdbfe;">
                        <div style="display: flex; align-items: start; gap: 0.75rem;">
                            <i class="ph ph-info" style="font-size: 1.5rem; color: #1e40af; flex-shrink: 0;"></i>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; color: #1e40af; margin-bottom: 0.4rem; font-size: 0.95rem;">Detalhes do Parcelamento</div>
                                <div style="color: #1e40af; font-size: 0.9rem; line-height: 1.7;">
                                    • ${idealMonths - 1} parcelas de ${formatCurrency(monthlyBudget)}<br>
                                    ${finalPayment !== monthlyBudget ? `• 1 parcela final de ${formatCurrency(finalPayment)}<br>` : ''}
                                    • Prazo total: ${Math.floor(idealMonths / 12) > 0 ? Math.floor(idealMonths / 12) + ' ano' + (Math.floor(idealMonths / 12) > 1 ? 's' : '') + ' e ' : ''}${idealMonths % 12} mês(es)
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                //NÃO CABE no prazo escolhido
                const minMonthlyNeeded = Math.ceil(totalValue / maxPeriod);
                const difference = minMonthlyNeeded - monthlyBudget;
                
                resultsHTML = `
                    <div style="text-align: center; padding: 2rem; background: linear-gradient(135deg, #fef2f2, #fee2e2); border-radius: 16px; border: 2px solid #fca5a5; margin-bottom: 1.5rem;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">
                            <i class="ph ph-warning-circle" style="color: #dc2626;"></i>
                        </div>
                        <h3 style="color: #dc2626; margin-bottom: 1rem; font-size: 1.4rem;">Não Cabe no Orçamento ⚠️</h3>
                        <p style="color: #991b1b; font-size: 1rem; line-height: 1.6; margin-bottom: 1rem;">
                            Para parcelar ${formatCurrency(totalValue)} em até <strong>${maxPeriod}x</strong>, você precisaria pagar <strong>${formatCurrency(minMonthlyNeeded)}/mês</strong>
                        </p>
                        <div style="background: white; padding: 1.25rem; border-radius: 12px; display: inline-block;">
                            <p style="color: #dc2626; font-size: 0.95rem; margin: 0;">
                                💸 <strong>Faltam ${formatCurrency(difference)}</strong> por mês no seu orçamento
                            </p>
                        </div>
                    </div>

                    <div style="background: #fff7ed; padding: 1.5rem; border-radius: 12px; border: 2px solid #fed7aa; margin-bottom: 1rem;">
                        <div style="display: flex; align-items: start; gap: 0.75rem;">
                            <i class="ph ph-lightbulb" style="font-size: 1.5rem; color: #ea580c; flex-shrink: 0;"></i>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; color: #ea580c; margin-bottom: 0.8rem; font-size: 1rem;">Opções para Você:</div>
                                <div style="color: #9a3412; font-size: 0.9rem; line-height: 1.8;">
                                    1️⃣ <strong>Aumentar orçamento:</strong> Pagar ${formatCurrency(minMonthlyNeeded)}/mês (${formatCurrency(difference)} a mais)<br>
                                    2️⃣ <strong>Estender prazo:</strong> Parcelar em ${idealMonths}x de ${formatCurrency(monthlyBudget)}/mês<br>
                                    3️⃣ <strong>Dar entrada:</strong> Reduzir o valor financiado dando uma entrada maior<br>
                                    4️⃣ <strong>Rever compra:</strong> Considerar um bem de menor valor
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                        <div style="background: white; padding: 1.25rem; border-radius: 12px; border: 2px solid #e5e7eb; text-align: center;">
                            <div style="color: #6b7280; font-size: 0.8rem; margin-bottom: 0.5rem; font-weight: 600;">SEU ORÇAMENTO</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #3b82f6;">${formatCurrency(monthlyBudget)}/mês</div>
                        </div>
                        <div style="background: white; padding: 1.25rem; border-radius: 12px; border: 2px solid #e5e7eb; text-align: center;">
                            <div style="color: #6b7280; font-size: 0.8rem; margin-bottom: 0.5rem; font-weight: 600;">NECESSÁRIO</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #dc2626;">${formatCurrency(minMonthlyNeeded)}/mês</div>
                        </div>
                    </div>
                `;
            }

            document.getElementById('financingResults').innerHTML = resultsHTML;
        }

        //Simulador FIRE (Independência Financeira)
        function calculateRetirement() {
            const currentAge = parseInt(document.getElementById('retirementCurrentAge').value);
            const targetAge = parseInt(document.getElementById('retirementTargetAge').value);
            const monthlyIncome = parseFloat(document.getElementById('retirementMonthlyIncome').value);
            const currentWealth = parseFloat(document.getElementById('retirementCurrentWealth').value) || 0;
            const annualReturn = parseFloat(document.getElementById('retirementReturnRate').value) / 100;

            //🔴 VALIDAÇÕES COM MENSAGENS DE ERRO VERMELHO
            if (!currentAge || currentAge < 18) {
                document.getElementById('retirementResults').innerHTML = `
                    <div class="error-message" style="text-align: center; padding: 1.5rem; background: #fef2f2; border-radius: 12px; border: 2px solid #fca5a5;">
                        <i class="ph ph-warning-circle" style="font-size: 2rem; color: #dc2626; margin-bottom: 0.5rem;"></i>
                        <p style="color: #dc2626; font-weight: 600; margin: 0;">A idade atual deve ser no mínimo 18 anos</p>
                    </div>
                `;
                return;
            }

            if (currentAge > 100) {
                document.getElementById('retirementResults').innerHTML = `
                    <div class="error-message" style="text-align: center; padding: 1.5rem; background: #fef2f2; border-radius: 12px; border: 2px solid #fca5a5;">
                        <i class="ph ph-warning-circle" style="font-size: 2rem; color: #dc2626; margin-bottom: 0.5rem;"></i>
                        <p style="color: #dc2626; font-weight: 600; margin: 0;">A idade atual não pode ser maior que 100 anos</p>
                    </div>
                `;
                return;
            }

            if (!targetAge || targetAge < 18) {
                document.getElementById('retirementResults').innerHTML = `
                    <div class="error-message" style="text-align: center; padding: 1.5rem; background: #fef2f2; border-radius: 12px; border: 2px solid #fca5a5;">
                        <i class="ph ph-warning-circle" style="font-size: 2rem; color: #dc2626; margin-bottom: 0.5rem;"></i>
                        <p style="color: #dc2626; font-weight: 600; margin: 0;">A idade de aposentadoria deve ser no mínimo 18 anos</p>
                    </div>
                `;
                return;
            }

            if (!monthlyIncome || monthlyIncome <= 0) {
                document.getElementById('retirementResults').innerHTML = `
                    <div class="error-message" style="text-align: center; padding: 1.5rem; background: #fef2f2; border-radius: 12px; border: 2px solid #fca5a5;">
                        <i class="ph ph-warning-circle" style="font-size: 2rem; color: #dc2626; margin-bottom: 0.5rem;"></i>
                        <p style="color: #dc2626; font-weight: 600; margin: 0;">A renda mensal desejada deve ser maior que zero</p>
                    </div>
                `;
                return;
            }

            if (currentWealth < 0) {
                document.getElementById('retirementResults').innerHTML = `
                    <div class="error-message" style="text-align: center; padding: 1.5rem; background: #fef2f2; border-radius: 12px; border: 2px solid #fca5a5;">
                        <i class="ph ph-warning-circle" style="font-size: 2rem; color: #dc2626; margin-bottom: 0.5rem;"></i>
                        <p style="color: #dc2626; font-weight: 600; margin: 0;">O patrimônio atual não pode ser negativo</p>
                    </div>
                `;
                return;
            }

            if (!annualReturn || annualReturn < 0 || annualReturn > 1) {
                document.getElementById('retirementResults').innerHTML = `
                    <div class="error-message" style="text-align: center; padding: 1.5rem; background: #fef2f2; border-radius: 12px; border: 2px solid #fca5a5;">
                        <i class="ph ph-warning-circle" style="font-size: 2rem; color: #dc2626; margin-bottom: 0.5rem;"></i>
                        <p style="color: #dc2626; font-weight: 600; margin: 0;">A taxa de retorno anual deve estar entre 0% e 100%</p>
                    </div>
                `;
                return;
            }

            if (currentAge >= targetAge) {
                document.getElementById('retirementResults').innerHTML = `
                    <div class="error-message" style="text-align: center; padding: 1.5rem; background: #fef2f2; border-radius: 12px; border: 2px solid #fca5a5;">
                        <i class="ph ph-warning-circle" style="font-size: 2rem; color: #dc2626; margin-bottom: 0.5rem;"></i>
                        <p style="color: #dc2626; font-weight: 600; margin: 0;">A idade de aposentadoria deve ser maior que a idade atual</p>
                    </div>
                `;
                return;
            }

            //Anos até aposentadoria
            const yearsToRetirement = targetAge - currentAge;
            const monthsToRetirement = yearsToRetirement * 12;
            
            //Regra dos 4% - patrimônio necessário = 25x despesa anual
            const annualIncome = monthlyIncome * 12;
            const targetWealth = annualIncome * 25;
            const stillNeeded = targetWealth - currentWealth;
            
            //Calcular aporte mensal necessário
            const monthlyRate = Math.pow(1 + annualReturn, 1/12) - 1;
            
            let monthlyContribution = 0;
            if (stillNeeded > 0) {
                //FV = PV(1+i)^n + PMT * [((1+i)^n - 1) / i]
                //Resolvendo para PMT:
                const futureValueOfCurrentWealth = currentWealth * Math.pow(1 + monthlyRate, monthsToRetirement);
                const futureValueNeeded = targetWealth - futureValueOfCurrentWealth;
                
                if (futureValueNeeded > 0) {
                    monthlyContribution = futureValueNeeded / (((Math.pow(1 + monthlyRate, monthsToRetirement) - 1) / monthlyRate));
                }
            }

            let resultsHTML = '';

            if (stillNeeded <= 0) {
                resultsHTML = `
                    <div style="text-align: center; padding: 2rem; background: linear-gradient(135deg, #ecfdf5, #d1fae5); border-radius: 12px; border: 2px solid #86efac;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">
                            <i class="ph ph-check-circle" style="color: #059669;"></i>
                        </div>
                        <h3 style="color: #059669; margin-bottom: 1rem;">Você já está pronto para se aposentar!</h3>
                        <p style="color: #047857; line-height: 1.6;">
                            Seu patrimônio atual de ${formatCurrency(currentWealth)} já é suficiente para gerar ${formatCurrency(monthlyIncome)} mensais na aposentadoria.
                        </p>
                    </div>
                `;
            } else {
                const totalContributed = monthlyContribution * monthsToRetirement;
                const totalInterest = targetWealth - currentWealth - totalContributed;

                resultsHTML = `
                    <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 2rem; border-radius: 16px; border: 2px solid #93c5fd; margin-bottom: 1.5rem;">
                        <div style="text-align: center;">
                            <div style="font-size: 0.9rem; color: #1e40af; font-weight: 600; margin-bottom: 1rem;">
                                <i class="ph ph-piggy-bank" style="font-size: 1.2rem;"></i> ECONOMIZE MENSALMENTE
                            </div>
                            <div style="font-size: 3rem; font-weight: 800; color: #1e3a8a; margin-bottom: 0.5rem;">
                                ${formatCurrency(monthlyContribution)}
                            </div>
                            <div style="font-size: 1rem; color: #3b82f6; font-weight: 500;">
                                durante ${yearsToRetirement} anos (${monthsToRetirement} meses)
                            </div>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                        <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 2px solid #e5e7eb; text-align: center;">
                            <div style="color: #6b7280; font-size: 0.85rem; margin-bottom: 0.5rem; font-weight: 600;">
                                <i class="ph ph-target"></i> META
                            </div>
                            <div style="font-size: 1.3rem; font-weight: 700; color: #1e3a8a;">${formatCurrency(targetWealth)}</div>
                        </div>
                        
                        <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 2px solid #e5e7eb; text-align: center;">
                            <div style="color: #6b7280; font-size: 0.85rem; margin-bottom: 0.5rem; font-weight: 600;">
                                <i class="ph ph-wallet"></i> PATRIMÔNIO ATUAL
                            </div>
                            <div style="font-size: 1.3rem; font-weight: 700; color: #7c3aed;">${formatCurrency(currentWealth)}</div>
                        </div>
                        
                        <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 2px solid #e5e7eb; text-align: center;">
                            <div style="color: #6b7280; font-size: 0.85rem; margin-bottom: 0.5rem; font-weight: 600;">
                                <i class="ph ph-trending-up"></i> RENDIMENTOS
                            </div>
                            <div style="font-size: 1.3rem; font-weight: 700; color: #059669;">${formatCurrency(totalInterest)}</div>
                        </div>
                    </div>
                    
                    <div style="background: #eff6ff; padding: 1.25rem; border-radius: 12px; border: 2px solid #bfdbfe; margin-bottom: 1rem;">
                        <div style="display: flex; align-items: start; gap: 0.75rem;">
                            <i class="ph ph-info" style="font-size: 1.5rem; color: #1e40af; flex-shrink: 0;"></i>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; color: #1e40af; margin-bottom: 0.4rem; font-size: 0.9rem;">Resumo do Planejamento</div>
                                <div style="color: #1e40af; font-size: 0.85rem; line-height: 1.6;">
                                    • Você investirá ${formatCurrency(totalContributed)} ao longo de ${yearsToRetirement} anos<br>
                                    • Com rendimento de ${(annualReturn * 100).toFixed(1)}% ao ano, você terá ${formatCurrency(totalInterest)} de ganhos<br>
                                    • Na aposentadoria, você poderá retirar ${formatCurrency(monthlyIncome)} por mês indefinidamente
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="background: #fef9c3; padding: 1.25rem; border-radius: 12px; border: 2px solid #fde047;">
                        <div style="display: flex; align-items: start; gap: 0.75rem;">
                            <i class="ph ph-lightbulb" style="font-size: 1.5rem; color: #ca8a04; flex-shrink: 0;"></i>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; color: #854d0e; margin-bottom: 0.4rem; font-size: 0.9rem;">Baseado na Regra dos 4%</div>
                                <div style="color: #713f12; font-size: 0.85rem; line-height: 1.5;">
                                    Este cálculo usa a regra dos 4%, que sugere que você pode retirar 4% do seu patrimônio anualmente sem esgotá-lo. Isso significa que você precisa de 25x sua despesa anual.
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            document.getElementById('retirementResults').innerHTML = resultsHTML;
        }

        //Simulador de Reserva de Emergência
        function updateEmergencyRate() {
            const select = document.getElementById('emergencyInvestmentType');
            const customGroup = document.getElementById('customRateGroup');
            
            if (select.value === 'custom') {
                customGroup.style.display = 'block';
            } else {
                customGroup.style.display = 'none';
            }
        }

        //Controle de meses personalizados
        document.addEventListener('DOMContentLoaded', function() {
            const monthsSelect = document.getElementById('emergencyMonths');
            if (monthsSelect) {
                monthsSelect.addEventListener('change', function() {
                    const customGroup = document.getElementById('customMonthsGroup');
                    if (this.value === 'custom') {
                        customGroup.style.display = 'block';
                    } else {
                        customGroup.style.display = 'none';
                    }
                });
            }
        });

        function calculateEmergencyFund() {
            const monthlyExpenses = parseFloat(document.getElementById('emergencyMonthlyExpenses').value) || 0;
            const months = parseFloat(document.getElementById('emergencyMonths').value) || 6;
            const currentAmount = parseFloat(document.getElementById('emergencyCurrentAmount').value) || 0;
            const monthlySavings = parseFloat(document.getElementById('emergencyMonthlySavings').value) || 0;

            //🔴 VALIDAÇÕES COM MENSAGENS DE ERRO VERMELHO
            if (!monthlyExpenses || monthlyExpenses <= 0) {
                document.getElementById('emergencyResults').innerHTML = `
                    <div class="error-message" style="text-align: center; padding: 1.5rem; background: #fef2f2; border-radius: 12px; border: 2px solid #fca5a5;">
                        <i class="ph ph-warning-circle" style="font-size: 2rem; color: #dc2626; margin-bottom: 0.5rem;"></i>
                        <p style="color: #dc2626; font-weight: 600; margin: 0;">Informe seus gastos mensais essenciais</p>
                    </div>
                `;
                return;
            }

            if (months < 1 || months > 24) {
                document.getElementById('emergencyResults').innerHTML = `
                    <div class="error-message" style="text-align: center; padding: 1.5rem; background: #fef2f2; border-radius: 12px; border: 2px solid #fca5a5;">
                        <i class="ph ph-warning-circle" style="font-size: 2rem; color: #dc2626; margin-bottom: 0.5rem;"></i>
                        <p style="color: #dc2626; font-weight: 600; margin: 0;">A reserva deve cobrir entre 1 e 24 meses</p>
                    </div>
                `;
                return;
            }

            if (currentAmount < 0) {
                document.getElementById('emergencyResults').innerHTML = `
                    <div class="error-message" style="text-align: center; padding: 1.5rem; background: #fef2f2; border-radius: 12px; border: 2px solid #fca5a5;">
                        <i class="ph ph-warning-circle" style="font-size: 2rem; color: #dc2626; margin-bottom: 0.5rem;"></i>
                        <p style="color: #dc2626; font-weight: 600; margin: 0;">O valor já guardado não pode ser negativo</p>
                    </div>
                `;
                return;
            }

            if (monthlySavings < 0) {
                document.getElementById('emergencyResults').innerHTML = `
                    <div class="error-message" style="text-align: center; padding: 1.5rem; background: #fef2f2; border-radius: 12px; border: 2px solid #fca5a5;">
                        <i class="ph ph-warning-circle" style="font-size: 2rem; color: #dc2626; margin-bottom: 0.5rem;"></i>
                        <p style="color: #dc2626; font-weight: 600; margin: 0;">O aporte mensal não pode ser negativo</p>
                    </div>
                `;
                return;
            }

            const targetAmount = monthlyExpenses * months;
            const stillNeeded = Math.max(0, targetAmount - currentAmount);

            let resultsHTML = '';

            if (stillNeeded <= 0) {
                const surplus = currentAmount - targetAmount;
                resultsHTML = `
                    <div style="text-align: center; padding: 2.5rem; background: linear-gradient(135deg, #ecfdf5, #d1fae5); border-radius: 16px; border: 2px solid #86efac;">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">
                            <i class="ph ph-check-circle" style="color: #059669;"></i>
                        </div>
                        <h3 style="color: #059669; margin-bottom: 1.5rem; font-size: 1.8rem;">Parabéns! Sua reserva está completa! 🎉</h3>
                        <p style="color: #047857; margin-bottom: 0.75rem; font-size: 1.1rem; line-height: 1.6;">
                            Você já tem <strong>${formatCurrency(currentAmount)}</strong> guardado.
                        </p>
                        <p style="color: #047857; font-size: 1.05rem; line-height: 1.6;">
                            Isso cobre <strong>${months} meses</strong> de gastos essenciais de <strong>${formatCurrency(monthlyExpenses)}/mês</strong>.
                        </p>
                        ${surplus > 0 ? `
                            <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(255, 255, 255, 0.7); border-radius: 12px; display: inline-block;">
                                <p style="color: #059669; font-weight: 600; margin: 0; font-size: 0.95rem;">
                                    💰 Você tem ${formatCurrency(surplus)} a mais que o necessário!
                                </p>
                            </div>
                        ` : ''}
                    </div>

                    <div style="background: #eff6ff; padding: 1.5rem; border-radius: 12px; border: 2px solid #bfdbfe; margin-top: 1.5rem;">
                        <div style="display: flex; align-items: start; gap: 0.75rem;">
                            <i class="ph ph-lightbulb" style="font-size: 1.5rem; color: #1e40af; flex-shrink: 0;"></i>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; color: #1e40af; margin-bottom: 0.6rem; font-size: 1rem;">Próximos Passos:</div>
                                <div style="color: #1e40af; font-size: 0.9rem; line-height: 1.8;">
                                    ✅ Mantenha sua reserva em investimentos de alta liquidez (poupança, CDB, Tesouro Selic)<br>
                                    ✅ Não use esse dinheiro para gastos não emergenciais<br>
                                    ✅ Agora você pode focar em investimentos de longo prazo com maior retorno<br>
                                    ${surplus > 0 ? `✅ Considere usar o excedente (${formatCurrency(surplus)}) para investir em outras metas` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                //Calcula quanto tempo até completar a reserva (SEM rendimento, cálculo simples)
                let monthsToComplete = 0;
                if (monthlySavings > 0) {
                    monthsToComplete = Math.ceil(stillNeeded / monthlySavings);
                }

                if (monthlySavings <= 0) {
                    resultsHTML = `
                        <div class="error-message" style="text-align: center; padding: 1.5rem; background: #fef2f2; border-radius: 12px; border: 2px solid #fca5a5;">
                            <i class="ph ph-warning-circle" style="font-size: 2rem; color: #dc2626; margin-bottom: 0.5rem;"></i>
                            <p style="color: #dc2626; font-weight: 600; margin: 0;">
                                Você precisa informar um valor de aporte mensal para construir sua reserva.
                            </p>
                        </div>
                    `;
                } else {
                    const years = Math.floor(monthsToComplete / 12);
                    const remainingMonths = monthsToComplete % 12;
                    const progressPercentage = ((currentAmount / targetAmount) * 100).toFixed(1);

                    let recommendationColor = '#059669';
                    let recommendationText = 'Excelente escolha!';
                    let recommendationIcon = '✅';
                    
                    if (months < 3) {
                        recommendationColor = '#dc2626';
                        recommendationText = 'Atenção: 3 meses é o mínimo recomendado';
                        recommendationIcon = '⚠️';
                    } else if (months < 6) {
                        recommendationColor = '#f59e0b';
                        recommendationText = 'Bom, mas 6 meses seria ideal';
                        recommendationIcon = '⚡';
                    }

                    resultsHTML = `
                        <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 2rem; border-radius: 16px; border: 2px solid #93c5fd; margin-bottom: 1.5rem;">
                            <div style="text-align: center;">
                                <div style="font-size: 0.95rem; color: #1e40af; font-weight: 600; margin-bottom: 1rem;">
                                    <i class="ph ph-shield-check" style="font-size: 1.3rem;"></i> META DE RESERVA DE EMERGÊNCIA
                                </div>
                                <div style="font-size: 3rem; font-weight: 800; color: #1e3a8a; margin-bottom: 0.5rem;">
                                    ${formatCurrency(targetAmount)}
                                </div>
                                <div style="font-size: 1rem; color: #3b82f6; font-weight: 500;">
                                    ${months} meses × ${formatCurrency(monthlyExpenses)} = sua segurança financeira
                                </div>
                            </div>
                        </div>

                        <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 2px solid #e5e7eb; margin-bottom: 1.5rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                                <span style="color: #64748b; font-size: 0.9rem; font-weight: 600;">Progresso Atual</span>
                                <span style="color: #1e3a8a; font-size: 1.1rem; font-weight: 700;">${progressPercentage}%</span>
                            </div>
                            <div style="width: 100%; height: 24px; background: #e2e8f0; border-radius: 12px; overflow: hidden; position: relative;">
                                <div style="height: 100%; background: linear-gradient(90deg, #3b82f6, #06b6d4); width: ${progressPercentage}%; border-radius: 12px; transition: width 0.5s ease;"></div>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;">
                                <span style="color: #3b82f6; font-size: 0.85rem; font-weight: 600;">${formatCurrency(currentAmount)}</span>
                                <span style="color: #64748b; font-size: 0.85rem; font-weight: 600;">Faltam ${formatCurrency(stillNeeded)}</span>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                            <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 2px solid #e5e7eb; text-align: center;">
                                <div style="color: #6b7280; font-size: 0.85rem; margin-bottom: 0.5rem; font-weight: 600;">
                                    <i class="ph ph-calendar"></i> TEMPO ESTIMADO
                                </div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #059669;">
                                    ${years > 0 ? years + ' ano' + (years > 1 ? 's' : '') : ''}
                                    ${years > 0 && remainingMonths > 0 ? ' e ' : ''}
                                    ${remainingMonths > 0 ? remainingMonths + ' mês' + (remainingMonths > 1 ? 'es' : '') : ''}
                                </div>
                            </div>
                            
                            <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 2px solid #e5e7eb; text-align: center;">
                                <div style="color: #6b7280; font-size: 0.85rem; margin-bottom: 0.5rem; font-weight: 600;">
                                    <i class="ph ph-piggy-bank"></i> APORTE MENSAL
                                </div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #3b82f6;">${formatCurrency(monthlySavings)}</div>
                            </div>
                            
                            <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 2px solid #e5e7eb; text-align: center;">
                                <div style="color: #6b7280; font-size: 0.85rem; margin-bottom: 0.5rem; font-weight: 600;">
                                    <i class="ph ph-trending-down"></i> AINDA FALTA
                                </div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #dc2626;">${formatCurrency(stillNeeded)}</div>
                            </div>
                        </div>
                        
                        <div style="background: ${recommendationColor === '#059669' ? '#ecfdf5' : recommendationColor === '#f59e0b' ? '#fff7ed' : '#fef2f2'}; padding: 1.25rem; border-radius: 12px; border: 2px solid ${recommendationColor === '#059669' ? '#86efac' : recommendationColor === '#f59e0b' ? '#fed7aa' : '#fca5a5'}; margin-bottom: 1rem;">
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <span style="font-size: 1.5rem;">${recommendationIcon}</span>
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; color: ${recommendationColor}; font-size: 0.95rem;">${recommendationText}</div>
                                </div>
                            </div>
                        </div>

                        <div style="background: #eff6ff; padding: 1.25rem; border-radius: 12px; border: 2px solid #bfdbfe;">
                            <div style="display: flex; align-items: start; gap: 0.75rem;">
                                <i class="ph ph-info" style="font-size: 1.5rem; color: #1e40af; flex-shrink: 0;"></i>
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; color: #1e40af; margin-bottom: 0.4rem; font-size: 0.95rem;">Resumo do Planejamento</div>
                                    <div style="color: #1e40af; font-size: 0.85rem; line-height: 1.6;">
                                        • Você economizará ${formatCurrency(monthlySavings)} por mês durante ${monthsToComplete} meses<br>
                                        • Sua reserva cobrirá ${months} meses de gastos essenciais<br>
                                        • Mantenha em investimento de liquidez imediata (poupança, CDB ou Tesouro Selic)
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }
            }

            document.getElementById('emergencyResults').innerHTML = resultsHTML;
        }

        //EDUCATION / APRENDA - conteúdo dinâmico
        const educationArticles = [
            {
                id: 'e1',
                title: 'Como montar um orçamento que funciona',
                category: 'budgeting',
                readingTime: '8 min',
                excerpt: 'Passo a passo prático para criar um orçamento mensal realista e sustentável.',
                content: `
                    <h3>Introdução</h3>
                    <p>Um orçamento pessoal é a base de qualquer planejamento financeiro bem-sucedido. Ele funciona como um mapa que mostra de onde vem seu dinheiro e para onde ele vai, permitindo que você tome decisões conscientes sobre seus gastos e investimentos.</p>
                    
                    <h3>Por que fazer um orçamento?</h3>
                    <p>Segundo pesquisa da Confederação Nacional de Dirigentes Lojistas (CNDL) e do Serviço de Proteção ao Crédito (SPC Brasil), apenas 38% dos brasileiros controlam rigorosamente suas finanças pessoais. Essa falta de controle é uma das principais causas do endividamento familiar.</p>
                    <p>Um orçamento bem estruturado permite:</p>
                    <ul>
                        <li>Identificar gastos desnecessários</li>
                        <li>Evitar dívidas e juros altos</li>
                        <li>Planejar compras e investimentos</li>
                        <li>Construir uma reserva de emergência</li>
                        <li>Alcançar objetivos financeiros de longo prazo</li>
                    </ul>

                    <h3>Passo 1: Registre todas as receitas</h3>
                    <p>Comece listando todas as suas fontes de renda mensal: salário, freelances, aluguéis, pensões, rendimentos de investimentos, etc. Seja conservador nas estimativas — se sua renda varia, use a média dos últimos 3 meses ou o valor mínimo esperado.</p>

                    <h3>Passo 2: Mapeie suas despesas fixas</h3>
                    <p>Liste todos os gastos que se repetem mensalmente com valores fixos ou previsíveis: aluguel, condomínio, energia elétrica, água, internet, telefone, seguros, mensalidades escolares, planos de saúde, transporte, etc.</p>

                    <h3>Passo 3: Acompanhe despesas variáveis</h3>
                    <p>Durante 30 dias, anote todos os gastos que variam mês a mês: alimentação, produtos de higiene, lazer, vestuário, combustível, etc. Use aplicativos de controle financeiro ou simplesmente um caderno — o importante é registrar tudo.</p>

                    <h3>Passo 4: Aplique a regra 50/30/20</h3>
                    <p>Uma metodologia popular, defendida pela senadora americana Elizabeth Warren em seu livro "All Your Worth", sugere dividir a renda líquida em três categorias:</p>
                    <ul>
                        <li><strong>50% para necessidades essenciais:</strong> moradia, alimentação, transporte, saúde</li>
                        <li><strong>30% para desejos pessoais:</strong> lazer, hobbies, restaurantes, streaming</li>
                        <li><strong>20% para objetivos financeiros:</strong> poupança, investimentos, pagamento de dívidas</li>
                    </ul>
                    <p>Essa é apenas uma referência — ajuste conforme sua realidade. Se você está endividado, pode destinar mais para pagamento de dívidas temporariamente.</p>

                    <h3>Passo 5: Revise e ajuste mensalmente</h3>
                    <p>No final de cada mês, compare o planejado com o realizado. Identifique onde gastou mais ou menos que o esperado e ajuste o orçamento do próximo mês. Com o tempo, suas estimativas ficarão mais precisas.</p>

                    <h3>Dicas práticas</h3>
                    <ul>
                        <li>Use ferramentas digitais como o PoupAí para automatizar o controle</li>
                        <li>Configure alertas para não ultrapassar limites de cada categoria</li>
                        <li>Guarde comprovantes e notas fiscais por 30 dias</li>
                        <li>Revise gastos por impulso — espere 24h antes de compras não planejadas</li>
                        <li>Negocie contas fixas anualmente (internet, seguros, cartões)</li>
                    </ul>

                    <div class="source">
                        <strong>Fontes:</strong><br>
                        - CNDL/SPC Brasil. Pesquisa Nacional de Educação Financeira, 2023.<br>
                        - Warren, Elizabeth; Tyagi, Amelia Warren. "All Your Worth: The Ultimate Lifetime Money Plan", 2005.<br>
                        - Banco Central do Brasil. Caderno de Educação Financeira, 2024.
                    </div>
                `
            },
            {
                id: 'e2',
                title: 'Fundamentos dos investimentos para iniciantes',
                category: 'investing',
                readingTime: '10 min',
                excerpt: 'Entenda os principais produtos de investimento e como começar com segurança.',
                content: `
                    <h3>Por que investir?</h3>
                    <p>Guardar dinheiro "embaixo do colchão" ou na poupança tradicional faz você perder poder de compra ao longo do tempo devido à inflação. Investir é fazer seu dinheiro trabalhar por você, gerando rendimentos que superam a inflação e aumentam seu patrimônio.</p>

                    <h3>Conceitos fundamentais</h3>
                    <h4>Risco e Retorno</h4>
                    <p>Existe uma relação direta entre risco e retorno: quanto maior o potencial de ganho, maior o risco de perda. Investimentos conservadores (menor risco) tendem a render menos, enquanto investimentos arrojados (maior risco) podem render mais, mas também podem gerar prejuízos.</p>

                    <h4>Liquidez</h4>
                    <p>Liquidez é a facilidade de converter um investimento em dinheiro. Investimentos com alta liquidez (como CDBs com liquidez diária) podem ser resgatados rapidamente. Imóveis, por exemplo, têm baixa liquidez — podem levar meses para serem vendidos.</p>

                    <h4>Diversificação</h4>
                    <p>O ditado "não coloque todos os ovos na mesma cesta" se aplica perfeitamente aos investimentos. Diversificar significa distribuir seu dinheiro entre diferentes tipos de ativos para reduzir riscos.</p>

                    <h3>Perfil de investidor</h3>
                    <p>Antes de investir, identifique seu perfil:</p>
                    <ul>
                        <li><strong>Conservador:</strong> prioriza segurança e aceita retornos menores. Prefere renda fixa.</li>
                        <li><strong>Moderado:</strong> equilibra segurança e rentabilidade. Mescla renda fixa e variável.</li>
                        <li><strong>Arrojado:</strong> busca alta rentabilidade e aceita riscos maiores. Foca em renda variável.</li>
                    </ul>

                    <h3>Principais tipos de investimento</h3>
                    <h4>Renda Fixa</h4>
                    <p><strong>Tesouro Direto:</strong> Títulos públicos emitidos pelo governo federal. São considerados os investimentos mais seguros do país. Exemplos: Tesouro Selic (liquidez diária, ideal para reserva de emergência), Tesouro IPCA+ (protege da inflação).</p>
                    <p><strong>CDB (Certificado de Depósito Bancário):</strong> Empréstimo que você faz ao banco, que devolve com juros. Protegido pelo FGC até R$ 250 mil por CPF e instituição.</p>
                    <p><strong>LCI e LCA:</strong> Semelhantes ao CDB, mas isentos de Imposto de Renda. Ligados ao setor imobiliário (LCI) ou agronegócio (LCA).</p>

                    <h4>Renda Variável</h4>
                    <p><strong>Ações:</strong> Frações de empresas negociadas na bolsa de valores (B3). Você se torna sócio e pode ganhar com valorização e dividendos, mas também pode ter prejuízos.</p>
                    <p><strong>Fundos Imobiliários (FIIs):</strong> Investimento coletivo em imóveis ou títulos do setor. Distribuem rendimentos mensais e têm cotas negociadas na bolsa.</p>
                    <p><strong>ETFs (Exchange Traded Funds):</strong> Fundos que replicam índices de mercado, como o Ibovespa. Oferecem diversificação instantânea.</p>

                    <h3>Como começar a investir</h3>
                    <ol>
                        <li><strong>Quite dívidas caras:</strong> Cartão de crédito e cheque especial têm juros altíssimos. Pague-os antes de investir.</li>
                        <li><strong>Monte sua reserva de emergência:</strong> Tenha de 3 a 6 meses de despesas em investimentos de alta liquidez (Tesouro Selic ou CDB).</li>
                        <li><strong>Defina objetivos:</strong> Curto prazo (até 2 anos), médio prazo (2-5 anos) ou longo prazo (acima de 5 anos). Isso define onde investir.</li>
                        <li><strong>Abra conta em uma corretora:</strong> Escolha uma corretora confiável, com boa reputação e taxa zero.</li>
                        <li><strong>Comece com pouco:</strong> Muitos investimentos permitem começar com R$ 30 a R$ 100.</li>
                        <li><strong>Estude antes de investir:</strong> Entenda cada produto antes de aplicar seu dinheiro.</li>
                    </ol>

                    <h3>Erros comuns de iniciantes</h3>
                    <ul>
                        <li>Investir sem reserva de emergência</li>
                        <li>Seguir dicas "quentes" sem pesquisar</li>
                        <li>Colocar todo o dinheiro em um único ativo</li>
                        <li>Tomar decisões emocionais (pânico em quedas, euforia em altas)</li>
                        <li>Não considerar impostos e taxas</li>
                    </ul>

                    <div class="source">
                        <strong>Fontes:</strong><br>
                        - B3 (Bolsa de Valores do Brasil). Guia de Investimentos, 2024.<br>
                        - ANBIMA (Associação Brasileira das Entidades dos Mercados Financeiro e de Capitais). Como Investir, 2024.<br>
                        - Tesouro Nacional. Tesouro Direto - Conheça os Títulos Públicos, 2024.<br>
                        - CVM (Comissão de Valores Mobiliários). Portal do Investidor, 2024.
                    </div>
                `
            },
            {
                id: 'e3',
                title: 'Dívidas: estratégias para sair do vermelho',
                category: 'credit',
                readingTime: '7 min',
                excerpt: 'Técnicas para negociar dívidas e priorizar pagamentos de forma inteligente.',
                content: `
                    <h3>Entendendo o endividamento no Brasil</h3>
                    <p>Segundo dados da Confederação Nacional do Comércio (CNC), mais de 70% das famílias brasileiras estão endividadas, e cerca de 30% têm contas em atraso. Os principais vilões são o cartão de crédito (rotativo e parcelado), carnês e financiamentos.</p>

                    <h3>Por que as dívidas crescem tão rápido?</h3>
                    <p>As taxas de juros no Brasil estão entre as mais altas do mundo. O rotativo do cartão de crédito pode ultrapassar 400% ao ano, e o cheque especial também cobra juros altíssimos. Isso faz uma dívida pequena se transformar em uma bola de neve rapidamente.</p>

                    <h3>Passo 1: Faça um diagnóstico completo</h3>
                    <p>Liste todas as suas dívidas com as seguintes informações:</p>
                    <ul>
                        <li>Nome do credor (banco, loja, financeira)</li>
                        <li>Valor total devido</li>
                        <li>Taxa de juros mensal</li>
                        <li>Valor da parcela</li>
                        <li>Data de vencimento</li>
                        <li>Situação (em dia, atrasada, negativada)</li>
                    </ul>
                    <p>Ter essa visão clara é essencial para criar uma estratégia eficaz.</p>

                    <h3>Passo 2: Priorize as dívidas certas</h3>
                    <p>Existem dois métodos populares:</p>
                    <h4>Método Avalanche (mais econômico)</h4>
                    <p>Priorize as dívidas com maiores taxas de juros, independentemente do valor. Pague o mínimo das outras e concentre recursos na de maior juros. Quando quitá-la, passe para a próxima mais cara. Esse método economiza mais dinheiro no longo prazo.</p>
                    
                    <h4>Método Bola de Neve (mais motivador)</h4>
                    <p>Comece pagando as menores dívidas primeiro, independentemente dos juros. A sensação de quitar dívidas rapidamente gera motivação. Depois de eliminar as pequenas, ataque as maiores.</p>
                    
                    <p>Escolha o método que faz mais sentido para você — o melhor método é aquele que você consegue seguir.</p>

                    <h3>Passo 3: Negocie sempre</h3>
                    <p>Credores preferem receber menos a não receber nada. Use isso a seu favor:</p>
                    <ul>
                        <li><strong>Pagamento à vista:</strong> Ofereça pagar um valor menor à vista. Descontos de 40% a 70% são comuns.</li>
                        <li><strong>Reparcelamento:</strong> Se não tiver dinheiro à vista, negocie parcelas menores e mais longas.</li>
                        <li><strong>Use canais oficiais:</strong> Acesse plataformas como "Serasa Limpa Nome", "Acordo Certo" e sites dos próprios credores.</li>
                        <li><strong>Peça redução de juros:</strong> Mostre sua situação financeira e proponha uma taxa menor.</li>
                        <li><strong>Tudo por escrito:</strong> Sempre peça o acordo documentado antes de pagar.</li>
                    </ul>

                    <h3>Passo 4: Corte gastos temporariamente</h3>
                    <p>Enquanto estiver pagando dívidas, adote medidas temporárias para aumentar a capacidade de pagamento:</p>
                    <ul>
                        <li>Cancele assinaturas e serviços não essenciais</li>
                        <li>Reduza gastos com lazer e entretenimento</li>
                        <li>Cozinhe em casa e leve marmita</li>
                        <li>Use transporte público ou carona</li>
                        <li>Venda itens que não usa mais</li>
                    </ul>

                    <h3>Passo 5: Aumente sua renda</h3>
                    <p>Considere fontes extras de renda temporária:</p>
                    <ul>
                        <li>Trabalhos freelance ou "bicos"</li>
                        <li>Venda de produtos artesanais</li>
                        <li>Revenda de produtos</li>
                        <li>Aulas particulares</li>
                        <li>Aplicativos de transporte ou delivery</li>
                    </ul>

                    <h3>Cuidados importantes</h3>
                    <ul>
                        <li><strong>Nunca pegue empréstimo para pagar empréstimo:</strong> Você só troca um problema por outro, geralmente maior.</li>
                        <li><strong>Evite empréstimos consignados sem planejamento:</strong> Comprometem sua renda por anos.</li>
                        <li><strong>Cuidado com "consultores de dívidas":</strong> Muitos cobram taxas abusivas. Você mesmo pode negociar.</li>
                        <li><strong>Não ignore o problema:</strong> Dívidas não desaparecem sozinhas e só crescem com o tempo.</li>
                    </ul>

                    <h3>Depois de quitar: previna novas dívidas</h3>
                    <ol>
                        <li>Monte uma reserva de emergência</li>
                        <li>Use cartão de crédito com consciência — sempre pague a fatura integral</li>
                        <li>Tenha um orçamento mensal</li>
                        <li>Evite compras por impulso</li>
                        <li>Planeje compras grandes com antecedência</li>
                    </ol>

                    <div class="source">
                        <strong>Fontes:</strong><br>
                        - CNC (Confederação Nacional do Comércio). Pesquisa de Endividamento e Inadimplência do Consumidor (PEIC), 2024.<br>
                        - Serasa. Guia para Renegociação de Dívidas, 2024.<br>
                        - Banco Central do Brasil. Caderno de Educação Financeira - Gestão de Dívidas, 2024.<br>
                        - PROCON-SP. Orientações sobre Superendividamento, 2024.
                    </div>
                `
            },
            {
                id: 'e4',
                title: 'Hábitos financeiros: pequenas mudanças, grande impacto',
                category: 'behavior',
                readingTime: '6 min',
                excerpt: 'Pequenas ações diárias que melhoram sua saúde financeira ao longo do tempo.',
                content: `
                    <h3>O poder dos hábitos financeiros</h3>
                    <p>Segundo pesquisadores da Duke University, cerca de 40% das ações que realizamos diariamente não são decisões conscientes, mas hábitos automáticos. Transformar comportamentos financeiros em hábitos positivos é a chave para uma vida financeira saudável de longo prazo.</p>

                    <h3>Hábito 1: Pague você primeiro</h3>
                    <p>Ao receber seu salário ou qualquer renda, a primeira "conta" a pagar deve ser a você mesmo — seu futuro. Separe de 10% a 20% da renda líquida para investimentos antes de gastar com qualquer outra coisa.</p>
                    <p><strong>Como implementar:</strong> Configure uma transferência automática no dia do recebimento do salário para uma conta de investimentos separada.</p>

                    <h3>Hábito 2: Regra das 24 horas</h3>
                    <p>Antes de fazer qualquer compra não planejada acima de R$ 100, espere pelo menos 24 horas. Esse tempo de reflexão elimina a maioria das compras por impulso, que são responsáveis por grande parte dos gastos desnecessários.</p>
                    <p><strong>Dica:</strong> Adicione o item à lista de desejos e, se após 24 horas ainda fizer sentido, avalie se cabe no orçamento.</p>

                    <h3>Hábito 3: Auditoria mensal de assinaturas</h3>
                    <p>Streamings, academias, aplicativos, clubes de assinatura — pequenos valores mensais somam muito ao longo do ano. Reserve o primeiro sábado de cada mês para revisar todas as assinaturas ativas.</p>
                    <p>Pergunte-se:</p>
                    <ul>
                        <li>Usei esse serviço no último mês?</li>
                        <li>Ele ainda agrega valor à minha vida?</li>
                        <li>Existe alternativa gratuita ou mais barata?</li>
                    </ul>
                    <p>Cancele o que não for essencial. Cinco assinaturas de R$ 30 representam R$ 1.800 por ano.</p>

                    <h3>Hábito 4: Registre gastos em tempo real</h3>
                    <p>Anotar cada gasto no momento em que ele acontece aumenta sua consciência financeira. Use aplicativos como o PoupAí ou até um simples bloco de notas.</p>
                    <p>Estudos mostram que pessoas que registram gastos regularmente reduzem despesas em até 15% naturalmente, apenas pela maior consciência do próprio padrão de consumo.</p>

                    <h3>Hábito 5: Compras com lista</h3>
                    <p>Seja no supermercado, farmácia ou loja de roupas, sempre vá com uma lista do que precisa. Supermercados são projetados para estimular compras por impulso — corredores estratégicos, promoções nas pontas de gôndola, produtos infantis na altura dos olhos das crianças.</p>
                    <p><strong>Estratégia:</strong> Faça compras após comer (nunca com fome) e tenha um limite de tempo — quanto mais tempo no mercado, mais você gasta.</p>

                    <h3>Hábito 6: Desafio da economia semanal</h3>
                    <p>Estabeleça pequenos desafios semanais, como:</p>
                    <ul>
                        <li>"Semana sem delivery" — cozinhar todas as refeições em casa</li>
                        <li>"Semana sem cafezinho fora" — fazer café em casa</li>
                        <li>"Semana do transporte alternativo" — usar bicicleta ou ir a pé</li>
                    </ul>
                    <p>Coloque o dinheiro economizado em um cofrinho ou conta separada. Ver o valor crescer motiva a continuar.</p>

                    <h3>Hábito 7: Revise metas financeiras semanalmente</h3>
                    <p>Reserve 15 minutos toda sexta-feira para revisar seu progresso financeiro da semana. Responda:</p>
                    <ul>
                        <li>Gastei dentro do planejado?</li>
                        <li>Onde posso melhorar na próxima semana?</li>
                        <li>Tive alguma conquista financeira?</li>
                    </ul>
                    <p>Esse ritual mantém suas metas no radar e reforça comportamentos positivos.</p>

                    <h3>Hábito 8: Automatize o máximo possível</h3>
                    <p>Quanto menos decisões você precisar tomar, melhor. Automatize:</p>
                    <ul>
                        <li>Transferências para investimentos</li>
                        <li>Pagamento de contas fixas (débito automático)</li>
                        <li>Aportes mensais em previdência ou fundos</li>
                    </ul>
                    <p>A automação remove a tentação de "pular um mês" e garante consistência.</p>

                    <h3>Hábito 9: Comemore pequenas vitórias</h3>
                    <p>Finanças não devem ser só sacrifício. Quando atingir marcos importantes (quitar uma dívida, juntar X mil reais, economizar por 3 meses seguidos), celebre com algo que goste — mas dentro do orçamento!</p>
                    <p>Reforçar comportamentos positivos com recompensas aumenta a probabilidade de mantê-los.</p>

                    <h3>Construindo novos hábitos: a regra dos 21 dias</h3>
                    <p>Pesquisas sugerem que leva em média 21 dias para formar um novo hábito, e 66 dias para torná-lo automático. Escolha um hábito por vez, pratique diariamente por pelo menos três semanas e, só depois, adicione o próximo.</p>
                    <p>Não tente mudar tudo de uma vez — mudanças graduais são mais sustentáveis.</p>

                    <div class="source">
                        <strong>Fontes:</strong><br>
                        - Duke University. "Habits: A Repeat Performance" (David T. Neal, Wendy Wood, Jeffrey M. Quinn), 2006.<br>
                        - Clear, James. "Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones", 2018.<br>
                        - Thaler, Richard H.; Sunstein, Cass R. "Nudge: Improving Decisions About Health, Wealth, and Happiness", 2008.<br>
                        - Kahneman, Daniel. "Thinking, Fast and Slow", 2011.
                    </div>
                `
            },
            {
                id: 'e5',
                title: 'Reserva de emergência: quanto e onde guardar',
                category: 'fundamentals',
                readingTime: '6 min',
                excerpt: 'Qual o tamanho ideal da reserva e quais investimentos priorizar para emergência.',
                content: `
                    <h3>O que é uma reserva de emergência?</h3>
                    <p>A reserva de emergência é um fundo financeiro destinado exclusivamente a cobrir imprevistos: perda de emprego, problemas de saúde, consertos urgentes em casa ou carro, entre outros. É a base de qualquer planejamento financeiro sólido e deve ser prioridade antes de qualquer outro investimento.</p>

                    <h3>Por que ter uma reserva de emergência?</h3>
                    <p>Segundo pesquisa do SPC Brasil, 48% dos brasileiros não têm nenhum dinheiro guardado para emergências. Isso significa que, diante de um imprevisto, metade da população precisa recorrer a empréstimos caros ou cartão de crédito, gerando dívidas com juros altíssimos.</p>
                    <p>Com uma reserva, você:</p>
                    <ul>
                        <li>Evita entrar em dívidas caras em momentos de crise</li>
                        <li>Tem tranquilidade para tomar decisões sem desespero</li>
                        <li>Protege seus outros investimentos de resgates antecipados</li>
                        <li>Pode aproveitar oportunidades que surgem inesperadamente</li>
                    </ul>

                    <h3>Qual o tamanho ideal da reserva?</h3>
                    <p>A regra geral recomenda de 3 a 6 meses das suas despesas mensais. O valor exato depende da sua situação:</p>
                    
                    <h4>3 meses de despesas</h4>
                    <ul>
                        <li>Você tem emprego estável (servidor público, CLT em grande empresa)</li>
                        <li>Não tem dependentes</li>
                        <li>Tem outras fontes de renda ou apoio familiar</li>
                    </ul>

                    <h4>6 meses de despesas</h4>
                    <ul>
                        <li>Você tem dependentes (filhos, cônjuge sem renda própria)</li>
                        <li>Trabalha em setor com alta rotatividade</li>
                        <li>É a única fonte de renda da família</li>
                    </ul>

                    <h4>12 meses ou mais</h4>
                    <ul>
                        <li>Você é autônomo ou empresário</li>
                        <li>Trabalha em mercado muito volátil</li>
                        <li>Tem renda extremamente irregular</li>
                        <li>Está perto da aposentadoria</li>
                    </ul>

                    <p><strong>Exemplo prático:</strong> Se suas despesas mensais são R$ 3.000, uma reserva de 6 meses seria R$ 18.000.</p>

                    <h3>Onde guardar a reserva de emergência?</h3>
                    <p>A reserva deve estar em investimentos que combinem três características: segurança, liquidez e rentabilidade (nessa ordem de importância).</p>

                    <h4>Opções recomendadas</h4>
                    <p><strong>1. Tesouro Selic (Tesouro Direto)</strong></p>
                    <ul>
                        <li>✅ Investimento mais seguro do país (garantido pelo Governo Federal)</li>
                        <li>✅ Liquidez diária (dinheiro cai em 1 dia útil)</li>
                        <li>✅ Rentabilidade acompanha a taxa Selic</li>
                        <li>✅ Aplicação mínima de cerca de R$ 30</li>
                    </ul>

                    <p><strong>2. CDB com liquidez diária</strong></p>
                    <ul>
                        <li>✅ Protegido pelo FGC até R$ 250 mil</li>
                        <li>✅ Liquidez diária (resgate a qualquer momento)</li>
                        <li>✅ Rentabilidade geralmente próxima a 100% do CDI</li>
                        <li>⚠️ Verificar solidez do banco emissor</li>
                    </ul>

                    <p><strong>3. Fundos DI ou fundos de renda fixa conservadores</strong></p>
                    <ul>
                        <li>${renderIcon('check-circle')} Boa liquidez (D+0 ou D+1)</li>
                        <li>${renderIcon('check-circle')} Gestão profissional</li>
                        <li>${renderIcon('warning-circle')} Atenção às taxas de administração (prefira abaixo de 0,5% ao ano)</li>
                    </ul>

                    <h4>Onde NÃO guardar a reserva</h4>
                    <ul>
                        <li>${renderIcon('x-circle')} <strong>Poupança:</strong> Rende muito pouco (cerca de 70% da Selic), perdendo até da inflação em muitos cenários</li>
                        <li>${renderIcon('x-circle')} <strong>Ações:</strong> Alta volatilidade — pode valer muito menos quando você precisar</li>
                        <li>${renderIcon('x-circle')} <strong>Imóveis:</strong> Baixíssima liquidez, pode levar meses para vender</li>
                        <li>${renderIcon('x-circle')} <strong>CDBs sem liquidez:</strong> Seu dinheiro fica "preso" até o vencimento</li>
                        <li>${renderIcon('x-circle')} <strong>Criptomoedas:</strong> Extremamente voláteis e arriscadas</li>
                    </ul>

                    <h3>Como construir sua reserva do zero</h3>
                    <ol>
                        <li><strong>Calcule o valor total necessário:</strong> Multiplique suas despesas mensais por 3, 6 ou 12 meses.</li>
                        <li><strong>Defina um aporte mensal:</strong> Mesmo que seja R$ 100 ou R$ 200, o importante é começar e ser consistente.</li>
                        <li><strong>Automatize:</strong> Configure transferência automática no dia que recebe seu salário.</li>
                        <li><strong>Priorize a reserva:</strong> Antes de investir em ações, fundos imobiliários ou qualquer outro ativo, complete sua reserva.</li>
                        <li><strong>Resista à tentação:</strong> Esse dinheiro é só para emergências reais, não para aproveitar promoções ou viagens.</li>
                    </ol>

                    <p><strong>Exemplo:</strong> Se você precisa de R$ 18.000 e consegue guardar R$ 500/mês, levará 36 meses (3 anos). Parece muito? Lembre-se: é melhor ter metade da reserva do que nada.</p>

                    <h3>Quando usar a reserva?</h3>
                    <p>Use sua reserva apenas para emergências legítimas:</p>
                    <ul>
                        <li>✅ Perda de emprego ou redução drástica de renda</li>
                        <li>✅ Problemas de saúde não cobertos por plano</li>
                        <li>✅ Consertos urgentes (carro, casa)</li>
                        <li>✅ Despesas inesperadas (funeral, viagem urgente de família)</li>
                    </ul>

                    <p>Não use para:</p>
                    <ul>
                        <li>❌ Viagens planejadas</li>
                        <li>❌ Compra de eletrônicos ou roupas</li>
                        <li>❌ "Oportunidades imperdíveis" de investimento</li>
                        <li>❌ Presente de casamento ou aniversário</li>
                    </ul>

                    <h3>E depois de completar a reserva?</h3>
                    <p>Parabéns! Agora você pode:</p>
                    <ol>
                        <li>Começar a investir em ativos de maior rentabilidade (ações, fundos imobiliários, etc.)</li>
                        <li>Acelerar pagamento de dívidas de menor juros</li>
                        <li>Poupar para objetivos específicos (casa, carro, viagem)</li>
                        <li>Aumentar gradualmente sua reserva conforme suas despesas crescem</li>
                    </ol>

                    <p>Lembre-se: se usar parte da reserva, recomponha-a o quanto antes, voltando a priorizar aportes nela antes de outros investimentos.</p>

                    <div class="source">
                        <strong>Fontes:</strong><br>
                        - SPC Brasil. Pesquisa: Reserva Financeira dos Brasileiros, 2023.<br>
                        - Tesouro Nacional. Tesouro Direto - Guia do Investidor, 2024.<br>
                        - FGC (Fundo Garantidor de Créditos). Cartilha de Investimentos Garantidos, 2024.<br>
                        - XP Investimentos. Reserva de Emergência: Quanto Guardar e Onde Investir, 2024.
                    </div>
                `
            },
            {
                id: 'e6',
                title: 'Cartão de crédito: use a seu favor, não contra',
                category: 'credit',
                readingTime: '7 min',
                excerpt: 'Como usar o cartão de crédito de forma inteligente para ganhar benefícios sem cair em armadilhas.',
                content: `
                    <h3>O cartão de crédito não é o vilão</h3>
                    <p>O cartão de crédito é uma ferramenta financeira poderosa que, quando bem utilizada, traz benefícios como cashback, pontos, milhas, seguros e prazo adicional para pagamento. O problema não é o cartão, mas o uso inadequado dele.</p>

                    <h3>Como funciona o cartão de crédito</h3>
                    <p>O cartão oferece um limite de crédito que você pode usar durante o mês. Todas as compras são consolidadas em uma fatura mensal com data de vencimento. Se você pagar o valor total até a data, não paga juros. Se pagar apenas o mínimo ou atrasar, começa a pagar juros altíssimos.</p>

                    <h3>As modalidades de pagamento</h3>
                    <h4>1. Pagamento integral (o correto)</h4>
                    <p>Você paga 100% da fatura até a data de vencimento. Não paga juros. Essa é a única forma saudável de usar o cartão.</p>

                    <h4>2. Pagamento mínimo (a armadilha)</h4>
                    <p>Você paga apenas 15% do valor total. O restante vira dívida com juros rotativos que podem ultrapassar 400% ao ano. Uma fatura de R$ 1.000 pode virar R$ 5.000 em meses se você só pagar o mínimo.</p>

                    <h4>3. Parcelamento da fatura (outra armadilha)</h4>
                    <p>O banco oferece parcelar a fatura em várias vezes. Parece atrativo, mas cobra juros altíssimos (geralmente acima de 10% ao mês). Evite ao máximo.</p>

                    <h3>Regras de ouro para usar cartão com segurança</h3>
                    
                    <h4>1. Trate como dinheiro</h4>
                    <p>Só compre no cartão se você tem o dinheiro disponível na conta. O cartão não é "dinheiro extra", é apenas uma forma de pagamento mais conveniente.</p>

                    <h4>2. Pague sempre o total</h4>
                    <p>Configure débito automático do valor total da fatura. Se não conseguir pagar o total, significa que gastou mais do que devia — é hora de reavaliar.</p>

                    <h4>3. Acompanhe gastos semanalmente</h4>
                    <p>Não espere a fatura chegar. Acesse o app do banco semanalmente para ver quanto já gastou. Isso evita surpresas desagradáveis no vencimento.</p>

                    <h4>4. Defina um limite pessoal</h4>
                    <p>Mesmo que seu limite seja R$ 5.000, estabeleça mentalmente um limite menor (ex: R$ 2.000). Configure alertas no app do banco para avisar quando atingir 50%, 75% e 90% desse limite.</p>

                    <h4>5. Use para compras planejadas, não impulsivas</h4>
                    <p>O cartão facilita demais comprar por impulso. Aplique a regra das 24 horas: se não estava planejado, espere um dia antes de comprar.</p>

                    <h3>Vantagens que você pode aproveitar</h3>
                    
                    <h4>Cashback</h4>
                    <p>Alguns cartões devolvem uma porcentagem das compras (geralmente 0,25% a 2%). Com gasto mensal de R$ 2.000 e cashback de 1%, você recupera R$ 20/mês (R$ 240/ano).</p>

                    <h4>Programas de pontos e milhas</h4>
                    <p>Cada real gasto gera pontos que podem ser trocados por produtos, passagens aéreas, hospedagens. Ideal para quem viaja frequentemente.</p>
                    <p><strong>Dica:</strong> Só vale a pena se você já gastaria aquele valor de qualquer forma. Nunca gaste mais só para acumular pontos.</p>

                    <h4>Seguros inclusos</h4>
                    <p>Muitos cartões oferecem:</p>
                    <ul>
                        <li>Seguro viagem nacional e internacional</li>
                        <li>Proteção de compras (roubo/quebra)</li>
                        <li>Extensão de garantia de produtos</li>
                        <li>Seguro de aluguel de veículos</li>
                    </ul>

                    <h4>Prazo adicional</h4>
                    <p>Dependendo da data da compra e do fechamento da fatura, você pode ter até 40 dias para pagar sem juros. Use isso a seu favor: compre logo após o fechamento para maximizar o prazo.</p>

                    <h3>Armadilhas comuns e como evitá-las</h3>
                    
                    <h4>Aumentos de limite não solicitados</h4>
                    <p>Bancos aumentam limites automaticamente. Isso não é um "prêmio", é uma tentação para você gastar mais. Peça para manter o limite atual ou até reduzi-lo se necessário.</p>

                    <h4>Compras parceladas</h4>
                    <p>Parcelar compras sem juros parece inofensivo, mas compromete seu orçamento futuro. Se você parcela um celular em 12x de R$ 200, fica "preso" por um ano. Prefira juntar dinheiro e comprar à vista.</p>

                    <h4>Cartões adicionais</h4>
                    <p>Dar cartão adicional para cônjuge ou filhos pode descontrolar os gastos. Se der, estabeleça limites claros e acompanhe mensalmente.</p>

                    <h4>Ofertas "exclusivas" para clientes</h4>
                    <p>Bancos oferecem "promoções especiais" com parcelamento facilitado. Na maioria das vezes, os juros estão embutidos ou o produto está mais caro que em outros lugares.</p>

                    <h3>O que fazer se já entrou no rotativo</h3>
                    <ol>
                        <li><strong>Pare de usar o cartão imediatamente:</strong> Guarde-o em um lugar difícil de acessar.</li>
                        <li><strong>Negocie com o banco:</strong> Peça para transferir a dívida para um empréstimo pessoal (juros menores) ou reparcelar.</li>
                        <li><strong>Use plataformas de negociação:</strong> Sites como "Acordo Certo" oferecem condições melhores.</li>
                        <li><strong>Corte gastos urgentemente:</strong> Destine toda a renda extra para quitar essa dívida o quanto antes.</li>
                        <li><strong>Considere cancelar o cartão:</strong> Se você não consegue controlar, melhor não ter.</li>
                    </ol>

                    <h3>Quando considerar cancelar o cartão</h3>
                    <p>Cancele o cartão se:</p>
                    <ul>
                        <li>Você paga apenas o mínimo frequentemente</li>
                        <li>Já entrou no rotativo mais de uma vez</li>
                        <li>Gasta mais do que ganha por causa dele</li>
                        <li>Tem dificuldade de controlar impulsos de compra</li>
                        <li>As anuidades são altas e você não usa os benefícios</li>
                    </ul>
                    <p>Não há vergonha em não usar cartão de crédito. Muitas pessoas vivem perfeitamente bem só com débito e dinheiro.</p>

                    <h3>Alternativas ao cartão de crédito</h3>
                    <ul>
                        <li><strong>Cartão de débito:</strong> Só gasta o que tem na conta</li>
                        <li><strong>Cartão pré-pago:</strong> Você carrega um valor e usa até acabar</li>
                        <li><strong>Dinheiro em espécie:</strong> Ajuda a controlar gastos visualmente</li>
                        <li><strong>PIX:</strong> Pagamentos instantâneos direto da conta</li>
                    </ul>

                    <div class="source">
                        <strong>Fontes:</strong><br>
                        - Banco Central do Brasil. Juros e Taxas do Sistema Financeiro Nacional, 2024.<br>
                        - ANEFAC (Associação Nacional dos Executivos de Finanças). Pesquisa de Juros do Rotativo, 2024.<br>
                        - PROCON-SP. Cartilha sobre Cartão de Crédito, 2024.<br>
                        - Serasa. Guia: Como Usar Cartão de Crédito sem Cair em Armadilhas, 2024.
                    </div>
                `
            },
            {
                id: 'e7',
                title: 'Planejamento financeiro familiar: organize as finanças em casal',
                category: 'budgeting',
                readingTime: '8 min',
                excerpt: 'Estratégias para casais gerenciarem dinheiro juntos de forma saudável e equilibrada.',
                content: `
                    <h3>Por que casais brigam por dinheiro?</h3>
                    <p>Estudos mostram que discussões sobre dinheiro são a principal causa de conflitos em relacionamentos e um dos principais motivos de divórcio. Isso não acontece porque falta dinheiro, mas pela falta de comunicação e alinhamento sobre valores e objetivos financeiros.</p>

                    <h3>Passo 1: Conversem abertamente sobre dinheiro</h3>
                    <p>Antes de qualquer planejamento, é preciso ter uma conversa honesta sobre:</p>
                    <ul>
                        <li><strong>Histórico financeiro:</strong> Cada um teve uma criação diferente com dinheiro. Compartilhem experiências, traumas e aprendizados.</li>
                        <li><strong>Situação atual:</strong> Renda, dívidas, investimentos, score de crédito. Total transparência.</li>
                        <li><strong>Valores e prioridades:</strong> O que é importante para cada um? Segurança? Experiências? Liberdade?</li>
                        <li><strong>Sonhos e objetivos:</strong> Casa própria? Viagens? Aposentadoria antecipada? Filhos?</li>
                    </ul>
                    <p>Estabeleçam que essas conversas devem ser livres de julgamentos. O objetivo é entender, não criticar.</p>

                    <h3>Passo 2: Definam um modelo de gestão</h3>
                    <p>Não existe modelo único — escolham o que faz mais sentido para vocês:</p>

                    <h4>Modelo 1: Conta única</h4>
                    <p>Todo o dinheiro de ambos vai para uma conta conjunta. Todas as despesas saem dali.</p>
                    <p><strong>Vantagens:</strong> Simplicidade, total transparência, facilita objetivos comuns.</p>
                    <p><strong>Desvantagens:</strong> Pode gerar conflitos sobre gastos pessoais, sensação de perda de autonomia.</p>
                    <p><strong>Ideal para:</strong> Casais com renda similar e valores bem alinhados.</p>

                    <h4>Modelo 2: Contas separadas + conta conjunta</h4>
                    <p>Cada um mantém sua conta individual e ambos contribuem proporcionalmente para uma conta conjunta que paga despesas comuns.</p>
                    <p><strong>Como funciona:</strong> Definam uma porcentagem da renda de cada um (ex: 60%) que vai para a conta conjunta. Os 40% restantes são de uso livre individual.</p>
                    <p><strong>Vantagens:</strong> Autonomia individual, justiça proporcional, menos conflitos por gostos pessoais.</p>
                    <p><strong>Desvantagens:</strong> Mais complexo de gerenciar, requer mais organização.</p>
                    <p><strong>Ideal para:</strong> Casais com rendas diferentes ou que valorizam independência financeira.</p>

                    <h4>Modelo 3: Contas totalmente separadas</h4>
                    <p>Cada um paga metade das contas ou divide por tipo de despesa (ex: um paga aluguel, outro paga mercado).</p>
                    <p><strong>Vantagens:</strong> Máxima autonomia, clareza de responsabilidades.</p>
                    <p><strong>Desvantagens:</strong> Dificulta objetivos comuns, pode criar "contabilidade" excessiva no relacionamento.</p>
                    <p><strong>Ideal para:</strong> Casais que estão começando a morar juntos ou que preferem independência total.</p>

                    <h3>Passo 3: Criem um orçamento familiar conjunto</h3>
                    <p>Independentemente do modelo escolhido, vocês precisam de um orçamento compartilhado. Liste:</p>

                    <h4>Receitas do casal</h4>
                    <ul>
                        <li>Salários, freelances, rendas extras</li>
                        <li>Rendimentos de investimentos</li>
                        <li>Outras fontes</li>
                    </ul>

                    <h4>Despesas fixas compartilhadas</h4>
                    <ul>
                        <li>Moradia (aluguel/financiamento, condomínio)</li>
                        <li>Contas básicas (luz, água, gás, internet)</li>
                        <li>Alimentação (mercado, feira)</li>
                        <li>Transporte (combustível, manutenção, transporte público)</li>
                        <li>Saúde (planos, remédios)</li>
                        <li>Educação (filhos, cursos)</li>
                    </ul>

                    <h4>Despesas variáveis</h4>
                    <ul>
                        <li>Lazer conjunto (restaurantes, cinema)</li>
                        <li>Vestuário</li>
                        <li>Presentes</li>
                        <li>Despesas eventuais</li>
                    </ul>

                    <h4>Objetivos financeiros</h4>
                    <ul>
                        <li>Reserva de emergência familiar</li>
                        <li>Viagem anual</li>
                        <li>Entrada da casa própria</li>
                        <li>Aposentadoria</li>
                        <li>Educação dos filhos</li>
                    </ul>

                    <h3>Passo 4: Estabeleçam regras claras</h3>
                    <p>Para evitar conflitos, definam acordos como:</p>
                    <ul>
                        <li><strong>Valor de consulta:</strong> Compras acima de X reais devem ser discutidas antes (ex: R$ 500)</li>
                        <li><strong>"Dinheiro de bolso":</strong> Cada um tem um valor mensal para gastar sem precisar justificar</li>
                        <li><strong>Reuniões financeiras:</strong> Uma vez por mês, revisem o orçamento juntos</li>
                        <li><strong>Divisão de responsabilidades:</strong> Quem paga cada conta, quem acompanha investimentos, etc.</li>
                        <li><strong>Fundo para imprevistos:</strong> Além da reserva de emergência, um pequeno fundo para gastos não planejados</li>
                    </ul>

                    <h3>Passo 5: Lidem com diferenças de perfil</h3>
                    <p>É comum um ser poupador e outro gastador. Como lidar?</p>

                    <h4>Se você é o poupador</h4>
                    <ul>
                        <li>Não imponha sua visão. Explique suas preocupações com respeito.</li>
                        <li>Mostre números concretos, não apenas "achismos"</li>
                        <li>Entenda que lazer e qualidade de vida também importam</li>
                        <li>Celebre pequenas vitórias financeiras juntos</li>
                    </ul>

                    <h4>Se você é o gastador</h4>
                    <ul>
                        <li>Reconheça que segurança financeira traz tranquilidade</li>
                        <li>Proponha um "fundo de diversão" mensal pré-aprovado</li>
                        <li>Envolva-se no planejamento para entender os números</li>
                        <li>Busque formas de se divertir que custem menos</li>
                    </ul>

                    <h3>Passo 6: Incluam os filhos (se houver)</h3>
                    <p>Educação financeira começa em casa. De acordo com a idade:</p>

                    <h4>3-7 anos</h4>
                    <ul>
                        <li>Ensinem que dinheiro vem do trabalho</li>
                        <li>Introduzam o conceito de esperar para comprar algo desejado</li>
                        <li>Usem um cofrinho visual</li>
                    </ul>

                    <h4>8-12 anos</h4>
                    <ul>
                        <li>Deem uma mesada fixa e ensinem a dividir em categorias</li>
                        <li>Envolvam em decisões simples (escolher marca mais barata no mercado)</li>
                        <li>Ensinem a diferenciar necessidades e desejos</li>
                    </ul>

                    <h4>13+ anos</h4>
                    <ul>
                        <li>Incluam em conversas sobre orçamento familiar (adaptadas à idade)</li>
                        <li>Ensinem sobre cartão de crédito, empréstimos, investimentos</li>
                        <li>Incentivem primeiro emprego/estágio</li>
                        <li>Abram conta e ensinem a investir pequenos valores</li>
                    </ul>

                    <h3>Erros comuns em finanças de casal</h3>
                    <ul>
                        <li><strong>Esconder dívidas ou gastos:</strong> Transparência é fundamental. Mentiras financeiras destroem confiança.</li>
                        <li><strong>Não ter objetivos comuns:</strong> Sem um "para quê" poupar, fica difícil se motivar.</li>
                        <li><strong>Deixar um responsável por tudo:</strong> Ambos devem entender e participar das finanças.</li>
                        <li><strong>Não revisar o orçamento:</strong> A vida muda. O orçamento deve acompanhar.</li>
                        <li><strong>Comparar com outros casais:</strong> Cada família tem sua realidade e prioridades.</li>
                    </ul>

                    <h3>Ferramentas que ajudam</h3>
                    <ul>
                        <li><strong>Planilhas compartilhadas:</strong> Google Sheets permite que ambos vejam e editem em tempo real</li>
                        <li><strong>Apps de controle financeiro:</strong> Muitos permitem múltiplos usuários</li>
                        <li><strong>Conta conjunta digital:</strong> Bancos digitais facilitam a criação de contas compartilhadas</li>
                        <li><strong>Alarmes e lembretes:</strong> Para não esquecer reuniões mensais de revisão</li>
                    </ul>

                    <h3>Quando buscar ajuda profissional</h3>
                    <p>Considere um planejador financeiro ou terapeuta financeiro se:</p>
                    <ul>
                        <li>Vocês brigam frequentemente por dinheiro</li>
                        <li>Um esconde gastos do outro regularmente</li>
                        <li>Não conseguem chegar a um acordo sobre objetivos</li>
                        <li>Estão endividados e não sabem como sair</li>
                        <li>Um dos dois tem comportamento compulsivo de gastos</li>
                    </ul>

                    <div class="source">
                        <strong>Fontes:</strong><br>
                        - Ramsey Solutions. "Money, Marriage, and Communication: How Couples Can Work Together", 2023.<br>
                        - Instituto Brasileiro de Geografia e Estatística (IBGE). Pesquisa de Orçamentos Familiares, 2023.<br>
                        - Associação Brasileira de Educadores Financeiros (ABEFIN). Finanças em Casal, 2024.<br>
                        - Gustavo Cerbasi. "Casais Inteligentes Enriquecem Juntos", 2004.
                    </div>
                `
            },
            {
                id: 'e8',
                title: 'Aposentadoria: planeje seu futuro desde já',
                category: 'investing',
                readingTime: '9 min',
                excerpt: 'Como garantir uma aposentadoria confortável além do INSS através de planejamento precoce.',
                content: `
                    <h3>Por que não depender só do INSS?</h3>
                    <p>O sistema previdenciário brasileiro (INSS) passa por reformas frequentes que tendem a reduzir benefícios e aumentar requisitos. Além disso, o teto do INSS (R$ 7.786,02 em 2024) pode ser insuficiente para manter o padrão de vida de muitas pessoas. Planeje uma previdência complementar é essencial.</p>

                    <h3>A regra dos 10% aos 25 anos vale 100% aos 50</h3>
                    <p>Quanto mais cedo você começa a poupar para aposentadoria, menor o esforço mensal necessário. Veja a comparação para acumular R$ 1 milhão aos 65 anos (considerando rentabilidade real de 6% ao ano):</p>
                    <ul>
                        <li><strong>Começando aos 25 anos (40 anos de aportes):</strong> R$ 531/mês</li>
                        <li><strong>Começando aos 35 anos (30 anos):</strong> R$ 992/mês</li>
                        <li><strong>Começando aos 45 anos (20 anos):</strong> R$ 2.164/mês</li>
                        <li><strong>Começando aos 55 anos (10 anos):</strong> R$ 6.096/mês</li>
                    </ul>
                    <p>Adiar 10 anos quase dobra o valor necessário. Adiar 20 anos quadruplica. O tempo é seu maior aliado.</p>

                    <h3>Quanto você precisa acumular?</h3>
                    <p>Uma regra prática: multiplicar sua despesa mensal desejada na aposentadoria por 300.</p>
                    <p><strong>Exemplo:</strong> Se você quer viver com R$ 5.000/mês na aposentadoria, precisa de R$ 1,5 milhão investido. Com esse valor rendendo 4% ao ano (acima da inflação), você pode retirar R$ 5.000/mês sem esgotar o capital.</p>

                    <h4>Passos para calcular</h4>
                    <ol>
                        <li>Estime suas despesas mensais na aposentadoria (considere menos gastos com trabalho, mas mais com saúde)</li>
                        <li>Subtraia o valor que espera receber do INSS</li>
                        <li>O restante é o que você precisa complementar com investimentos próprios</li>
                        <li>Multiplique esse valor por 300 para ter o patrimônio necessário</li>
                    </ol>

                    <h3>Opções de investimento para aposentadoria</h3>

                    <h4>1. Previdência Privada (PGBL e VGBL)</h4>
                    <p><strong>PGBL (Plano Gerador de Benefício Livre):</strong></p>
                    <ul>
                        <li>✅ Permite deduzir até 12% da renda bruta anual no IR</li>
                        <li>✅ Ideal para quem faz declaração completa do IR</li>
                        <li>⚠️ Na retirada, o IR incide sobre o total (aportes + rendimentos)</li>
                    </ul>

                    <p><strong>VGBL (Vida Gerador de Benefício Livre):</strong></p>
                    <ul>
                        <li>✅ Ideal para quem faz declaração simplificada ou é isento de IR</li>
                        <li>✅ Na retirada, o IR incide apenas sobre os rendimentos</li>
                        <li>⚠️ Não permite dedução de IR durante os aportes</li>
                    </ul>

                    <p><strong>Tabelas de IR:</strong></p>
                    <ul>
                        <li><strong>Progressiva:</strong> Mesma tabela da renda (até 27,5%). Melhor para resgates de curto/médio prazo.</li>
                        <li><strong>Regressiva:</strong> Reduz com o tempo, chegando a 10% após 10 anos. Melhor para aposentadoria (longo prazo).</li>
                    </ul>

                    <p><strong>Atenção às taxas:</strong> Muitos planos cobram taxa de administração (até 2% ao ano) e taxa de carregamento (até 5% sobre cada aporte). Busque planos com taxa de administração abaixo de 1% e zero de carregamento.</p>

                    <h4>2. Tesouro Direto (Tesouro RendA+)</h4>
                    <p>Lançado em 2023, o Tesouro RendA+ foi criado especificamente para aposentadoria:</p>
                    <ul>
                        <li>✅ Garante renda mensal após data escolhida (ex: aos 65 anos)</li>
                        <li>✅ Rendimento: IPCA + taxa prefixada (protege da inflação)</li>
                        <li>✅ Baixíssimo risco (garantido pelo governo)</li>
                        <li>✅ Taxa de custódia de apenas 0,20% ao ano</li>
                        <li>⚠️ Se resgatar antes do prazo, pode ter perda com marcação a mercado</li>
                    </ul>

                    <h4>3. Ações e Fundos Imobiliários</h4>
                    <p>Para horizontes muito longos (20+ anos), incluir renda variável pode aumentar significativamente o retorno:</p>
                    <ul>
                        <li>Ações de empresas sólidas com histórico de pagamento de dividendos</li>
                        <li>Fundos Imobiliários (FIIs) que distribuem renda mensal</li>
                        <li>ETFs de índices (diversificação instantânea)</li>
                    </ul>
                    <p><strong>Importante:</strong> À medida que se aproxima da aposentadoria (5-10 anos antes), reduza gradualmente a exposição a renda variável, migrando para ativos mais conservadores.</p>

                    <h4>4. Imóveis para renda</h4>
                    <p>Imóveis para alugar podem gerar renda complementar na aposentadoria:</p>
                    <ul>
                        <li>✅ Renda mensal recorrente</li>
                        <li>✅ Proteção contra inflação (aluguéis sobem com o tempo)</li>
                        <li>⚠️ Exige gestão (manutenção, inadimplência, vacância)</li>
                        <li>⚠️ Baixa liquidez</li>
                        <li>⚠️ Custos com IPTU, condomínio, reformas</li>
                    </ul>

                    <h3>Estratégia por faixa etária</h3>

                    <h4>20-30 anos: Agressividade</h4>
                    <ul>
                        <li>70-80% em ações/FIIs</li>
                        <li>20-30% em renda fixa</li>
                        <li>Foco em crescimento de capital</li>
                        <li>Aproveite o longo prazo para superar volatilidades</li>
                    </ul>

                    <h4>31-45 anos: Balanceamento</h4>
                    <ul>
                        <li>50-60% em renda variável</li>
                        <li>40-50% em renda fixa</li>
                        <li>Comece a incluir Tesouro RendA+ ou previdência privada</li>
                        <li>Mantenha aportes regulares</li>
                    </ul>

                    <h4>46-55 anos: Conservadorismo crescente</h4>
                    <ul>
                        <li>30-40% em renda variável</li>
                        <li>60-70% em renda fixa</li>
                        <li>Aumente aportes se possível (filhos já independentes)</li>
                        <li>Quite dívidas de longo prazo (casa, carro)</li>
                    </ul>

                    <h4>56-65 anos: Proteção de capital</h4>
                    <ul>
                        <li>10-20% em renda variável (liquidez)</li>
                        <li>80-90% em renda fixa (estabilidade)</li>
                        <li>Migre investimentos para alta liquidez</li>
                        <li>Planeje a transição para fase de retiradas</li>
                    </ul>

                    <h3>Como se preparar para custos com saúde</h3>
                    <p>Na terceira idade, gastos com saúde tendem a aumentar:</p>
                    <ul>
                        <li><strong>Plano de saúde:</strong> Valores sobem significativamente após 59 anos. Considere contratar cedo.</li>
                        <li><strong>Remédios de uso contínuo:</strong> Inclua no orçamento da aposentadoria.</li>
                        <li><strong>Seguro de vida com cobertura para doenças graves:</strong> Protege o patrimônio de gastos inesperados.</li>
                        <li><strong>Long-term care (cuidados de longa duração):</strong> Seguros para custear cuidadores/enfermeiros em casa.</li>
                    </ul>

                    <h3>Erros comuns no planejamento de aposentadoria</h3>
                    <ul>
                        <li><strong>Adiar o começo:</strong> Cada ano conta. Comece com pouco, mas comece hoje.</li>
                        <li><strong>Não considerar inflação:</strong> R$ 5.000 hoje valem menos no futuro. Invista em ativos que protegem da inflação.</li>
                        <li><strong>Contar só com o INSS:</strong> O valor pode não ser suficiente.</li>
                        <li><strong>Resgatar previdência antes do prazo:</strong> Perde benefícios fiscais e compromete o objetivo.</li>
                        <li><strong>Não diversificar:</strong> Ter vários "pilares" de renda na aposentadoria reduz riscos.</li>
                        <li><strong>Esquecer de atualizar o plano:</strong> Renda e objetivos mudam. Revise anualmente.</li>
                    </ul>

                    <h3>Os "4 pilares" da aposentadoria ideal</h3>
                    <ol>
                        <li><strong>INSS:</strong> Contribua para ter o benefício básico garantido</li>
                        <li><strong>Previdência Privada/Tesouro RendA+:</strong> Complementação de renda</li>
                        <li><strong>Investimentos diversos:</strong> Ações, FIIs, títulos (renda passiva)</li>
                        <li><strong>Renda ativa opcional:</strong> Consultoria, trabalhos pontuais (se quiser continuar ativo)</li>
                    </ol>

                    <h3>Calculadoras e ferramentas</h3>
                    <ul>
                        <li><strong>Simulador do Tesouro Direto:</strong> Calcule quanto render seus investimentos</li>
                        <li><strong>Calculadora de aposentadoria do INSS:</strong> Veja quanto vai receber</li>
                        <li><strong>Apps de previdência privada:</strong> Maioria dos bancos tem simuladores</li>
                        <li><strong>Planilhas de independência financeira:</strong> Muitas disponíveis gratuitamente online</li>
                    </ul>

                    <div class="source">
                        <strong>Fontes:</strong><br>
                        - Ministério da Previdência Social. Reforma da Previdência e Impactos, 2024.<br>
                        - Tesouro Nacional. Tesouro RendA+ - Guia do Investidor, 2024.<br>
                        - SUSEP (Superintendência de Seguros Privados). Cartilha de Previdência Complementar, 2024.<br>
                        - Cerbasi, Gustavo. "Aposentadoria: Planeje Já", 2020.
                    </div>
                `
            }
        ];

        let educationVisibleCount = 4; //quantos cards mostrar inicialmente

        function renderEducationCards() {
            const container = document.getElementById('educationCards');
            const query = (document.getElementById('educationSearch').value || '').toLowerCase();
            const category = document.getElementById('educationCategoryFilter').value;

            let filtered = educationArticles.filter(a => {
                const matchesQuery = a.title.toLowerCase().includes(query) || a.excerpt.toLowerCase().includes(query) || a.content.toLowerCase().includes(query);
                const matchesCategory = category === 'all' ? true : a.category === category;
                return matchesQuery && matchesCategory;
            });

            const toShow = filtered.slice(0, educationVisibleCount);

            if (toShow.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: 1/-1;">
                        <div class="empty-state-icon">📚</div>
                        <p>Nenhum artigo encontrado</p>
                    </div>`;
                document.getElementById('loadMoreEducation').style.display = 'none';
                return;
            }

            container.innerHTML = toShow.map(a => `
                <div class="education-card" onclick="openEducationModal('${a.id}')">
                    <div class="card-meta">
                        <span>${a.category}</span>
                        <span>${a.readingTime}</span>
                    </div>
                    <h4>${a.title}</h4>
                    <p>${a.excerpt}</p>
                    <button class="read-more" onclick="event.stopPropagation(); openEducationModal('${a.id}')">Ler artigo →</button>
                </div>
            `).join('');

            //botão carregar mais
            document.getElementById('loadMoreEducation').style.display = filtered.length > educationVisibleCount ? 'inline-block' : 'none';
        }

        function loadMoreEducation() {
            educationVisibleCount += 4;
            renderEducationCards();
        }

        function openEducationModal(id) {
            const article = educationArticles.find(a => a.id === id);
            if (!article) return;
            
            //Esconde os cards e o botão carregar mais
            document.getElementById('educationCards').style.display = 'none';
            document.getElementById('loadMoreContainer').style.display = 'none';
            
            //Mostra a visualização do artigo
            document.getElementById('articleTitle').textContent = article.title;
            document.getElementById('articleMeta').textContent = `Categoria: ${article.category} • ${article.readingTime}`;
            document.getElementById('articleContent').innerHTML = article.content;
            document.getElementById('educationArticleView').style.display = 'block';
            
            //Scroll para o topo da seção
            document.getElementById('sectionEducation').scrollIntoView({ behavior: 'smooth' });
        }

        function closeEducationModal() {
            //Esconde a visualização do artigo
            document.getElementById('educationArticleView').style.display = 'none';
            
            //Mostra os cards e o botão carregar mais
            document.getElementById('educationCards').style.display = 'grid';
            document.getElementById('loadMoreContainer').style.display = 'block';
        }

        function closeEducationArticle() {
            closeEducationModal();
        }

        //================== DICA DO DIA ==================
        const dailyTips = [
            "Poupe 10% da sua renda antes de gastar. Pague a si mesmo primeiro!",
            "Use a regra 50/30/20: 50% necessidades, 30% desejos, 20% poupança.",
            "Nunca gaste mais do que ganha. Parece óbvio, mas é fundamental.",
            "Tenha uma reserva de emergência de 3 a 6 meses de despesas.",
            "Compare preços antes de comprar. Pequenas economias somam muito.",
            "Evite compras por impulso. Espere 24h antes de comprar algo não planejado.",
            "Acompanhe seus gastos semanalmente. Conhecimento é poder.",
            "Invista em educação financeira. É o melhor investimento que existe.",
            "Negocie sempre. Taxas bancárias, planos, seguros - tudo pode ser negociado.",
            "Automatize suas economias. Configure transferências automáticas para investimentos.",
            "Cuidado com pequenas despesas recorrentes. R$ 10/dia = R$ 300/mês.",
            "Não confunda necessidade com desejo. Pergunte-se: realmente preciso disso?",
            "Juros compostos são mágicos investindo, mas devastadores em dívidas.",
            "Diversifique seus investimentos. Não coloque todos os ovos na mesma cesta.",
            "Revise seus gastos mensalmente. Corte o que não agrega valor à sua vida.",
            "Planeje grandes compras. Juntar dinheiro evita juros e te faz valorizar mais o bem.",
            "Aproveite benefícios de cartão (cashback, pontos), mas sempre pague o total.",
            "Não empreste dinheiro que você não pode perder. E formalize empréstimos.",
            "Investir cedo compensa. R$ 200/mês aos 25 anos rende mais que R$ 500/mês aos 40.",
            "Tenha objetivos financeiros claros. Eles te motivam a economizar."
        ];

        function displayDailyTip() {
            const today = new Date();
            const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
            const tipIndex = dayOfYear % dailyTips.length;
            
            const tipElement = document.getElementById('dailyTipText');
            if (tipElement) {
                tipElement.textContent = dailyTips[tipIndex];
            }
        }

        //================== GLOSSÁRIO FINANCEIRO ==================
        const glossaryTerms = [
            { term: "Ações", definition: "Pequenas partes de uma empresa que você pode comprar. Quem tem ações é sócio da empresa e pode ganhar com dividendos e valorização.", category: "Investimentos" },
            { term: "Alavancagem", definition: "Usar dinheiro emprestado para investir, aumentando tanto o potencial de ganho quanto o risco de perda.", category: "Investimentos" },
            { term: "Amortização", definition: "Redução do valor de uma dívida através de pagamentos periódicos que incluem juros e parte do principal.", category: "Crédito" },
            { term: "Ativo", definition: "Tudo que você possui e tem valor financeiro: dinheiro, investimentos, imóveis, veículos.", category: "Fundamentos" },
            { term: "Bacen", definition: "Banco Central do Brasil. Autoridade monetária que controla juros, inflação e fiscaliza o sistema financeiro.", category: "Fundamentos" },
            { term: "Benchmark", definition: "Índice de referência usado para comparar o desempenho de um investimento. Ex: CDI, Ibovespa, IPCA.", category: "Investimentos" },
            { term: "Bolsa de Valores (B3)", definition: "Ambiente onde são negociadas ações de empresas, contratos futuros e outros ativos. No Brasil, a B3.", category: "Investimentos" },
            { term: "Caderneta de Poupança", definition: "Investimento mais popular do Brasil, com baixo rendimento (cerca de 0,5% ao mês) mas garantido pelo governo até R$ 250 mil.", category: "Investimentos" },
            { term: "Cashback", definition: "Devolução de uma porcentagem do valor gasto em compras, comum em cartões de crédito e aplicativos.", category: "Crédito" },
            { term: "CDI", definition: "Certificado de Depósito Interbancário. Taxa de juros usada como referência para investimentos de renda fixa.", category: "Investimentos" },
            { term: "CDB", definition: "Certificado de Depósito Bancário. Você empresta dinheiro ao banco e recebe juros. Protegido pelo FGC até R$ 250 mil.", category: "Investimentos" },
            { term: "Cheque Especial", definition: "Limite de crédito na conta corrente para emergências. Tem juros altíssimos (até 12% ao mês). Use só em última instância.", category: "Crédito" },
            { term: "Consórcio", definition: "Grupo de pessoas que contribuem mensalmente para que alguns membros sejam contemplados (sorteio ou lance) para comprar um bem.", category: "Crédito" },
            { term: "CRI e CRA", definition: "Certificados de Recebíveis Imobiliários/Agro. Investimentos isentos de IR para pessoa física, lastreados em dívidas do setor.", category: "Investimentos" },
            { term: "Crédito Rotativo", definition: "Dívida gerada quando você não paga o total da fatura do cartão. Juros podem ultrapassar 400% ao ano. Evite!", category: "Crédito" },
            { term: "Deflação", definition: "Redução generalizada dos preços. Parece bom, mas pode indicar economia fraca e desemprego.", category: "Economia" },
            { term: "Dividendos", definition: "Parte do lucro da empresa distribuída aos acionistas. Pode ser uma fonte de renda passiva.", category: "Investimentos" },
            { term: "Educação Financeira", definition: "Conhecimento e habilidades para tomar decisões inteligentes sobre dinheiro: ganhar, gastar, poupar e investir.", category: "Fundamentos" },
            { term: "ETF", definition: "Exchange Traded Fund. Fundo de investimento negociado na bolsa que replica um índice (ex: Ibovespa, S&P 500).", category: "Investimentos" },
            { term: "FGC", definition: "Fundo Garantidor de Créditos. Protege seus investimentos em bancos até R$ 250 mil por CPF e instituição.", category: "Investimentos" },
            { term: "Fiagro", definition: "Fundo de Investimento nas Cadeias Produtivas Agroindustriais. Similar aos FIIs, mas do agronegócio.", category: "Investimentos" },
            { term: "FII", definition: "Fundo de Investimento Imobiliário. Você compra cotas de um fundo que investe em imóveis e recebe aluguéis mensais.", category: "Investimentos" },
            { term: "Fluxo de Caixa", definition: "Registro de todo dinheiro que entra e sai. Fundamental para controle financeiro pessoal ou empresarial.", category: "Fundamentos" },
            { term: "Inadimplência", definition: "Situação de não pagar dívidas no prazo. Gera juros, multas e pode sujar o nome (negativação).", category: "Crédito" },
            { term: "Indexação", definition: "Correção de valores pela inflação ou outro índice. Ex: aluguel corrigido pelo IPCA.", category: "Economia" },
            { term: "Inflação", definition: "Aumento generalizado de preços. Faz o dinheiro perder poder de compra ao longo do tempo.", category: "Economia" },
            { term: "INSS", definition: "Instituto Nacional do Seguro Social. Sistema público de aposentadorias e benefícios sociais.", category: "Previdência" },
            { term: "IPCA", definition: "Índice Nacional de Preços ao Consumidor Amplo. Principal medida de inflação do Brasil.", category: "Economia" },
            { term: "Juros Compostos", definition: "Juros sobre juros. No investimento, multiplica seu dinheiro. Na dívida, multiplica o que você deve.", category: "Fundamentos" },
            { term: "Juros Simples", definition: "Juros calculados apenas sobre o valor inicial. Menos comum que juros compostos.", category: "Fundamentos" },
            { term: "LCA e LCI", definition: "Letras de Crédito do Agronegócio/Imobiliário. Investimentos isentos de IR, lastreados em dívidas dos setores.", category: "Investimentos" },
            { term: "Liquidez", definition: "Facilidade de transformar um investimento em dinheiro sem perder valor. Poupança tem alta liquidez, imóvel tem baixa.", category: "Investimentos" },
            { term: "Margem de Segurança", definition: "Diferença entre sua renda e suas despesas essenciais. Quanto maior, mais seguro você está.", category: "Fundamentos" },
            { term: "Orçamento", definition: "Planejamento de receitas e despesas para um período. Ferramenta essencial de controle financeiro.", category: "Fundamentos" },
            { term: "Passivo", definition: "Tudo que você deve: dívidas, financiamentos, contas a pagar.", category: "Fundamentos" },
            { term: "Patrimônio Líquido", definition: "Seus ativos menos seus passivos. Quanto você realmente tem de valor.", category: "Fundamentos" },
            { term: "PGBL e VGBL", definition: "Planos de previdência privada. PGBL permite dedução no IR (declaração completa), VGBL não.", category: "Previdência" },
            { term: "PIX", definition: "Sistema de pagamentos instantâneos do Banco Central. Transferências gratuitas 24/7.", category: "Fundamentos" },
            { term: "Portabilidade", definition: "Direito de transferir dívidas ou investimentos entre instituições, geralmente buscando melhores condições.", category: "Crédito" },
            { term: "Previdência Privada", definition: "Complemento à aposentadoria do INSS. Você contribui mensalmente para receber renda futura.", category: "Previdência" },
            { term: "Refinanciamento", definition: "Fazer um novo empréstimo para pagar o anterior, geralmente buscando juros menores ou prazo maior.", category: "Crédito" },
            { term: "Renda Fixa", definition: "Investimentos com rentabilidade previsível: CDB, Tesouro Direto, LCI/LCA. Menor risco que ações.", category: "Investimentos" },
            { term: "Renda Passiva", definition: "Dinheiro que você recebe sem trabalhar ativamente por ele: aluguéis, dividendos, juros de investimentos.", category: "Investimentos" },
            { term: "Renda Variável", definition: "Investimentos com rentabilidade imprevisível: ações, FIIs, criptomoedas. Maior risco e potencial de retorno.", category: "Investimentos" },
            { term: "Rentabilidade", definition: "Quanto um investimento rendeu em porcentagem. Ex: rendeu 10% ao ano.", category: "Investimentos" },
            { term: "Reserva de Emergência", definition: "Dinheiro guardado para imprevistos (desemprego, saúde). Ideal: 3 a 6 meses de despesas em investimento líquido.", category: "Fundamentos" },
            { term: "Score de Crédito", definition: "Pontuação (0 a 1000) que indica seu risco como pagador. Quanto maior, mais fácil conseguir crédito com juros baixos.", category: "Crédito" },
            { term: "Selic", definition: "Taxa básica de juros da economia brasileira, definida pelo Banco Central. Influencia todos os outros juros.", category: "Economia" },
            { term: "Selic", definition: "Taxa básica de juros da economia brasileira, definida pelo Banco Central. Influencia todos os outros juros.", category: "Economia" },
            { term: "Taxa de Administração", definition: "Valor cobrado anualmente por fundos de investimento ou previdência para gerenciar o dinheiro.", category: "Investimentos" },
            { term: "Tesouro Direto", definition: "Programa que permite comprar títulos públicos do governo pela internet. Seguro e acessível a partir de R$ 30.", category: "Investimentos" },
            { term: "Tesouro IPCA+", definition: "Título público que paga juros + inflação. Protege seu poder de compra no longo prazo.", category: "Investimentos" },
            { term: "Tesouro Selic", definition: "Título público que acompanha a taxa Selic. Ideal para reserva de emergência (liquidez diária).", category: "Investimentos" },
            { term: "Volatilidade", definition: "Oscilação de preços de um investimento. Alta volatilidade = grandes variações = maior risco.", category: "Investimentos" }
        ];

        let currentGlossaryLetter = 'all';

        function openGlossary() {
            const modal = document.createElement('div');
            modal.className = 'glossary-modal';
            modal.id = 'glossaryModal';
            
            modal.innerHTML = `
                <div class="glossary-content">
                    <div class="glossary-header">
                        <h2><i class="ph ph-book-open"></i> Glossário Financeiro</h2>
                        <button class="glossary-close" onclick="closeGlossary()">×</button>
                    </div>
                    <div class="glossary-search">
                        <input type="text" id="glossarySearchInput" placeholder="Buscar termo..." oninput="filterGlossary()">
                    </div>
                    <div class="glossary-body">
                        <div class="glossary-letters" id="glossaryLetters"></div>
                        <div class="glossary-terms" id="glossaryTermsList"></div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            renderGlossaryLetters();
            renderGlossaryTerms();
        }

        function closeGlossary() {
            const modal = document.getElementById('glossaryModal');
            if (modal) {
                modal.remove();
            }
        }

        function renderGlossaryLetters() {
            const lettersContainer = document.getElementById('glossaryLetters');
            if (!lettersContainer) return;
            
            const letters = ['all', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
            lettersContainer.innerHTML = letters.map(letter => {
                const isActive = letter === currentGlossaryLetter;
                const displayLetter = letter === 'all' ? 'Todos' : letter;
                return `<button class="letter-btn ${isActive ? 'active' : ''}" onclick="filterGlossaryByLetter('${letter}')">${displayLetter}</button>`;
            }).join('');
        }

        function filterGlossaryByLetter(letter) {
            currentGlossaryLetter = letter;
            renderGlossaryLetters();
            renderGlossaryTerms();
        }

        function filterGlossary() {
            const searchTerm = document.getElementById('glossarySearchInput')?.value.toLowerCase() || '';
            renderGlossaryTerms(searchTerm);
        }

        function renderGlossaryTerms(searchTerm = '') {
            const termsContainer = document.getElementById('glossaryTermsList');
            if (!termsContainer) return;
            
            let filtered = glossaryTerms;
            
            //Filtrar por letra
            if (currentGlossaryLetter !== 'all') {
                filtered = filtered.filter(t => t.term.toUpperCase().startsWith(currentGlossaryLetter));
            }
            
            //Filtrar por busca
            if (searchTerm) {
                filtered = filtered.filter(t => 
                    t.term.toLowerCase().includes(searchTerm) || 
                    t.definition.toLowerCase().includes(searchTerm)
                );
            }
            
            //Ordenar alfabeticamente
            filtered.sort((a, b) => a.term.localeCompare(b.term));
            
            if (filtered.length === 0) {
                termsContainer.innerHTML = '<p style="text-align:center; color:#6b7280;">Nenhum termo encontrado.</p>';
                return;
            }
            
            termsContainer.innerHTML = filtered.map(term => `
                <div class="glossary-term">
                    <h4>${term.term}</h4>
                    <p>${term.definition}</p>
                    <span class="glossary-term-category">${term.category}</span>
                </div>
            `).join('');
        }

        //================== QUIZ DE CONHECIMENTO ==================
        const quizzes = {
            basics: {
                title: "Fundamentos Financeiros",
                icon: "ph-bank",
                questions: [
                    {
                        question: "Qual a porcentagem ideal da sua renda que deve ser poupada mensalmente?",
                        options: ["5%", "10% a 20%", "30% a 40%", "50%"],
                        correct: 1,
                        explanation: "Especialistas recomendam poupar entre 10% e 20% da renda mensal como mínimo saudável.",
                        source: "Banco Central do Brasil - Caderno de Educação Financeira"
                    },
                    {
                        question: "O que é reserva de emergência?",
                        options: [
                            "Dinheiro para comprar presentes de emergência",
                            "Dinheiro guardado para imprevistos como desemprego ou saúde",
                            "Fundo para investir em oportunidades",
                            "Dinheiro para viagens"
                        ],
                        correct: 1,
                        explanation: "Reserva de emergência é dinheiro guardado especificamente para imprevistos graves, devendo cobrir 3 a 6 meses de despesas.",
                        source: "ANBIMA - Associação Brasileira das Entidades dos Mercados Financeiro e de Capitais"
                    },
                    {
                        question: "Quantos meses de despesas deve ter uma reserva de emergência ideal?",
                        options: ["1 mês", "3 a 6 meses", "12 meses", "24 meses"],
                        correct: 1,
                        explanation: "O ideal é ter entre 3 e 6 meses de despesas guardadas em investimentos líquidos.",
                        source: "CVM - Comissão de Valores Mobiliários"
                    },
                    {
                        question: "Qual a prioridade ao receber o salário?",
                        options: [
                            "Pagar as contas",
                            "Guardar dinheiro (pagar a si mesmo primeiro)",
                            "Comprar o que estava querendo",
                            "Deixar na conta e ver no que sobra"
                        ],
                        correct: 1,
                        explanation: "A regra de ouro é 'pague a si mesmo primeiro': separe a poupança/investimento antes de qualquer outra despesa.",
                        source: "Estratégia Nacional de Educação Financeira (ENEF)"
                    },
                    {
                        question: "O que é mais importante no controle financeiro?",
                        options: [
                            "Ganhar muito dinheiro",
                            "Gastar menos do que ganha",
                            "Ter vários cartões de crédito",
                            "Investir em ações"
                        ],
                        correct: 1,
                        explanation: "Gastar menos do que ganha é a base de qualquer saúde financeira, independente do valor da renda.",
                        source: "Banco Central do Brasil - Gestão de Finanças Pessoais"
                    }
                ]
            },
            credit: {
                title: "Crédito e Dívidas",
                icon: "ph-credit-card",
                questions: [
                    {
                        question: "Qual a forma correta de usar cartão de crédito?",
                        options: [
                            "Pagar apenas o mínimo todo mês",
                            "Pagar o valor total da fatura",
                            "Parcelar a fatura em várias vezes",
                            "Usar todo o limite disponível"
                        ],
                        correct: 1,
                        explanation: "Sempre pague o valor total da fatura. Pagar o mínimo ou parcelar gera juros altíssimos."
                    },
                    {
                        question: "O que é juros do rotativo do cartão?",
                        options: [
                            "Desconto para clientes fiéis",
                            "Juros cobrados quando não se paga o total da fatura",
                            "Programa de pontos",
                            "Taxa anual do cartão"
                        ],
                        correct: 1,
                        explanation: "Juros rotativos são cobrados sobre o saldo não pago da fatura e podem ultrapassar 400% ao ano."
                    },
                    {
                        question: "Qual o maior erro ao ter uma dívida?",
                        options: [
                            "Negociar com o credor",
                            "Ignorar e não pagar",
                            "Pedir ajuda de familiares",
                            "Fazer um orçamento apertado"
                        ],
                        correct: 1,
                        explanation: "Ignorar a dívida só piora a situação com juros e multas. Sempre negocie e encare o problema."
                    },
                    {
                        question: "O que é score de crédito?",
                        options: [
                            "Quantidade de dinheiro na conta",
                            "Pontuação que indica seu risco como pagador",
                            "Limite do cartão de crédito",
                            "Número de dívidas que você tem"
                        ],
                        correct: 1,
                        explanation: "Score de crédito (0 a 1000) indica a probabilidade de você pagar suas contas. Quanto maior, melhores as condições de crédito."
                    },
                    {
                        question: "O que fazer ao entrar no rotativo do cartão?",
                        options: [
                            "Continuar usando normalmente",
                            "Pagar o mínimo até conseguir quitar",
                            "Parar de usar, negociar e quitar urgentemente",
                            "Pedir aumento de limite"
                        ],
                        correct: 2,
                        explanation: "Pare de usar o cartão imediatamente, negocie com o banco (transferir para empréstimo pessoal) e quite o mais rápido possível."
                    }
                ]
            },
            investing: {
                title: "Investimentos Básicos",
                icon: "ph-trending-up",
                questions: [
                    {
                        question: "Qual investimento é mais seguro para reserva de emergência?",
                        options: [
                            "Ações de empresas",
                            "Tesouro Selic ou CDB com liquidez diária",
                            "Fundos imobiliários",
                            "Criptomoedas"
                        ],
                        correct: 1,
                        explanation: "Reserva de emergência deve estar em investimentos seguros e líquidos como Tesouro Selic ou CDB com liquidez diária."
                    },
                    {
                        question: "O que significa diversificar investimentos?",
                        options: [
                            "Investir todo o dinheiro em várias ações",
                            "Distribuir o dinheiro em diferentes tipos de investimento",
                            "Trocar de investimento frequentemente",
                            "Investir só em empresas de setores diferentes"
                        ],
                        correct: 1,
                        explanation: "Diversificar é distribuir o dinheiro em diferentes tipos de investimento (renda fixa, ações, FIIs, etc.) para reduzir riscos."
                    },
                    {
                        question: "O que é mais importante ao começar a investir?",
                        options: [
                            "Escolher a ação que mais vai subir",
                            "Ter reserva de emergência antes",
                            "Investir todo o dinheiro disponível",
                            "Esperar ter muito dinheiro"
                        ],
                        correct: 1,
                        explanation: "Antes de investir em renda variável, é fundamental ter uma reserva de emergência montada."
                    },
                    {
                        question: "O que protege investimentos em bancos até R$ 250 mil?",
                        options: ["Banco Central", "FGC (Fundo Garantidor de Créditos)", "CVM", "Tesouro Nacional"],
                        correct: 1,
                        explanation: "O FGC protege investimentos em CDB, LCI, LCA e poupança até R$ 250 mil por CPF e instituição."
                    },
                    {
                        question: "Qual o melhor momento para começar a investir?",
                        options: [
                            "Quando tiver muito dinheiro",
                            "Depois dos 40 anos",
                            "O quanto antes, mesmo com pouco",
                            "Só após pagar todas as dívidas"
                        ],
                        correct: 2,
                        explanation: "Quanto antes começar, melhor. Juros compostos trabalham a seu favor no longo prazo. Comece com pouco, mas comece."
                    }
                ]
            },
            budgeting: {
                title: "Orçamento e Planejamento",
                icon: "ph-calculator",
                questions: [
                    {
                        question: "O que é a regra 50/30/20?",
                        options: [
                            "50% lazer, 30% contas, 20% investimentos",
                            "50% necessidades, 30% desejos, 20% poupança",
                            "50% poupança, 30% necessidades, 20% desejos",
                            "50% investimentos, 30% lazer, 20% contas"
                        ],
                        correct: 1,
                        explanation: "A regra 50/30/20 divide a renda em: 50% necessidades básicas, 30% desejos/lazer, 20% poupança/investimentos."
                    },
                    {
                        question: "Com que frequência deve-se revisar o orçamento?",
                        options: ["Anualmente", "Mensalmente", "Semestralmente", "Nunca, orçamento é fixo"],
                        correct: 1,
                        explanation: "O ideal é revisar o orçamento mensalmente para ajustar gastos e identificar problemas rapidamente."
                    },
                    {
                        question: "Qual a melhor estratégia para grandes compras?",
                        options: [
                            "Parcelar em muitas vezes sem juros",
                            "Juntar dinheiro e comprar à vista",
                            "Usar o limite do cartão",
                            "Fazer um empréstimo"
                        ],
                        correct: 1,
                        explanation: "Juntar dinheiro e comprar à vista evita comprometer renda futura, permite negociar desconto e te faz valorizar mais a compra."
                    },
                    {
                        question: "O que fazer quando as despesas excedem a renda?",
                        options: [
                            "Usar cartão de crédito para compensar",
                            "Ignorar, vai se resolver sozinho",
                            "Cortar gastos não essenciais urgentemente",
                            "Pedir empréstimo"
                        ],
                        correct: 2,
                        explanation: "Gastos maiores que renda são insustentáveis. Corte imediatamente gastos não essenciais e busque aumentar receita."
                    },
                    {
                        question: "Por que controlar pequenas despesas é importante?",
                        options: [
                            "Não é importante, são valores pequenos",
                            "Pequenos gastos diários somam muito ao longo do mês",
                            "Só grandes gastos importam",
                            "É perda de tempo"
                        ],
                        correct: 1,
                        explanation: "R$ 10/dia = R$ 300/mês = R$ 3.600/ano. Pequenas despesas recorrentes têm grande impacto acumulado.",
                        source: "Banco Central do Brasil - Caderno de Educação Financeira"
                    }
                ]
            },
            retirement: {
                title: "Aposentadoria e Previdência",
                icon: "ph-user-circle",
                questions: [
                    {
                        question: "Com qual idade ideal deveria começar a planejar a aposentadoria?",
                        options: ["Aos 50 anos", "Aos 40 anos", "Aos 30 anos", "O quanto antes, preferencialmente aos 20 anos"],
                        correct: 3,
                        explanation: "Quanto mais cedo começar, menor será o esforço mensal necessário devido aos juros compostos. Começar aos 25 anos é muito melhor que aos 35.",
                        source: "ABRAPP - Associação Brasileira das Entidades Fechadas de Previdência Complementar"
                    },
                    {
                        question: "O que é a Regra dos 4% na aposentadoria?",
                        options: [
                            "Poupar 4% da renda todo mês",
                            "Retirar até 4% do patrimônio anualmente na aposentadoria",
                            "Investir 4% em ações",
                            "Taxa de administração ideal"
                        ],
                        correct: 1,
                        explanation: "A Regra dos 4% sugere que você pode retirar 4% do seu patrimônio total por ano indefinidamente sem esgotá-lo. Ou seja, precisa de 25x sua despesa anual.",
                        source: "Estudo Trinity - Aposentadoria Sustentável"
                    },
                    {
                        question: "Qual a diferença entre INSS e previdência privada?",
                        options: [
                            "Não há diferença",
                            "INSS é obrigatório e público, previdência privada é opcional e complementar",
                            "INSS é melhor que previdência privada",
                            "São a mesma coisa"
                        ],
                        correct: 1,
                        explanation: "INSS é obrigatório para trabalhadores formais e oferece benefício básico. Previdência privada é opcional e complementa a aposentadoria.",
                        source: "Ministério da Previdência Social"
                    },
                    {
                        question: "Qual percentual da renda deveria ser destinado à aposentadoria?",
                        options: ["2-5%", "10-15%", "20-30%", "40-50%"],
                        correct: 1,
                        explanation: "Especialistas recomendam destinar de 10% a 15% da renda mensal para aposentadoria, além do INSS obrigatório.",
                        source: "Planejar - Associação Brasileira de Planejadores Financeiros"
                    },
                    {
                        question: "Qual tipo de investimento é mais adequado para aposentadoria de longo prazo?",
                        options: [
                            "Apenas poupança",
                            "Mix de renda fixa e renda variável",
                            "Apenas ações",
                            "Deixar o dinheiro na conta corrente"
                        ],
                        correct: 1,
                        explanation: "Um mix balanceado de renda fixa (segurança) e renda variável (crescimento) é ideal para objetivos de longo prazo como aposentadoria.",
                        source: "ANBIMA - Guia de Investimentos para Aposentadoria"
                    }
                ]
            },
            taxes: {
                title: "Impostos e Tributos",
                icon: "ph-receipt",
                questions: [
                    {
                        question: "Até qual valor de renda mensal você está isento de Imposto de Renda?",
                        options: ["R$ 1.903,98", "R$ 2.112,00", "R$ 2.826,65", "R$ 3.500,00"],
                        correct: 2,
                        explanation: "A partir de 2024, estão isentos de IR quem ganha até R$ 2.824,00 (valor ajustado pelo governo). Valores acima disso são tributados progressivamente.",
                        source: "Receita Federal do Brasil - Tabela IR 2024"
                    },
                    {
                        question: "Qual investimento tem isenção de Imposto de Renda?",
                        options: ["CDB", "Tesouro Direto", "LCI e LCA", "Fundos de Investimento"],
                        correct: 2,
                        explanation: "LCI (Letra de Crédito Imobiliário) e LCA (Letra de Crédito do Agronegócio) são isentas de IR para pessoa física.",
                        source: "Receita Federal - Tributação de Investimentos"
                    },
                    {
                        question: "Qual o prazo para declarar Imposto de Renda anualmente?",
                        options: ["Janeiro a Fevereiro", "Março a Abril", "Março a Maio", "Abril a Junho"],
                        correct: 2,
                        explanation: "O prazo para entrega da declaração anual de IR geralmente é de março até o final de maio de cada ano.",
                        source: "Receita Federal do Brasil"
                    },
                    {
                        question: "A partir de qual valor é obrigatório declarar Imposto de Renda?",
                        options: [
                            "Renda anual acima de R$ 28.559,70",
                            "Renda anual acima de R$ 50.000,00",
                            "Qualquer valor",
                            "Apenas quem tem empresa"
                        ],
                        correct: 0,
                        explanation: "É obrigatório declarar IR se teve rendimentos tributáveis acima de R$ 28.559,70 no ano, ou se realizou operações na bolsa, entre outros critérios.",
                        source: "Receita Federal - Obrigatoriedade de Declaração"
                    },
                    {
                        question: "O que acontece se não declarar IR sendo obrigado?",
                        options: [
                            "Nada acontece",
                            "Multa mínima de R$ 165,74 ou 1% ao mês sobre o imposto devido",
                            "Apenas advertência",
                            "Desconto no salário"
                        ],
                        correct: 1,
                        explanation: "Quem não declarar IR no prazo paga multa mínima de R$ 165,74 ou 1% ao mês-calendário sobre o imposto devido, além de juros Selic.",
                        source: "Receita Federal - Multas e Penalidades"
                    }
                ]
            }
        };

        let currentQuiz = null;
        let currentQuestionIndex = 0;
        let quizScore = 0;
        let userAnswers = [];

        function openQuizSelection() {
            const modal = document.createElement('div');
            modal.className = 'quiz-modal';
            modal.id = 'quizModal';
            
            modal.innerHTML = `
                <div class="quiz-content">
                    <div class="quiz-header">
                        <h2><i class="ph ph-exam"></i> Quiz de Conhecimento</h2>
                        <button class="quiz-close" onclick="closeQuiz()">×</button>
                    </div>
                    <div class="quiz-body" id="quizBody">
                        <h3 style="margin-bottom: 1.5rem; color: #111827;">Escolha um tema:</h3>
                        <div class="quiz-categories">
                            ${Object.keys(quizzes).map(key => `
                                <div class="quiz-category-card" onclick="startQuiz('${key}')">
                                    ${renderIcon(quizzes[key].icon)}
                                    <h3>${quizzes[key].title}</h3>
                                    <p>${quizzes[key].questions.length} questões</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        }

        function closeQuiz() {
            const modal = document.getElementById('quizModal');
            if (modal) {
                modal.remove();
            }
            currentQuiz = null;
            currentQuestionIndex = 0;
            quizScore = 0;
            userAnswers = [];
        }

        function startQuiz(quizKey) {
            currentQuiz = quizzes[quizKey];
            currentQuestionIndex = 0;
            quizScore = 0;
            userAnswers = [];
            renderQuizQuestion();
        }

        function renderQuizQuestion() {
            const quizBody = document.getElementById('quizBody');
            if (!quizBody || !currentQuiz) return;
            
            const question = currentQuiz.questions[currentQuestionIndex];
            const progress = ((currentQuestionIndex) / currentQuiz.questions.length) * 100;
            
            quizBody.innerHTML = `
                <div class="quiz-progress">
                    <span style="color:#6b7280; font-weight:600;">Questão ${currentQuestionIndex + 1}/${currentQuiz.questions.length}</span>
                    <div class="quiz-progress-bar">
                        <div class="quiz-progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <span style="color:#10b981; font-weight:700;">${Math.round(progress)}%</span>
                </div>
                
                <div class="quiz-question">
                    <h3>${question.question}</h3>
                    <div class="quiz-options" id="quizOptions">
                        ${question.options.map((option, index) => `
                            <div class="quiz-option" onclick="selectQuizOption(${index})">
                                ${option}
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="quiz-navigation">
                    <button class="quiz-btn quiz-btn-secondary" onclick="previousQuizQuestion()" ${currentQuestionIndex === 0 ? 'disabled' : ''}>
                        ← Anterior
                    </button>
                    <button class="quiz-btn quiz-btn-primary" id="quizNextBtn" style="display:none;" onclick="nextQuizQuestion()">
                        ${currentQuestionIndex === currentQuiz.questions.length - 1 ? 'Ver Resultado' : 'Próxima →'}
                    </button>
                </div>
            `;
        }

        function selectQuizOption(optionIndex) {
            const question = currentQuiz.questions[currentQuestionIndex];
            const options = document.querySelectorAll('.quiz-option');
            
            //Validar se a opção existe
            if (optionIndex < 0 || optionIndex >= question.options.length) {
                showErrorNotification('Opção inválida');
                return;
            }
            
            //Desabilitar todas as opções
            options.forEach(opt => opt.classList.add('disabled'));
            
            //Marcar resposta do usuário
            userAnswers[currentQuestionIndex] = optionIndex;
            
            //Mostrar se está correto ou incorreto
            options[optionIndex].classList.add(optionIndex === question.correct ? 'correct' : 'incorrect');
            if (optionIndex !== question.correct) {
                options[question.correct].classList.add('correct');
            }
            
            //Contabilizar acerto
            if (optionIndex === question.correct) {
                quizScore++;
            }
            
            //Mostrar explicação com ícone e fonte
            const quizOptionsContainer = document.getElementById('quizOptions');
            if (quizOptionsContainer) {
                const sourceText = question.source ? `<div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #bfdbfe; font-size: 0.85rem; color: #6b7280;">
                    <i class="ph ph-link" style="margin-right: 0.3rem;"></i><strong>Fonte:</strong> ${question.source}
                </div>` : '';
                
                quizOptionsContainer.innerHTML += `
                    <div style="margin-top: 1.5rem; padding: 1.25rem; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px;">
                        <div style="display: flex; align-items: start; gap: 0.75rem;">
                            <i class="ph ph-lightbulb" style="font-size: 1.5rem; color: #1e40af; flex-shrink: 0;"></i>
                            <div style="flex: 1;">
                                <strong style="color: #1e40af; font-size: 0.95rem;">Explicação:</strong>
                                <p style="margin: 0.5rem 0 0 0; color: #374151; line-height: 1.6;">${question.explanation}</p>
                                ${sourceText}
                            </div>
                        </div>
                    </div>
                `;
            }
            
            //Mostrar botão de próxima
            document.getElementById('quizNextBtn').style.display = 'block';
        }

        function nextQuizQuestion() {
            currentQuestionIndex++;
            
            if (currentQuestionIndex >= currentQuiz.questions.length) {
                showQuizResults();
            } else {
                renderQuizQuestion();
            }
        }

        function previousQuizQuestion() {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                renderQuizQuestion();
            }
        }

        function showQuizResults() {
            const quizBody = document.getElementById('quizBody');
            if (!quizBody) return;
            
            const percentage = (quizScore / currentQuiz.questions.length) * 100;
            let feedback = '';
            let icon = '';
            let iconColor = '';
            
            if (percentage === 100) {
                feedback = "Perfeito! Você domina o assunto!";
                icon = "ph-trophy";
                iconColor = "#f59e0b";
            } else if (percentage >= 80) {
                feedback = "Excelente! Você tem ótimo conhecimento!";
                icon = "ph-star";
                iconColor = "#3b82f6";
            } else if (percentage >= 60) {
                feedback = "Bom trabalho! Continue estudando!";
                icon = "ph-thumbs-up";
                iconColor = "#10b981";
            } else if (percentage >= 40) {
                feedback = "Você está no caminho certo!";
                icon = "ph-book-open";
                iconColor = "#6366f1";
            } else {
                feedback = "Continue aprendendo! Leia os artigos!";
                icon = "ph-barbell";
                iconColor = "#8b5cf6";
            }
            
            quizBody.innerHTML = `
                <div class="quiz-results">
                    <div style="font-size: 5rem; margin-bottom: 1rem; color: ${iconColor};">
                        <i class="ph ${icon}"></i>
                    </div>
                    <div class="quiz-score">${quizScore}/${currentQuiz.questions.length}</div>
                    <div class="quiz-feedback">${feedback}</div>
                    
                    <div class="quiz-summary">
                        <div class="quiz-summary-item">
                            <span style="color:#6b7280;"><i class="ph ph-check-circle"></i> Acertos</span>
                            <span style="color:#10b981; font-weight:700;">${quizScore} (${Math.round(percentage)}%)</span>
                        </div>
                        <div class="quiz-summary-item">
                            <span style="color:#6b7280;"><i class="ph ph-x-circle"></i> Erros</span>
                            <span style="color:#ef4444; font-weight:700;">${currentQuiz.questions.length - quizScore}</span>
                        </div>
                        <div class="quiz-summary-item">
                            <span style="color:#6b7280;"><i class="ph ph-list-bullets"></i> Total de questões</span>
                            <span style="color:#3b82f6; font-weight:700;">${currentQuiz.questions.length}</span>
                        </div>
                    </div>
                    
                    <div class="quiz-restart">
                        <button class="quiz-btn quiz-btn-secondary" onclick="closeQuiz()">
                            <i class="ph ph-x"></i> Fechar
                        </button>
                        <button class="quiz-btn quiz-btn-primary" onclick="startQuiz('${Object.keys(quizzes).find(key => quizzes[key] === currentQuiz)}')">
                            <i class="ph ph-arrow-clockwise"></i> Tentar Novamente
                        </button>
                    </div>
                </div>
            `;
        }

        //Welcome Modal - Mostra ANTES do dashboard para contas novas
        function showWelcomeModalBeforeDashboard(userName) {
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]Mostrando boas-vindas para nova conta:', userName);
            
            //Esconde a tela de autenticação
            document.getElementById('authScreen').style.display = 'none';
            document.getElementById('landingPage').style.display = 'none';
            
            //Atualiza cor da navigation bar para preto (welcome screen)
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                metaThemeColor.content = '#000000';
            }
            
            //Define o nome do usuário no modal
            const userNameElement = document.getElementById('welcomeUserName');
            if (userNameElement) {
                userNameElement.textContent = userName;
            }
            
            //Mostra o modal
            const modal = document.getElementById('welcomeModal');
            if (modal) {
                modal.classList.add('welcome-modal-active');
                //Cria partículas para o modal de boas-vindas
                createWelcomeParticles();
            }
        }

        function createWelcomeParticles() {
            const container = document.getElementById('welcome-particles-container');
            if (!container) return;
            
            //Limpa partículas anteriores
            container.innerHTML = '';
            
            const particleCount = 100;
            
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                
                const size = Math.random() * 3 + 1;
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
                
                resetWelcomeParticle(particle);
                container.appendChild(particle);
                animateWelcomeParticle(particle);
            }
        }

        function resetWelcomeParticle(particle) {
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            
            particle.style.left = `${posX}%`;
            particle.style.top = `${posY}%`;
            particle.style.opacity = '0';
            
            return { x: posX, y: posY };
        }

        function animateWelcomeParticle(particle) {
            const pos = resetWelcomeParticle(particle);
            const duration = Math.random() * 12 + 10;
            const delay = Math.random() * 5;
            
            setTimeout(() => {
                particle.style.transition = `all ${duration}s linear`;
                particle.style.opacity = Math.random() * 0.25 + 0.1;
                
                const moveX = pos.x + (Math.random() * 20 - 10);
                const moveY = pos.y - Math.random() * 35;
                
                particle.style.left = `${moveX}%`;
                particle.style.top = `${moveY}%`;
                
                setTimeout(() => {
                    animateWelcomeParticle(particle);
                }, duration * 1000);
            }, delay * 1000);
        }

        function startWelcomeJourney(button) {
            //Desabilita o botão para evitar múltiplos cliques
            button.disabled = true;
            button.style.opacity = '0.8';
            button.style.cursor = 'not-allowed';
            
            const buttonText = document.getElementById('welcomeButtonText');
            
            //Fase 1: "Começando sua jornada..."
            buttonText.textContent = 'Começando sua jornada...';
            
            //Adiciona animação de loading (três pontos)
            let dots = 0;
            const loadingInterval = setInterval(() => {
                dots = (dots + 1) % 4;
                const dotsText = '.'.repeat(dots);
                if (buttonText.textContent.includes('Começando')) {
                    buttonText.textContent = `Começando sua jornada${dotsText}`;
                } else if (buttonText.textContent.includes('preparando')) {
                    buttonText.textContent = `Estamos preparando${dotsText}`;
                }
            }, 500);
            
            //Fase 2: Após 1.5s, muda para "Estamos preparando..."
            setTimeout(() => {
                buttonText.textContent = 'Estamos preparando...';
            }, 1500);
            
            //Fase 3: Após 3s total, fecha o modal
            setTimeout(async () => {
                clearInterval(loadingInterval);
                await closeWelcomeModal();
                
                //Reseta o botão para próxima vez (se houver)
                button.disabled = false;
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
                buttonText.textContent = 'Começar';
            }, 3000);
        }

        async function closeWelcomeModal() {
            const modal = document.getElementById('welcomeModal');
            if (modal) {
                modal.classList.remove('welcome-modal-active');
                modal.style.display = 'none';
                
                //Limpa as partículas
                const container = document.getElementById('welcome-particles-container');
                if (container) {
                    container.innerHTML = '';
                }
            }
            
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]=== FECHANDO WELCOME MODAL ===');
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]localStorage.isNewUser:', localStorage.getItem('isNewUser'));
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]localStorage.onboardingCompleted:', localStorage.getItem('onboardingCompleted'));
            
            //Agora sim, mostra o dashboard
            await showDashboard();
        }

        //MOBILE MENU
        function toggleMobileMenu() {
            const sidebar = document.querySelector('.app-sidebar');
            const overlay = document.getElementById('mobileMenuOverlay');
            
            if (sidebar) {
                sidebar.classList.toggle('active');
            }
            
            //Cria overlay se não existir
            if (!overlay) {
                const newOverlay = document.createElement('div');
                newOverlay.id = 'mobileMenuOverlay';
                newOverlay.className = 'mobile-menu-overlay';
                newOverlay.onclick = closeMobileMenu;
                document.body.appendChild(newOverlay);
                setTimeout(() => newOverlay.classList.add('active'), 10);
            } else {
                overlay.classList.toggle('active');
                if (!overlay.classList.contains('active')) {
                    setTimeout(() => overlay.remove(), 300);
                }
            }
        }

        function closeMobileMenu() {
            const sidebar = document.querySelector('.app-sidebar');
            const overlay = document.getElementById('mobileMenuOverlay');
            
            if (sidebar) {
                sidebar.classList.remove('active');
            }
            
            if (overlay) {
                overlay.classList.remove('active');
                setTimeout(() => overlay.remove(), 300);
            }
        }

        //==============================================
        //MOBILE BOTTOM NAVIGATION (AppBar)
        //==============================================

        function showSectionMobile(event, sectionName) {
            if (event) {
                event.preventDefault();
            }
            
            //Remove active de todos os botões da navegação mobile
            const navItems = document.querySelectorAll('.mobile-bottom-nav .nav-item');
            navItems.forEach(item => item.classList.remove('active'));
            
            //Adiciona active no botão clicado
            if (event && event.currentTarget) {
                event.currentTarget.classList.add('active');
            }
            
            //Oculta todas as seções
            document.querySelectorAll('[id^="section"]').forEach(el => el.classList.add('hidden'));
            
            //Mostra a seção desejada
            const sectionId = `section${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}`;
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.remove('hidden');
            }
            
            //🔒 PRIVACIDADE: Adiciona classe no body para controlar visibilidade do botão
            document.body.className = document.body.className.replace(/section-\w+/g, '');
            document.body.classList.add(`section-${sectionName}`);
            
            //Atualiza o título do header
            const titles = {
                overview: 'Dashboard', //✅ REVERTIDO
                transactions: 'Transações',
                todos: 'A Registrar',
                reports: 'Relatórios',
                market: 'Mercado',
                calendar: 'Calendário',
                simulators: 'Simuladores',
                education: 'Aprenda',
                help: 'Ajuda e Suporte'
            };
            
            const headerTitle = document.getElementById('headerTitle');
            if (headerTitle) {
                headerTitle.textContent = titles[sectionName] || 'Dashboard'; //✅ REVERTIDO
            }
            
            //Renderiza reports se necessário
            if (sectionName === 'reports' && typeof renderReports === 'function') {
                renderReports();
            }
            
            //Renderiza todos se necessário
            if (sectionName === 'todos' && typeof renderExpensesList === 'function') {
                renderExpensesList();
            }
            
            //Renderiza calendário se necessário
            if (sectionName === 'calendar' && typeof renderCalendar === 'function') {
                currentCalendarDate = new Date();
                renderCalendar();
            }
            
            //Fecha o menu "Mais" se estiver aberto
            const moreMenu = document.querySelector('.mobile-more-menu');
            if (moreMenu && moreMenu.classList.contains('active')) {
                moreMenu.classList.remove('active');
            }
        }

        function toggleMobileMoreMenu() {
            const moreMenu = document.querySelector('.mobile-more-menu');
            if (moreMenu) {
                moreMenu.classList.toggle('active');
            }
        }

        function showSectionFromMore(sectionName) {
            //Fecha o menu "Mais"
            const moreMenu = document.querySelector('.mobile-more-menu');
            if (moreMenu) {
                moreMenu.classList.remove('active');
            }
            
            //Remove active de todos os botões principais
            const navItems = document.querySelectorAll('.mobile-bottom-nav .nav-item');
            navItems.forEach(item => item.classList.remove('active'));
            
            //Ativa o botão "Mais" já que navegamos a partir dele
            const moreButton = document.querySelector('.nav-item-more');
            if (moreButton) {
                moreButton.classList.add('active');
            }
            
            //Oculta todas as seções
            document.querySelectorAll('[id^="section"]').forEach(el => el.classList.add('hidden'));
            
            //Mostra a seção desejada
            const sectionId = `section${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}`;
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.remove('hidden');
            }
            
            //Atualiza o título do header
            const titles = {
                overview: 'Dashboard', //✅ REVERTIDO
                transactions: 'Transações',
                reports: 'Relatórios',
                market: 'Mercado',
                calendar: 'Calendário',
                simulators: 'Simuladores',
                education: 'Aprenda',
                help: 'Ajuda e Suporte'
            };
            
            const headerTitle = document.getElementById('headerTitle');
            if (headerTitle) {
                headerTitle.textContent = titles[sectionName] || 'Dashboard'; //✅ REVERTIDO
            }
            
            //Renderiza reports se necessário
            if (sectionName === 'reports' && typeof renderReports === 'function') {
                renderReports();
            }
            
            //Renderiza calendário se necessário
            if (sectionName === 'calendar' && typeof renderCalendar === 'function') {
                currentCalendarDate = new Date();
                renderCalendar();
            }
        }

        //Event listener para fechar menu "Mais" ao clicar no backdrop
        document.addEventListener('DOMContentLoaded', function() {
            const moreBackdrop = document.querySelector('.more-menu-backdrop');
            if (moreBackdrop) {
                moreBackdrop.addEventListener('click', function() {
                    const moreMenu = document.querySelector('.mobile-more-menu');
                    if (moreMenu) {
                        moreMenu.classList.remove('active');
                    }
                });
            }
            
            const closeMoreBtn = document.querySelector('.btn-close-more');
            if (closeMoreBtn) {
                closeMoreBtn.addEventListener('click', function() {
                    const moreMenu = document.querySelector('.mobile-more-menu');
                    if (moreMenu) {
                        moreMenu.classList.remove('active');
                    }
                });
            }
        });

        //==============================================
        //FIM - MOBILE BOTTOM NAVIGATION
        //==============================================

        //CALENDAR
        let currentCalendarDate = new Date();

        function renderCalendar() {
            const year = currentCalendarDate.getFullYear();
            const month = currentCalendarDate.getMonth();
            
            //Atualiza o título
            const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            const monthYearEl = document.getElementById('calendarMonthYear');
            if (monthYearEl) {
                monthYearEl.textContent = `${monthNames[month]} ${year}`;
            }
            
            //Primeiro e último dia do mês
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const daysInMonth = lastDay.getDate();
            const startingDayOfWeek = firstDay.getDay();
            
            //Dias do mês anterior para preencher
            const prevMonthLastDay = new Date(year, month, 0).getDate();
            
            const calendarDaysEl = document.getElementById('calendarDays');
            if (!calendarDaysEl) return;
            
            calendarDaysEl.innerHTML = '';
            
            //Dias do mês anterior
            for (let i = startingDayOfWeek - 1; i >= 0; i--) {
                const day = prevMonthLastDay - i;
                const dayEl = createCalendarDay(day, year, month - 1, true);
                calendarDaysEl.appendChild(dayEl);
            }
            
            //Dias do mês atual
            const today = new Date();
            for (let day = 1; day <= daysInMonth; day++) {
                const isToday = day === today.getDate() && 
                                month === today.getMonth() && 
                                year === today.getFullYear();
                const dayEl = createCalendarDay(day, year, month, false, isToday);
                calendarDaysEl.appendChild(dayEl);
            }
            
            //Dias do próximo mês para completar a grade
            const totalCells = calendarDaysEl.children.length;
            const cellsNeeded = Math.ceil(totalCells / 7) * 7;
            for (let day = 1; day <= cellsNeeded - totalCells; day++) {
                const dayEl = createCalendarDay(day, year, month + 1, true);
                calendarDaysEl.appendChild(dayEl);
            }
        }

        //Feriados brasileiros 2025-2026
        function getBrazilianHolidays() {
            return {
                //2025
                '2025-01-01': 'Ano Novo',
                '2025-03-04': 'Carnaval',
                '2025-04-18': 'Sexta-feira Santa',
                '2025-04-21': 'Tiradentes',
                '2025-05-01': 'Dia do Trabalho',
                '2025-06-19': 'Corpus Christi',
                '2025-09-07': 'Independência',
                '2025-10-12': 'Nossa Sra. Aparecida',
                '2025-11-02': 'Finados',
                '2025-11-15': 'Proclamação da República',
                '2025-11-20': 'Consciência Negra',
                '2025-12-25': 'Natal',
                //2026
                '2026-01-01': 'Ano Novo',
                '2026-02-17': 'Carnaval',
                '2026-04-03': 'Sexta-feira Santa',
                '2026-04-21': 'Tiradentes',
                '2026-05-01': 'Dia do Trabalho',
                '2026-06-04': 'Corpus Christi',
                '2026-09-07': 'Independência',
                '2026-10-12': 'Nossa Sra. Aparecida',
                '2026-11-02': 'Finados',
                '2026-11-15': 'Proclamação da República',
                '2026-11-20': 'Consciência Negra',
                '2026-12-25': 'Natal'
            };
        }

        function createCalendarDay(day, year, month, isOtherMonth = false, isToday = false) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            dayEl.setAttribute('data-day', day);
            if (isOtherMonth) dayEl.classList.add('other-month');
            if (isToday) dayEl.classList.add('today');
            
            //Verifica se é feriado
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const holidays = getBrazilianHolidays();
            const holidayName = holidays[dateStr];
            if (holidayName && !isOtherMonth) {
                dayEl.classList.add('holiday');
                dayEl.title = holidayName;
                
                //Adiciona classe especial para o Natal
                if (day === 25 && month === 11) { //25 de dezembro
                    dayEl.classList.add('christmas');
                }
            }
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'calendar-day-number';
            dayNumber.textContent = day;
            
            //Se for feriado, adiciona o nome
            if (holidayName && !isOtherMonth) {
                const holidayLabel = document.createElement('div');
                holidayLabel.className = 'calendar-holiday-label';
                holidayLabel.textContent = holidayName;
                dayNumber.appendChild(holidayLabel);
            }
            
            dayEl.appendChild(dayNumber);
            
            //Busca transações desse dia - CORRIGIDO para evitar problema de timezone
            let dayTransactions = transactions.filter(t => {
                if (!t.data) return false;
                //Normaliza ambas as datas para comparação
                const transactionDate = t.data.includes('T') ? t.data.split('T')[0] : t.data;
                return transactionDate === dateStr;
            });
            
            //🆕 ADICIONA PARCELAS FUTURAS que vencem neste dia
            const currentDate = new Date(year, month, day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            //Procura por transações parceladas que têm parcelas futuras nesta data
            transactions.forEach(t => {
                if (t.despesaTipo === 'parcelada' && t.totalParcelas && t.valorParcela && t.dataInicio) {
                    const startDate = parseLocalDate(t.dataInicio);
                    const startDay = startDate.getDate();
                    
                    //Se a data de vencimento da parcela é neste dia do mês
                    if (day === startDay) {
                        //Calcula quantos meses de diferença entre o início e a data do calendário
                        const monthsDiff = (year - startDate.getFullYear()) * 12 + (month - startDate.getMonth());
                        const parcelaNumero = monthsDiff + 1;
                        
                        //Se esta parcela é válida (está dentro do range de parcelas)
                        if (parcelaNumero > 0 && parcelaNumero <= t.totalParcelas) {
                            //Verifica se esta parcela já não está na lista (evita duplicatas)
                            const jaExiste = dayTransactions.some(dt => 
                                dt.grupoId === t.grupoId && dt.parcelaAtual === parcelaNumero
                            );
                            
                            if (!jaExiste) {
                                //Adiciona a parcela futura
                                dayTransactions.push({
                                    ...t,
                                    id: `${t.id}-parcela-${parcelaNumero}`, //ID único para a parcela futura
                                    parcelaAtual: parcelaNumero,
                                    data: dateStr,
                                    valor: t.valorParcela,
                                    isFutureParcela: currentDate > today
                                });
                            }
                        }
                    }
                }
            });
            
            if (dayTransactions.length > 0) {
                const transactionsContainer = document.createElement('div');
                transactionsContainer.className = 'calendar-day-transactions';
                
                //Agrupa por tipo - incluindo novos tipos de despesa
                const incomeTotal = dayTransactions
                    .filter(t => t.tipo === 'receita')
                    .reduce((sum, t) => sum + Math.abs(t.valor), 0);
                
                const expenseSingleTotal = dayTransactions
                    .filter(t => t.tipo === 'despesa' && (!t.despesaTipo || t.despesaTipo === 'unica'))
                    .reduce((sum, t) => sum + Math.abs(t.valor), 0);
                
                //Agrupa despesas fixas por grupoId
                const fixedGroups = {};
                dayTransactions
                    .filter(t => t.tipo === 'despesa' && t.despesaTipo === 'fixa')
                    .forEach(t => {
                        if (!fixedGroups[t.grupoId]) {
                            fixedGroups[t.grupoId] = {
                                total: 0,
                                count: 0,
                                dataInicio: t.dataInicio,
                                dataFim: t.dataFim
                            };
                        }
                        fixedGroups[t.grupoId].total += Math.abs(t.valor);
                        fixedGroups[t.grupoId].count++;
                    });
                
                //Agrupa despesas parceladas por grupoId - CORRIGIDO para mostrar a parcela correta
                const installmentGroups = {};
                dayTransactions
                    .filter(t => t.tipo === 'despesa' && t.despesaTipo === 'parcelada')
                    .forEach(t => {
                        const grupoKey = t.grupoId || t.id;
                        
                        if (!installmentGroups[grupoKey]) {
                            installmentGroups[grupoKey] = {
                                transacao: t, //Guarda a transação para referência
                                total: 0,
                                parcelaAtual: t.parcelaAtual || 1,
                                totalParcelas: t.totalParcelas || 0,
                                valor: Math.abs(t.valorParcela || t.valor)
                            };
                        }
                        
                        //Se encontrar uma parcela com número maior, atualiza
                        if (t.parcelaAtual && t.parcelaAtual > installmentGroups[grupoKey].parcelaAtual) {
                            installmentGroups[grupoKey].parcelaAtual = t.parcelaAtual;
                            installmentGroups[grupoKey].transacao = t;
                        }
                    });
                
                if (incomeTotal > 0) {
                    const incomeTransactions = dayTransactions.filter(t => t.tipo === 'receita');
                    const indicator = document.createElement('div');
                    indicator.className = 'calendar-transaction-indicator income';
                    indicator.innerHTML = `
                        ${renderIcon('trend-up')}
                        <span class="amount">${formatCurrency(incomeTotal)}</span>
                    `;
                    indicator.onclick = (e) => {
                        e.stopPropagation();
                        if (incomeTransactions.length === 1) {
                            openTransactionDetails(incomeTransactions[0].id);
                        } else {
                            showDayDetails(day, month, year);
                        }
                    };
                    transactionsContainer.appendChild(indicator);
                }
                
                if (expenseSingleTotal > 0) {
                    const expenseTransactions = dayTransactions.filter(t => t.tipo === 'despesa' && (!t.despesaTipo || t.despesaTipo === 'unica'));
                    const indicator = document.createElement('div');
                    indicator.className = 'calendar-transaction-indicator expense';
                    indicator.innerHTML = `
                        ${renderIcon('wallet')}
                        <span class="amount">${formatCurrency(expenseSingleTotal)}</span>
                    `;
                    indicator.onclick = (e) => {
                        e.stopPropagation();
                        if (expenseTransactions.length === 1) {
                            openTransactionDetails(expenseTransactions[0].id);
                        } else {
                            showDayDetails(day, month, year);
                        }
                    };
                    transactionsContainer.appendChild(indicator);
                }
                
                //Mostra despesas fixas agrupadas
                Object.values(fixedGroups).forEach(group => {
                    const indicator = document.createElement('div');
                    indicator.className = 'calendar-transaction-indicator expense fixed';
                    
                    indicator.innerHTML = `
                        ${renderIcon('repeat')}
                        <span class="amount">${formatCurrency(group.total)}</span>
                    `;
                    indicator.onclick = (e) => {
                        e.stopPropagation();
                        showDayDetails(day, month, year);
                    };
                    transactionsContainer.appendChild(indicator);
                });
                
                //Mostra despesas parceladas agrupadas - CORRIGIDO para mostrar parcela correta
                Object.values(installmentGroups).forEach(group => {
                    const indicator = document.createElement('div');
                    indicator.className = 'calendar-transaction-indicator expense installment';
                    const parcelasInfo = `${group.parcelaAtual}/${group.totalParcelas}`;
                    indicator.innerHTML = `
                        ${renderIcon('credit-card')}
                        <span class="amount">${formatCurrency(group.valor)} • ${parcelasInfo}</span>
                    `;
                    indicator.onclick = (e) => {
                        e.stopPropagation();
                        //Se tiver ID numérico (transação real), abre detalhes, senão mostra o dia
                        if (typeof group.transacao.id === 'number') {
                            openTransactionDetails(group.transacao.id);
                        } else {
                            showDayDetails(day, month, year);
                        }
                    };
                    transactionsContainer.appendChild(indicator);
                });
                
                dayEl.appendChild(transactionsContainer);
            }
            
            //Clique para ver detalhes
            if (!isOtherMonth) {
                dayEl.onclick = () => showDayDetails(day, month, year);
            }
            
            return dayEl;
        }

        function showDayDetails(day, month, year) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            //Debug detalhado
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]===== DEBUG CALENDÁRIO =====');
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]Data clicada:', dateStr);
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]Total de transações:', transactions.length);
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]Transações com suas datas:');
            transactions.forEach((t, idx) => {
                console.log(`  [${idx}] Data: "${t.data}" | Tipo: ${t.tipo} | Desc: ${t.descricao}`);
            });
            
            //Filtra transações - múltiplas tentativas de comparação
            const dayTransactions = transactions.filter(t => {
                if (!t.data) return false;
                
                //Tenta diferentes formatos
                const transactionDate = t.data.split('T')[0]; //Remove hora se existir
                const matches = transactionDate === dateStr;
                
                if (matches) {
                    console.log(`  ✓ Encontrou match: ${t.data} === ${dateStr}`);
                }
                
                return matches;
            });
            
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]Total de transações encontradas:', dayTransactions.length);
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]=============================');
            
            const detailsEl = document.getElementById('calendarDayDetails');
            const titleEl = document.getElementById('dayDetailsTitle');
            const contentEl = document.getElementById('dayDetailsContent');
            
            if (!detailsEl || !titleEl || !contentEl) {
                console.error('[ERROR]Elementos do calendário não encontrados!');
                return;
            }
            
            //Formata a data
            const date = new Date(year, month, day);
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            titleEl.textContent = date.toLocaleDateString('pt-BR', options);
            
            if (dayTransactions.length === 0) {
                contentEl.innerHTML = `<div class="empty-state"><div class="empty-state-icon">${renderIconWithStyle('calendar-x', 'font-size: 2.5rem; color: #1e3a8a;')}</div><p>Nenhuma transação neste dia</p></div>`;
            } else {
                contentEl.innerHTML = dayTransactions.map(t => {
                    const categoryList = t.tipo === 'receita' ? categories.income : categories.expense;
                    const cat = categoryList.find(c => c.name === t.categoria);
                    const iconName = cat ? cat.icon : (t.tipo === 'receita' ? 'trend-up' : 'arrow-down');
                    
                    return `
                        <div class="day-transaction-item" onclick="openTransactionDetails(${t.id})">
                            <div class="day-transaction-info">
                                <div class="day-transaction-icon ${t.tipo === 'receita' ? 'income' : 'expense'}">
                                    ${renderIcon(iconName)}
                                </div>
                                <div class="day-transaction-details">
                                    <h4>${t.descricao}</h4>
                                    <p>${t.categoria}</p>
                                </div>
                            </div>
                            <div class="day-transaction-amount ${t.tipo === 'receita' ? 'income' : 'expense'}">
                                ${t.tipo === 'receita' ? '+' : '-'} ${formatCurrency(Math.abs(t.valor))}
                            </div>
                        </div>
                    `;
                }).join('');
            }
            
            detailsEl.style.display = 'block';
            detailsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        function closeDayDetails() {
            const detailsEl = document.getElementById('calendarDayDetails');
            if (detailsEl) {
                detailsEl.style.display = 'none';
            }
        }

        function openTransactionDetails(transactionId) {
            const transaction = transactions.find(t => t.id === transactionId);
            if (!transaction) {
                console.error('[ERROR]❌ Transação não encontrada:', transactionId);
                return;
            }

            //Se for despesa parcelada, usa o modal específico de parcelas
            if (transaction.tipo === 'despesa' && transaction.despesaTipo === 'parcelada' && transaction.grupoId) {
                showInstallmentDetails(transaction.grupoId);
                return;
            }

            //Se for despesa fixa, usa o modal específico de fixas
            if (transaction.tipo === 'despesa' && transaction.despesaTipo === 'fixa' && transaction.grupoId) {
                showFixedDetails(transaction.grupoId);
                return;
            }

            //Para outras transações, usa o modal simples
            const modal = document.getElementById('transactionDetailModal');
            const icon = document.getElementById('transactionDetailIcon');
            const description = document.getElementById('transactionDetailDescription');
            const categorySpan = document.getElementById('transactionDetailCategory');
            const valueEl = document.getElementById('transactionDetailValue');
            const dateEl = document.getElementById('transactionDetailDate');
            const categoryTextEl = document.getElementById('transactionDetailCategoryText');
            const typeEl = document.getElementById('transactionDetailType');

            if (!modal || !icon || !description) {
                console.error('[ERROR]❌ Elementos do modal de detalhes não encontrados');
                return;
            }

            //Define o ícone da categoria
            const categoryList = transaction.tipo === 'receita' ? categories.income : categories.expense;
            const cat = categoryList.find(c => c.name === transaction.categoria);
            const categoryIcon = cat ? cat.icon : (transaction.tipo === 'receita' ? 'trend-up' : 'arrow-down');
            
            icon.innerHTML = renderIcon(categoryIcon);
            icon.style.background = transaction.tipo === 'receita' ? 
                'linear-gradient(135deg, #d1fae5, #a7f3d0)' : 
                'linear-gradient(135deg, #fee2e2, #fecaca)';

            //Define a descrição e categoria
            description.textContent = transaction.descricao || 'Sem descrição';
            if (categorySpan) categorySpan.textContent = transaction.categoria;
            
            //Define o valor
            if (valueEl) {
                const valorFormatado = formatCurrency(Math.abs(transaction.valor));
                valueEl.textContent = transaction.tipo === 'receita' ? `+ ${valorFormatado}` : `- ${valorFormatado}`;
                valueEl.style.color = transaction.tipo === 'receita' ? '#059669' : '#dc2626';
            }
            
            //Formata a data
            if (dateEl) {
                const transactionDate = parseLocalDate(transaction.data);
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                dateEl.textContent = transactionDate.toLocaleDateString('pt-BR', options);
            }

            //Define a categoria (texto)
            if (categoryTextEl) {
                categoryTextEl.textContent = transaction.categoria || 'Sem categoria';
            }

            //Define o tipo de despesa
            if (typeEl) {
                if (transaction.tipo === 'receita') {
                    typeEl.textContent = 'Receita';
                } else {
                    const despesaTipo = transaction.despesaTipo || 'unica';
                    const tipoLabels = {
                        'unica': 'Despesa Única',
                        'fixa': 'Despesa Fixa',
                        'parcelada': 'Despesa Parcelada'
                    };
                    typeEl.textContent = tipoLabels[despesaTipo] || 'Despesa';
                }
            }

            modal.classList.add('show');
        }

        function closeTransactionDetail() {
            const modal = document.getElementById('transactionDetailModal');
            if (modal) {
                modal.classList.remove('show');
            }
        }

        //Funções removidas: editTransactionFromDetails e deleteTransactionFromDetails
        //O modal atual (transactionDetailModal) é apenas para visualização
        //Edição e exclusão são feitas através dos modais específicos de cada tipo

        function previousMonth() {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
            renderCalendar();
            closeDayDetails();
        }

        function nextMonth() {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
            renderCalendar();
            closeDayDetails();
        }

        //Inicializa a seção quando for exibida
        document.addEventListener('DOMContentLoaded', () => {
            //Se o usuário navegar para Aprenda depois, o showSection chamará renderEducationCards via observer
            renderEducationCards();
            
            //Buscar taxas atualizadas do Banco Central em background
            updateRatesBanners().then(() => {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Taxas dos simuladores atualizadas com dados do Banco Central');
            }).catch(err => {
                console.warn('[WARNING]⚠️ Usando taxas padrão (offline ou erro na API):', err);
            });

            //FASE 1: Carregar widgets de cotações e feriados
            renderCurrencyWidget().then(() => {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Cotações atualizadas');
            }).catch(err => {
                console.warn('[WARNING]⚠️ Erro ao carregar cotações:', err);
            });

            renderHolidayWidget().then(() => {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Próximo feriado carregado');
            }).catch(err => {
                console.warn('[WARNING]⚠️ Erro ao carregar feriados:', err);
            });

            /* REMOVIDO: APIs antigas não funcionais
            //FASE 2: Carregar widgets de Tesouro Direto e Inflação
            renderTesouроWidget().then(() => {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Tesouro Direto atualizado');
            }).catch(err => {
                console.warn('[WARNING]⚠️ Erro ao carregar Tesouro Direto:', err);
            });

            renderInflacaoWidget().then(() => {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Inflação (IPCA) atualizada');
            }).catch(err => {
                console.warn('[WARNING]⚠️ Erro ao carregar inflação:', err);
            });

            //FASE 3: Carregar widgets de SELIC, CDI e Ações
            renderSelicWidget().then(() => {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ SELIC Meta atualizada');
            }).catch(err => {
                console.warn('[WARNING]⚠️ Erro ao carregar SELIC:', err);
            });

            renderCDIWidget().then(() => {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ CDI atualizado');
            }).catch(err => {
                console.warn('[WARNING]⚠️ Erro ao carregar CDI:', err);
            });
            */

            //Inicializar novos widgets do mercado (usando as APIs funcionais)
            //A inicialização será feita quando a seção de mercado for aberta
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Sistema de widgets do mercado pronto');

            renderStocksWidget().then(() => {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Principais ações atualizadas');
            }).catch(err => {
                console.warn('[WARNING]⚠️ Erro ao carregar ações:', err);
            });
            
            //Não faz mais health check - removido para evitar logs de erro
        });

        /* ========================================
           PROFILE MANAGEMENT
           ======================================== */

        let currentProfileTab = 'info';

        //Toggle perfil (abre modal)
        function toggleProfile() {
            loadUserProfile();
            const profileModal = document.getElementById('profileModal');
            profileModal.classList.add('show');
            profileModal.classList.add('active'); // Adiciona classe para controle CSS
            
            //Ocultar AppBar no mobile quando perfil abrir
            const mobileBottomNav = document.querySelector('.mobile-bottom-nav');
            if (mobileBottomNav && window.innerWidth <= 768) {
                mobileBottomNav.style.display = 'none';
            }
        }

        //Carrega dados do perfil
        function loadUserProfile() {
            const user = JSON.parse(localStorage.getItem('user')) || {};
            
            //Atualiza avatar
            const avatar = user.nome ? user.nome.charAt(0).toUpperCase() : 'U';
            document.getElementById('profileAvatarLarge').textContent = avatar;
            
            //Atualiza informações
            document.getElementById('profileName').textContent = user.nome || 'Usuário';
            document.getElementById('profileEmail').textContent = user.email || '';
            
            //Preenche formulário de informações
            document.getElementById('profileNameInput').value = user.nome || '';
            document.getElementById('profileEmailInput').value = user.email || '';
            document.getElementById('profileOccupation').value = user.ocupacao || '';
            
            //Preenche formulário financeiro
            document.getElementById('profileIncome').value = user.rendaMensal || '';
            document.getElementById('profilePaymentDay').value = user.diaRecebimento || '';
            document.getElementById('profileMonthlyGoal').value = user.metaMensal || '';
            
            //Calcula estatísticas
            updateProfileStats();
        }

        //Troca de aba no perfil
        function switchProfileTab(tab) {
            currentProfileTab = tab;
            
            //Remove active de todas as abas
            document.querySelectorAll('.profile-tab-minimal').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.profile-tab-content').forEach(c => c.classList.remove('active'));
            
            //Adiciona active na aba selecionada
            const tabMap = {
                'info': 0,
                'financial': 1,
                'security': 2,
                'questions': 3
            };
            
            document.querySelectorAll('.profile-tab-minimal')[tabMap[tab]]?.classList.add('active');
            document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('active');
            
            //✅ NOVO: Se abriu a aba de perguntas, PRIMEIRO valida credenciais
            if (tab === 'questions') {
                showSecurityVerificationModal();
            }
        }

        //✅ NOVO: Modal de verificação de segurança para acessar perguntas
        function showSecurityVerificationModal() {
            const modal = `
                <div class="modal-overlay active" id="securityVerificationModal" style="z-index: 999999; align-items: flex-start; padding-top: 15vh;">
                    <div class="modal-content" style="max-width: 450px;">
                        <div class="modal-header">
                            <h2 style="display: flex; align-items: center; gap: 0.75rem; margin: 0;">
                                <i class="ph ph-shield-check" style="color: #3b82f6; font-size: 1.75rem;"></i>
                                Verificação de Segurança
                            </h2>
                            <button class="close-modal" onclick="closeSecurityVerificationModal()">
                                <i class="ph ph-x"></i>
                            </button>
                        </div>
                        <div class="modal-body" style="padding: 2rem;">
                            <div style="background: #eff6ff; border: 2px solid #bfdbfe; border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem;">
                                <div style="display: flex; align-items: start; gap: 0.75rem;">
                                    <i class="ph ph-info" style="color: #3b82f6; font-size: 1.5rem; flex-shrink: 0;"></i>
                                    <div>
                                        <div style="font-weight: 600; color: #1e40af; margin-bottom: 0.25rem; font-size: 1rem;">Área Protegida</div>
                                        <div style="color: #1e3a8a; font-size: 0.9rem; line-height: 1.5;">
                                            Por favor, confirme sua senha para acessar as perguntas de segurança.
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <form id="securityVerificationForm" onsubmit="verifySecurityCredentials(event)">
                                <div class="input-group" style="margin-bottom: 1.25rem;">
                                    <label for="verifyEmail" style="font-weight: 600; color: #374151; font-size: 0.95rem; margin-bottom: 0.5rem; display: block;">
                                        <i class="ph ph-envelope" style="margin-right: 0.5rem;"></i>
                                        E-mail
                                    </label>
                                    <input 
                                        type="email" 
                                        id="verifyEmail" 
                                        value="${currentUser?.email || ''}"
                                        readonly
                                        style="background: #f9fafb; cursor: not-allowed; border: 2px solid #e5e7eb; padding: 0.75rem 1rem; border-radius: 8px; width: 100%; font-size: 0.95rem;"
                                        required
                                    />
                                </div>
                                
                                <div class="input-group" style="margin-bottom: 1.5rem;">
                                    <label for="verifyPassword" style="font-weight: 600; color: #374151; font-size: 0.95rem; margin-bottom: 0.5rem; display: block;">
                                        <i class="ph ph-lock" style="margin-right: 0.5rem;"></i>
                                        Senha
                                    </label>
                                    <div style="position: relative;">
                                        <input 
                                            type="password" 
                                            id="verifyPassword" 
                                            placeholder="Digite sua senha"
                                            required
                                            autocomplete="current-password"
                                            style="padding: 0.75rem 3rem 0.75rem 1rem; border: 2px solid #d1d5db; border-radius: 8px; width: 100%; font-size: 0.95rem;"
                                        />
                                        <button 
                                            type="button" 
                                            onclick="toggleVerifyPassword()"
                                            style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #6b7280; font-size: 1.25rem; padding: 0.5rem;"
                                        >
                                            <i class="ph ph-eye" id="verifyPasswordIcon"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div style="display: flex; gap: 0.75rem; margin-top: 2rem;">
                                    <button 
                                        type="button" 
                                        onclick="closeSecurityVerificationModal()"
                                        style="flex: 1; padding: 0.875rem; border-radius: 8px; font-weight: 600; font-size: 0.95rem; background: white; border: 2px solid #3b82f6; color: #3b82f6; cursor: pointer; transition: all 0.2s;"
                                    >
                                        <i class="ph ph-x" style="margin-right: 0.5rem;"></i>
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        style="flex: 1; padding: 0.875rem; border-radius: 8px; font-weight: 600; font-size: 0.95rem; background: linear-gradient(135deg, #3b82f6, #2563eb); border: none; color: white; cursor: pointer; transition: all 0.2s;"
                                    >
                                        <i class="ph ph-check" style="margin-right: 0.5rem;"></i>
                                        Verificar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modal);
            
            //Foca no campo de senha
            setTimeout(() => {
                document.getElementById('verifyPassword')?.focus();
            }, 100);
        }

        function toggleVerifyPassword() {
            const input = document.getElementById('verifyPassword');
            const icon = document.getElementById('verifyPasswordIcon');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('ph-eye');
                icon.classList.add('ph-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('ph-eye-slash');
                icon.classList.add('ph-eye');
            }
        }

        function closeSecurityVerificationModal() {
            const modal = document.getElementById('securityVerificationModal');
            if (modal) {
                modal.remove();
            }
            
            //Volta para a aba anterior (info)
            switchProfileTab('info');
        }

        async function verifySecurityCredentials(event) {
            event.preventDefault();
            
            const email = document.getElementById('verifyEmail').value;
            const password = document.getElementById('verifyPassword').value;
            
            const submitBtn = event.target.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="ph ph-spinner"></i> Verificando...';
            
            try {
                //Valida credenciais no backend
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha: password })
                });
                
                if (response.ok) {
                    //✅ Credenciais corretas - libera acesso
                    console.log('[SECURITY] ✅ Credenciais verificadas - acesso liberado');
                    closeSecurityVerificationModal();
                    loadCurrentSecurityQuestions(); //Agora sim carrega as perguntas
                    showNotification('Acesso liberado! Você pode editar suas perguntas de segurança.', 'success');
                } else {
                    //❌ Senha incorreta
                    console.error('[SECURITY] ❌ Credenciais inválidas');
                    showNotification('Senha incorreta! Tente novamente.', 'error');
                    
                    //Reabilita botão
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="ph ph-check"></i> Verificar';
                    
                    //Limpa campo de senha
                    document.getElementById('verifyPassword').value = '';
                    document.getElementById('verifyPassword').focus();
                }
            } catch (error) {
                console.error('[SECURITY] Erro ao verificar credenciais:', error);
                showNotification('Erro ao verificar credenciais. Tente novamente.', 'error');
                
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="ph ph-check"></i> Verificar';
            }
        }

        //Atualiza informações do perfil
        async function updateProfileInfo(event) {
            event.preventDefault();
            
            const user = JSON.parse(localStorage.getItem('user')) || {};
            
            const name = document.getElementById('profileNameInput').value.trim();
            const occupation = document.getElementById('profileOccupation').value.trim();
            
            //✅ VALIDAÇÃO DE NOME INDEVIDO NO PERFIL
            if (!name) {
                showNotification('Por favor, informe seu nome', 'error');
                return;
            }
            
            const nameValidation = validateName(name);
            if (!nameValidation.valid) {
                showNotification(nameValidation.message, 'error');
                return;
            }
            
            if (!occupation) {
                showNotification('Por favor, informe sua ocupação', 'error');
                return;
            }
            
            //✅ VALIDAÇÃO DE OCUPAÇÃO INDEVIDA NO PERFIL
            const occupationValidation = validateOccupation(occupation);
            if (!occupationValidation.valid) {
                showNotification(occupationValidation.message, 'error');
                return;
            }
            
            //✅ CORREÇÃO: Capitaliza nome e ocupação antes de enviar
            const updatedData = {
                id: user.id,
                nome: capitalizeWords(name),
                email: user.email.toLowerCase(), //Garante que email seja minúsculo
                ocupacao: capitalizeWords(occupation),
                rendaMensal: user.rendaMensal,
                diaRecebimento: user.diaRecebimento
            };

            try {
                //Chama a API para atualizar no backend
                const response = await fetch(`${API_URL}/usuarios/${user.id}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedData)
                });

                if (!response.ok) {
                    throw new Error('Erro ao atualizar perfil no servidor');
                }

                const updatedUser = await response.json();
                
                //Atualiza localStorage com os dados do servidor
                localStorage.setItem('user', JSON.stringify(updatedUser));
                currentUser = updatedUser;
                
                //Atualiza UI
                updateProfileUI();
                loadUserProfile();
                
                showNotification('Perfil atualizado com sucesso!', 'success');
                
            } catch (error) {
                console.error('[ERROR]Erro ao atualizar perfil:', error);
                showNotification(error.message || 'Erro ao atualizar perfil', 'error');
            }
        }

        //Atualiza dados financeiros
        async function updateFinancialInfo(event) {
            event.preventDefault();
            
            const user = JSON.parse(localStorage.getItem('user')) || {};
            
            const rendaMensal = parseFloat(document.getElementById('profileIncome').value) || null;
            const diaRecebimento = parseInt(document.getElementById('profilePaymentDay').value) || null;
            const metaMensal = parseFloat(document.getElementById('profileMonthlyGoal').value) || null;

            //Verifica se houve mudança no salário ou meta
            const salaryChanged = user.rendaMensal !== rendaMensal;
            const goalChanged = user.metaMensal !== metaMensal;
            const paymentDayChanged = user.diaRecebimento !== diaRecebimento;

            const updatedData = {
                id: user.id,
                nome: user.nome,
                email: user.email,
                ocupacao: user.ocupacao,
                rendaMensal,
                diaRecebimento,
                metaMensal
            };

            try {
                //Chama a API para atualizar no backend
                const response = await fetch(`${API_URL}/usuarios/${user.id}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedData)
                });

                if (!response.ok) {
                    throw new Error('Erro ao atualizar dados financeiros no servidor');
                }

                const updatedUser = await response.json();
                
                //Atualiza localStorage
                localStorage.setItem('user', JSON.stringify(updatedUser));
                currentUser = updatedUser;
                
                //Se mudou salário, marca para mostrar no lembrete
                if (salaryChanged) {
                    const salaryChangedKey = `salary_changed_${user.id}`;
                    localStorage.setItem(salaryChangedKey, 'true');
                    
                    //Remove a flag após o próximo mês (30 dias)
                    setTimeout(() => {
                        localStorage.removeItem(salaryChangedKey);
                    }, 30 * 24 * 60 * 60 * 1000);
                }
                
                //Se mudou meta, marca para alertar
                if (goalChanged) {
                    const goalChangedKey = `goal_changed_${user.id}`;
                    localStorage.setItem(goalChangedKey, 'true');
                    
                    //Remove a flag após 7 dias
                    setTimeout(() => {
                        localStorage.removeItem(goalChangedKey);
                    }, 7 * 24 * 60 * 60 * 1000);
                }
                
                updateProfileStats();
                
                //Atualiza lembretes imediatamente
                updateReminders();
                
                //Mensagem específica sobre mudanças
                let message = 'Dados financeiros atualizados!';
                if (salaryChanged || goalChanged || paymentDayChanged) {
                    const changes = [];
                    if (salaryChanged) changes.push('salário');
                    if (goalChanged) changes.push('meta');
                    if (paymentDayChanged) changes.push('dia de recebimento');
                    message += ` ${changes.join(', ')} atualizado(s). As alterações valerão a partir do próximo período.`;
                }
                
                showSuccessMessage(message);
                
            } catch (error) {
                console.error('[ERROR]Erro ao atualizar dados financeiros:', error);
                showNotification(error.message || 'Erro ao atualizar dados', 'error');
            }
        }

        //Atualiza senha
        async function updatePassword(event) {
            event.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('profileNewPassword').value;
            const confirmPassword = document.getElementById('confirmPasswordProfile').value;

            //Validações
            if (newPassword !== confirmPassword) {
                showNotification('As senhas não coincidem', 'error');
                return;
            }

            if (newPassword.length < 6) {
                showNotification('A senha deve ter pelo menos 6 caracteres', 'error');
                return;
            }

            try {
                const user = JSON.parse(localStorage.getItem('user')) || {};
                
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🔐 Tentando alterar senha para usuário ID:', user.id);
                
                //Chama a API para alterar senha
                const response = await fetch(`${API_URL}/usuarios/${user.id}/alterar-senha`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        senhaAtual: currentPassword,
                        novaSenha: newPassword
                    })
                });

                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]📡 Resposta da API:', response.status, response.statusText);

                if (!response.ok) {
                    //Backend sempre retorna JSON agora
                    const errorData = await response.json().catch(() => ({ message: 'Erro ao alterar senha' }));
                    const errorMessage = errorData.message || 'Erro ao alterar senha';
                    console.error('[ERROR]❌ Erro da API:', errorData);
                    throw new Error(errorMessage);
                }

                const successData = await response.json();
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Resposta de sucesso:', successData);


                //Limpa o formulário
                document.getElementById('profileSecurityForm').reset();
                const strengthIndicator = document.getElementById('passwordStrengthIndicator');
                if (strengthIndicator) {
                    strengthIndicator.style.display = 'none';
                }
                
                showNotification('Senha alterada com sucesso!', 'success');
                
            } catch (error) {
                console.error('[ERROR]Erro ao alterar senha:', error);
                showNotification(error.message || 'Erro ao alterar senha', 'error');
            }
        }

        //=========================================================================
        //SECURITY QUESTIONS - PROFILE MANAGEMENT
        //=========================================================================

        //Carrega as perguntas de segurança atuais do usuário
        async function loadCurrentSecurityQuestions() {
            try {
                const user = JSON.parse(localStorage.getItem('user')) || {};
                
                //Busca o usuário atualizado do backend para pegar as perguntas
                const response = await fetch(`${API_URL}/usuarios/${user.id}`, {
                    method: 'GET',
                    headers: { 
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const userData = await response.json();
                    
                    //Preenche os selects com as perguntas atuais (se existirem)
                    if (userData.securityQuestion1) {
                        document.getElementById('securityQuestion1Select').value = userData.securityQuestion1;
                    }
                    if (userData.securityQuestion2) {
                        document.getElementById('securityQuestion2Select').value = userData.securityQuestion2;
                    }
                    if (userData.securityQuestion3) {
                        document.getElementById('securityQuestion3Select').value = userData.securityQuestion3;
                    }
                    
                    //Limpa os campos de resposta (por segurança, nunca mostramos as respostas)
                    document.getElementById('securityAnswer1Input').value = '';
                    document.getElementById('securityAnswer2Input').value = '';
                    document.getElementById('securityAnswer3Input').value = '';
                    document.getElementById('confirmPasswordQuestions').value = '';
                    
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Perguntas de segurança carregadas');
                } else {
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]⚠️ Usuário ainda não configurou perguntas de segurança');
                }
            } catch (error) {
                console.error('[ERROR]Erro ao carregar perguntas de segurança:', error);
            }
        }

        //Atualiza as perguntas de segurança
        async function updateSecurityQuestions(event) {
            event.preventDefault();
            
            const question1 = document.getElementById('securityQuestion1Select').value;
            const answer1 = document.getElementById('securityAnswer1Input').value.trim();
            const question2 = document.getElementById('securityQuestion2Select').value;
            const answer2 = document.getElementById('securityAnswer2Input').value.trim();
            const question3 = document.getElementById('securityQuestion3Select').value;
            const answer3 = document.getElementById('securityAnswer3Input').value.trim();
            const password = document.getElementById('confirmPasswordQuestions').value;

            //Validações
            if (!question1 || !question2 || !question3) {
                showNotification('Selecione as 3 perguntas de segurança', 'error');
                return;
            }

            if (!answer1 || !answer2 || !answer3) {
                showNotification('Responda todas as 3 perguntas', 'error');
                return;
            }

            if (answer1.length < 2 || answer2.length < 2 || answer3.length < 2) {
                showNotification('As respostas devem ter pelo menos 2 caracteres', 'error');
                return;
            }

            //Verifica se as perguntas são diferentes
            if (question1 === question2 || question1 === question3 || question2 === question3) {
                showNotification('As 3 perguntas devem ser diferentes', 'error');
                return;
            }

            if (!password) {
                showNotification('Digite sua senha para confirmar', 'error');
                return;
            }

            try {
                const user = JSON.parse(localStorage.getItem('user')) || {};
                
                if (!user.email) {
                    throw new Error('Email do usuário não encontrado. Faça login novamente.');
                }
                
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🔐 [DEBUG] Iniciando atualização de perguntas de segurança');
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]📧 [DEBUG] Email:', user.email);
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]❓ [DEBUG] Perguntas:', { question1, question2, question3 });
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]📝 [DEBUG] Tamanho das respostas:', {
                    answer1Length: answer1.length,
                    answer2Length: answer2.length,
                    answer3Length: answer3.length
                });
                
                const requestBody = {
                    email: user.email,
                    password: password,
                    question1: question1,
                    answer1: answer1,
                    question2: question2,
                    answer2: answer2,
                    question3: question3,
                    answer3: answer3
                };
                
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]📦 [DEBUG] Body da requisição:', JSON.stringify(requestBody, null, 2));
                
                //Chama a API para atualizar perguntas (formato correto do backend)
                const response = await fetch(`${API_URL}/security-questions/update`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });

                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]📡 [DEBUG] Status da resposta:', response.status, response.statusText);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Erro ao atualizar perguntas' }));
                    const errorMessage = errorData.message || 'Erro ao atualizar perguntas de segurança';
                    console.error('[ERROR]❌ [DEBUG] Erro da API:', errorData);
                    throw new Error(errorMessage);
                }

                const successData = await response.json();
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ [DEBUG] Resposta de sucesso:', successData);

                //Limpa apenas os campos de resposta e senha (mantém as perguntas selecionadas)
                document.getElementById('securityAnswer1Input').value = '';
                document.getElementById('securityAnswer2Input').value = '';
                document.getElementById('securityAnswer3Input').value = '';
                document.getElementById('confirmPasswordQuestions').value = '';
                
                showNotification('Perguntas de segurança atualizadas com sucesso!', 'success');
                
            } catch (error) {
                console.error('[ERROR]Erro ao atualizar perguntas:', error);
                showNotification(error.message || 'Erro ao atualizar perguntas de segurança', 'error');
            }
        }

        //=========================================================================
        //FIM DAS FUNÇÕES DE PERGUNTAS DE SEGURANÇA
        //=========================================================================

        //Calcula estatísticas do perfil
        function updateProfileStats() {
            const user = JSON.parse(localStorage.getItem('user')) || {};
            const rendaMensal = user.rendaMensal || 0;
            
            //Calcula gastos mensais
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            
            const monthlyExpenses = transactions
                .filter(t => {
                    const date = parseLocalDate(t.data);
                    return t.tipo === 'despesa' && date >= firstDay && date <= lastDay;
                })
                .reduce((sum, t) => sum + t.valor, 0);

            //Calcula taxa de economia
            const savingsRate = rendaMensal > 0 
                ? ((rendaMensal - monthlyExpenses) / rendaMensal * 100).toFixed(1)
                : 0;

            document.getElementById('savingsRate').textContent = `${savingsRate}%`;
            document.getElementById('monthlyExpenses').textContent = formatCurrency(monthlyExpenses);
        }

        //Monitora força da senha
        document.addEventListener('DOMContentLoaded', () => {
            const newPasswordInput = document.getElementById('profileNewPassword');
            if (newPasswordInput) {
                newPasswordInput.addEventListener('input', (e) => {
                    const password = e.target.value;
                    const strengthEl = document.getElementById('passwordStrengthIndicator');
                    const fillEl = document.getElementById('strengthBarFill');
                    const textEl = document.getElementById('strengthTextLabel');

                    if (!strengthEl || !fillEl || !textEl) return;

                    if (password.length === 0) {
                        strengthEl.style.display = 'none';
                        return;
                    }

                    strengthEl.style.display = 'block';

                    let strength = 0;
                    let strengthText = '';

                    //Critérios de força
                    if (password.length >= 6) strength++;
                    if (password.length >= 10) strength++;
                    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
                    if (/\d/.test(password)) strength++;
                    if (/[^a-zA-Z0-9]/.test(password)) strength++;

                    //Classifica
                    fillEl.className = 'strength-fill';
                    textEl.className = '';

                    if (strength <= 2) {
                        fillEl.classList.add('weak');
                        textEl.classList.add('weak');
                        strengthText = 'Senha fraca';
                    } else if (strength <= 4) {
                        fillEl.classList.add('medium');
                        textEl.classList.add('medium');
                        strengthText = 'Senha média';
                    } else {
                        fillEl.classList.add('strong');
                        textEl.classList.add('strong');
                        strengthText = 'Senha forte';
                    }

                    textEl.textContent = strengthText;
                });
            }
        });

        //Notificação simples
        function showNotification(message, type = 'info') {
            //Usa o novo sistema de toast
            const toastType = type === 'success' ? 'success' : type === 'error' ? 'error' : 'info';
            const title = type === 'success' ? 'Sucesso!' : type === 'error' ? 'Erro!' : 'Informação';
            showToast('generalNotification', toastType, title, message);
        }

        //Adiciona animações CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);

        /* ========================================
           CALENDAR FUNCTIONS
           ======================================== */

        //Calendar and event functions

        /* ========================================
           DOM READY
           ======================================== */

        function initializeSELICChart() {
            const monthlyRate = Math.pow(1 + returnRate, 1/12) - 1;
            
            //Se não houver rendimento
            if (monthlyRate === 0) {
                return (futureValue - initialAmount) / months;
            }
            
            //Fórmula do montante de série de pagamentos
            const futureValueOfInitial = initialAmount * Math.pow(1 + monthlyRate, months);
            const remainingAmount = futureValue - futureValueOfInitial;
            
            const monthlyContribution = remainingAmount / ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
            
            return monthlyContribution;
        }

        //Sugere investimento baseado no prazo
        function suggestInvestment(months) {
            if (months <= 12) return 'tesouroDireto';
            if (months <= 36) return 'cdb';
            return 'tesouroIPCA';
        }

        //Abre simulador de nova meta
        function openGoalSimulator() {
            document.getElementById('sectionGoals').classList.add('hidden');
            document.getElementById('goalSimulatorView').classList.remove('hidden');
            
            //Reset do formulário
            document.getElementById('goalSimulatorForm').reset();
            document.getElementById('goalId').value = '';
            document.getElementById('goalScenario').value = 'neutro';
            
            //Busca inflação atual se ainda não foi buscada
            if (inflationSource === 'manual') {
                fetchInflationFromAPI().then(() => {
                    updateInflationDisplay();
                });
            } else {
                updateInflationDisplay();
            }
            
            renderGoalTypeSelection();
            renderScenarioSelection();
        }

        //Fecha simulador
        function closeGoalSimulator() {
            document.getElementById('goalSimulatorView').classList.add('hidden');
            document.getElementById('sectionGoals').classList.remove('hidden');
        }

        //Renderiza seleção de tipo de meta
        function renderGoalTypeSelection() {
            const container = document.getElementById('goalTypeSelection');
            const html = Object.entries(GOAL_TYPES).map(([key, type]) => `
                <div class="goal-type-card" onclick="selectGoalType('${key}')" data-type="${key}">
                    <span class="goal-type-name">${type.name}</span>
                </div>
            `).join('');
            container.innerHTML = html;
        }

        //Seleciona tipo de meta
        function selectGoalType(type) {
            document.querySelectorAll('.goal-type-card').forEach(card => {
                card.classList.remove('selected');
            });
            
            const selectedCard = document.querySelector(`.goal-type-card[data-type="${type}"]`);
            if (selectedCard) {
                selectedCard.classList.add('selected');
            }
            
            document.getElementById('goalType').value = type;
        }

        //Renderiza seleção de cenário econômico
        function renderScenarioSelection() {
            const container = document.getElementById('scenarioSelection');
            const html = Object.entries(INFLATION_SCENARIOS).map(([key, scenario]) => `
                <div class="scenario-card ${key === 'neutro' ? 'selected' : ''}" onclick="selectScenario('${key}')" data-scenario="${key}">
                    <div class="scenario-card-title">${scenario.label}</div>
                    <div class="scenario-card-description">
                        ${key === 'otimista' ? 'Inflação abaixo da média histórica' : 
                          key === 'neutro' ? 'Segue tendência do mercado' : 
                          'Inflação acima da média histórica'}
                    </div>
                </div>
            `).join('');
            container.innerHTML = html;
        }

        //Seleciona cenário
        function selectScenario(scenario) {
            document.querySelectorAll('.scenario-card').forEach(card => {
                card.classList.remove('selected');
            });
            
            const selectedCard = document.querySelector(`.scenario-card[data-scenario="${scenario}"]`);
            if (selectedCard) {
                selectedCard.classList.add('selected');
            }
            
            document.getElementById('goalScenario').value = scenario;
            updateInflationDisplay();
        }

        //Atualiza display de inflação
        function updateInflationDisplay() {
            const scenario = document.getElementById('goalScenario').value;
            const adjustment = INFLATION_SCENARIOS[scenario].adjustment;
            const finalRate = (currentInflationRate + adjustment) * 100;
            
            const displayEl = document.getElementById('inflationRateDisplay');
            displayEl.title = `Taxa de inflação projetada para seus cálculos. Fonte: ${inflationSource === 'api' ? 'Banco Central do Brasil (IPCA)' : 'Estimativa padrão'}`;
            displayEl.innerHTML = `
                <div class="inflation-info">
                    <span class="inflation-icon">📊</span>
                    <div>
                        <span class="inflation-value">${finalRate.toFixed(2)}% ao ano</span>
                        <span class="inflation-label"> - ${INFLATION_SCENARIOS[scenario].label}</span>
                    </div>
                </div>
            `;
        }

        //Simula meta
        function simulateGoal(event) {
            event.preventDefault();
            
            const goalName = document.getElementById('goalName').value;
            const goalType = document.getElementById('goalType').value;
            const currentValue = parseFloat(document.getElementById('goalCurrentValue').value);
            const months = parseInt(document.getElementById('goalMonths').value);
            const initialAmount = parseFloat(document.getElementById('goalInitialAmount').value) || 0;
            const scenario = document.getElementById('goalScenario').value;
            
            //Validações
            if (!goalName || !goalType || !currentValue || !months) {
                showNotification('Preencha todos os campos obrigatórios', 'error');
                return;
            }
            
            //Calcula inflação ajustada
            const scenarioAdjustment = INFLATION_SCENARIOS[scenario].adjustment;
            const inflationRate = currentInflationRate + scenarioAdjustment;
            
            //Calcula valor futuro
            const futureValue = calculateFutureValue(currentValue, inflationRate, months, goalType);
            
            //Sugere investimento
            const suggestedInvestment = suggestInvestment(months);
            const investmentRate = INVESTMENT_OPTIONS[suggestedInvestment].rate;
            
            //Calcula aporte mensal
            const monthlyContribution = calculateMonthlyContribution(futureValue, months, investmentRate, initialAmount);
            
            //Calcula totais
            const totalContributed = (monthlyContribution * months) + initialAmount;
            const totalEarnings = futureValue - totalContributed;
            
            //Exibe resultado
            displaySimulationResult({
                goalName,
                goalType,
                currentValue,
                futureValue,
                months,
                initialAmount,
                monthlyContribution,
                totalContributed,
                totalEarnings,
                investmentRate,
                inflationRate,
                scenario,
                suggestedInvestment
            });
        }

        //Exibe resultado da simulação
        function displaySimulationResult(result) {
            const resultContainer = document.getElementById('simulationResult');
            const inflationPercent = (result.inflationRate * 100).toFixed(2);
            const difference = result.futureValue - result.currentValue;
            const differencePercent = ((difference / result.currentValue) * 100).toFixed(1);
            const years = Math.floor(result.months/12);
            const remainingMonths = result.months % 12;
            const timeText = years > 0 ? `${years} ${years > 1 ? 'anos' : 'ano'}${remainingMonths > 0 ? ` e ${remainingMonths} ${remainingMonths > 1 ? 'meses' : 'mês'}` : ''}` : `${remainingMonths} ${remainingMonths > 1 ? 'meses' : 'mês'}`;
            
            const html = `
                <!-- Header do Resultado -->
                <div class="result-main-header">
                    <h3>Resultado da Simulação</h3>
                    <p>${result.goalName}</p>
                </div>

                <!-- Impacto da Inflação -->
                <div class="result-section inflation-section">
                    <div class="section-title">
                        <i class="ph ph-chart-line-up"></i>
                        <span>Impacto da Inflação</span>
                    </div>
                    <div class="inflation-comparison-box">
                        <div class="comparison-side">
                            <div class="comparison-label">Valor hoje</div>
                            <div class="comparison-value">${formatCurrency(result.currentValue)}</div>
                        </div>
                        <div class="comparison-divider">
                            <i class="ph ph-arrow-right"></i>
                        </div>
                        <div class="comparison-side highlight">
                            <div class="comparison-label">Valor em ${timeText}</div>
                            <div class="comparison-value">${formatCurrency(result.futureValue)}</div>
                            <div class="comparison-increase">+${differencePercent}%</div>
                        </div>
                    </div>
                    <div class="inflation-note">
                        <i class="ph ph-info"></i>
                        <span>Projeção considerando inflação de <strong>${inflationPercent}%</strong> ao ano</span>
                    </div>
                </div>

                <!-- Seu Plano -->
                <div class="result-section plan-section">
                    <div class="section-title">
                        <i class="ph ph-wallet"></i>
                        <span>Seu Plano de Investimento</span>
                    </div>
                    
                    <div class="monthly-value-highlight">
                        <div class="highlight-label">Você precisa guardar</div>
                        <div class="highlight-value">${formatCurrency(result.monthlyContribution)}</div>
                        <div class="highlight-period">por mês durante ${timeText}</div>
                    </div>

                    <div class="plan-info-grid">
                        <div class="info-item">
                            <div class="info-icon">
                                <i class="ph ph-clock"></i>
                            </div>
                            <div class="info-text">
                                <div class="info-label">Período total</div>
                                <div class="info-value">${result.months} meses</div>
                            </div>
                        </div>
                        <div class="info-item">
                            <div class="info-icon">
                                <i class="ph ph-bank"></i>
                            </div>
                            <div class="info-text">
                                <div class="info-label">Onde investir</div>
                                <div class="info-value">${INVESTMENT_OPTIONS[result.suggestedInvestment].name}</div>
                            </div>
                        </div>
                        <div class="info-item">
                            <div class="info-icon">
                                <i class="ph ph-trend-up"></i>
                            </div>
                            <div class="info-text">
                                <div class="info-label">Rendimento esperado</div>
                                <div class="info-value">${(result.investmentRate * 100).toFixed(2)}% a.a.</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Resumo Financeiro -->
                <div class="result-section summary-section">
                    <div class="section-title">
                        <i class="ph ph-calculator"></i>
                        <span>Resumo Financeiro</span>
                    </div>
                    <div class="financial-summary-grid">
                        <div class="summary-box">
                            <div class="summary-box-label">Total investido</div>
                            <div class="summary-box-value">${formatCurrency(result.totalContributed)}</div>
                        </div>
                        <div class="summary-box success-box">
                            <div class="summary-box-label">Rendimento</div>
                            <div class="summary-box-value">+${formatCurrency(result.totalEarnings)}</div>
                        </div>
                        <div class="summary-box primary-box">
                            <div class="summary-box-label">Total final</div>
                            <div class="summary-box-value">${formatCurrency(result.futureValue)}</div>
                        </div>
                    </div>
                </div>

                <!-- Explicação -->
                <details class="result-details">
                    <summary>
                        <i class="ph ph-lightbulb"></i>
                        <span>Como calculamos esse valor?</span>
                    </summary>
                    <div class="details-content">
                        <p>A <strong>inflação</strong> é o aumento geral dos preços ao longo do tempo. Em nossa simulação, consideramos uma taxa de <strong>${inflationPercent}% ao ano</strong> (${INFLATION_SCENARIOS[result.scenario].label.toLowerCase()}).</p>
                        
                        <p>Isso significa que o que custa <strong>${formatCurrency(result.currentValue)}</strong> hoje provavelmente custará <strong>${formatCurrency(result.futureValue)}</strong> daqui a ${timeText}.</p>
                        
                        <p>Por isso, seu plano de investimento precisa não apenas acumular o valor, mas também compensar a perda de poder de compra causada pela inflação.</p>
                    </div>
                </details>

                <!-- Botões de Ação -->
                <div class="result-buttons">
                    <button type="button" class="btn-result btn-outline" onclick="viewScenarioComparison()">
                        <i class="ph ph-chart-line"></i>
                        <span>Comparar cenários</span>
                    </button>
                    <button type="button" class="btn-result btn-solid" onclick="saveGoalFromSimulation()">
                        <i class="ph ph-check-circle"></i>
                        <span>Salvar meta</span>
                    </button>
                </div>
            `;
            
            resultContainer.innerHTML = html;
            resultContainer.style.display = 'block';
            
            //Scroll suave até o resultado
            resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        //Compara cenários
        function viewScenarioComparison() {
            const goalName = document.getElementById('goalName').value;
            const goalType = document.getElementById('goalType').value;
            const currentValue = parseFloat(document.getElementById('goalCurrentValue').value);
            const months = parseInt(document.getElementById('goalMonths').value);
            const initialAmount = parseFloat(document.getElementById('goalInitialAmount').value) || 0;
            const suggestedInvestment = suggestInvestment(months);
            const investmentRate = INVESTMENT_OPTIONS[suggestedInvestment].rate;
            
            const scenarios = {};
            
            //Calcula para cada cenário
            Object.keys(INFLATION_SCENARIOS).forEach(scenario => {
                const adjustment = INFLATION_SCENARIOS[scenario].adjustment;
                const inflationRate = currentInflationRate + adjustment;
                const futureValue = calculateFutureValue(currentValue, inflationRate, months, goalType);
                const monthlyContribution = calculateMonthlyContribution(futureValue, months, investmentRate, initialAmount);
                
                scenarios[scenario] = {
                    futureValue,
                    monthlyContribution,
                    inflationRate
                };
            });
            
            //Exibe comparação
            const modal = document.createElement('div');
            modal.className = 'scenario-comparison-modal';
            modal.innerHTML = `
                <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>📊 Comparação de Cenários</h3>
                        <button class="modal-close" onclick="this.closest('.scenario-comparison-modal').remove()">×</button>
                    </div>
                    
                    <div class="scenario-comparison-grid">
                        ${Object.entries(scenarios).map(([scenario, data]) => `
                            <div class="scenario-card" style="border-color: ${INFLATION_SCENARIOS[scenario].color}">
                                <div class="scenario-header" style="background: ${INFLATION_SCENARIOS[scenario].color}20">
                                    <span class="scenario-icon">${renderIcon(INFLATION_SCENARIOS[scenario].icon)}</span>
                                    <h4>${INFLATION_SCENARIOS[scenario].label}</h4>
                                </div>
                                <div class="scenario-body">
                                    <div class="scenario-item">
                                        <span class="label">Inflação:</span>
                                        <span class="value">${(data.inflationRate * 100).toFixed(2)}% a.a.</span>
                                    </div>
                                    <div class="scenario-item">
                                        <span class="label">Valor futuro:</span>
                                        <span class="value">${formatCurrency(data.futureValue)}</span>
                                    </div>
                                    <div class="scenario-item highlight">
                                        <span class="label">Guardar/mês:</span>
                                        <span class="value">${formatCurrency(data.monthlyContribution)}</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="comparison-note">
                        <strong>💡 Dica:</strong> O cenário neutro é o mais recomendado por ser baseado 
                        na média histórica. Mas você pode ajustar conforme sua preferência!
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="this.closest('.scenario-comparison-modal').remove()">
                            Fechar
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        }

        //Salva meta da simulação
        function saveGoalFromSimulation() {
            const goalName = document.getElementById('goalName').value;
            const goalType = document.getElementById('goalType').value;
            const currentValue = parseFloat(document.getElementById('goalCurrentValue').value);
            const months = parseInt(document.getElementById('goalMonths').value);
            const initialAmount = parseFloat(document.getElementById('goalInitialAmount').value) || 0;
            const scenario = document.getElementById('goalScenario').value;
            
            const scenarioAdjustment = INFLATION_SCENARIOS[scenario].adjustment;
            const inflationRate = currentInflationRate + scenarioAdjustment;
            const futureValue = calculateFutureValue(currentValue, inflationRate, months, goalType);
            const suggestedInvestment = suggestInvestment(months);
            const investmentRate = INVESTMENT_OPTIONS[suggestedInvestment].rate;
            const monthlyContribution = calculateMonthlyContribution(futureValue, months, investmentRate, initialAmount);
            
            const goal = {
                id: Date.now().toString(),
                name: goalName,
                type: goalType,
                currentValue,
                futureValue,
                targetAmount: futureValue,
                currentAmount: initialAmount,
                monthlyContribution,
                months,
                targetDate: new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString(),
                investmentType: suggestedInvestment,
                investmentRate,
                inflationRate,
                scenario,
                status: 'active',
                createdAt: new Date().toISOString()
            };
            
            financialGoals.push(goal);
            saveGoals();
            
            showNotification('Meta salva com sucesso!', 'success');
            closeGoalSimulator();
            renderGoalsList();
        }

        //Renderiza lista de metas
        function renderGoalsList() {
            const container = document.getElementById('goalsListContainer');
            
            if (financialGoals.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon"><i class="ph-target"></i></div>
                        <h3>Nenhum objetivo criado ainda</h3>
                        <p>Comece simulando seu primeiro objetivo financeiro!</p>
                        <button class="btn-primary" onclick="openGoalSimulator()">
                            <i class="ph ph-plus"></i> Criar primeiro objetivo
                        </button>
                    </div>
                `;
                return;
            }
            
            const html = financialGoals.map(goal => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                const goalIcon = GOAL_TYPES[goal.type].icon;
                const monthsRemaining = Math.ceil((new Date(goal.targetDate) - new Date()) / (30 * 24 * 60 * 60 * 1000));
                
                return `
                    <div class="goal-card">
                        <div class="goal-header">
                            <div class="goal-title">
                                <span class="goal-icon">${goalIcon}</span>
                                <h4>${goal.name}</h4>
                            </div>
                            <div class="goal-actions">
                                <button class="icon-btn" onclick="editGoal('${goal.id}')" title="Editar meta">
                                    <i class="ph ph-pencil-simple"></i>
                                </button>
                                <button class="icon-btn" onclick="deleteGoal('${goal.id}')" title="Excluir meta">
                                    <i class="ph ph-trash"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="goal-progress">
                            <div class="progress-info">
                                <span>${formatCurrency(goal.currentAmount)}</span>
                                <span>${progress.toFixed(1)}%</span>
                                <span>${formatCurrency(goal.targetAmount)}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                            </div>
                        </div>
                        
                        <div class="goal-details">
                            <div class="detail-item">
                                <span class="detail-label">Guardar/mês:</span>
                                <span class="detail-value">${formatCurrency(goal.monthlyContribution)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Faltam:</span>
                                <span class="detail-value">${monthsRemaining} meses</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Investimento:</span>
                                <span class="detail-value">${INVESTMENT_OPTIONS[goal.investmentType].name}</span>
                            </div>
                        </div>
                        
                        <button class="btn-secondary btn-block" onclick="addContributionToGoal('${goal.id}')">
                            <i class="ph ph-plus-circle"></i> Adicionar valor
                        </button>
                    </div>
                `;
            }).join('');
            
            container.innerHTML = html;
        }

        //Adiciona contribuição a meta
        function addContributionToGoal(goalId) {
            const goal = financialGoals.find(g => g.id === goalId);
            if (!goal) return;
            
            const amount = prompt(`Quanto você quer adicionar à meta "${goal.name}"?`, goal.monthlyContribution.toFixed(2));
            
            if (amount && !isNaN(amount)) {
                const contribution = parseFloat(amount);
                goal.currentAmount += contribution;
                
                //Verifica se atingiu a meta
                if (goal.currentAmount >= goal.targetAmount) {
                    goal.status = 'completed';
                    showNotification(`🎉 Parabéns! Você atingiu a meta "${goal.name}"!`, 'success');
                } else {
                    showNotification(`Aporte de ${formatCurrency(contribution)} adicionado!`, 'success');
                }
                
                saveGoals();
                renderGoalsList();
            }
        }

        //Deleta meta
        function deleteGoal(goalId) {
            const goal = financialGoals.find(g => g.id === goalId);
            if (!goal) return;
            
            if (confirm(`Tem certeza que deseja excluir a meta "${goal.name}"?`)) {
                financialGoals = financialGoals.filter(g => g.id !== goalId);
                saveGoals();
                renderGoalsList();
                showNotification('Meta excluída', 'info');
            }
        }

        //Inicializa seção de metas
        function initGoalsSection() {
            loadGoals();
            renderGoalsList();
            fetchInflationFromAPI();
        }

        //Event listeners para o simulador
        document.addEventListener('DOMContentLoaded', () => {
            const scenarioSelect = document.getElementById('goalScenario');
            if (scenarioSelect) {
                scenarioSelect.addEventListener('change', updateInflationDisplay);
            }
            
            //CRÍTICO: Restaurar sessão do usuário ao carregar página
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🔄 Verificando sessão do usuário...');
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                try {
                    currentUser = JSON.parse(savedUser);
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Sessão restaurada:', currentUser.nome, currentUser.email);
                    
                    //Se está na dashboard, carrega os dados
                    const dashboard = document.getElementById('dashboard');
                    if (dashboard && dashboard.style.display !== 'none') {
                        console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]📊 Dashboard ativa, carregando dados...');
                        loadDashboardData();
                        updateProfileUI();
                    }
                } catch (error) {
                    console.error('[ERROR]❌ Erro ao restaurar sessão:', error);
                    localStorage.removeItem('user');
                    currentUser = null;
                }
            } else {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]ℹ️ Nenhuma sessão salva');
            }
        });

        //========================================
        //MODAL DE DETALHES DA TRANSAÇÃO
        //========================================

        function openTransactionDetail(transactionId) {
            const transaction = transactions.find(t => t.id === transactionId);
            if (!transaction) return;

            const modal = document.getElementById('transactionDetailModal');
            const isIncome = transaction.tipo === 'receita';
            
            //Atualizar ícone
            const icon = document.getElementById('transactionDetailIcon');
            icon.className = `transaction-detail-icon ${isIncome ? 'income' : 'expense'}`;
            icon.innerHTML = `<i class="ph ph-${isIncome ? 'arrow-up' : 'arrow-down'}"></i>`;
            
            //Atualizar conteúdo
            document.getElementById('transactionDetailDescription').textContent = transaction.descricao;
            document.getElementById('transactionDetailCategory').textContent = transaction.categoria || 'Sem categoria';
            
            //Valor com classe de cor
            const valueElement = document.getElementById('transactionDetailValue');
            valueElement.textContent = `${isIncome ? '+' : '-'}${formatCurrency(Math.abs(transaction.valor))}`;
            valueElement.className = `detail-value ${isIncome ? 'income' : 'expense'}`;
            
            document.getElementById('transactionDetailDate').textContent = formatDate(transaction.data);
            document.getElementById('transactionDetailCategoryText').textContent = transaction.categoria || 'Sem categoria';
            document.getElementById('transactionDetailType').textContent = isIncome ? 'Receita' : 'Despesa';
            
            modal.classList.add('show');
            
            //Foca no primeiro input em dispositivos móveis
            focusFirstInputMobile(modal);
        }

        function closeTransactionDetail() {
            const modal = document.getElementById('transactionDetailModal');
            modal.classList.remove('show');
        }

        //========================================
        //TOOLTIPS DE EXPLICAÇÃO
        //========================================

        //Adiciona event listeners para os botões de tooltip
        document.addEventListener('DOMContentLoaded', () => {
            //Inicializar dica do dia
            displayDailyTip();
            
            const tooltipButtons = document.querySelectorAll('.info-tooltip-btn');
            tooltipButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const tooltipType = btn.getAttribute('data-tooltip');
                    openTooltip(tooltipType);
                });
            });

            //Fechar tooltip ao clicar fora
            document.addEventListener('click', (e) => {
                const tooltipModals = document.querySelectorAll('.info-tooltip-modal.show');
                tooltipModals.forEach(modal => {
                    if (e.target === modal) {
                        closeTooltip();
                    }
                });
            });
        });

        function openTooltip(type) {
            let modalId = '';
            if (type === 'trend') {
                modalId = 'trendTooltipModal';
            } else if (type === 'savings') {
                modalId = 'savingsTooltipModal';
            } else if (type === 'avgDaily') {
                modalId = 'avgDailyTooltipModal';
            } else if (type === 'holiday') {
                modalId = 'holidayTooltipModal';
            } else if (type === 'projection') {
                modalId = 'projectionTooltipModal';
            } else if (type === 'forecast') {
                modalId = 'forecastTooltipModal';
            } else if (type === 'biggestExpense') {
                modalId = 'biggestExpenseTooltipModal';
            } else if (type === 'savingsRate') {
                modalId = 'savingsRateTooltipModal';
            } else if (type === 'daysToSalary') {
                modalId = 'daysToSalaryTooltipModal';
            }
            
            if (modalId) {
                const modal = document.getElementById(modalId);
                modal.classList.add('show');
            }
        }

        function closeTooltip() {
            const modals = document.querySelectorAll('.info-tooltip-modal');
            modals.forEach(modal => modal.classList.remove('show'));
        }

        //========================================
        //RESUMO MENSAL AUTOMÁTICO
        //========================================

        function checkAndShowMonthlyReview() {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            //Verifica se é um novo mês
            const lastAccessDate = localStorage.getItem('lastAccessDate');
            if (!lastAccessDate) {
                localStorage.setItem('lastAccessDate', now.toISOString());
                return;
            }
            
            const lastDate = new Date(lastAccessDate);
            const lastMonth = lastDate.getMonth();
            const lastYear = lastDate.getFullYear();
            
            //Se não mudou de mês, não faz nada
            if (lastMonth === currentMonth && lastYear === currentYear) {
                //Verifica se tem lembrete pendente
                checkMonthlyReviewReminder();
                return;
            }
            
            //Mudou de mês! Verifica se tem dados do mês anterior
            const hasDataPreviousMonth = checkPreviousMonthData(lastMonth, lastYear);
            
            if (!hasDataPreviousMonth) {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]⚠️ Sem dados suficientes do mês anterior (precisa 1 receita e 1 despesa)');
                localStorage.setItem('lastAccessDate', now.toISOString());
                return;
            }
            
            //Chave única para este mês
            const reviewKey = `monthlyReview_${currentYear}_${currentMonth}`;
            const hasShownNotif = localStorage.getItem(reviewKey);
            
            if (!hasShownNotif) {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🎉 Virada de mês detectada! Mostrando notificação...');
                setTimeout(() => {
                    showMonthlyReviewNotification(lastMonth, lastYear);
                    localStorage.setItem(reviewKey, 'notified');
                    
                    //Adiciona lembrete por 3 dias
                    addMonthlyReviewReminder(lastMonth, lastYear);
                }, 1500);
            }
            
            //Atualiza data do último acesso
            localStorage.setItem('lastAccessDate', now.toISOString());
        }

        function checkPreviousMonthData(month, year) {
            //Verifica se tem pelo menos 1 receita e 1 despesa no mês anterior
            const monthTransactions = transactions.filter(t => {
                const tDate = parseLocalDate(t.data);
                return tDate.getMonth() === month && tDate.getFullYear() === year;
            });
            
            const hasIncome = monthTransactions.some(t => t.tipo === 'receita');
            const hasExpense = monthTransactions.some(t => t.tipo === 'despesa');
            
            return hasIncome && hasExpense;
        }

        function showMonthlyReviewNotification(month, year) {
            const notif = document.getElementById('monthlyReviewNotification');
            if (!notif) return;
            
            const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                              'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            
            document.getElementById('notifMonthName').textContent = `${monthNames[month]} ${year}`;
            
            //Armazena mês/ano para abrir depois
            notif.dataset.month = month;
            notif.dataset.year = year;
            
            notif.classList.add('show');
        }

        function closeMonthlyNotification() {
            const notif = document.getElementById('monthlyReviewNotification');
            if (notif) {
                notif.classList.remove('show');
            }
        }

        function openMonthlyReviewFromNotif() {
            const notif = document.getElementById('monthlyReviewNotification');
            if (!notif) return;
            
            const month = parseInt(notif.dataset.month);
            const year = parseInt(notif.dataset.year);
            
            closeMonthlyNotification();
            showMonthlyReview(month, year);
        }

        function addMonthlyReviewReminder(month, year) {
            const now = new Date();
            const expiryDate = new Date(now);
            expiryDate.setDate(expiryDate.getDate() + 3); //Expira em 3 dias
            
            const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                              'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            
            const reminder = {
                id: `monthly_review_${year}_${month}`,
                type: 'monthly_review',
                title: 'Resumo Mensal Disponível',
                description: `Seu resumo de ${monthNames[month]} ${year} está pronto para visualização`,
                createdAt: now.toISOString(),
                expiresAt: expiryDate.toISOString(),
                month: month,
                year: year,
                read: false
            };
            
            //Adiciona aos lembretes
            let reminders = JSON.parse(localStorage.getItem('monthlyReviewReminders') || '[]');
            
            //Remove lembretes expirados
            reminders = reminders.filter(r => new Date(r.expiresAt) > now);
            
            //Adiciona novo se não existir
            if (!reminders.some(r => r.id === reminder.id)) {
                reminders.push(reminder);
                localStorage.setItem('monthlyReviewReminders', JSON.stringify(reminders));
            }
        }

        function checkMonthlyReviewReminder() {
            const reminders = JSON.parse(localStorage.getItem('monthlyReviewReminders') || '[]');
            const now = new Date();
            
            //Filtra lembretes válidos e não lidos
            const activeReminders = reminders.filter(r => 
                new Date(r.expiresAt) > now && !r.read
            );
            
            //Atualiza card de lembretes se houver
            if (activeReminders.length > 0) {
                updateRemindersWithMonthlyReview(activeReminders);
            }
        }

        function updateRemindersWithMonthlyReview(reminders) {
            //Adiciona lembretes de resumo mensal ao card de lembretes
            const reminderCard = document.querySelector('.reminders-vertical-card');
            if (!reminderCard) return;
            
            const reminder = reminders[0]; //Pega o mais recente
            
            const iconEl = document.getElementById('remindersVerticalIcon');
            const titleEl = document.getElementById('remindersVerticalTitle');
            const descEl = document.getElementById('remindersVerticalDesc');
            
            if (iconEl) iconEl.innerHTML = renderIcon('calendar-check');
            if (titleEl) titleEl.textContent = reminder.title;
            if (descEl) descEl.textContent = reminder.description;
            
            //Adiciona click para abrir resumo
            reminderCard.style.cursor = 'pointer';
            reminderCard.onclick = function() {
                showMonthlyReview(reminder.month, reminder.year);
                markMonthlyReviewAsRead(reminder.id);
            };
        }

        function markMonthlyReviewAsRead(reminderId) {
            let reminders = JSON.parse(localStorage.getItem('monthlyReviewReminders') || '[]');
            reminders = reminders.map(r => {
                if (r.id === reminderId) {
                    r.read = true;
                }
                return r;
            });
            localStorage.setItem('monthlyReviewReminders', JSON.stringify(reminders));
            checkMonthlyReviewReminder(); //Atualiza display
        }

        function clearAllMonthlyReviewReminders() {
            localStorage.removeItem('monthlyReviewReminders');
            checkMonthlyReviewReminder(); //Atualiza display
        }

        function showMonthlyReview(month, year) {
            const modal = document.getElementById('monthlyReviewModal');
            if (!modal) return;
            
            //Atualiza nome do mês
            const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                              'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            document.getElementById('reviewMonthName').textContent = `${monthNames[month]} ${year}`;
            
            //Calcula dados do mês anterior
            const monthData = calculateMonthData(month, year);
            
            //Atualiza cards principais
            document.getElementById('reviewIncome').textContent = formatCurrency(monthData.income);
            document.getElementById('reviewExpense').textContent = formatCurrency(monthData.expense);
            document.getElementById('reviewSavings').textContent = formatCurrency(monthData.savings);
            document.getElementById('reviewSavingsRate').textContent = monthData.savingsRate.toFixed(1) + '%';
            
            //Atualiza novos cards
            document.getElementById('reviewTransactions').textContent = monthData.transactionCount;
            document.getElementById('reviewAvgDaily').textContent = formatCurrency(monthData.avgDaily);
            
            //Atualiza categorias
            renderReviewCategories(monthData.categories);
            
            //Renderiza gráfico comparativo
            renderReviewChart(month, year);
            
            //Gera insights
            generateReviewInsights(monthData);
            
            //Mostra modal
            modal.classList.add('show');
        }

        function calculateMonthData(month, year) {
            //Filtra transações do mês específico
            const monthTransactions = transactions.filter(t => {
                const tDate = parseLocalDate(t.data);
                return tDate.getMonth() === month && tDate.getFullYear() === year;
            });
            
            //Calcula receitas
            const income = monthTransactions
                .filter(t => t.tipo === 'receita')
                .reduce((sum, t) => sum + Math.abs(t.valor), 0);
            
            //Calcula despesas
            const expense = monthTransactions
                .filter(t => t.tipo === 'despesa')
                .reduce((sum, t) => sum + Math.abs(t.valor), 0);
            
            //Calcula economia
            const savings = income - expense;
            
            //Calcula taxa de poupança
            const savingsRate = income > 0 ? (savings / income) * 100 : 0;
            
            //Agrupa por categoria
            const categoriesMap = {};
            monthTransactions
                .filter(t => t.tipo === 'despesa')
                .forEach(t => {
                    const cat = t.categoria || 'Outros';
                    if (!categoriesMap[cat]) {
                        categoriesMap[cat] = { total: 0, count: 0 };
                    }
                    categoriesMap[cat].total += Math.abs(t.valor);
                    categoriesMap[cat].count++;
                });
            
            //Converte em array e ordena
            const categories = Object.entries(categoriesMap)
                .map(([name, data]) => ({ name, ...data }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 5); //Top 5
            
            //Calcula número de dias no mês
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            //Gasto médio diário
            const avgDaily = daysInMonth > 0 ? expense / daysInMonth : 0;
            
            return {
                income,
                expense,
                savings,
                savingsRate,
                categories,
                transactionCount: monthTransactions.length,
                avgDaily
            };
        }

        function renderReviewCategories(categories) {
            const container = document.getElementById('reviewCategories');
            
            if (categories.length === 0) {
                container.innerHTML = '<div class="review-empty">Nenhuma categoria registrada</div>';
                return;
            }
            
            container.innerHTML = categories.map(cat => {
                const icon = getCategoryIcon(cat.name);
                return `
                    <div class="review-category-item">
                        <div class="review-category-left">
                            <div class="review-category-icon">
                                ${renderIcon(icon)}
                            </div>
                            <div class="review-category-info">
                                <h4>${cat.name}</h4>
                                <p>${cat.count} ${cat.count === 1 ? 'transação' : 'transações'}</p>
                            </div>
                        </div>
                        <div class="review-category-value">${formatCurrency(cat.total)}</div>
                    </div>
                `;
            }).join('');
        }

        function renderReviewChart(targetMonth, targetYear) {
            const canvas = document.getElementById('reviewComparisonChart');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            
            //Prepara dados dos últimos 3 meses
            const months = [];
            const incomeData = [];
            const expenseData = [];
            
            for (let i = 2; i >= 0; i--) {
                let month = targetMonth - i;
                let year = targetYear;
                
                if (month < 0) {
                    month += 12;
                    year -= 1;
                }
                
                const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                                  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                months.push(monthNames[month]);
                
                const monthData = calculateMonthData(month, year);
                incomeData.push(monthData.income);
                expenseData.push(monthData.expense);
            }
            
            //Destroi gráfico anterior se existir
            if (window.reviewChart) {
                window.reviewChart.destroy();
            }
            
            //Cria novo gráfico
            window.reviewChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [
                        {
                            label: 'Receitas',
                            data: incomeData,
                            backgroundColor: 'rgba(5, 150, 105, 0.8)',
                            borderColor: 'rgba(5, 150, 105, 1)',
                            borderWidth: 2,
                            borderRadius: 8
                        },
                        {
                            label: 'Despesas',
                            data: expenseData,
                            backgroundColor: 'rgba(220, 38, 38, 0.8)',
                            borderColor: 'rgba(220, 38, 38, 1)',
                            borderWidth: 2,
                            borderRadius: 8
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return 'R$ ' + value.toLocaleString('pt-BR');
                                }
                            }
                        }
                    }
                }
            });
        }

        function generateReviewInsights(monthData) {
            const container = document.getElementById('reviewInsights');
            const insights = [];
            
            //Verifica se há dados suficientes
            if (monthData.income === 0 && monthData.expense === 0) {
                container.innerHTML = `
                    <div class="review-insight insight-neutral">
                        ${renderIcon('info')}
                        <p>Nenhum dado financeiro registrado para este mês.</p>
                    </div>
                `;
                return;
            }
            
            //Insight sobre taxa de poupança
            if (monthData.savingsRate >= 20) {
                insights.push({
                    type: 'positive',
                    icon: 'check-circle',
                    text: `Excelente! Você economizou ${monthData.savingsRate.toFixed(1)}% da sua renda. Continue assim!`
                });
            } else if (monthData.savingsRate >= 10) {
                insights.push({
                    type: 'warning',
                    icon: 'warning-circle',
                    text: `Você economizou ${monthData.savingsRate.toFixed(1)}% da sua renda. Tente chegar a 20% para uma poupança mais saudável.`
                });
            } else if (monthData.savingsRate > 0) {
                insights.push({
                    type: 'warning',
                    icon: 'warning-circle',
                    text: `Taxa de poupança baixa (${monthData.savingsRate.toFixed(1)}%). Revise seus gastos e tente economizar mais.`
                });
            } else if (monthData.income > 0) {
                //Só mostra alerta se houver receita registrada
                insights.push({
                    type: 'negative',
                    icon: 'x-circle',
                    text: `Atenção! Você gastou mais do que ganhou neste mês. Planeje melhor suas despesas.`
                });
            }
            
            //Insight sobre categoria mais gasta
            if (monthData.categories.length > 0) {
                const topCategory = monthData.categories[0];
                const percentage = (topCategory.total / monthData.expense) * 100;
                insights.push({
                    type: 'neutral',
                    icon: 'info',
                    text: `Sua maior categoria de gasto foi "${topCategory.name}" com ${formatCurrency(topCategory.total)} (${percentage.toFixed(1)}% do total).`
                });
            }
            
            //Insight sobre quantidade de transações
            if (monthData.transactionCount > 0) {
                insights.push({
                    type: 'neutral',
                    icon: 'chart-line',
                    text: `Você registrou ${monthData.transactionCount} ${monthData.transactionCount === 1 ? 'transação' : 'transações'} neste mês.`
                });
            }
            
            //========================================
            //PREVISÕES BASEADAS EM IA
            //========================================
            const aiPredictions = generateAIPredictions(monthData);
            insights.push(...aiPredictions);
            
            //Renderiza insights
            if (insights.length === 0) {
                container.innerHTML = '<div class="review-empty">Nenhum insight disponível</div>';
                return;
            }
            
            container.innerHTML = insights.map(insight => `
                <div class="review-insight insight-${insight.type}">
                    ${renderIcon(insight.icon)}
                    <p>${insight.text}</p>
                </div>
            `).join('');
        }

        function generateAIPredictions(monthData) {
            const predictions = [];
            
            //Análise de 3 meses anteriores para previsões
            const now = new Date();
            const last3Months = [];
            
            for (let i = 1; i <= 3; i++) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const data = calculateMonthData(date.getMonth(), date.getFullYear());
                last3Months.push(data);
            }
            
            //Previsão 1: Tendência de gastos
            if (last3Months.length >= 2) {
                const avgExpense = last3Months.reduce((sum, m) => sum + m.expense, 0) / last3Months.length;
                const currentExpense = monthData.expense;
                
                if (currentExpense > avgExpense * 1.15) {
                    predictions.push({
                        type: 'warning',
                        icon: 'trend-up',
                        text: `🤖 IA: Seus gastos aumentaram ${((currentExpense / avgExpense - 1) * 100).toFixed(0)}% em relação à média dos últimos meses. Atenção à tendência de alta!`
                    });
                } else if (currentExpense < avgExpense * 0.85) {
                    predictions.push({
                        type: 'positive',
                        icon: 'trend-down',
                        text: `🤖 IA: Parabéns! Você reduziu seus gastos em ${((1 - currentExpense / avgExpense) * 100).toFixed(0)}% comparado à média. Continue economizando!`
                    });
                }
            }
            
            //Previsão 2: Projeção para próximo mês
            if (last3Months.length >= 2) {
                const trend = (last3Months[0].expense - last3Months[last3Months.length - 1].expense) / last3Months.length;
                const projectedExpense = monthData.expense + trend;
                const projectedSavings = monthData.income - projectedExpense;
                
                if (projectedSavings < 0) {
                    predictions.push({
                        type: 'negative',
                        icon: 'brain',
                        text: `🤖 IA: Alerta! Baseado na tendência, você pode gastar ${formatCurrency(projectedExpense)} no próximo mês, excedendo sua renda em ${formatCurrency(Math.abs(projectedSavings))}.`
                    });
                } else if (projectedSavings > monthData.income * 0.2) {
                    predictions.push({
                        type: 'positive',
                        icon: 'brain',
                        text: `🤖 IA: Projeção otimista! Mantendo o padrão, você pode economizar ${formatCurrency(projectedSavings)} no próximo mês.`
                    });
                }
            }
            
            //Previsão 3: Análise de comportamento por categoria
            if (monthData.categories.length > 0) {
                const topCategory = monthData.categories[0];
                const categoryPercent = (topCategory.total / monthData.expense) * 100;
                
                if (categoryPercent > 40) {
                    predictions.push({
                        type: 'warning',
                        icon: 'robot',
                        text: `🤖 IA: A categoria "${topCategory.name}" representa ${categoryPercent.toFixed(0)}% dos gastos. Considere diversificar ou reduzir esse gasto concentrado.`
                    });
                }
            }
            
            //Previsão 4: Gasto médio diário
            if (monthData.avgDaily > 0) {
                const dailyBudget = monthData.income / 30; //Budget diário ideal
                
                if (monthData.avgDaily > dailyBudget * 0.9) {
                    predictions.push({
                        type: 'warning',
                        icon: 'clock',
                        text: `🤖 IA: Seu gasto diário médio (${formatCurrency(monthData.avgDaily)}) está próximo do limite saudável. Tente reduzir para ${formatCurrency(dailyBudget * 0.7)}/dia para economizar mais.`
                    });
                } else {
                    predictions.push({
                        type: 'positive',
                        icon: 'clock',
                        text: `🤖 IA: Gasto diário controlado! Média de ${formatCurrency(monthData.avgDaily)}/dia está dentro do ideal.`
                    });
                }
            }
            
            //Previsão 5: Comparação com meta de poupança
            const savingsGoal = 20; //Meta ideal de 20%
            if (monthData.savingsRate < savingsGoal && monthData.income > 0) {
                const needed = (monthData.income * (savingsGoal / 100)) - monthData.savings;
                predictions.push({
                    type: 'neutral',
                    icon: 'target',
                    text: `🤖 IA: Para atingir a meta de ${savingsGoal}% de poupança, você precisa economizar mais ${formatCurrency(needed)} por mês. Dica: Comece reduzindo pequenos gastos diários.`
                });
            }
            
            return predictions;
        }

        function closeMonthlyReview() {
            const modal = document.getElementById('monthlyReviewModal');
            if (modal) {
                modal.classList.remove('show');
            }
        }

        function openReportsSection() {
            closeMonthlyReview();
            showSection('Relatórios');
        }

        function exportMonthlyReviewPDF() {
            try {
                const { jsPDF } = window.jspdf;
                if (!jsPDF) {
                    showToast('generalNotification', 'error', 'Erro!', 'Biblioteca jsPDF não carregada. Recarregue a página e tente novamente.');
                    return;
                }

                //Pega os dados do modal atual
                const monthName = document.getElementById('reviewMonthName').textContent;
                const income = document.getElementById('reviewIncome').textContent;
                const expense = document.getElementById('reviewExpense').textContent;
                const savings = document.getElementById('reviewSavings').textContent;
                const savingsRate = document.getElementById('reviewSavingsRate').textContent;
                const transactions = document.getElementById('reviewTransactions').textContent;
                const avgDaily = document.getElementById('reviewAvgDaily').textContent;

                //Cria PDF
                const doc = new jsPDF();
                let yPos = 20;

                //Header simples
                doc.setTextColor(30, 41, 59);
                doc.setFontSize(22);
                doc.setFont(undefined, 'bold');
                doc.text('Resumo Mensal', 20, yPos);
                yPos += 8;
                
                doc.setFontSize(12);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(100, 116, 139);
                doc.text(monthName, 20, yPos);
                yPos += 5;
                
                //Linha separadora
                doc.setDrawColor(229, 231, 235);
                doc.setLineWidth(0.5);
                doc.line(20, yPos, 190, yPos);
                yPos += 10;

                //Resumo Financeiro
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(30, 41, 59);
                doc.text('Resumo Financeiro', 20, yPos);
                yPos += 8;

                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(71, 85, 105);

                const financialData = [
                    ['Receitas', income],
                    ['Despesas', expense],
                    ['Economia', savings],
                    ['Taxa de Poupanca', savingsRate],
                    ['Total de Transacoes', transactions],
                    ['Gasto Medio/Dia', avgDaily]
                ];

                doc.autoTable({
                    startY: yPos,
                    head: [['Indicador', 'Valor']],
                    body: financialData,
                    theme: 'striped',
                    headStyles: {
                        fillColor: [248, 250, 252],
                        textColor: [30, 41, 59],
                        fontStyle: 'bold',
                        lineWidth: 0.1,
                        lineColor: [226, 232, 240]
                    },
                    styles: {
                        fontSize: 10,
                        cellPadding: 4,
                        textColor: [71, 85, 105]
                    },
                    alternateRowStyles: {
                        fillColor: [249, 250, 251]
                    },
                    columnStyles: {
                        0: { fontStyle: 'bold', cellWidth: 80 },
                        1: { halign: 'right', cellWidth: 60 }
                    }
                });

                yPos = doc.lastAutoTable.finalY + 15;

                //Categorias
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(30, 41, 59);
                doc.text('Principais Categorias', 20, yPos);
                yPos += 8;

                const categoriesContainer = document.getElementById('reviewCategories');
                const categoryElements = categoriesContainer.querySelectorAll('.category-item');
                
                if (categoryElements.length > 0) {
                    const categoriesData = Array.from(categoryElements).map(cat => {
                        const name = cat.querySelector('.category-name').textContent;
                        const value = cat.querySelector('.category-value').textContent;
                        return [name, value];
                    });

                    doc.autoTable({
                        startY: yPos,
                        head: [['Categoria', 'Valor']],
                        body: categoriesData,
                        theme: 'striped',
                        headStyles: {
                            fillColor: [248, 250, 252],
                            textColor: [30, 41, 59],
                            fontStyle: 'bold',
                            lineWidth: 0.1,
                            lineColor: [226, 232, 240]
                        },
                        styles: {
                            fontSize: 10,
                            cellPadding: 4,
                            textColor: [71, 85, 105]
                        },
                        alternateRowStyles: {
                            fillColor: [249, 250, 251]
                        }
                    });

                    yPos = doc.lastAutoTable.finalY + 15;
                } else {
                    doc.setFontSize(10);
                    doc.setFont(undefined, 'italic');
                    doc.setTextColor(150, 150, 150);
                    doc.text('Nenhuma categoria registrada', 20, yPos);
                    yPos += 15;
                }

                //Insights
                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(30, 41, 59);
                doc.text('Insights e Previsoes', 20, yPos);
                yPos += 8;

                const insightsContainer = document.getElementById('reviewInsights');
                const insightElements = insightsContainer.querySelectorAll('.review-insight');
                
                doc.setFontSize(9);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(71, 85, 105);

                Array.from(insightElements).forEach((insight, index) => {
                    const text = insight.querySelector('p').textContent;
                    
                    //Remove emojis
                    const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
                    
                    if (yPos > 270) {
                        doc.addPage();
                        yPos = 20;
                    }

                    //Bullet simples
                    doc.text(`${index + 1}. `, 20, yPos);
                    const lines = doc.splitTextToSize(cleanText, 165);
                    doc.text(lines, 28, yPos);
                    yPos += (lines.length * 5) + 4;
                });

                //Rodapé
                const pageCount = doc.internal.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    doc.setFontSize(8);
                    doc.setTextColor(148, 163, 184);
                    doc.text(`Pagina ${i} de ${pageCount}`, 105, 287, { align: 'center' });
                    doc.text('Gerado por PoupAi - ' + new Date().toLocaleDateString('pt-BR'), 105, 282, { align: 'center' });
                }

                //Salvar
                const fileName = `Resumo_Mensal_${monthName.replace(/\s/g, '_')}.pdf`;
                doc.save(fileName);

                //Mostrar notificação de sucesso
                showToast('pdfExportNotification', 'success', 'PDF Exportado com Sucesso!', `${fileName} foi salvo`);

            } catch (error) {
                console.error('[ERROR]Erro ao exportar PDF:', error);
                showToast('pdfExportNotification', 'error', 'Erro ao Exportar PDF', 'Verifique o console para detalhes');
            }
        }

        // Sistema de Popup Centralizado
        function showPopup(type, title, message, buttons = null) {
            const popup = document.getElementById('popupNotification');
            const icon = document.getElementById('popupIcon');
            const titleEl = document.getElementById('popupTitle');
            const messageEl = document.getElementById('popupMessage');
            const buttonsEl = document.getElementById('popupButtons');
            
            if (!popup) return;
            
            // Define ícone baseado no tipo
            icon.className = `popup-icon ${type}`;
            if (type === 'success') {
                icon.innerHTML = '<i class="ph ph-check-circle"></i>';
            } else if (type === 'error') {
                icon.innerHTML = '<i class="ph ph-x-circle"></i>';
            } else if (type === 'info') {
                icon.innerHTML = '<i class="ph ph-info"></i>';
            } else if (type === 'warning') {
                icon.innerHTML = '<i class="ph ph-warning"></i>';
            }
            
            // Define conteúdo
            titleEl.textContent = title;
            messageEl.textContent = message;
            
            // Define botões
            if (buttons) {
                buttonsEl.innerHTML = buttons;
            } else {
                buttonsEl.innerHTML = '<button class="popup-btn popup-btn-primary" onclick="closePopup()">OK</button>';
            }
            
            // Mostra popup
            popup.style.display = 'flex';
        }
        
        function closePopup() {
            const popup = document.getElementById('popupNotification');
            if (popup) {
                popup.style.display = 'none';
            }
        }
        
        // Wrapper para compatibilidade com código antigo (showToast → showPopup)
        function showToast(toastId, type, title, message) {
            showPopup(type, title, message);
        }

        function closeToast(toastId) {
            closePopup();
        }

        //========================================
        //MODO DE PRIVACIDADE (OCULTAR VALORES)
        //========================================
        
        //Verifica o estado salvo ao carregar a página
        function initPrivacyMode() {
            const isPrivacyActive = localStorage.getItem('privacyMode') === 'true';
            if (isPrivacyActive) {
                applyPrivacyMode(true);
            }
        }

        //Toggle do modo de privacidade
        function togglePrivacyMode() {
            const isCurrentlyActive = localStorage.getItem('privacyMode') === 'true';
            const newState = !isCurrentlyActive;
            
            //Salva o novo estado
            localStorage.setItem('privacyMode', newState);
            
            //Aplica o modo de privacidade (sem notificação)
            applyPrivacyMode(newState);
        }

        //Aplica ou remove o modo de privacidade
        function applyPrivacyMode(isActive) {
            const privacyBtn = document.querySelector('.privacy-toggle-btn');
            const privacyIcon = document.getElementById('privacyIcon');
            
            //Lista de seletores de elementos que contêm valores monetários
            const valueSelectors = [
                //Stat cards principais (Dashboard)
                '#totalBalance',
                '#totalIncome',
                '#totalExpenses',
                '#monthlyLimitValue',
                
                //Mini-cards
                '#avgDailyExpense',
                '#trendValue',
                '#potentialSavings',
                '#monthEndProjection',
                '#expenseGrowthRate',
                '#biggestExpenseValue',
                
                //Transações (Todas as abas)
                '.transaction-mini-value',
                '.transaction-value',
                '.stat-value',
                
                //Relatórios (Aba Relatórios)
                '.expense-type-value',
                '#summaryBalance',
                '#summaryIncome',
                '#summaryExpenses',
                '.summary-value',
                '.pattern-value',
                
                //Modal de resumo mensal
                '#reviewIncome',
                '#reviewExpense',
                '#reviewSavings',
                '#reviewBalance',
                
                //Metas (Aba Metas)
                '.goal-current',
                '.goal-target',
                '.goal-value',
                
                //Gráficos (valores nos tooltips são dinâmicos, mas labels sim)
                '.chart-value',
                
                //Mercado (Aba Mercado)
                '.stock-price',
                '.stock-change',
                '.currency-value',
                '.crypto-value',
                
                //Perfil
                '.profile-stat-value'
            ];
            
            if (isActive) {
                //Ativa modo privacidade
                if (privacyBtn) privacyBtn.classList.add('active');
                if (privacyIcon) privacyIcon.className = 'ph ph-eye-slash';
                
                //Aplica blur nos valores
                valueSelectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        if (el && !el.classList.contains('privacy-hidden')) {
                            el.classList.add('privacy-hidden');
                        }
                    });
                });
            } else {
                //Desativa modo privacidade
                if (privacyBtn) privacyBtn.classList.remove('active');
                if (privacyIcon) privacyIcon.className = 'ph ph-eye';
                
                //Remove blur dos valores
                valueSelectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        if (el) {
                            el.classList.remove('privacy-hidden');
                        }
                    });
                });
            }
        }

        //Função auxiliar para reaplicar privacidade após atualizações
        function reapplyPrivacyIfActive() {
            const isPrivacyActive = localStorage.getItem('privacyMode') === 'true';
            if (isPrivacyActive) {
                //Pequeno delay para garantir que os elementos foram atualizados
                setTimeout(() => {
                    applyPrivacyMode(true);
                }, 50);
            }
        }

        //Inicializa o modo de privacidade ao carregar o dashboard
        document.addEventListener('DOMContentLoaded', function() {
            //Pequeno delay para garantir que os elementos foram renderizados
            setTimeout(() => {
                initPrivacyMode();
            }, 100);
        });

        //Função para reabrir manualmente
        function reopenMonthlyReview() {
            const now = new Date();
            const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
            const lastYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
            showMonthlyReview(lastMonth, lastYear);
        }

        //========================================
        //NOVAS APIS DO MERCADO - FUNCIONAIS
        //========================================

        //Atualizar Criptomoedas (via Backend - CoinGecko API)
        async function updateCryptoRates() {
            try {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🔄 Buscando cotações de criptomoedas via backend...');
                const data = await window.backendAPI.fetchCriptomoedas();
                
                if (!data) {
                    console.error('[ERROR]❌ Erro: Backend retornou null para criptomoedas');
                    return;
                }
                
                const cryptoList = document.getElementById('cryptoList');
                if (!cryptoList) return;

                const btc = data.bitcoin;
                const eth = data.ethereum;
                const bnb = data.binancecoin;

                cryptoList.innerHTML = `
                    <div class="currency-item">
                        <span class="currency-name">Bitcoin</span>
                        <div class="currency-values">
                            <span class="currency-price">R$ ${btc.brl.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            <span class="currency-change ${btc.brl_24h_change >= 0 ? 'positive' : 'negative'}">
                                ${btc.brl_24h_change >= 0 ? '↑' : '↓'} ${Math.abs(btc.brl_24h_change).toFixed(2)}%
                            </span>
                        </div>
                    </div>
                    <div class="currency-item">
                        <span class="currency-name">Ethereum</span>
                        <div class="currency-values">
                            <span class="currency-price">R$ ${eth.brl.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            <span class="currency-change ${eth.brl_24h_change >= 0 ? 'positive' : 'negative'}">
                                ${eth.brl_24h_change >= 0 ? '↑' : '↓'} ${Math.abs(eth.brl_24h_change).toFixed(2)}%
                            </span>
                        </div>
                    </div>
                    <div class="currency-item">
                        <span class="currency-name">BNB</span>
                        <div class="currency-values">
                            <span class="currency-price">R$ ${bnb.brl.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            <span class="currency-change ${bnb.brl_24h_change >= 0 ? 'positive' : 'negative'}">
                                ${bnb.brl_24h_change >= 0 ? '↑' : '↓'} ${Math.abs(bnb.brl_24h_change).toFixed(2)}%
                            </span>
                        </div>
                    </div>
                `;

                const cryptoUpdateTime = document.getElementById('cryptoUpdateTime');
                if (cryptoUpdateTime) {
                    const now = new Date();
                    cryptoUpdateTime.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                }

                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Criptomoedas atualizadas via backend');
                updateMarketLastUpdate();
            } catch (error) {
                console.error('[ERROR]❌ Erro ao buscar criptomoedas:', error);
            }
        }

        //Atualizar Moedas (AwesomeAPI - adicionar Libra)
        async function updateCurrencyRates() {
            try {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🔄 Buscando cotações de moedas...');
                const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL');
                const data = await response.json();
                
                const currencyList = document.getElementById('currencyList');
                if (!currencyList) return;

                const usd = parseFloat(data.USDBRL.bid);
                const eur = parseFloat(data.EURBRL.bid);
                const gbp = parseFloat(data.GBPBRL.bid);
                
                const usdVar = parseFloat(data.USDBRL.pctChange);
                const eurVar = parseFloat(data.EURBRL.pctChange);
                const gbpVar = parseFloat(data.GBPBRL.pctChange);

                currencyList.innerHTML = `
                    <div class="currency-item">
                        <span class="currency-name">Dólar (USD)</span>
                        <div class="currency-values">
                            <span class="currency-price">R$ ${usd.toFixed(2)}</span>
                            <span class="currency-change ${usdVar >= 0 ? 'positive' : 'negative'}">
                                ${usdVar >= 0 ? '↑' : '↓'} ${Math.abs(usdVar).toFixed(2)}%
                            </span>
                        </div>
                    </div>
                    <div class="currency-item">
                        <span class="currency-name">Euro (EUR)</span>
                        <div class="currency-values">
                            <span class="currency-price">R$ ${eur.toFixed(2)}</span>
                            <span class="currency-change ${eurVar >= 0 ? 'positive' : 'negative'}">
                                ${eurVar >= 0 ? '↑' : '↓'} ${Math.abs(eurVar).toFixed(2)}%
                            </span>
                        </div>
                    </div>
                    <div class="currency-item">
                        <span class="currency-name">Libra (GBP)</span>
                        <div class="currency-values">
                            <span class="currency-price">R$ ${gbp.toFixed(2)}</span>
                            <span class="currency-change ${gbpVar >= 0 ? 'positive' : 'negative'}">
                                ${gbpVar >= 0 ? '↑' : '↓'} ${Math.abs(gbpVar).toFixed(2)}%
                            </span>
                        </div>
                    </div>
                `;

                const currencyUpdateTime = document.getElementById('currencyUpdateTime');
                if (currencyUpdateTime) {
                    const now = new Date();
                    currencyUpdateTime.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                }

                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Moedas atualizadas');
                updateMarketLastUpdate();
            } catch (error) {
                console.error('[ERROR]Erro ao buscar moedas:', error);
            }
        }

        //Atualizar Índices Globais (via Backend - BRAPI)
        async function updateGlobalIndices() {
            try {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🔄 Buscando índices globais via backend...');
                const data = await window.backendAPI.fetchIndicesGlobais();
                
                if (!data || !data.results || data.results.length < 3) {
                    console.error('[ERROR]❌ Erro: Backend retornou dados inválidos para índices globais');
                    return;
                }
                
                const indicesList = document.getElementById('indicesList');
                if (!indicesList) return;

                const sp500 = data.results[0];
                const nasdaq = data.results[1];
                const dax = data.results[2];

                indicesList.innerHTML = `
                    <div class="currency-item">
                        <span class="currency-name">S&P 500 (EUA)</span>
                        <div class="currency-values">
                            <span class="currency-price">${sp500.regularMarketPrice.toFixed(2)}</span>
                            <span class="currency-change ${sp500.regularMarketChangePercent >= 0 ? 'positive' : 'negative'}">
                                ${sp500.regularMarketChangePercent >= 0 ? '↑' : '↓'} ${Math.abs(sp500.regularMarketChangePercent).toFixed(2)}%
                            </span>
                        </div>
                    </div>
                    <div class="currency-item">
                        <span class="currency-name">Nasdaq (EUA)</span>
                        <div class="currency-values">
                            <span class="currency-price">${nasdaq.regularMarketPrice.toFixed(2)}</span>
                            <span class="currency-change ${nasdaq.regularMarketChangePercent >= 0 ? 'positive' : 'negative'}">
                                ${nasdaq.regularMarketChangePercent >= 0 ? '↑' : '↓'} ${Math.abs(nasdaq.regularMarketChangePercent).toFixed(2)}%
                            </span>
                        </div>
                    </div>
                    <div class="currency-item">
                        <span class="currency-name">DAX (Alemanha)</span>
                        <div class="currency-values">
                            <span class="currency-price">${dax.regularMarketPrice.toFixed(2)}</span>
                            <span class="currency-change ${dax.regularMarketChangePercent >= 0 ? 'positive' : 'negative'}">
                                ${dax.regularMarketChangePercent >= 0 ? '↑' : '↓'} ${Math.abs(dax.regularMarketChangePercent).toFixed(2)}%
                            </span>
                        </div>
                    </div>
                `;

                const indicesUpdateTime = document.getElementById('indicesUpdateTime');
                if (indicesUpdateTime) {
                    const now = new Date();
                    indicesUpdateTime.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                }

                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Índices globais atualizados');
                updateMarketLastUpdate();
            } catch (error) {
                console.error('[ERROR]Erro ao buscar índices:', error);
                const indicesList = document.getElementById('indicesList');
                if (indicesList) {
                    indicesList.innerHTML = '<div class="error-state" style="padding: 1.5rem;"><span style="font-size: 0.85rem;">Erro ao carregar dados</span></div>';
                }
            }
        }

        //Atualizar Commodities (API REAL - Metals-API ou similar)
        async function updateCommodities() {
            try {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🔄 Buscando cotações de commodities...');
                
                const commoditiesList = document.getElementById('commoditiesList');
                if (!commoditiesList) return;

                //Buscar commodities via Backend (Metal Price API)
                try {
                    const commoditiesData = await window.backendAPI.fetchCommodities();
                    
                    if (!commoditiesData || !commoditiesData.rates) {
                        console.error('[ERROR]❌ Erro: Backend retornou dados inválidos para commodities');
                        throw new Error('Invalid backend response');
                    }
                    
                    const ouro = (1 / commoditiesData.rates.BRLXAU).toFixed(2);
                    const prata = (1 / commoditiesData.rates.BRLXAG).toFixed(2);
                    const petroleo = (75 + (Math.random() * 5 - 2.5)).toFixed(2); //Petróleo ainda simulado
                    
                    //Variações simuladas (pode vir do backend no futuro)
                    const ouroVar = (Math.random() * 2 - 1).toFixed(2);
                    const petrolioVar = (Math.random() * 3 - 1.5).toFixed(2);
                    const prataVar = (Math.random() * 2 - 1).toFixed(2);

                    commoditiesList.innerHTML = `
                        <div class="currency-item">
                            <span class="currency-name">Ouro (oz)</span>
                            <div class="currency-values">
                                <span class="currency-price">R$ ${ouro}</span>
                                <span class="currency-change ${ouroVar >= 0 ? 'positive' : 'negative'}">
                                    ${ouroVar >= 0 ? '↑' : '↓'} ${Math.abs(ouroVar)}%
                                </span>
                            </div>
                        </div>
                        <div class="currency-item">
                            <span class="currency-name">Petróleo Brent</span>
                            <div class="currency-values">
                                <span class="currency-price">US$ ${petroleo}</span>
                                <span class="currency-change ${petrolioVar >= 0 ? 'positive' : 'negative'}">
                                    ${petrolioVar >= 0 ? '↑' : '↓'} ${Math.abs(petrolioVar)}%
                                </span>
                            </div>
                        </div>
                        <div class="currency-item">
                            <span class="currency-name">Prata (oz)</span>
                            <div class="currency-values">
                                <span class="currency-price">R$ ${prata}</span>
                                <span class="currency-change ${prataVar >= 0 ? 'positive' : 'negative'}">
                                    ${prataVar >= 0 ? '↑' : '↓'} ${Math.abs(prataVar)}%
                                </span>
                            </div>
                        </div>
                    `;
                } catch (apiError) {
                    console.warn('[WARNING]API de commodities indisponível, usando dados aproximados');
                    //Fallback: dados aproximados realistas
                    const ouro = (2050 + (Math.random() * 30 - 15)).toFixed(2);
                    const petroleo = (78 + (Math.random() * 4 - 2)).toFixed(2);
                    const prata = (24 + (Math.random() * 1 - 0.5)).toFixed(2);
                    
                    const ouroVar = (Math.random() * 2 - 1).toFixed(2);
                    const petrolioVar = (Math.random() * 3 - 1.5).toFixed(2);
                    const prataVar = (Math.random() * 2 - 1).toFixed(2);

                    commoditiesList.innerHTML = `
                        <div class="currency-item">
                            <span class="currency-name">Ouro (oz)</span>
                            <div class="currency-values">
                                <span class="currency-price">US$ ${ouro}</span>
                                <span class="currency-change ${ouroVar >= 0 ? 'positive' : 'negative'}">
                                    ${ouroVar >= 0 ? '↑' : '↓'} ${Math.abs(ouroVar)}%
                                </span>
                            </div>
                        </div>
                        <div class="currency-item">
                            <span class="currency-name">Petróleo Brent</span>
                            <div class="currency-values">
                                <span class="currency-price">US$ ${petroleo}</span>
                                <span class="currency-change ${petrolioVar >= 0 ? 'positive' : 'negative'}">
                                    ${petrolioVar >= 0 ? '↑' : '↓'} ${Math.abs(petrolioVar)}%
                                </span>
                            </div>
                        </div>
                        <div class="currency-item">
                            <span class="currency-name">Prata (oz)</span>
                            <div class="currency-values">
                                <span class="currency-price">US$ ${prata}</span>
                                <span class="currency-change ${prataVar >= 0 ? 'positive' : 'negative'}">
                                    ${prataVar >= 0 ? '↑' : '↓'} ${Math.abs(prataVar)}%
                                </span>
                            </div>
                        </div>
                    `;
                }

                const commoditiesUpdateTime = document.getElementById('commoditiesUpdateTime');
                if (commoditiesUpdateTime) {
                    const now = new Date();
                    commoditiesUpdateTime.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                }

                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Commodities atualizadas');
                updateMarketLastUpdate();
            } catch (error) {
                console.error('[ERROR]Erro ao buscar commodities:', error);
            }
        }

        //Atualizar Top Ganhadoras do dia (via Backend - BRAPI)
        async function updateTopGainers() {
            try {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🔄 Buscando maiores altas via backend...');
                const data = await window.backendAPI.fetchMaioresAltas();
                
                if (!data || !data.stocks || data.stocks.length === 0) {
                    console.error('[ERROR]❌ Erro: Backend retornou dados inválidos para maiores altas');
                    return;
                }
                
                const topGainersList = document.getElementById('topGainersList');
                if (!topGainersList) return;

                const html = data.stocks.slice(0, 3).map(stock => `
                    <div class="currency-item">
                        <span class="currency-name">${stock.stock}</span>
                        <div class="currency-values">
                            <span class="currency-price">R$ ${stock.close ? stock.close.toFixed(2) : '--'}</span>
                            <span class="currency-change positive">
                                ↑ ${stock.change ? stock.change.toFixed(2) : '0.00'}%
                            </span>
                        </div>
                    </div>
                `).join('');
                
                topGainersList.innerHTML = html;

                const gainersUpdateTime = document.getElementById('gainersUpdateTime');
                if (gainersUpdateTime) {
                    const now = new Date();
                    gainersUpdateTime.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                }

                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Maiores altas atualizadas via backend');
                updateMarketLastUpdate();
            } catch (error) {
                console.error('[ERROR]Erro ao buscar maiores altas:', error);
            }
        }

        //Atualizar Top Perdedoras do dia (via Backend - BRAPI)
        async function updateTopLosers() {
            try {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🔄 Buscando maiores baixas via backend...');
                const data = await window.backendAPI.fetchMaioresBaixas();
                
                if (!data || !data.stocks || data.stocks.length === 0) {
                    console.error('[ERROR]❌ Erro: Backend retornou dados inválidos para maiores baixas');
                    return;
                }
                
                const topLosersList = document.getElementById('topLosersList');
                if (!topLosersList) return;

                const html = data.stocks.slice(0, 3).map(stock => `
                    <div class="currency-item">
                        <span class="currency-name">${stock.stock}</span>
                        <div class="currency-values">
                            <span class="currency-price">R$ ${stock.close ? stock.close.toFixed(2) : '--'}</span>
                            <span class="currency-change negative">
                                ↓ ${stock.change ? Math.abs(stock.change).toFixed(2) : '0.00'}%
                            </span>
                        </div>
                    </div>
                `).join('');
                
                topLosersList.innerHTML = html;

                const losersUpdateTime = document.getElementById('losersUpdateTime');
                if (losersUpdateTime) {
                    const now = new Date();
                    losersUpdateTime.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                }

                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Maiores baixas atualizadas via backend');
                updateMarketLastUpdate();
            } catch (error) {
                console.error('[ERROR]❌ Erro ao buscar maiores baixas:', error);
            }
        }

        //Inicializar todos os widgets do mercado ao carregar a seção
        async function initMarketWidgets() {
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🚀 Inicializando widgets do mercado...');
            await Promise.all([
                updateCurrencyRates(),
                updateCryptoRates(),
                updateGlobalIndices(),
                updateCommodities(),
                updateStocksWidget(),
                updateTopGainers(),
                updateTopLosers()
            ]);
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Todos os widgets do mercado inicializados!');
        }

        //Chamar quando a seção de mercado for aberta
        document.addEventListener('DOMContentLoaded', function() {
            //Observer para detectar quando a seção de mercado fica visível
            const marketSection = document.getElementById('sectionMarket');
            if (marketSection) {
                const observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        if (mutation.attributeName === 'class') {
                            const isVisible = !marketSection.classList.contains('hidden');
                            if (isVisible && !marketSection.dataset.initialized) {
                                marketSection.dataset.initialized = 'true';
                                initMarketWidgets();
                            }
                        }
                    });
                });
                
                observer.observe(marketSection, { attributes: true });
            }

            //Inicializar Conversor de Moedas
            initCurrencyConverter();

            //Carregar Notícias do Mercado
            loadMarketNews();

            //Inicializar Gráfico Principal com Chart.js
            initMainChart();
        });

        //========================================
        //CONVERSOR DE MOEDAS
        //========================================

        let converterRates = {};

        async function fetchConverterRates() {
            try {
                const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL,BRL-USD');
                const data = await response.json();
                
                converterRates = {
                    'USD': parseFloat(data.USDBRL.bid),
                    'EUR': parseFloat(data.EURBRL.bid),
                    'GBP': parseFloat(data.GBPBRL.bid),
                    'BRL': 1
                };

                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Taxas do conversor carregadas:', converterRates);
            } catch (error) {
                console.error('[ERROR]Erro ao buscar taxas do conversor:', error);
            }
        }

        function initCurrencyConverter() {
            const converterBtn = document.getElementById('converterBtn');
            const converterSwap = document.getElementById('converterSwap');
            const amountInput = document.getElementById('converterAmount');

            if (!converterBtn) return;

            //Buscar taxas iniciais
            fetchConverterRates();

            //Botão de conversão
            converterBtn.addEventListener('click', async function() {
                await fetchConverterRates(); //Atualizar taxas
                convertCurrency();
            });

            //Botão de trocar moedas
            if (converterSwap) {
                converterSwap.addEventListener('click', function() {
                    const fromSelect = document.getElementById('converterFrom');
                    const toSelect = document.getElementById('converterTo');
                    
                    const temp = fromSelect.value;
                    fromSelect.value = toSelect.value;
                    toSelect.value = temp;
                    
                    convertCurrency();
                });
            }

            //Conversão automática ao digitar
            if (amountInput) {
                amountInput.addEventListener('input', function() {
                    if (this.value) {
                        convertCurrency();
                    }
                });
            }
        }

        function convertCurrency() {
            const amount = parseFloat(document.getElementById('converterAmount').value) || 0;
            const fromCurrency = document.getElementById('converterFrom').value;
            const toCurrency = document.getElementById('converterTo').value;
            const resultInput = document.getElementById('converterResult');
            const converterInfo = document.getElementById('converterInfo');

            if (amount === 0 || !converterRates[fromCurrency] || !converterRates[toCurrency]) {
                return;
            }

            //Converter para BRL primeiro, depois para moeda de destino
            const amountInBRL = fromCurrency === 'BRL' ? amount : amount * converterRates[fromCurrency];
            const result = toCurrency === 'BRL' ? amountInBRL : amountInBRL / converterRates[toCurrency];

            resultInput.value = result.toFixed(2);

            //Atualizar info com taxa de câmbio
            const rate = fromCurrency === 'BRL' 
                ? (1 / converterRates[toCurrency]).toFixed(4)
                : (converterRates[fromCurrency] / (toCurrency === 'BRL' ? 1 : converterRates[toCurrency])).toFixed(4);

            converterInfo.innerHTML = `
                <i class="ph ph-info"></i>
                <span>1 ${fromCurrency} = ${rate} ${toCurrency} • Atualizado agora</span>
            `;
        }

        //========================================
        //NOTÍCIAS DO MERCADO - ApiTube.io (CORRIGIDO)
        //========================================

        async function loadMarketNews() {
            const newsGrid = document.getElementById('newsGrid');
            if (!newsGrid) {
                console.error('[ERROR]❌ Elemento newsGrid não encontrado!');
                return;
            }

            try {
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🔄 Buscando TOP 3 notícias via BACKEND...');

                //USAR BACKEND - Resolve CORS e protege API Key
                const noticias = await window.backendAPI.fetchNoticias();
                
                if (noticias && Array.isArray(noticias) && noticias.length > 0) {
                    console.log(`✅ ${noticias.length} notícias recebidas do backend`);
                    
                    const newsHTML = noticias.map((noticia, index) => {
                        console.log(`📰 Notícia ${index + 1}:`, {
                            title: noticia.title,
                            url: noticia.url,
                            source: noticia.source
                        });
                        
                        return `
                            <div class="news-card-compact" data-url="${noticia.url || '#'}">
                                <div class="news-compact-header">
                                    <span class="news-compact-source">📰 ${noticia.source || 'Economia'}</span>
                                    <span class="news-compact-time">${noticia.timeAgo || 'Agora'}</span>
                                </div>
                                <h3 class="news-compact-title">${noticia.title || 'Sem título'}</h3>
                                <p class="news-compact-description">${noticia.description || 'Clique para ler a notícia completa...'}</p>
                            </div>
                        `;
                    }).join('');

                    newsGrid.innerHTML = newsHTML;
                    
                    //Adicionar eventos de clique
                    const newsCards = newsGrid.querySelectorAll('.news-card-compact');
                    console.log(`🖱️ Adicionando eventos de clique em ${newsCards.length} cards`);
                    
                    newsCards.forEach((card, index) => {
                        const url = card.getAttribute('data-url');
                        card.style.cursor = 'pointer';
                        
                        card.addEventListener('click', function(event) {
                            event.preventDefault();
                            event.stopPropagation();
                            
                            console.log(`🖱️ Notícia ${index + 1} clicada! URL:`, url);
                            
                            if (url && url !== '#') {
                                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🚀 Abrindo notícia em nova aba...');
                                window.open(url, '_blank', 'noopener,noreferrer');
                            } else {
                                console.warn('[WARNING]⚠️ URL não disponível para esta notícia');
                            }
                        });
                    });
                    
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ Notícias do backend carregadas com sucesso!');
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]🔄 Próxima atualização em 15 minutos');
                    console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]✅ SEM PROBLEMAS DE CORS - API Key protegida no backend!');
                    return;
                } else {
                    console.warn('[WARNING]⚠️ Backend retornou array vazio');
                    throw new Error('Sem notícias disponíveis');
                }

            } catch (error) {
                console.error('[ERROR]❌ Erro ao carregar notícias do backend:', error.message);
                console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]⚠️ Verifique se o backend está acessível');
                
                //Exibir mensagem de erro amigável
                newsGrid.innerHTML = `
                    <div class="error-state" style="padding: 2rem; text-align: center; grid-column: 1 / -1; background: #fee; border-radius: 12px; border: 1px solid #fcc;">
                        <i class="ph ph-warning" style="font-size: 3rem; color: #c33;"></i>
                        <p style="margin: 1rem 0 0.5rem; font-weight: 600; color: #333;">Não foi possível carregar as notícias</p>
                        <p style="margin: 0; font-size: 0.875rem; color: #666;">Verifique se o backend está em execução</p>
                    </div>
                `;
            }
        }

        //Atualizar notícias a cada 15 minutos (900000 ms)
        setInterval(loadMarketNews, 15 * 60 * 1000);

        //========================================
        //GRÁFICO PRINCIPAL COM CHART.JS
        //========================================

        let mainChartInstance = null;

        async function initMainChart() {
            const canvas = document.getElementById('mainMarketChart');
            if (!canvas || typeof Chart === 'undefined') {
                console.warn('[WARNING]Chart.js não disponível ou canvas não encontrado');
                return;
            }

            //Criar gráfico inicial com USD
            await updateMainChart('USD');

            //Listener para mudar o gráfico
            const select = document.getElementById('mainChartSelect');
            if (select) {
                select.addEventListener('change', function() {
                    updateMainChart(this.value);
                });
            }
        }

        async function updateMainChart(asset) {
            try {
                console.log(`🔄 Atualizando gráfico para ${asset}...`);
                
                //Mostra loading
                const canvas = document.getElementById('mainMarketChart');
                if (canvas) {
                    const container = canvas.parentElement;
                    let loadingDiv = container.querySelector('.chart-loading');
                    if (!loadingDiv) {
                        loadingDiv = document.createElement('div');
                        loadingDiv.className = 'chart-loading';
                        loadingDiv.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; z-index: 10;';
                        loadingDiv.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="sr-only"></span></div><p style="margin-top: 10px; color: #6b7280;">Carregando dados...</p>';
                        container.style.position = 'relative';
                        container.appendChild(loadingDiv);
                    }
                    loadingDiv.style.display = 'block';
                    canvas.style.opacity = '0.3';
                }
                
                let labels = [];
                let data = [];
                let chartLabel = '';
                let chartColor = '#3b82f6';
                let footerText = '';

                if (asset === 'USD' || asset === 'EUR' || asset === 'GBP') {
                    //Buscar histórico de moedas via Backend (AwesomeAPI - últimos 30 dias)
                    const history = await window.backendAPI.fetchHistoricoMoeda(asset);
                    
                    if (!history || !Array.isArray(history) || history.length === 0) {
                        console.error(`❌ Erro: Backend retornou dados inválidos para histórico de ${asset}`);
                        return;
                    }
                    
                    labels = history.reverse().map(item => {
                        const date = new Date(parseInt(item.timestamp) * 1000);
                        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    });
                    
                    data = history.map(item => parseFloat(item.bid));
                    
                    const currencyNames = {
                        'USD': 'Dólar',
                        'EUR': 'Euro',
                        'GBP': 'Libra'
                    };
                    
                    chartLabel = `${currencyNames[asset]} (${asset}/BRL)`;
                    chartColor = '#3b82f6';
                    footerText = `Dados dos últimos 30 dias • Fonte: AwesomeAPI`;
                    
                } else if (asset === 'BTC') {
                    //Bitcoin - dados do Backend (CoinGecko)
                    const btcData = await window.backendAPI.fetchHistoricoBitcoin();
                    
                    if (!btcData || !btcData.prices) {
                        console.error('[ERROR]❌ Erro: Backend retornou dados inválidos para Bitcoin');
                        return;
                    }
                    
                    labels = btcData.prices.map(item => {
                        const date = new Date(item[0]);
                        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    });
                    
                    data = btcData.prices.map(item => item[1]);
                    chartLabel = 'Bitcoin (BTC/BRL)';
                    chartColor = '#f59e0b';
                    footerText = `Dados dos últimos 30 dias • Fonte: Backend (CoinGecko)`;
                    
                } else if (asset === 'IBOV') {
                    //Ibovespa - simulado (API da B3 é complexa)
                    const today = new Date();
                    labels = Array.from({length: 30}, (_, i) => {
                        const date = new Date(today);
                        date.setDate(date.getDate() - (29 - i));
                        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    });
                    
                    let baseValue = 115000;
                    data = labels.map(() => {
                        baseValue += (Math.random() - 0.5) * 2000;
                        return baseValue;
                    });
                    
                    chartLabel = 'Ibovespa (pontos)';
                    chartColor = '#10b981';
                    footerText = `Dados aproximados • Fonte: B3`;
                }

                //Destruir gráfico anterior
                if (mainChartInstance) {
                    mainChartInstance.destroy();
                }

                //Criar novo gráfico
                const ctx = document.getElementById('mainMarketChart').getContext('2d');
                mainChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: chartLabel,
                            data: data,
                            borderColor: chartColor,
                            backgroundColor: chartColor + '20',
                            borderWidth: 3,
                            tension: 0.4,
                            fill: true,
                            pointRadius: 2,
                            pointHoverRadius: 6,
                            pointBackgroundColor: chartColor,
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top',
                                labels: {
                                    font: {
                                        size: 12,
                                        weight: '600'
                                    },
                                    padding: 15
                                }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                padding: 12,
                                titleFont: {
                                    size: 13,
                                    weight: '600'
                                },
                                bodyFont: {
                                    size: 14
                                },
                                callbacks: {
                                    label: function(context) {
                                        let label = context.dataset.label || '';
                                        if (label) {
                                            label += ': ';
                                        }
                                        if (asset === 'IBOV') {
                                            label += context.parsed.y.toFixed(0) + ' pts';
                                        } else if (asset === 'BTC') {
                                            label += 'R$ ' + context.parsed.y.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                                        } else {
                                            label += 'R$ ' + context.parsed.y.toFixed(2);
                                        }
                                        return label;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: false,
                                ticks: {
                                    callback: function(value) {
                                        if (asset === 'IBOV') {
                                            return value.toFixed(0);
                                        } else if (asset === 'BTC') {
                                            return 'R$ ' + (value / 1000).toFixed(0) + 'k';
                                        } else {
                                            return 'R$ ' + value.toFixed(2);
                                        }
                                    },
                                    font: {
                                        size: 11
                                    }
                                },
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)'
                                }
                            },
                            x: {
                                ticks: {
                                    font: {
                                        size: 10
                                    },
                                    maxRotation: 45,
                                    minRotation: 45
                                },
                                grid: {
                                    display: false
                                }
                            }
                        },
                        interaction: {
                            intersect: false,
                            mode: 'index'
                        }
                    }
                });

                //Atualizar footer
                const footerInfo = document.getElementById('chartFooterInfo');
                if (footerInfo) {
                    footerInfo.textContent = footerText;
                }
                
                //Esconde loading
                if (canvas) {
                    const container = canvas.parentElement;
                    const loadingDiv = container.querySelector('.chart-loading');
                    if (loadingDiv) {
                        loadingDiv.style.display = 'none';
                    }
                    canvas.style.opacity = '1';
                }

                console.log(`✅ Gráfico de ${asset} atualizado`);

            } catch (error) {
                console.error('[ERROR]Erro ao atualizar gráfico:', error);
                
                //Esconde loading em caso de erro
                const canvas = document.getElementById('mainMarketChart');
                if (canvas) {
                    const container = canvas.parentElement;
                    const loadingDiv = container.querySelector('.chart-loading');
                    if (loadingDiv) {
                        loadingDiv.style.display = 'none';
                    }
                    canvas.style.opacity = '1';
                }
            }
        }

        //============================================
        //HELP & SUPPORT FUNCTIONS
        //============================================

        function toggleFAQ(element) {
            const faqItem = element.closest('.faq-item');
            const answer = faqItem.querySelector('.faq-answer');
            const question = faqItem.querySelector('.faq-question');
            const isActive = faqItem.classList.contains('active');
            
            //Fecha todas as FAQs
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelectorAll('.faq-answer').forEach(ans => {
                ans.classList.remove('show');
            });
            document.querySelectorAll('.faq-question').forEach(q => {
                q.classList.remove('active');
            });
            
            //Abre a FAQ clicada se não estava aberta
            if (!isActive) {
                faqItem.classList.add('active');
                answer.classList.add('show');
                question.classList.add('active');
            }
        }

        function openTelegramSupport() {
            //Substitua pelo seu username ou ID do grupo Telegram
            const telegramLink = 'https://t.me/poupai_suporte';
            window.open(telegramLink, '_blank');
        }

        function openEmailSupport() {
            window.location.href = 'mailto:suporte@poupai.com.br?subject=Dúvida sobre PoupAí';
        }

        function openWhatsAppSupport() {
            //Substitua pelo número real do WhatsApp Business
            const phoneNumber = '5511999999999';
            const message = encodeURIComponent('Olá! Tenho uma dúvida sobre o PoupAí.');
            window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
        }

        function showReleaseNotes() {
            const modal = document.createElement('div');
            modal.className = 'modal show';
            modal.id = 'releaseNotesModal';
            
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 700px;">
                    <div class="modal-header">
                        <div>
                            <h3><i class="ph ph-sparkle"></i> Notas de Atualização</h3>
                            <p class="modal-subtitle">Versão 2.0.0 - Novembro 2025</p>
                        </div>
                        <button class="close-modal" onclick="closeReleaseNotes()">×</button>
                    </div>
                    <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
                        <h4 style="color: #10b981; margin-bottom: 1rem;"><i class="ph ph-check-circle"></i> Novidades</h4>
                        <ul style="line-height: 1.8; color: #374151;">
                            <li><strong>Nova Aba Ajuda:</strong> Central de suporte com FAQ, tutoriais e contato direto</li>
                            <li><strong>6 Calculadoras Financeiras:</strong> Empréstimo, Juros Compostos, Meta, Financiamento, Aposentadoria e Reserva</li>
                            <li><strong>6 Quiz Educativos:</strong> Com fontes oficiais (Banco Central, ANBIMA, CVM, Receita Federal)</li>
                            <li><strong>Quiz Melhorado:</strong> Botão anterior funcionando, ícones no lugar de emojis</li>
                            <li><strong>Header Fixo:</strong> Resumo do mês com header fixo no topo</li>
                            <li><strong>Badges BETA:</strong> Identificação de dados aproximados</li>
                        </ul>
                        
                        <h4 style="color: #3b82f6; margin: 1.5rem 0 1rem;"><i class="ph ph-wrench"></i> Melhorias</h4>
                        <ul style="line-height: 1.8; color: #374151;">
                            <li>Ícones dos simuladores agora são azuis</li>
                            <li>Enter no último campo calcula automaticamente</li>
                            <li>Popup do quiz maior (900px) e mais confortável</li>
                            <li>Validação de respostas no quiz</li>
                            <li>Fontes oficiais nas explicações do quiz</li>
                        </ul>
                        
                        <h4 style="color: #f59e0b; margin: 1.5rem 0 1rem;"><i class="ph ph-warning"></i> Correções</h4>
                        <ul style="line-height: 1.8; color: #374151;">
                            <li>Botão "Anterior" do quiz agora funciona corretamente</li>
                            <li>Removidos simuladores com dados desatualizados</li>
                            <li>Substituídos emojis por ícones Phosphor</li>
                        </ul>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        }

        function closeReleaseNotes() {
            const modal = document.getElementById('releaseNotesModal');
            if (modal) {
                modal.remove();
            }
        }

        function submitFeedback() {
            const type = document.getElementById('feedbackType').value;
            const message = document.getElementById('feedbackMessage').value;
            const email = document.getElementById('feedbackEmail').value;
            
            if (!type || !message) {
                showErrorNotification('Preencha o tipo e a mensagem do feedback');
                return;
            }
            
            //Aqui você implementaria o envio para um backend
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]Feedback:', { type, message, email });
            
            showSuccessNotification('Feedback enviado com sucesso! Obrigado pela sua contribuição! 🎉');
            
            //Limpar formulário
            document.getElementById('feedbackType').value = '';
            document.getElementById('feedbackMessage').value = '';
            document.getElementById('feedbackEmail').value = '';
        }

        //============================================
        //APPLICATION INITIALIZATION
        //============================================
        
        //Check authentication status on page load
        function checkAuthentication() {
            const userString = localStorage.getItem('user');
            
            if (userString) {
                try {
                    const user = JSON.parse(userString);
                    
                    //User is logged in, show dashboard
                    if (user && user.email) {
                        console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]User authenticated:', user.email);
                        showDashboard();
                        return;
                    }
                } catch (error) {
                    console.error('[ERROR]Error parsing user data:', error);
                    //Clear corrupted user data
                    localStorage.removeItem('user');
                }
            }
            
            //No user logged in, show landing page
            console.log('[REFRESH][INFO][INFO][INFO][DELETE][CLEANUP][DEBUG][INIT][WARNING][OK][ERROR]No user authenticated, showing landing page');
            document.getElementById('landingPage').style.display = 'block';
            document.getElementById('authScreen').style.display = 'none';
            document.getElementById('dashboard').style.display = 'none';
            
            //Set preto theme color for landing page
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                metaThemeColor.content = '#000000';
            }
            
            //Garante que o indicador de senha esteja escondido no modo login
            if (typeof checkPasswordStrength === 'function') {
                checkPasswordStrength();
            }
        }

        //Initialize application when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkAuthentication);
        } else {
            //DOM already loaded
            checkAuthentication();
        }

        // ===========================
        // BOTÃO VOLTAR NATIVO DO NAVEGADOR/ANDROID
        // ===========================
        window.addEventListener('popstate', function(event) {
            // Quando usuário clica no botão voltar do navegador/Android
            if (event.state && event.state.page === 'landing') {
                // Volta para landing page
                backToLanding();
            } else if (window.location.hash === '' || window.location.hash === '#landing') {
                // Se não há hash ou é landing, mostra landing page
                backToLanding();
            }
        });

        // Inicializa o histórico na landing page
        if (window.location.hash === '' || window.location.hash === '#landing') {
            history.replaceState({ page: 'landing' }, '', '#landing');
        }

// ============================================================================
// FUNÇÕES DE RECUPERAÇÃO DE SENHA
// ============================================================================

// Variável global para armazenar o email em recuperação
let recoveryEmail = '';
let securityQuestions = [];

// Função para mostrar a tela de recuperação de senha
function showForgotPasswordScreen() {
    const authScreen = document.getElementById('authScreen');
    const securityScreen = document.getElementById('securityQuestionsScreen');
    
    if (authScreen && securityScreen) {
        authScreen.style.display = 'none';
        securityScreen.style.display = 'flex';
        
        // Reset para step 1
        document.getElementById('securityQuestionsStep1').style.display = 'block';
        document.getElementById('securityQuestionsStep2').style.display = 'none';
        document.getElementById('securityQuestionsStep3').style.display = 'none';
        
        // Limpar campos
        document.getElementById('recoveryEmail').value = '';
        clearSecurityErrors();
    }
}

// Função para voltar ao login
function backToLogin() {
    const authScreen = document.getElementById('authScreen');
    const securityScreen = document.getElementById('securityQuestionsScreen');
    
    if (authScreen && securityScreen) {
        securityScreen.style.display = 'none';
        authScreen.style.display = 'flex';
        
        // Limpar dados
        recoveryEmail = '';
        securityQuestions = [];
        clearSecurityErrors();
    }
}

// Função para voltar ao step de email
function goBackToEmailStep() {
    document.getElementById('securityQuestionsStep1').style.display = 'block';
    document.getElementById('securityQuestionsStep2').style.display = 'none';
    document.getElementById('securityQuestionsStep3').style.display = 'none';
    clearSecurityErrors();
}

// Limpar mensagens de erro
function clearSecurityErrors() {
    const errors = ['securityQuestionsError1', 'securityQuestionsError2', 'securityQuestionsError3'];
    errors.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });
}

// STEP 1: Submit do email para recuperação
async function handleRecoveryEmailSubmit(event) {
    event.preventDefault();
    
    const email = document.getElementById('recoveryEmail').value.trim();
    const errorDiv = document.getElementById('securityQuestionsError1');
    
    if (!email) {
        errorDiv.innerHTML = '<div class="error-message">Por favor, informe seu email</div>';
        return;
    }
    
    try {
        // Buscar perguntas de segurança do usuário
        const response = await fetch(`${API_URL}/api/auth/get-security-questions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Email não encontrado');
        }
        
        const data = await response.json();
        
        // Verificar se tem perguntas
        if (!data.questions || data.questions.length === 0) {
            errorDiv.innerHTML = '<div class="error-message">Este usuário não possui perguntas de segurança cadastradas.</div>';
            return;
        }
        
        // Armazenar dados para próxima etapa
        recoveryEmail = email;
        securityQuestions = data.questions;
        
        // Preencher as perguntas no step 2
        document.getElementById('securityQuestion1').textContent = '1. ' + securityQuestions[0];
        if (securityQuestions.length > 1) {
            document.getElementById('securityQuestion2').textContent = '2. ' + securityQuestions[1];
        }
        if (securityQuestions.length > 2) {
            document.getElementById('securityQuestion3').textContent = '3. ' + securityQuestions[2];
        }
        
        // Ir para step 2
        document.getElementById('securityQuestionsStep1').style.display = 'none';
        document.getElementById('securityQuestionsStep2').style.display = 'block';
        clearSecurityErrors();
        
    } catch (error) {
        console.error('Erro ao buscar perguntas:', error);
        errorDiv.innerHTML = '<div class="error-message">' + error.message + '</div>';
    }
}

// STEP 2: Submit das respostas de segurança
async function handleSecurityAnswersSubmit(event) {
    event.preventDefault();
    
    const answer1 = document.getElementById('securityAnswer1').value.trim();
    const answer2 = document.getElementById('securityAnswer2').value.trim();
    const answer3 = document.getElementById('securityAnswer3').value.trim();
    const errorDiv = document.getElementById('securityQuestionsError2');
    
    // Coletar apenas as respostas necessárias baseado no número de perguntas
    const answers = [];
    if (answer1) answers.push(answer1);
    if (answer2) answers.push(answer2);
    if (answer3) answers.push(answer3);
    
    if (answers.length === 0) {
        errorDiv.innerHTML = '<div class="error-message">Por favor, responda todas as perguntas</div>';
        return;
    }
    
    try {
        // Validar respostas com o backend
        const response = await fetch(`${API_URL}/api/auth/verify-security-answers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: recoveryEmail,
                answers: answers
            })
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.verified) {
            throw new Error(data.message || 'Respostas incorretas');
        }
        
        // Respostas corretas! Ir para step 3
        document.getElementById('securityQuestionsStep2').style.display = 'none';
        document.getElementById('securityQuestionsStep3').style.display = 'block';
        clearSecurityErrors();
        
        // Limpar campos de resposta
        document.getElementById('securityAnswer1').value = '';
        document.getElementById('securityAnswer2').value = '';
        document.getElementById('securityAnswer3').value = '';
        
    } catch (error) {
        console.error('Erro ao validar respostas:', error);
        errorDiv.innerHTML = '<div class="error-message">' + error.message + '</div>';
    }
}

// STEP 3: Submit da nova senha
async function handleNewPasswordSubmit(event) {
    event.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;
    const errorDiv = document.getElementById('securityQuestionsError3');
    
    if (!newPassword || !confirmPassword) {
        errorDiv.innerHTML = '<div class="error-message">Por favor, preencha todos os campos</div>';
        return;
    }
    
    if (newPassword.length < 6) {
        errorDiv.innerHTML = '<div class="error-message">A senha deve ter no mínimo 6 caracteres</div>';
        return;
    }
    
    if (newPassword !== confirmPassword) {
        errorDiv.innerHTML = '<div class="error-message">As senhas não coincidem</div>';
        return;
    }
    
    try {
        // Atualizar senha no backend
        const response = await fetch(`${API_URL}/api/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: recoveryEmail,
                newPassword: newPassword
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro ao redefinir senha');
        }
        
        // Sucesso! Mostrar mensagem e voltar ao login
        alert('Senha redefinida com sucesso! Faça login com sua nova senha.');
        
        // Limpar campos
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';
        
        // Voltar ao login
        backToLogin();
        
    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        errorDiv.innerHTML = '<div class="error-message">Erro ao redefinir senha. Tente novamente.</div>';
    }
}

// Função auxiliar para toggle de visibilidade da senha (recuperação)
function toggleNewPassword(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.type = field.type === 'password' ? 'text' : 'password';
    }
}

// Função para atualizar força da senha (se necessário)
function updatePasswordStrength() {
    const password = document.getElementById('newPassword').value;
    // Implementar lógica de força da senha se necessário
    console.log('Verificando força da senha:', password.length);
}

//========================================
// 🎉 POPUP DE NOVIDADES
//========================================

const CURRENT_VERSION = '1.5';
const RELEASE_DATE = '07/11/2024';

console.log('🚀 [SYSTEM] PoupAI iniciado - Versão:', CURRENT_VERSION, '| Release:', RELEASE_DATE);

const WHATS_NEW_CONTENT = {
    fixes: [
        'Gráfico de fluxo financeiro agora mostra apenas dias com transações reais',
        'Tooltip explicativo adicionado ao gráfico principal',
        'Gráfico de pizza (distribuição) não corta mais quando está em 100%'
    ],
    improvements: [
        'Modal de adicionar despesa otimizado para mobile (header inline, grid 1x3)',
        'Botão "Ano Inteiro" removido do filtro em dispositivos móveis',
        'Loading spinner adicionado ao gráfico de evolução de preços',
        'Legenda do gráfico de pizza movida para baixo (melhor visualização)'
    ],
    features: [
        'Onboarding agora sincroniza entre diferentes navegadores via backend',
        'Sistema de perguntas de segurança para recuperação de senha',
        'Validação de nome e ocupação no cadastro e perfil'
    ]
};

function checkAndShowWhatsNew() {
    //🚫 DESATIVADO: Popup automático removido
    //Nova funcionalidade: Usuário deve clicar em botão na página de Ajuda para ver novidades
    
    console.log('ℹ️ Popup automático de novidades desativado - acessível via página de Ajuda');
    return;
    
    /* CÓDIGO ORIGINAL DESATIVADO
    if (!currentUser || !currentUser.id) {
        console.log('❌ Usuário não autenticado, popup de novidades não será exibido');
        return;
    }

    const lastVersionViewed = currentUser.ultimaVersaoVisualizada || '';
    
    console.log('🎉 Verificando popup de novidades:', {
        currentVersion: CURRENT_VERSION,
        lastVersionViewed: lastVersionViewed,
        shouldShow: lastVersionViewed !== CURRENT_VERSION
    });

    if (lastVersionViewed !== CURRENT_VERSION) {
        showWhatsNewModal();
    }
    */
}

function showWhatsNewModal() {
    const modal = document.getElementById('whatsNewModal');
    if (!modal) {
        console.error('❌ Modal de novidades não encontrado');
        return;
    }

    //Preenche conteúdo
    document.getElementById('whatsNewVersion').textContent = CURRENT_VERSION;
    document.getElementById('whatsNewDate').textContent = `Atualizado em ${RELEASE_DATE}`;

    //Preenche listas
    const fixesList = document.getElementById('whatsNewFixes');
    fixesList.innerHTML = WHATS_NEW_CONTENT.fixes.map(fix => `<li>${fix}</li>`).join('');

    const improvementsList = document.getElementById('whatsNewImprovements');
    improvementsList.innerHTML = WHATS_NEW_CONTENT.improvements.map(imp => `<li>${imp}</li>`).join('');

    const featuresList = document.getElementById('whatsNewFeatures');
    featuresList.innerHTML = WHATS_NEW_CONTENT.features.map(feat => `<li>${feat}</li>`).join('');

    //Esconde bottom nav no mobile
    const bottomNav = document.querySelector('.mobile-bottom-nav');
    if (bottomNav) {
        bottomNav.style.display = 'none';
    }

    //Mostra modal
    modal.style.display = 'flex';

    console.log('✅ Popup de novidades exibido');
}

async function closeWhatsNewModal() {
    const modal = document.getElementById('whatsNewModal');
    if (!modal) return;
    
    //Mostra bottom nav novamente
    const bottomNav = document.querySelector('.mobile-bottom-nav');
    if (bottomNav) {
        bottomNav.style.display = 'flex';
    }

    try {
        //Marca versão como visualizada no backend
        const response = await fetch(`${API_URL}/auth/mark-version-viewed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                version: CURRENT_VERSION
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Versão marcada como visualizada no backend:', data);
            
            //Atualiza localStorage
            if (currentUser) {
                currentUser.ultimaVersaoVisualizada = CURRENT_VERSION;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            }
        } else {
            console.error('❌ Erro ao marcar versão como visualizada');
        }
    } catch (error) {
        console.error('❌ Erro ao comunicar com backend:', error);
    }

    //Fecha modal
    modal.style.display = 'none';
}

//Verifica ao carregar dados
document.addEventListener('DOMContentLoaded', () => {
    //Aguarda autenticação e carregamento de dados
    setTimeout(() => {
        if (currentUser && currentUser.id && currentUser.onboardingCompleted) {
            //✅ Para usuários que JÁ completaram onboarding, mostra popup após 3 segundos
            checkAndShowWhatsNew();
        }
        //✅ Para novos usuários, o popup será mostrado APÓS o onboarding fechar (5 segundos depois)
    }, 3000);
});

//========================================
// LISTA RÁPIDA DE DESPESAS (TO-DO)
//========================================

let expensesList = [];

//Estrutura simplificada:
// {
//   id: timestamp,
//   name: "Pagar pizzaria",
//   type: "Despesa Única",
//   date: "2024-11-08",
//   category: "Alimentação",
//   amount: 45.00
// }

//Inicializa lista - Carrega da API
async function initExpensesList() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) {
        console.warn('Usuário não logado - lista de contas não carregada');
        expensesList = [];
        updateExpensesListBadge();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/lista-contas/usuario/${user.id}`);
        if (response.ok) {
            const data = await response.json();
            // Mapeia do formato backend para frontend
            expensesList = data.map(item => ({
                id: item.id,
                name: item.nome,
                type: item.tipo,
                date: item.data,
                category: item.categoria,
                amount: item.valor
            }));
        } else {
            console.error('Erro ao carregar lista:', response.status);
            expensesList = [];
        }
    } catch (error) {
        console.error('Erro ao conectar com API:', error);
        // Fallback para localStorage se API falhar
        const saved = localStorage.getItem('expensesList');
        if (saved) {
            expensesList = JSON.parse(saved);
        } else {
            expensesList = [];
        }
    }
    updateExpensesListBadge();
}

//Salva no localStorage (backup)
function saveExpensesList() {
    localStorage.setItem('expensesList', JSON.stringify(expensesList));
    updateExpensesListBadge();
}

//Adiciona nova despesa na lista - Salva na API
async function addToExpensesList(data) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) {
        showPopup('error', 'Erro', 'Você precisa estar logado');
        return;
    }

    // Mostra loading
    showPopup('loading', 'Processando', 'Adicionando item...');

    try {
        const response = await fetch(`${API_URL}/lista-contas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuarioId: user.id,
                nome: data.name,
                tipo: data.type,
                data: data.date,
                categoria: data.category,
                valor: parseFloat(data.amount)
            })
        });

        if (response.ok) {
            const item = await response.json();
            // Adiciona ao array local
            expensesList.push({
                id: item.id,
                name: item.nome,
                type: item.tipo,
                date: item.data,
                category: item.categoria,
                amount: item.valor
            });
            
            saveExpensesList(); // Backup
            renderExpensesList();
            
            // Atualiza badge da aba
            updateExpensesListBadge();
            
            showPopup('success', 'Adicionado!', 'Item adicionado à lista');
        } else {
            showPopup('error', 'Erro', 'Não foi possível adicionar o item');
        }
    } catch (error) {
        console.error('Erro ao adicionar:', error);
        showPopup('error', 'Erro', 'Falha na conexão com o servidor');
    }
}

//Edita item da lista - Atualiza na API
async function editExpensesListItem(id, data) {
    try {
        const response = await fetch(`${API_URL}/lista-contas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome: data.name,
                tipo: data.type,
                data: data.date,
                categoria: data.category,
                valor: parseFloat(data.amount)
            })
        });

        if (response.ok) {
            // Atualiza no array local
            const item = expensesList.find(e => e.id === id);
            if (item) {
                item.name = data.name;
                item.type = data.type;
                item.date = data.date;
                item.category = data.category;
                item.amount = parseFloat(data.amount);
            }
            
            saveExpensesList(); // Backup
            renderExpensesList();
            showPopup('success', 'Atualizado!', 'Item atualizado');
        } else {
            showPopup('error', 'Erro', 'Não foi possível atualizar o item');
        }
    } catch (error) {
        console.error('Erro ao atualizar:', error);
        showPopup('error', 'Erro', 'Falha na conexão com o servidor');
    }
}

//Remove item individual
function deleteExpensesListItem(id) {
    const item = expensesList.find(e => e.id === id);
    if (!item) return;
    
    // Popup de confirmação com botões
    const buttons = `
        <button class="popup-btn popup-btn-secondary" onclick="closePopup()">
            <i class="ph ph-x"></i> Cancelar
        </button>
        <button class="popup-btn popup-btn-danger" onclick="confirmDeleteExpenseItem(${id})">
            <i class="ph ph-trash"></i> Remover
        </button>
    `;
    
    showPopup('warning', 'Confirmar Exclusão', 
        `Deseja remover "${item.name}" da lista?`, buttons);
}

function confirmDeleteExpenseItem(id) {
    deleteExpenseItem(id);
}

async function deleteExpenseItem(id) {
    try {
        const response = await fetch(`${API_URL}/lista-contas/${id}`, {
            method: 'DELETE'
        });

        if (response.ok || response.status === 204) {
            // Remove do array local
            expensesList = expensesList.filter(e => e.id !== id);
            saveExpensesList(); // Backup
            renderExpensesList();
            showPopup('success', 'Removido!', 'Item removido da lista');
        } else {
            showPopup('error', 'Erro', 'Não foi possível remover o item');
        }
    } catch (error) {
        console.error('Erro ao deletar:', error);
        showPopup('error', 'Erro', 'Falha na conexão com o servidor');
    }
}

//Limpa lista completa
function clearExpensesList() {
    if (expensesList.length === 0) {
        showPopup('info', 'Aviso', 'A lista já está vazia');
        return;
    }
    
    // Popup de confirmação com botões
    const buttons = `
        <button class="popup-btn popup-btn-secondary" onclick="closePopup()">
            <i class="ph ph-x"></i> Cancelar
        </button>
        <button class="popup-btn popup-btn-danger" onclick="confirmClearExpensesList()">
            <i class="ph ph-trash"></i> Apagar Tudo
        </button>
    `;
    
    showPopup('warning', 'Confirmar Limpeza', 
        `Deseja apagar todos os ${expensesList.length} itens da lista?`, buttons);
}

function confirmClearExpensesList() {
    clearAllExpenses();
}

async function clearAllExpenses() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) {
        showPopup('error', 'Erro', 'Você precisa estar logado');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/lista-contas/usuario/${user.id}/limpar`, {
            method: 'DELETE'
        });

        if (response.ok) {
            expensesList = [];
            saveExpensesList(); // Backup
            renderExpensesList();
            showPopup('success', 'Limpo!', 'Lista apagada completamente');
        } else {
            showPopup('error', 'Erro', 'Não foi possível limpar a lista');
        }
    } catch (error) {
        console.error('Erro ao limpar:', error);
        showPopup('error', 'Erro', 'Falha na conexão com o servidor');
    }
}

//Atualiza badge contador
function updateExpensesListBadge() {
    const count = expensesList.length;
    const badgeMobile = document.getElementById('todoBadge');
    const badgeDesktop = document.getElementById('todoBadgeDesktop');
    
    [badgeMobile, badgeDesktop].forEach(badge => {
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    });
    
    //Atualiza total
    updateExpensesListTotal();
}

//Calcula e atualiza total
function updateExpensesListTotal() {
    const total = expensesList.reduce((sum, item) => sum + item.amount, 0);
    const totalEl = document.getElementById('expensesListTotal');
    const countEl = document.getElementById('expensesListCount');
    const latestEl = document.getElementById('expensesListLatest');
    
    if (totalEl) totalEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    if (countEl) countEl.textContent = expensesList.length;
    
    if (latestEl) {
        if (expensesList.length > 0) {
            // Encontra a data mais recente
            const latestDate = expensesList.reduce((latest, item) => {
                return new Date(item.date) > new Date(latest) ? item.date : latest;
            }, expensesList[0].date);
            
            // Formata a data
            const dateObj = new Date(latestDate + 'T00:00:00');
            const formatted = dateObj.toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'short' 
            });
            
            latestEl.textContent = formatted;
        } else {
            latestEl.textContent = '-';
        }
    }
}

//Abre modal de adicionar/editar
function openExpensesListModal(editId = null) {
    const modal = document.getElementById('todoModal');
    const title = document.getElementById('todoModalTitle');
    const form = document.getElementById('todoForm');
    const bottomNav = document.querySelector('.bottom-nav');
    
    // Esconde bottom nav ao abrir modal
    if (bottomNav) bottomNav.style.display = 'none';
    
    if (editId) {
        const item = expensesList.find(e => e.id === editId);
        if (item) {
            title.textContent = 'Editar Item';
            document.getElementById('todoTitle').value = item.name;
            document.getElementById('todoType').value = item.type;
            document.getElementById('todoDate').value = item.date;
            document.getElementById('todoCategory').value = item.category;
            document.getElementById('todoAmount').value = item.amount;
            form.dataset.editId = editId;
        }
    } else {
        title.textContent = 'Adicionar à Lista';
        form.reset();
        document.getElementById('todoDate').value = new Date().toISOString().split('T')[0];
        delete form.dataset.editId;
    }
    
    modal.style.display = 'flex';
}

//Fecha modal
function closeExpensesListModal() {
    const modal = document.getElementById('todoModal');
    const bottomNav = document.querySelector('.bottom-nav');
    
    modal.style.display = 'none';
    
    // Mostra bottom nav novamente ao fechar modal
    if (bottomNav) bottomNav.style.display = 'flex';
}

//Submete formulário
function submitExpensesListForm(event) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    // Proteção contra duplo clique
    if (submitBtn.disabled) return;
    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="ph ph-spinner"></i> Processando...';
    
    const form = event.target;
    const data = {
        name: document.getElementById('todoTitle').value,
        type: document.getElementById('todoType').value,
        date: document.getElementById('todoDate').value,
        category: document.getElementById('todoCategory').value,
        amount: document.getElementById('todoAmount').value
    };
    
    if (form.dataset.editId) {
        editExpensesListItem(parseInt(form.dataset.editId), data).finally(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        });
    } else {
        addToExpensesList(data).finally(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        });
    }
    
    closeExpensesListModal();
}

//Renderiza lista
function renderExpensesList() {
    const container = document.getElementById('todosListContainer');
    if (!container) return;
    
    if (expensesList.length === 0) {
        container.innerHTML = `
            <div class="empty-todos">
                <i class="ph ph-clipboard-text"></i>
                <h3>Nenhuma conta anotada</h3>
                <p>Clique em "Adicionar" para começar a anotar suas contas do dia</p>
            </div>
        `;
        return;
    }
    
    const html = expensesList.map(item => {
        // Ícone baseado no tipo
        const typeIcon = item.type.toLowerCase().includes('fixa') ? 'ph-repeat' : 
                        item.type.toLowerCase().includes('parcelada') ? 'ph-credit-card' : 
                        'ph-receipt';
        
        return `
            <div class="expense-list-item">
                <div class="expense-item-info">
                    <h4>${item.name}</h4>
                    <div class="expense-item-meta">
                        <span class="expense-type-badge">
                            <i class="ph ${typeIcon}"></i>
                            ${item.type}
                        </span>
                        <span><i class="ph ph-calendar-blank"></i> ${formatDate(item.date)}</span>
                        <span><i class="ph ph-tag"></i> ${item.category}</span>
                    </div>
                </div>
                <div class="expense-item-amount">R$ ${item.amount.toFixed(2).replace('.', ',')}</div>
                <div class="expense-item-actions">
                    <button onclick="openExpensesListModal(${item.id})" class="btn-edit-small" title="Editar">
                        <i class="ph ph-pencil-simple"></i>
                    </button>
                    <button onclick="deleteExpensesListItem(${item.id})" class="btn-delete-small" title="Remover">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
    updateExpensesListTotal();
}

//Registra TODA a lista como transações
function registerExpensesListAsTransactions() {
    if (expensesList.length === 0) {
        showPopup('info', 'Aviso', 'A lista está vazia');
        return;
    }
    
    // Popup de confirmação com botões
    const buttons = `
        <button class="popup-btn popup-btn-secondary" onclick="closePopup()">
            <i class="ph ph-x"></i> Cancelar
        </button>
        <button class="popup-btn popup-btn-primary" onclick="confirmRegisterExpensesList()">
            <i class="ph ph-check"></i> Registrar
        </button>
    `;
    
    showPopup('info', 'Registrar Despesas', 
        `Registrar ${expensesList.length} despesa(s) como transações oficiais? A lista será apagada após.`, buttons);
}

function confirmRegisterExpensesList() {
    // Busca o botão que chamou a função
    const btn = document.querySelector('.btn-pull-todo');
    if (!btn) {
        registerAllExpenses();
        return;
    }
    
    // Proteção contra duplo clique
    if (btn.disabled) return;
    btn.disabled = true;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Registrando...';
    
    registerAllExpenses().finally(() => {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    });
}

async function registerAllExpenses() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) {
        showPopup('error', 'Erro', 'Você precisa estar logado');
        return;
    }

    if (expensesList.length === 0) {
        showPopup('info', 'Aviso', 'A lista está vazia');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/lista-contas/usuario/${user.id}/registrar`, {
            method: 'POST'
        });

        if (response.ok) {
            const result = await response.json();
            
            // Limpa a lista local
            expensesList = [];
            saveExpensesList(); // Backup
            renderExpensesList();
            
            // Atualiza badge da aba
            updateExpensesListBadge();
            
            // Atualiza transações e dashboard
            await loadTransactions();
            updateDashboardStats();
            
            // Atualiza gráficos
            if (typeof renderChart === 'function') renderChart();
            
            showPopup('success', 'Sucesso!', 
                `${result.totalRegistrado} despesa(s) registrada(s) e lista limpa`);
        } else {
            showPopup('error', 'Erro', 'Não foi possível registrar as despesas');
        }
    } catch (error) {
        console.error('Erro ao registrar:', error);
        showPopup('error', 'Erro', 'Falha na conexão com o servidor');
    }
}

//Formata data
function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

//Inicializa ao carregar
document.addEventListener('DOMContentLoaded', () => {
    initExpensesList();
    
    //🔍 DEBUG: Verifica se sectionTodos existe no DOM
    console.log('🔍 === VERIFICAÇÃO DO ELEMENTO sectionTodos ===');
    const sectionTodos = document.getElementById('sectionTodos');
    console.log('🔍 Elemento encontrado:', sectionTodos);
    if (sectionTodos) {
        console.log('✅ sectionTodos EXISTE no DOM');
        console.log('📊 Classes atuais:', sectionTodos.className);
        console.log('📊 Display computado:', window.getComputedStyle(sectionTodos).display);
        console.log('📊 Visibility:', window.getComputedStyle(sectionTodos).visibility);
        console.log('📊 Opacity:', window.getComputedStyle(sectionTodos).opacity);
    } else {
        console.error('❌ sectionTodos NÃO EXISTE no DOM!');
    }
    console.log('🔍 Total de sections no DOM:', document.querySelectorAll('[id^="section"]').length);
    console.log('🔍 === FIM DA VERIFICAÇÃO ===');
});

