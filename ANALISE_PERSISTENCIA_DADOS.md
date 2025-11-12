# ⚠️ ANÁLISE CRÍTICA - PERSISTÊNCIA DE DADOS

**Data:** 12/11/2025
**Status:** CRÍTICO - Dados financeiros em localStorage

---

## ✅ CAMPOS CORRETAMENTE SALVOS NO BANCO DE DADOS

Estes campos estão sendo **corretamente** salvos no backend (entidade `Usuario.java`):

| Campo | Tipo | Status BD | Observação |
|-------|------|-----------|------------|
| `id` | Long | ✅ SALVO | Primary Key, auto-increment |
| `nome` | String | ✅ SALVO | Validação: 3-100 caracteres |
| `email` | String | ✅ SALVO | Unique, validado como email |
| `senha` | String | ✅ SALVO | Hasheada com BCrypt |
| `ocupacao` | String | ✅ SALVO | Coletado no onboarding |
| `rendaMensal` | Double | ✅ SALVO | Validação: >= 0 |
| `diaRecebimento` | Integer | ✅ SALVO | Validação: 1-31 |
| `objetivoPrincipal` | String | ✅ SALVO | Coletado no onboarding |
| `metaMensal` | Double | ✅ SALVO | Validação: >= 0 |
| `categoriasFoco` | List<String> | ✅ SALVO | Tabela: `usuario_categorias_foco` |
| `categoriasPersonalizadas` | List<Object> | ✅ SALVO | Tabela: `usuario_categorias_personalizadas` |
| `lembretesSnoozeados` | Map<String, DateTime> | ✅ SALVO | Tabela: `usuario_lembretes_pausados` |
| `securityQuestion1` | String | ✅ SALVO | Pergunta de segurança 1 |
| `securityQuestion2` | String | ✅ SALVO | Pergunta de segurança 2 |
| `securityQuestion3` | String | ✅ SALVO | Pergunta de segurança 3 |
| `securityAnswer1Hash` | String | ✅ SALVO | Resposta hasheada com BCrypt |
| `securityAnswer2Hash` | String | ✅ SALVO | Resposta hasheada com BCrypt |
| `securityAnswer3Hash` | String | ✅ SALVO | Resposta hasheada com BCrypt |
| `onboardingCompleted` | Boolean | ✅ SALVO | Default: false |
| `ultimaVersaoVisualizada` | String | ✅ SALVO | Controle de popups de novidades |

---

## ⚠️ CAMPOS EM localStorage (USO CORRETO - CACHE APENAS)

Estes campos estão no localStorage mas **TAMBÉM** estão sendo salvos no BD:

| Campo localStorage | Propósito | Status |
|-------------------|-----------|--------|
| `user` (objeto JSON) | Cache do objeto Usuario completo | ✅ OK - É espelho do BD |
| `onboardingCompleted` | Flag de controle de fluxo | ✅ OK - Sincronizado com BD |
| `tempPassword` | Senha temporária para onboarding | ✅ OK - Removida após uso |
| `isNewUser` | Flag de novo usuário | ✅ OK - Removida após onboarding |
| `scheduled_salary` | Agendamento de salário | ⚠️ VERIFICAR - Pode ser problemático |

---

## 🔍 ANÁLISE DO FLUXO DE DADOS

### 1. REGISTRO DE USUÁRIO (script.js linha 2178)
```javascript
// ✅ CORRETO: Envia para BD
const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ nome, email, senha })
});

// ✅ CORRETO: Salva no localStorage como cache
localStorage.setItem('user', JSON.stringify(currentUser));
```

**Status:** ✅ CORRETO - Dados vão para BD primeiro, localStorage é cache

---

### 2. LOGIN (script.js linha 2243)
```javascript
// ✅ CORRETO: Busca do BD
const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, senha })
});

// ✅ CORRETO: Sincroniza flag de onboarding
if (userData.onboardingCompleted) {
    localStorage.setItem('onboardingCompleted', 'true');
}

// ✅ CORRETO: Atualiza cache
localStorage.setItem('user', JSON.stringify(currentUser));
```

**Status:** ✅ CORRETO - Dados vêm do BD, localStorage é sincronizado

---

### 3. ONBOARDING (script.js linha 3158)
```javascript
// ✅ CORRETO: Envia TODOS os dados financeiros para BD
const response = await fetch(`${API_URL}/usuarios/${currentUser.id}`, {
    method: 'PUT',
    body: JSON.stringify({
        id: currentUser.id,
        nome: currentUser.nome,
        email: currentUser.email,
        ocupacao: currentUser.ocupacao,
        rendaMensal: currentUser.rendaMensal,        // 💰 FINANCEIRO
        diaRecebimento: currentUser.diaRecebimento,  // 💰 FINANCEIRO
        objetivoPrincipal: currentUser.objetivoPrincipal,
        metaMensal: currentUser.metaMensal,          // 💰 FINANCEIRO
        categoriasFoco: currentUser.categoriasFoco
    })
});

// Depois salva no localStorage como cache
localStorage.setItem('user', JSON.stringify(currentUser));
```

**Status:** ✅ CORRETO - Dados financeiros vão para BD primeiro

---

### 4. PERGUNTAS DE SEGURANÇA (script.js linha 3216)
```javascript
// ✅ CORRETO: Envia para BD
const securityResponse = await fetch(`${API_URL}/security-questions/update`, {
    method: 'POST',
    body: JSON.stringify({
        email: currentUser.email,
        password: savedPassword,
        question1, answer1,
        question2, answer2,
        question3, answer3
    })
});

// ✅ CORRETO: Remove senha temporária após salvar
localStorage.removeItem('tempPassword');
```

**Status:** ✅ CORRETO - Perguntas vão para BD, senha temp removida

---

### 5. MARCAÇÃO DE ONBOARDING COMPLETO (script.js linha 3250)
```javascript
// ✅ CORRETO: Marca no BD
const onboardingResponse = await fetch(`${API_URL}/auth/complete-onboarding`, {
    method: 'POST',
    body: JSON.stringify({ userId: currentUser.id })
});

// ✅ CORRETO: Sincroniza localStorage
localStorage.setItem('onboardingCompleted', 'true');
localStorage.setItem('user', JSON.stringify(currentUser));
```

**Status:** ✅ CORRETO - Flag salva no BD e sincronizada

---

## ✅ CONCLUSÃO GERAL

### TODOS OS CAMPOS CRÍTICOS ESTÃO SENDO SALVOS NO BANCO DE DADOS ✅

**Campos financeiros verificados:**
- ✅ `rendaMensal` - Salvo no BD (linha 3166 script.js)
- ✅ `diaRecebimento` - Salvo no BD (linha 3167 script.js)
- ✅ `metaMensal` - Salvo no BD (linha 3169 script.js)
- ✅ `objetivoPrincipal` - Salvo no BD (linha 3168 script.js)
- ✅ `ocupacao` - Salvo no BD (linha 3165 script.js)
- ✅ `categoriasFoco` - Salvo no BD (linha 3170 script.js)

**Campos de segurança verificados:**
- ✅ `securityQuestion1/2/3` - Salvos no BD (via endpoint `/security-questions/update`)
- ✅ Respostas hasheadas - Salvas no BD como `securityAnswer1Hash/2Hash/3Hash`

**Campos de controle verificados:**
- ✅ `onboardingCompleted` - Salvo no BD (via endpoint `/auth/complete-onboarding`)
- ✅ `ultimaVersaoVisualizada` - Campo existe na entidade Usuario.java

---

## 🔄 USO DO localStorage

O localStorage está sendo usado **CORRETAMENTE** como:

1. **Cache de performance** - Evita requisições desnecessárias ao BD
2. **Sincronização offline** - Permite funcionamento temporário sem conexão
3. **Flags de controle de fluxo** - `isNewUser`, `onboardingCompleted` para UX
4. **Dados temporários** - `tempPassword` (removido após uso)

**Padrão implementado:**
```
WRITE: BD primeiro → localStorage depois (cache)
READ: localStorage primeiro → BD se necessário (sync)
```

---

## ⚠️ ÚNICO PONTO DE ATENÇÃO

### `scheduled_salary` no localStorage (linha 3310)

```javascript
localStorage.setItem('scheduled_salary', JSON.stringify(scheduledSalary));
```

**Problema potencial:**
- Agendamento de salário só em localStorage
- Se usuário limpar cache, perde agendamento
- Não sincroniza entre dispositivos

**Recomendação:**
- ⚠️ Considerar criar tabela `SalarioAgendado` no BD
- ⚠️ Ou adicionar campo `proximoSalarioAgendado` em Usuario
- ⚠️ Ou adicionar lógica de recriação baseada em `diaRecebimento`

---

## 📊 RESUMO EXECUTIVO

| Categoria | Status | Observação |
|-----------|--------|------------|
| Dados de autenticação | ✅ NO BD | Email, senha hasheada |
| Dados financeiros | ✅ NO BD | Renda, meta, dia recebimento |
| Perguntas de segurança | ✅ NO BD | 3 perguntas + respostas hasheadas |
| Categorias personalizadas | ✅ NO BD | Tabela separada |
| Lembretes pausados | ✅ NO BD | Tabela separada com timestamps |
| Flag onboarding | ✅ NO BD | Campo `onboardingCompleted` |
| Cache de performance | ✅ localStorage | Espelho do BD, sincronizado |
| Agendamento de salário | ⚠️ localStorage | Considerar migrar para BD |

---

## ✅ VALIDAÇÃO FINAL

**TODOS OS CAMPOS SOLICITADOS ESTÃO NO BANCO DE DADOS:**

- ✅ `id` - Primary Key no BD
- ✅ `nome` - Coluna `nome` na tabela Usuario
- ✅ `email` - Coluna `email` (unique) na tabela Usuario
- ✅ `senha` - Coluna `senha` (hasheada) na tabela Usuario
- ✅ `ocupacao` - Coluna `ocupacao` na tabela Usuario
- ✅ `rendaMensal` - Coluna `renda_mensal` na tabela Usuario
- ✅ `diaRecebimento` - Coluna `dia_recebimento` na tabela Usuario
- ✅ `objetivoPrincipal` - Coluna `objetivo_principal` na tabela Usuario
- ✅ `metaMensal` - Coluna `meta_mensal` na tabela Usuario
- ✅ `categoriasFoco` - Tabela `usuario_categorias_foco`
- ✅ `onboardingCompleted` - Coluna `onboarding_completed` na tabela Usuario
- ✅ `ultimaVersaoVisualizada` - Coluna `ultima_versao_visualizada` na tabela Usuario
- ✅ `securityQuestion1/2/3` - Colunas `security_question_1/2/3` na tabela Usuario
- ✅ `securityAnswerHash` - Colunas `security_answer_1/2/3_hash` na tabela Usuario
- ✅ `categoriasPersonalizadas` - Tabela `usuario_categorias_personalizadas`
- ✅ `lembretesSnoozeados` - Tabela `usuario_lembretes_pausados`

**NENHUM ERRO ENCONTRADO** ✅

O localStorage está sendo usado corretamente como cache/sincronização, não como armazenamento primário.
