-- ========================================
-- NOVA TABELA: diaper_records (Registros de Fraldas)
-- ========================================

-- TABELA: diaper_records (Registros de Fraldas - Puns e Cocôs)
CREATE TABLE diaper_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
    caregiver_id UUID NOT NULL REFERENCES caregivers(id),
    diaper_type VARCHAR(20) NOT NULL CHECK (diaper_type IN ('pum', 'coco', 'xixi', 'misto')),
    consistency VARCHAR(20) CHECK (consistency IN ('liquido', 'pastoso', 'solido', 'seco')), -- Para cocôs
    color VARCHAR(20) CHECK (color IN ('amarelo', 'marrom', 'verde', 'branco', 'outro')), -- Para cocôs
    smell_intensity INTEGER CHECK (smell_intensity >= 1 AND smell_intensity <= 5), -- Escala 1-5
    notes TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), -- Horário do evento
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ÍNDICES PARA PERFORMANCE
-- ========================================

CREATE INDEX idx_diaper_records_baby_id ON diaper_records(baby_id);
CREATE INDEX idx_diaper_records_date ON diaper_records(recorded_at);
CREATE INDEX idx_diaper_records_type ON diaper_records(diaper_type);
CREATE INDEX idx_diaper_records_baby_date ON diaper_records(baby_id, recorded_at);

-- ========================================
-- TRIGGERS PARA UPDATED_AT
-- ========================================

CREATE TRIGGER update_diaper_records_updated_at BEFORE UPDATE ON diaper_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- CONSTRAINTS E VALIDAÇÕES
-- ========================================

-- Validações específicas para cocôs (devem ter consistência)
ALTER TABLE diaper_records ADD CONSTRAINT check_coco_consistency
    CHECK (
        (diaper_type = 'coco' AND consistency IS NOT NULL) OR
        (diaper_type != 'coco')
    );

-- ========================================
-- POLÍTICAS RLS (Row Level Security)
-- ========================================

-- Habilitar RLS
ALTER TABLE diaper_records ENABLE ROW LEVEL SECURITY;

-- Políticas para DIAPER_RECORDS
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

-- ========================================
-- FUNÇÕES AUXILIARES
-- ========================================

-- Relatório de fraldas diário
CREATE OR REPLACE FUNCTION daily_diaper_report(baby_uuid UUID, report_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    total_diapers INTEGER,
    pum_count INTEGER,
    coco_count INTEGER,
    xixi_count INTEGER,
    misto_count INTEGER,
    last_coco_time TIMESTAMP WITH TIME ZONE,
    diaper_details JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH diaper_data AS (
        SELECT 
            diaper_type,
            recorded_at,
            consistency,
            color,
            smell_intensity,
            notes,
            c.name as caregiver_name
        FROM diaper_records dr
        JOIN caregivers c ON dr.caregiver_id = c.id
        WHERE dr.baby_id = baby_uuid 
        AND recorded_at::DATE = report_date
    )
    SELECT 
        COUNT(*)::INTEGER as total_diapers,
        COUNT(CASE WHEN diaper_type = 'pum' THEN 1 END)::INTEGER as pum_count,
        COUNT(CASE WHEN diaper_type = 'coco' THEN 1 END)::INTEGER as coco_count,
        COUNT(CASE WHEN diaper_type = 'xixi' THEN 1 END)::INTEGER as xixi_count,
        COUNT(CASE WHEN diaper_type = 'misto' THEN 1 END)::INTEGER as misto_count,
        MAX(CASE WHEN diaper_type = 'coco' THEN recorded_at END) as last_coco_time,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'horario', recorded_at,
                    'tipo', diaper_type,
                    'consistencia', consistency,
                    'cor', color,
                    'intensidade_cheiro', smell_intensity,
                    'observacoes', notes,
                    'cuidador', caregiver_name
                ) ORDER BY recorded_at
            ), 
            '[]'::jsonb
        ) as diaper_details
    FROM diaper_data;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- VIEWS ÚTEIS
-- ========================================

-- Últimos registros de fraldas
CREATE OR REPLACE VIEW recent_diaper_records AS
SELECT 
    b.id as baby_id,
    b.name as baby_name,
    f.name as family_name,
    CONCAT(b.name, ' (', f.name, ')') as baby_identifier,
    c.name as caregiver_name,
    dr.diaper_type,
    dr.consistency,
    dr.color,
    dr.smell_intensity,
    dr.recorded_at,
    dr.notes,
    dr.created_at
FROM diaper_records dr
JOIN babies b ON dr.baby_id = b.id
JOIN families f ON b.family_id = f.id
JOIN caregivers c ON dr.caregiver_id = c.id
ORDER BY dr.recorded_at DESC
LIMIT 20;

-- ========================================
-- COMENTÁRIOS NAS TABELAS
-- ========================================

COMMENT ON TABLE diaper_records IS 'Registros de fraldas dos bebês (puns, cocôs, xixi)';
COMMENT ON COLUMN diaper_records.diaper_type IS 'Tipo de evento: pum, coco, xixi ou misto';
COMMENT ON COLUMN diaper_records.consistency IS 'Consistência do cocô: liquido, pastoso, solido, seco';
COMMENT ON COLUMN diaper_records.color IS 'Cor do cocô: amarelo, marrom, verde, branco, outro';
COMMENT ON COLUMN diaper_records.smell_intensity IS 'Intensidade do cheiro numa escala de 1-5';
COMMENT ON COLUMN diaper_records.recorded_at IS 'Horário em que o evento aconteceu';

-- ========================================
-- DADOS DE EXEMPLO (OPCIONAL)
-- ========================================

/*
-- Exemplo de inserção de registros de fralda
INSERT INTO diaper_records (baby_id, caregiver_id, diaper_type, consistency, color, smell_intensity, notes) VALUES 
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'coco', 'pastoso', 'amarelo', 3, 'Fralda normal após mamada'),
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'pum', NULL, NULL, 2, 'Só gases mesmo');
*/

-- Para verificar se a tabela foi criada corretamente:
SELECT 'Tabela diaper_records criada com sucesso!' as status;
