-- ============================================
-- SCRIPT PARA LIMPAR O BANCO DE DADOS POUPAI
-- ============================================
-- Execute este script no seu cliente MySQL
-- (MySQL Workbench, DBeaver, Aiven Console, etc)

-- ============================================
-- OPÇÃO 1: LIMPAR APENAS OS DADOS (RECOMENDADO)
-- Mantém a estrutura das tabelas, apaga só os registros
-- ============================================

-- Ver quais tabelas existem
SHOW TABLES;

-- Desabilitar verificação de chaves estrangeiras temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- Limpar dados das tabelas (mantém a estrutura)
TRUNCATE TABLE transactions;
TRUNCATE TABLE goals;
TRUNCATE TABLE reminders;
TRUNCATE TABLE users;

-- Reabilitar verificação de chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 1;

-- Verificar se está vazio
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_transactions FROM transactions;
SELECT COUNT(*) as total_goals FROM goals;
SELECT COUNT(*) as total_reminders FROM reminders;


-- ============================================
-- OPÇÃO 2: DELETAR TUDO (INCLUINDO ESTRUTURA)
-- Use apenas se quiser recriar tudo do zero
-- ============================================

/*
-- Desabilitar verificação de chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 0;

-- Deletar todas as tabelas
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS goals;
DROP TABLE IF EXISTS reminders;
DROP TABLE IF EXISTS users;

-- Reabilitar verificação de chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 1;

-- Verificar que está vazio
SHOW TABLES;
*/


-- ============================================
-- OPÇÃO 3: DELETAR APENAS DADOS DE TESTE
-- Se você quiser manter alguns usuários específicos
-- ============================================

/*
-- Exemplo: Deletar apenas transações antigas
DELETE FROM transactions WHERE date < '2025-01-01';

-- Exemplo: Deletar usuário específico e seus dados
DELETE FROM transactions WHERE user_id = 123;
DELETE FROM goals WHERE user_id = 123;
DELETE FROM reminders WHERE user_id = 123;
DELETE FROM users WHERE id = 123;
*/
