-- ========================================
-- CONFIGURAÇÃO DAS POLÍTICAS RLS PARA TABELA DIAPER_RECORDS
-- ========================================

-- Habilitar RLS na tabela diaper_records (se não estiver habilitado)
ALTER TABLE diaper_records ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver (para recriar)
DROP POLICY IF EXISTS "Users can view diaper records from their family babies" ON diaper_records;
DROP POLICY IF EXISTS "Users can insert diaper records for their family babies" ON diaper_records;
DROP POLICY IF EXISTS "Users can update diaper records from their family babies" ON diaper_records;
DROP POLICY IF EXISTS "Users can delete diaper records from their family babies" ON diaper_records;

-- ========================================
-- POLÍTICA PARA SELECT (Visualizar registros)
-- ========================================
CREATE POLICY "Users can view diaper records from their family babies"
ON diaper_records
FOR SELECT
TO public
USING (
    baby_id IN (
        SELECT babies.id
        FROM babies
        WHERE babies.family_id = get_user_family_id()
    )
);

-- ========================================
-- POLÍTICA PARA INSERT (Inserir novos registros)
-- ========================================
CREATE POLICY "Users can insert diaper records for their family babies"
ON diaper_records
FOR INSERT
TO public
WITH CHECK (
    baby_id IN (
        SELECT babies.id
        FROM babies
        WHERE babies.family_id = get_user_family_id()
    )
);

-- ========================================
-- POLÍTICA PARA UPDATE (Atualizar registros)
-- ========================================
CREATE POLICY "Users can update diaper records from their family babies"
ON diaper_records
FOR UPDATE
TO public
USING (
    baby_id IN (
        SELECT babies.id
        FROM babies
        WHERE babies.family_id = get_user_family_id()
    )
)
WITH CHECK (
    baby_id IN (
        SELECT babies.id
        FROM babies
        WHERE babies.family_id = get_user_family_id()
    )
);

-- ========================================
-- POLÍTICA PARA DELETE (Excluir registros)
-- ========================================
CREATE POLICY "Users can delete diaper records from their family babies"
ON diaper_records
FOR DELETE
TO public
USING (
    baby_id IN (
        SELECT babies.id
        FROM babies
        WHERE babies.family_id = get_user_family_id()
    )
);

-- ========================================
-- VERIFICAÇÃO DAS POLÍTICAS CRIADAS
-- ========================================
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'diaper_records'
ORDER BY cmd;

-- ========================================
-- TESTE DE VERIFICAÇÃO (DESCOMENTE PARA TESTAR)
-- ========================================
/*
-- Verificar se o usuário consegue ver apenas registros da sua família
SELECT 
    dr.*,
    b.name as baby_name,
    b.family_id
FROM diaper_records dr
JOIN babies b ON dr.baby_id = b.id
LIMIT 5;

-- Teste de inserção (substitua os IDs pelos corretos)
INSERT INTO diaper_records (
    baby_id, 
    caregiver_id, 
    diaper_type, 
    recorded_at
) VALUES (
    (SELECT id FROM babies WHERE family_id = get_user_family_id() LIMIT 1),
    (SELECT id FROM caregivers WHERE family_id = get_user_family_id() LIMIT 1),
    'wet',
    NOW()
);
*/
