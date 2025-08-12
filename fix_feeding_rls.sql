-- Script para corrigir RLS de DELETE para feeding_records
-- Execute este script no SQL Editor do Supabase

-- Verificar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'feeding_records' 
ORDER BY policyname;

-- Remover política de DELETE se existir para recriar
DROP POLICY IF EXISTS "Users can delete feeding records from their family babies" ON feeding_records;

-- Recriar a política de DELETE
CREATE POLICY "Users can delete feeding records from their family babies" ON feeding_records
    FOR DELETE USING (
        baby_id IN (SELECT id FROM babies WHERE family_id = get_user_family_id())
    );

-- Verificar se RLS está habilitado
ALTER TABLE feeding_records ENABLE ROW LEVEL SECURITY;

-- Verificar novamente as políticas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'feeding_records' 
ORDER BY policyname;
