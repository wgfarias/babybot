-- ========================================
-- VERIFICAR SE A TABELA DIAPER_RECORDS EXISTE
-- ========================================

-- Verificar se a tabela existe
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'diaper_records';

-- Verificar colunas da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'diaper_records'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'diaper_records';

-- Teste simples de inserção (só para verificar se funciona)
-- DESCOMENTE APENAS SE QUISER TESTAR:
/*
INSERT INTO diaper_records (
    baby_id, 
    caregiver_id, 
    diaper_type, 
    recorded_at
) VALUES (
    (SELECT id FROM babies LIMIT 1),
    (SELECT id FROM caregivers LIMIT 1),
    'teste',
    NOW()
);
*/

