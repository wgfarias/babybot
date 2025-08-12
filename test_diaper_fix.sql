-- ========================================
-- TESTE DA CORREÇÃO DA CONSTRAINT check_coco_consistency
-- ========================================

-- Este script testa se a correção funcionou corretamente

-- ========================================
-- 1. VERIFICAR A CONSTRAINT ATUAL
-- ========================================
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'check_coco_consistency';

-- ========================================
-- 2. TESTE DE INSERÇÃO VÁLIDA (DEVE FUNCIONAR)
-- ========================================

-- Teste 1: Cocô com consistência definida ✅
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
    'pastoso',  -- ✅ Consistência definida para cocô
    'amarelo',
    NOW()
);

-- Teste 2: Pum sem consistência (deve funcionar) ✅
INSERT INTO diaper_records (
    baby_id, 
    caregiver_id, 
    diaper_type, 
    recorded_at
) VALUES (
    (SELECT id FROM babies WHERE family_id = get_user_family_id() LIMIT 1),
    (SELECT id FROM caregivers WHERE family_id = get_user_family_id() LIMIT 1),
    'pum',      -- ✅ Para pum, consistency pode ser NULL
    NOW()
);

-- ========================================
-- 3. VERIFICAR SE OS DADOS FORAM INSERIDOS
-- ========================================
SELECT 
    id,
    diaper_type,
    consistency,
    color,
    recorded_at
FROM diaper_records 
ORDER BY recorded_at DESC 
LIMIT 5;

-- ========================================
-- 4. TESTE QUE DEVERIA FALHAR (COMENTADO)
-- ========================================
-- Este teste deve falhar com o erro da constraint:
/*
INSERT INTO diaper_records (
    baby_id, 
    caregiver_id, 
    diaper_type, 
    recorded_at
) VALUES (
    (SELECT id FROM babies WHERE family_id = get_user_family_id() LIMIT 1),
    (SELECT id FROM caregivers WHERE family_id = get_user_family_id() LIMIT 1),
    'coco',      -- ❌ Cocô sem consistência deve falhar
    NOW()
);
*/

-- ========================================
-- RESUMO DA CORREÇÃO APLICADA:
-- ========================================

/*
PROBLEMA ORIGINAL:
- Aplicação enviava consistency = null para registros de cocô
- Violava a constraint check_coco_consistency

CORREÇÃO APLICADA:
1. ✅ Adicionada validação no frontend para exigir consistency quando diaper_type = 'coco'
2. ✅ Mensagem de erro clara: "Para registros de cocô, a consistência é obrigatória"
3. ✅ Lógica simplificada para não enviar valores inválidos

RESULTADO:
- Agora é impossível criar um registro de cocô sem consistência
- A constraint continua funcionando como barreira de segurança
- Usuário recebe feedback claro sobre o que precisa preencher
*/
