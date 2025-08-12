-- ========================================
-- DIAGNÓSTICO: Por que baby_id está retornando NULL
-- ========================================

-- ERRO: null value in column "baby_id" of relation "diaper_records" violates not-null constraint

-- ========================================
-- 1. VERIFICAR SE A FUNÇÃO get_user_family_id() FUNCIONA
-- ========================================

-- Testar se a função retorna algo
SELECT get_user_family_id() as current_user_family_id;

-- Verificar se auth.uid() está funcionando
SELECT 
    auth.uid() as current_auth_uid,
    auth.uid()::UUID as current_auth_uid_as_uuid;

-- ========================================
-- 2. VERIFICAR SE EXISTEM FAMILIES
-- ========================================

-- Listar todas as famílias
SELECT 
    id,
    name,
    created_at
FROM families 
ORDER BY created_at DESC;

-- ========================================
-- 3. VERIFICAR SE EXISTEM CAREGIVERS
-- ========================================

-- Listar todos os cuidadores
SELECT 
    id,
    name,
    email,
    family_id,
    created_at
FROM caregivers 
ORDER BY created_at DESC;

-- ========================================
-- 4. VERIFICAR SE EXISTEM BABIES
-- ========================================

-- Listar todos os bebês
SELECT 
    id,
    name,
    family_id,
    birth_date,
    created_at
FROM babies 
ORDER BY created_at DESC;

-- ========================================
-- 5. VERIFICAR A RELAÇÃO ENTRE DADOS
-- ========================================

-- Verificar se há bebês para a família do usuário atual
SELECT 
    b.id as baby_id,
    b.name as baby_name,
    b.family_id,
    f.name as family_name,
    get_user_family_id() as current_family_id
FROM babies b
JOIN families f ON b.family_id = f.id
WHERE b.family_id = get_user_family_id();

-- Verificar se há cuidadores para a família do usuário atual
SELECT 
    c.id as caregiver_id,
    c.name as caregiver_name,
    c.family_id,
    f.name as family_name,
    get_user_family_id() as current_family_id
FROM caregivers c
JOIN families f ON c.family_id = f.id
WHERE c.family_id = get_user_family_id();

-- ========================================
-- 6. SOLUÇÕES ALTERNATIVAS PARA TESTE
-- ========================================

-- OPÇÃO A: Usar IDs específicos (se souber que existem)
-- Descomente e substitua pelos IDs reais:
/*
INSERT INTO diaper_records (
    baby_id, 
    caregiver_id, 
    diaper_type, 
    consistency,
    color,
    recorded_at
) VALUES (
    'cole-aqui-um-baby-id-real',      -- Substitua por um UUID real
    'cole-aqui-um-caregiver-id-real', -- Substitua por um UUID real
    'coco',
    'pastoso',
    'amarelo',
    NOW()
);
*/

-- OPÇÃO B: Criar dados de teste se não existirem
-- CUIDADO: Só execute se realmente não houver dados!

-- Criar família de teste (só se não houver nenhuma)
/*
INSERT INTO families (id, name) 
SELECT uuid_generate_v4(), 'Família Teste'
WHERE NOT EXISTS (SELECT 1 FROM families);
*/

-- Criar cuidador de teste (só se não houver nenhum)
/*
INSERT INTO caregivers (id, name, email, family_id)
SELECT 
    uuid_generate_v4(), 
    'Cuidador Teste', 
    'teste@example.com',
    (SELECT id FROM families LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM caregivers);
*/

-- Criar bebê de teste (só se não houver nenhum)
/*
INSERT INTO babies (id, name, family_id, birth_date)
SELECT 
    uuid_generate_v4(),
    'Bebê Teste',
    (SELECT id FROM families LIMIT 1),
    CURRENT_DATE - INTERVAL '6 months'
WHERE NOT EXISTS (SELECT 1 FROM babies);
*/

-- ========================================
-- 7. VERSÃO SEGURA DO TESTE ORIGINAL
-- ========================================

-- Teste que verifica se os dados existem antes de inserir
DO $$
DECLARE
    test_baby_id UUID;
    test_caregiver_id UUID;
BEGIN
    -- Buscar um bebê e cuidador válidos
    SELECT id INTO test_baby_id 
    FROM babies 
    WHERE family_id = get_user_family_id() 
    LIMIT 1;
    
    SELECT id INTO test_caregiver_id 
    FROM caregivers 
    WHERE family_id = get_user_family_id() 
    LIMIT 1;
    
    -- Verificar se encontrou os dados
    IF test_baby_id IS NULL THEN
        RAISE NOTICE 'ERRO: Nenhum bebê encontrado para a família do usuário atual';
        RAISE NOTICE 'Family ID do usuário: %', get_user_family_id();
        RETURN;
    END IF;
    
    IF test_caregiver_id IS NULL THEN
        RAISE NOTICE 'ERRO: Nenhum cuidador encontrado para a família do usuário atual';
        RAISE NOTICE 'Family ID do usuário: %', get_user_family_id();
        RETURN;
    END IF;
    
    -- Se chegou até aqui, pode inserir
    INSERT INTO diaper_records (
        baby_id, 
        caregiver_id, 
        diaper_type, 
        consistency,
        color,
        recorded_at
    ) VALUES (
        test_baby_id,
        test_caregiver_id,
        'coco',
        'pastoso',
        'amarelo',
        NOW()
    );
    
    RAISE NOTICE 'Sucesso! Registro de fralda inserido com baby_id: % e caregiver_id: %', test_baby_id, test_caregiver_id;
END;
$$;
