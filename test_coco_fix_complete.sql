-- ========================================
-- TESTE COMPLETO DA CORREÇÃO DO PROBLEMA DE COCÔ
-- ========================================

-- PROBLEMA ORIGINAL:
-- "new row for relation "diaper_records" violates check constraint "check_coco_consistency""

-- CAUSAS ENCONTRADAS:
-- 1. handleSubmit() enviava consistency = null para cocôs (✅ CORRIGIDO)
-- 2. handleQuickRecord() não enviava consistency para cocôs (✅ CORRIGIDO)

-- ========================================
-- 1. VERIFICAR A CONSTRAINT ATUAL
-- ========================================

SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'check_coco_consistency';

-- ========================================
-- 2. VERIFICAR REGISTROS EXISTENTES PROBLEMÁTICOS
-- ========================================

-- Buscar registros de cocô sem consistência (se houver)
SELECT 
    id,
    baby_id,
    diaper_type,
    consistency,
    recorded_at
FROM diaper_records 
WHERE diaper_type = 'coco' 
AND consistency IS NULL;

-- ========================================
-- 3. TESTES DE INSERÇÃO VÁLIDOS
-- ========================================

-- Teste 1: Registro de cocô VÁLIDO (com consistência)
-- DESCOMENTE PARA TESTAR:
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
    'pastoso',
    'amarelo',
    NOW()
);
*/

-- Teste 2: Registro de pum VÁLIDO (sem consistência)
-- DESCOMENTE PARA TESTAR:
/*
INSERT INTO diaper_records (
    baby_id, 
    caregiver_id, 
    diaper_type, 
    recorded_at
) VALUES (
    (SELECT id FROM babies WHERE family_id = get_user_family_id() LIMIT 1),
    (SELECT id FROM caregivers WHERE family_id = get_user_family_id() LIMIT 1),
    'pum',
    NOW()
);
*/

-- ========================================
-- 4. TESTE QUE DEVE FALHAR (PARA CONFIRMAR QUE A CONSTRAINT FUNCIONA)
-- ========================================

-- Este teste DEVE falhar com erro de constraint:
-- DESCOMENTE APENAS PARA CONFIRMAR QUE A CONSTRAINT FUNCIONA:
/*
INSERT INTO diaper_records (
    baby_id, 
    caregiver_id, 
    diaper_type, 
    recorded_at
) VALUES (
    (SELECT id FROM babies WHERE family_id = get_user_family_id() LIMIT 1),
    (SELECT id FROM caregivers WHERE family_id = get_user_family_id() LIMIT 1),
    'coco',  -- ❌ Cocô sem consistência deve falhar
    NOW()
);
*/

-- ========================================
-- 5. VERIFICAR ÚLTIMOS REGISTROS
-- ========================================

SELECT 
    id,
    diaper_type,
    consistency,
    color,
    smell_intensity,
    recorded_at,
    created_at
FROM diaper_records 
ORDER BY created_at DESC 
LIMIT 10;

-- ========================================
-- RESUMO DAS CORREÇÕES APLICADAS:
-- ========================================

/*
📋 CORREÇÕES IMPLEMENTADAS:

1. ✅ FRONTEND - handleSubmit():
   - Adicionada validação: se diaper_type = 'coco' e consistency vazio → erro
   - Mensagem clara: "Para registros de cocô, a consistência é obrigatória"
   - Lógica simplificada para enviar consistency apenas quando necessário

2. ✅ FRONTEND - handleQuickRecord():
   - Bloqueio de registros rápidos para cocôs
   - Força uso do formulário completo para cocôs
   - Mensagem: "Para registros de cocô, use o formulário completo para informar a consistência"

3. ✅ CONSTRAINT DATABASE:
   - Mantida a constraint original que garante consistency NOT NULL para cocôs
   - Funciona como barreira de segurança final

RESULTADO ESPERADO:
- ❌ Impossível criar cocô sem consistência via interface
- ✅ Registros de pum/xixi/misto funcionam normalmente  
- ✅ Registros de cocô exigem formulário completo com consistência
- ✅ Mensagens claras orientam o usuário sobre o que fazer

TESTE NA APLICAÇÃO:
1. Tente fazer registro rápido de cocô → deve mostrar aviso e abrir formulário
2. No formulário, tente salvar cocô sem consistência → deve mostrar erro
3. Salve cocô com consistência → deve funcionar normalmente
4. Registros de pum/xixi funcionam em ambos os modos
*/
