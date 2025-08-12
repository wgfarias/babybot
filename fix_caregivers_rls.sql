-- Corrigir política RLS para permitir que cuidadores vejam outros cuidadores da mesma família

-- Remover a política atual
DROP POLICY IF EXISTS "caregivers_unified_access" ON caregivers;

-- Criar políticas separadas e mais específicas

-- 1. Política para SELECT: Permite ver todos os cuidadores da mesma família
CREATE POLICY "caregivers_select_family" ON caregivers
    FOR SELECT 
    USING (
        -- Acesso público (necessário para login/signup)
        auth.uid() IS NULL
        OR
        -- Acesso aos cuidadores da mesma família
        family_id = get_user_family_id()
    );

-- 2. Política para INSERT: Permite criar novos cuidadores na família
CREATE POLICY "caregivers_insert_family" ON caregivers
    FOR INSERT 
    WITH CHECK (
        -- Durante signup (sem auth ainda)
        auth.uid() IS NULL
        OR
        -- Inserir na própria família
        family_id = get_user_family_id()
    );

-- 3. Política para UPDATE: Permite atualizar qualquer cuidador da família
CREATE POLICY "caregivers_update_family" ON caregivers
    FOR UPDATE 
    USING (family_id = get_user_family_id())
    WITH CHECK (family_id = get_user_family_id());

-- 4. Política para DELETE: Permite deletar qualquer cuidador da família (exceto a si mesmo via aplicação)
CREATE POLICY "caregivers_delete_family" ON caregivers
    FOR DELETE 
    USING (family_id = get_user_family_id());
