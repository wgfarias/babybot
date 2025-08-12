-- ========================================
-- DIAGNÓSTICO E CORREÇÃO DO ERRO DE CONSTRAINT check_coco_consistency
-- ========================================

-- PROBLEMA IDENTIFICADO:
-- A constraint check_coco_consistency exige que quando diaper_type = 'coco',
-- o campo consistency NÃO PODE ser NULL.

-- ========================================
-- 1. VERIFICAR A CONSTRAINT ATUAL
-- ========================================

-- Verificar se a constraint existe
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'check_coco_consistency';

-- ========================================
-- 2. VERIFICAR DADOS QUE VIOLAM A CONSTRAINT
-- ========================================

-- Encontrar registros que violam a regra (diaper_type = 'coco' mas consistency = NULL)
SELECT 
    id,
    baby_id,
    diaper_type,
    consistency,
    recorded_at,
    created_at
FROM diaper_records 
WHERE diaper_type = 'coco' 
AND consistency IS NULL;

-- ========================================
-- 3. SOLUÇÕES POSSÍVEIS
-- ========================================

-- OPÇÃO A: Corrigir dados existentes (definir consistência padrão)
-- DESCOMENTE APENAS SE QUISER APLICAR:
/*
UPDATE diaper_records 
SET consistency = 'pastoso'  -- valor padrão razoável
WHERE diaper_type = 'coco' 
AND consistency IS NULL;
*/

-- OPÇÃO B: Remover a constraint temporariamente para investigar
-- DESCOMENTE APENAS SE NECESSÁRIO:
/*
ALTER TABLE diaper_records DROP CONSTRAINT IF EXISTS check_coco_consistency;
*/

-- OPÇÃO C: Recriar a constraint com regra mais flexível
-- DESCOMENTE APENAS SE QUISER APLICAR:
/*
-- Primeiro remove a constraint atual
ALTER TABLE diaper_records DROP CONSTRAINT IF EXISTS check_coco_consistency;

-- Recria com regra mais flexível (permite NULL temporariamente)
ALTER TABLE diaper_records ADD CONSTRAINT check_coco_consistency
    CHECK (
        (diaper_type = 'coco' AND consistency IS NOT NULL) OR
        (diaper_type != 'coco')
    );
*/

-- ========================================
-- 4. EXEMPLO DE INSERT CORRETO
-- ========================================

-- CORRETO: Cocô com consistência definida
/*
INSERT INTO diaper_records (
    baby_id, 
    caregiver_id, 
    diaper_type, 
    consistency,
    color,
    recorded_at
) VALUES (
    (SELECT id FROM babies WHERE family_id = get_user_family_id() LIMIT 1),
    (SELECT id FROM caregivers WHERE family_id = get_user_family_id() LIMIT 1),
    'coco',
    'pastoso',  -- OBRIGATÓRIO para diaper_type = 'coco'
    'amarelo',
    NOW()
);
*/

-- CORRETO: Outros tipos sem consistência
/*
INSERT INTO diaper_records (
    baby_id, 
    caregiver_id, 
    diaper_type, 
    recorded_at
) VALUES (
    (SELECT id FROM babies WHERE family_id = get_user_family_id() LIMIT 1),
    (SELECT id FROM caregivers WHERE family_id = get_user_family_id() LIMIT 1),
    'pum',      -- Para 'pum', 'xixi', 'misto' consistency pode ser NULL
    NOW()
);
*/

-- ========================================
-- 5. VERIFICAR SE O PROBLEMA FOI RESOLVIDO
-- ========================================

-- Verificar se ainda há violações
SELECT 
    COUNT(*) as registros_problematicos
FROM diaper_records 
WHERE diaper_type = 'coco' 
AND consistency IS NULL;

-- Se retornar 0, o problema foi resolvido

-- ========================================
-- 6. TESTE FINAL
-- ========================================

-- Teste de inserção que deveria funcionar
-- DESCOMENTE PARA TESTAR:
/*
INSERT INTO diaper_records (
    baby_id, 
    caregiver_id, 
    diaper_type, 
    consistency,
    recorded_at
) VALUES (
    (SELECT id FROM babies WHERE family_id = get_user_family_id() LIMIT 1),
    (SELECT id FROM caregivers WHERE family_id = get_user_family_id() LIMIT 1),
    'coco',
    'solido',
    NOW()
);
*/

-- ========================================
-- RESUMO DO PROBLEMA:
-- ========================================

/*
ERRO: "new row for relation "diaper_records" violates check constraint "check_coco_consistency""

CAUSA: 
- Tentativa de inserir um registro com diaper_type = 'coco' mas consistency = NULL
- A constraint exige que cocôs tenham consistência definida

SOLUÇÕES:
1. Sempre informar consistency quando diaper_type = 'coco'
2. Valores válidos para consistency: 'liquido', 'pastoso', 'solido', 'seco'
3. Para outros tipos ('pum', 'xixi', 'misto'), consistency pode ser NULL

EXEMPLO DE INSERT CORRETO:
INSERT INTO diaper_records (baby_id, caregiver_id, diaper_type, consistency) 
VALUES (baby_uuid, caregiver_uuid, 'coco', 'pastoso');
*/
