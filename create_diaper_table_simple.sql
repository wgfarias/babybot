-- ========================================
-- CRIAR TABELA DIAPER_RECORDS (VERSÃO SIMPLIFICADA)
-- ========================================

-- Primeiro, criar a tabela principal
CREATE TABLE IF NOT EXISTS diaper_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
    caregiver_id UUID NOT NULL REFERENCES caregivers(id),
    diaper_type VARCHAR(20) NOT NULL CHECK (diaper_type IN ('pum', 'coco', 'xixi', 'misto')),
    consistency VARCHAR(20) CHECK (consistency IN ('liquido', 'pastoso', 'solido', 'seco')),
    color VARCHAR(20) CHECK (color IN ('amarelo', 'marrom', 'verde', 'branco', 'outro')),
    smell_intensity INTEGER CHECK (smell_intensity >= 1 AND smell_intensity <= 5),
    notes TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices básicos
CREATE INDEX IF NOT EXISTS idx_diaper_records_baby_id ON diaper_records(baby_id);
CREATE INDEX IF NOT EXISTS idx_diaper_records_date ON diaper_records(recorded_at);
CREATE INDEX IF NOT EXISTS idx_diaper_records_type ON diaper_records(diaper_type);

-- Trigger para updated_at (se a função já existir)
CREATE TRIGGER update_diaper_records_updated_at 
    BEFORE UPDATE ON diaper_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE diaper_records ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas
CREATE POLICY "Users can view diaper records from their family babies" ON diaper_records
    FOR SELECT USING (
        baby_id IN (SELECT id FROM babies WHERE family_id = get_user_family_id())
    );

CREATE POLICY "Users can insert diaper records for their family babies" ON diaper_records
    FOR INSERT WITH CHECK (
        baby_id IN (SELECT id FROM babies WHERE family_id = get_user_family_id())
    );

CREATE POLICY "Users can update diaper records from their family babies" ON diaper_records
    FOR UPDATE USING (
        baby_id IN (SELECT id FROM babies WHERE family_id = get_user_family_id())
    );

CREATE POLICY "Users can delete diaper records from their family babies" ON diaper_records
    FOR DELETE USING (
        baby_id IN (SELECT id FROM babies WHERE family_id = get_user_family_id())
    );

-- Verificar se foi criado
SELECT 'Tabela diaper_records criada com sucesso!' as status;

