-- ========================================
-- BABYBOT - BANCO DE DADOS COMPLETO CONSOLIDADO
-- ========================================
-- 
-- Este arquivo contém toda a estrutura do banco de dados do BabyBot
-- Inclui: Tabelas, Índices, Constraints, RLS, Funções, Views e Dados de Exemplo
-- 
-- ÚLTIMA ATUALIZAÇÃO: Consolidado com todas as correções
-- - Coluna email em caregivers 
-- - Políticas RLS corrigidas (sem recursão infinita)
-- - Views atualizadas com identificação única
-- - Índices otimizados
-- 
-- Execute este arquivo completo no SQL Editor do Supabase
-- ========================================

-- ========================================
-- SEÇÃO 1: EXTENSÕES E CONFIGURAÇÕES
-- ========================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- SEÇÃO 2: TABELAS PRINCIPAIS
-- ========================================

-- TABELA: families (Famílias)
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL, -- Número do WhatsApp principal
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: caregivers (Cuidadores)
CREATE TABLE caregivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20), -- Pode ser null se usar o mesmo da família
    email TEXT, -- Email usado na autenticação do Supabase Auth
    relationship VARCHAR(50), -- 'mae', 'pai', 'avo', 'cuidador', etc.
    is_primary BOOLEAN DEFAULT FALSE, -- Define se é o cuidador principal
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: babies (Bebês) - SEM campos de peso/altura estáticos
CREATE TABLE babies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('masculino', 'feminino', 'outros')),
    is_active BOOLEAN DEFAULT TRUE, -- Para desativar sem deletar
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: sleep_records (Registros de Sono)
CREATE TABLE sleep_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
    caregiver_id UUID NOT NULL REFERENCES caregivers(id),
    sleep_start TIMESTAMP WITH TIME ZONE NOT NULL,
    sleep_end TIMESTAMP WITH TIME ZONE, -- NULL enquanto está dormindo
    sleep_location VARCHAR(50), -- 'berco', 'colo', 'carrinho', 'cama_pais', etc.
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: feeding_records (Registros de Alimentação)
CREATE TABLE feeding_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
    caregiver_id UUID NOT NULL REFERENCES caregivers(id),
    feeding_type VARCHAR(20) NOT NULL CHECK (feeding_type IN ('amamentacao', 'mamadeira', 'papinha', 'fruta', 'agua', 'suco', 'outros')),
    
    -- Para amamentação
    breastfeeding_start TIMESTAMP WITH TIME ZONE,
    breastfeeding_end TIMESTAMP WITH TIME ZONE,
    breast_side VARCHAR(10) CHECK (breast_side IN ('esquerdo', 'direito', 'ambos')),
    
    -- Para mamadeira e outros líquidos
    amount_ml INTEGER,
    
    -- Para alimentos sólidos
    food_description TEXT,
    
    notes TEXT,
    feeding_time TIMESTAMP WITH TIME ZONE NOT NULL, -- Horário principal do registro
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: walk_records (Registros de Passeios)
CREATE TABLE walk_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
    caregiver_id UUID NOT NULL REFERENCES caregivers(id),
    walk_start TIMESTAMP WITH TIME ZONE NOT NULL,
    walk_end TIMESTAMP WITH TIME ZONE, -- NULL enquanto está passeando
    location VARCHAR(200), -- Descrição opcional do local
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: growth_records (Registros de Crescimento)
CREATE TABLE growth_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
    caregiver_id UUID NOT NULL REFERENCES caregivers(id),
    
    -- Dados de crescimento
    weight_grams INTEGER NOT NULL CHECK (weight_grams > 0),
    height_cm DECIMAL(4,1) CHECK (height_cm > 0),
    head_circumference_cm DECIMAL(4,1) CHECK (head_circumference_cm > 0), -- Perímetro cefálico
    
    -- Contexto da medição
    measurement_date DATE NOT NULL,
    measurement_location VARCHAR(100), -- 'casa', 'pediatra', 'hospital', etc.
    notes TEXT,
    
    -- Campos de auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- SEÇÃO 3: ÍNDICES PARA PERFORMANCE
-- ========================================

-- Índices para consultas frequentes
CREATE INDEX idx_babies_family_id ON babies(family_id);
CREATE INDEX idx_caregivers_family_id ON caregivers(family_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_caregivers_email ON caregivers(email);
CREATE INDEX idx_sleep_records_baby_id ON sleep_records(baby_id);
CREATE INDEX idx_sleep_records_date ON sleep_records(sleep_start);
CREATE INDEX idx_feeding_records_baby_id ON feeding_records(baby_id);
CREATE INDEX idx_feeding_records_date ON feeding_records(feeding_time);
CREATE INDEX idx_walk_records_baby_id ON walk_records(baby_id);
CREATE INDEX idx_walk_records_date ON walk_records(walk_start);
CREATE INDEX idx_growth_records_baby_id ON growth_records(baby_id);
CREATE INDEX idx_growth_records_date ON growth_records(measurement_date);
CREATE INDEX idx_growth_records_baby_date ON growth_records(baby_id, measurement_date);

-- ========================================
-- SEÇÃO 4: FUNÇÕES E TRIGGERS
-- ========================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para tabelas que têm updated_at
CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_babies_updated_at BEFORE UPDATE ON babies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sleep_records_updated_at BEFORE UPDATE ON sleep_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feeding_records_updated_at BEFORE UPDATE ON feeding_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_walk_records_updated_at BEFORE UPDATE ON walk_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_growth_records_updated_at BEFORE UPDATE ON growth_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- SEÇÃO 5: CONSTRAINTS E VALIDAÇÕES
-- ========================================

-- Garantir que sleep_end seja posterior a sleep_start
ALTER TABLE sleep_records ADD CONSTRAINT check_sleep_duration 
    CHECK (sleep_end IS NULL OR sleep_end > sleep_start);

-- Garantir que walk_end seja posterior a walk_start
ALTER TABLE walk_records ADD CONSTRAINT check_walk_duration 
    CHECK (walk_end IS NULL OR walk_end > walk_start);

-- Garantir que breastfeeding_end seja posterior a breastfeeding_start
ALTER TABLE feeding_records ADD CONSTRAINT check_breastfeeding_duration 
    CHECK (breastfeeding_end IS NULL OR breastfeeding_end > breastfeeding_start);

-- Garantir dados válidos para amamentação
ALTER TABLE feeding_records ADD CONSTRAINT check_breastfeeding_data
    CHECK (
        (feeding_type = 'amamentacao' AND breastfeeding_start IS NOT NULL) OR
        (feeding_type != 'amamentacao' AND breastfeeding_start IS NULL AND breastfeeding_end IS NULL AND breast_side IS NULL)
    );

-- Garantir que mamadeira tenha quantidade
ALTER TABLE feeding_records ADD CONSTRAINT check_bottle_amount
    CHECK (
        (feeding_type = 'mamadeira' AND amount_ml IS NOT NULL AND amount_ml > 0) OR
        (feeding_type != 'mamadeira')
    );

-- Não permitir medições futuras
ALTER TABLE growth_records ADD CONSTRAINT check_measurement_date_not_future 
    CHECK (measurement_date <= NOW()::DATE);

-- Função para validar data de medição vs nascimento
CREATE OR REPLACE FUNCTION validate_growth_measurement_date()
RETURNS TRIGGER AS $$
DECLARE
    birth_date_val DATE;
BEGIN
    -- Buscar data de nascimento do bebê
    SELECT birth_date INTO birth_date_val
    FROM babies 
    WHERE id = NEW.baby_id;
    
    -- Validar se a medição é posterior ao nascimento
    IF NEW.measurement_date < birth_date_val THEN
        RAISE EXCEPTION 'Data de medição (%) não pode ser anterior ao nascimento (%)', 
            NEW.measurement_date, birth_date_val;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar data antes de inserir/atualizar
CREATE TRIGGER validate_growth_date_trigger
    BEFORE INSERT OR UPDATE ON growth_records
    FOR EACH ROW EXECUTE FUNCTION validate_growth_measurement_date();

-- ========================================
-- SEÇÃO 6: FUNÇÕES AUXILIARES
-- ========================================

-- Função para verificar se bebê está dormindo
CREATE OR REPLACE FUNCTION is_baby_sleeping(baby_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM sleep_records 
        WHERE baby_id = baby_uuid 
        AND sleep_end IS NULL
    );
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se bebê está passeando
CREATE OR REPLACE FUNCTION is_baby_walking(baby_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM walk_records 
        WHERE baby_id = baby_uuid 
        AND walk_end IS NULL
    );
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- SEÇÃO 7: ROW LEVEL SECURITY (RLS)
-- ========================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE babies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE walk_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_records ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para obter family_id do usuário
CREATE OR REPLACE FUNCTION get_user_family_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT family_id 
        FROM caregivers 
        WHERE id = auth.uid()::UUID
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para FAMILIES
CREATE POLICY "Users can view their own family" ON families
    FOR SELECT USING (id = get_user_family_id());

CREATE POLICY "Users can update their own family" ON families
    FOR UPDATE USING (id = get_user_family_id());

CREATE POLICY "Service role can insert families" ON families
    FOR INSERT WITH CHECK (true);

-- Políticas para CAREGIVERS (corrigida para permitir acesso a todos da família)

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

-- 4. Política para DELETE: Permite deletar qualquer cuidador da família
CREATE POLICY "caregivers_delete_family" ON caregivers
    FOR DELETE 
    USING (family_id = get_user_family_id());

-- Políticas para BABIES
CREATE POLICY "Users can view babies from their family" ON babies
    FOR SELECT USING (family_id = get_user_family_id());

CREATE POLICY "Users can update babies from their family" ON babies
    FOR UPDATE USING (family_id = get_user_family_id());

CREATE POLICY "Users can insert babies in their family" ON babies
    FOR INSERT WITH CHECK (family_id = get_user_family_id());

CREATE POLICY "Users can delete babies from their family" ON babies
    FOR DELETE USING (family_id = get_user_family_id());

-- Políticas para SLEEP_RECORDS
CREATE POLICY "Users can view sleep records from their family babies" ON sleep_records
    FOR SELECT USING (
        baby_id IN (SELECT id FROM babies WHERE family_id = get_user_family_id())
    );

CREATE POLICY "Users can insert sleep records for their family babies" ON sleep_records
    FOR INSERT WITH CHECK (
        baby_id IN (SELECT id FROM babies WHERE family_id = get_user_family_id())
    );

CREATE POLICY "Users can update sleep records from their family babies" ON sleep_records
    FOR UPDATE USING (
        baby_id IN (SELECT id FROM babies WHERE family_id = get_user_family_id())
    );

CREATE POLICY "Users can delete sleep records from their family babies" ON sleep_records
    FOR DELETE USING (
        baby_id IN (SELECT id FROM babies WHERE family_id = get_user_family_id())
    );

-- Políticas para FEEDING_RECORDS
CREATE POLICY "Users can view feeding records from their family babies" ON feeding_records
    FOR SELECT USING (
        baby_id IN (SELECT id FROM babies WHERE family_id = get_user_family_id())
    );

CREATE POLICY "Users can insert feeding records for their family babies" ON feeding_records
    FOR INSERT WITH CHECK (
        baby_id IN (SELECT id FROM babies WHERE family_id = get_user_family_id())
    );

CREATE POLICY "Users can update feeding records from their family babies" ON feeding_records
    FOR UPDATE USING (
        baby_id IN (SELECT id FROM babies WHERE family_id = get_user_family_id())
    );

CREATE POLICY "Users can delete feeding records from their family babies" ON feeding_records
    FOR DELETE USING (
        baby_id IN (SELECT id FROM babies WHERE family_id = get_user_family_id())
    );

-- Políticas para WALK_RECORDS
CREATE POLICY "Users can view walk records from their family babies" ON walk_records
    FOR SELECT USING (
        baby_id IN (SELECT id FROM babies WHERE family_id = get_user_family_id())
    );

CREATE POLICY "Users can insert walk records for their family babies" ON walk_records
    FOR INSERT WITH CHECK (
        baby_id IN (SELECT id FROM babies WHERE family_id = get_user_family_id())
    );

CREATE POLICY "Users can update walk records from their family babies" ON walk_records
    FOR UPDATE USING (
        baby_id IN (SELECT id FROM babies WHERE family_id = get_user_family_id())
    );

CREATE POLICY "Users can delete walk records from their family babies" ON walk_records
    FOR DELETE USING (
        baby_id IN (SELECT id FROM babies WHERE family_id = get_user_family_id())
    );

-- Políticas para GROWTH_RECORDS
CREATE POLICY "Users can view growth records from their family babies" ON growth_records
    FOR SELECT USING (
        baby_id IN (SELECT id FROM babies WHERE family_id = get_user_family_id())
    );

CREATE POLICY "Users can insert growth records for their family babies" ON growth_records
    FOR INSERT WITH CHECK (
        baby_id IN (SELECT id FROM babies WHERE family_id = get_user_family_id())
    );

CREATE POLICY "Users can update growth records from their family babies" ON growth_records
    FOR UPDATE USING (
        baby_id IN (SELECT id FROM babies WHERE family_id = get_user_family_id())
    );

CREATE POLICY "Users can delete growth records from their family babies" ON growth_records
    FOR DELETE USING (
        baby_id IN (SELECT id FROM babies WHERE family_id = get_user_family_id())
    );

-- ========================================
-- SEÇÃO 8: GRANTS PARA AUTHENTICATED USERS
-- ========================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ========================================
-- SEÇÃO 9: FUNÇÕES DE RELATÓRIOS
-- ========================================

-- Função para obter última medição de crescimento
CREATE OR REPLACE FUNCTION get_latest_growth(baby_uuid UUID)
RETURNS TABLE (
    weight_grams INTEGER,
    height_cm DECIMAL(4,1),
    head_circumference_cm DECIMAL(4,1),
    measurement_date DATE,
    age_days INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gr.weight_grams,
        gr.height_cm,
        gr.head_circumference_cm,
        gr.measurement_date,
        (gr.measurement_date - b.birth_date)::INTEGER as age_days
    FROM growth_records gr
    JOIN babies b ON gr.baby_id = b.id
    WHERE gr.baby_id = baby_uuid
    ORDER BY gr.measurement_date DESC, gr.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Relatório de sono diário
CREATE OR REPLACE FUNCTION daily_sleep_report(baby_uuid UUID, report_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    total_sleep_minutes INTEGER,
    total_sleep_sessions INTEGER,
    longest_sleep_minutes INTEGER,
    average_sleep_minutes INTEGER,
    sleep_sessions JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH sleep_data AS (
        SELECT 
            EXTRACT(EPOCH FROM (COALESCE(sleep_end, NOW()) - sleep_start))::INTEGER / 60 as duration_minutes,
            sleep_start,
            COALESCE(sleep_end, NOW()) as sleep_end,
            sleep_location,
            c.name as caregiver_name
        FROM sleep_records sr
        JOIN caregivers c ON sr.caregiver_id = c.id
        WHERE sr.baby_id = baby_uuid 
        AND sleep_start::DATE = report_date
    )
    SELECT 
        COALESCE(SUM(duration_minutes), 0)::INTEGER as total_sleep_minutes,
        COUNT(*)::INTEGER as total_sleep_sessions,
        COALESCE(MAX(duration_minutes), 0)::INTEGER as longest_sleep_minutes,
        COALESCE(AVG(duration_minutes), 0)::INTEGER as average_sleep_minutes,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'inicio', sleep_start,
                    'fim', sleep_end,
                    'duracao_minutos', duration_minutes,
                    'local', sleep_location,
                    'cuidador', caregiver_name
                ) ORDER BY sleep_start
            ), 
            '[]'::jsonb
        ) as sleep_sessions
    FROM sleep_data;
END;
$$ LANGUAGE plpgsql;

-- Relatório de alimentação diário
CREATE OR REPLACE FUNCTION daily_feeding_report(baby_uuid UUID, report_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    total_feedings INTEGER,
    breastfeeding_count INTEGER,
    bottle_count INTEGER,
    total_bottle_ml INTEGER,
    total_breastfeeding_minutes INTEGER,
    feeding_details JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH feeding_data AS (
        SELECT 
            feeding_type,
            feeding_time,
            amount_ml,
            CASE 
                WHEN breastfeeding_start IS NOT NULL AND breastfeeding_end IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (breastfeeding_end - breastfeeding_start))::INTEGER / 60
                ELSE NULL
            END as breastfeeding_minutes,
            breast_side,
            food_description,
            c.name as caregiver_name
        FROM feeding_records fr
        JOIN caregivers c ON fr.caregiver_id = c.id
        WHERE fr.baby_id = baby_uuid 
        AND feeding_time::DATE = report_date
    )
    SELECT 
        COUNT(*)::INTEGER as total_feedings,
        COUNT(CASE WHEN feeding_type = 'amamentacao' THEN 1 END)::INTEGER as breastfeeding_count,
        COUNT(CASE WHEN feeding_type = 'mamadeira' THEN 1 END)::INTEGER as bottle_count,
        COALESCE(SUM(amount_ml), 0)::INTEGER as total_bottle_ml,
        COALESCE(SUM(breastfeeding_minutes), 0)::INTEGER as total_breastfeeding_minutes,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'horario', feeding_time,
                    'tipo', feeding_type,
                    'quantidade_ml', amount_ml,
                    'duracao_amamentacao_min', breastfeeding_minutes,
                    'lado_seio', breast_side,
                    'descricao_comida', food_description,
                    'cuidador', caregiver_name
                ) ORDER BY feeding_time
            ), 
            '[]'::jsonb
        ) as feeding_details
    FROM feeding_data;
END;
$$ LANGUAGE plpgsql;

-- Status atual do bebê
CREATE OR REPLACE FUNCTION baby_current_status(baby_uuid UUID)
RETURNS TABLE (
    baby_name TEXT,
    current_status TEXT,
    status_since TIMESTAMP WITH TIME ZONE,
    last_feeding TIMESTAMP WITH TIME ZONE,
    last_feeding_type TEXT,
    hours_since_last_feeding DECIMAL(4,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH current_sleep AS (
        SELECT sleep_start
        FROM sleep_records 
        WHERE baby_id = baby_uuid AND sleep_end IS NULL
        ORDER BY sleep_start DESC 
        LIMIT 1
    ),
    current_walk AS (
        SELECT walk_start
        FROM walk_records 
        WHERE baby_id = baby_uuid AND walk_end IS NULL
        ORDER BY walk_start DESC 
        LIMIT 1
    ),
    last_feed AS (
        SELECT feeding_time, feeding_type
        FROM feeding_records 
        WHERE baby_id = baby_uuid
        ORDER BY feeding_time DESC 
        LIMIT 1
    )
    SELECT 
        b.name::TEXT as baby_name,
        CASE 
            WHEN cs.sleep_start IS NOT NULL THEN 'Dormindo'
            WHEN cw.walk_start IS NOT NULL THEN 'Passeando'
            ELSE 'Acordado em casa'
        END::TEXT as current_status,
        COALESCE(cs.sleep_start, cw.walk_start, lf.feeding_time) as status_since,
        lf.feeding_time as last_feeding,
        lf.feeding_type::TEXT as last_feeding_type,
        CASE 
            WHEN lf.feeding_time IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (NOW() - lf.feeding_time))::DECIMAL / 3600
            ELSE NULL
        END::DECIMAL(4,2) as hours_since_last_feeding
    FROM babies b
    LEFT JOIN current_sleep cs ON true
    LEFT JOIN current_walk cw ON true
    LEFT JOIN last_feed lf ON true
    WHERE b.id = baby_uuid;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- SEÇÃO 10: VIEWS ÚTEIS
-- ========================================

-- Últimos registros de sono
CREATE OR REPLACE VIEW recent_sleep_records AS
SELECT 
    b.id as baby_id,
    b.name as baby_name,
    f.name as family_name,
    CONCAT(b.name, ' (', f.name, ')') as baby_identifier,
    c.name as caregiver_name,
    sr.sleep_start,
    sr.sleep_end,
    CASE 
        WHEN sr.sleep_end IS NULL THEN 'Em andamento'
        ELSE EXTRACT(EPOCH FROM (sr.sleep_end - sr.sleep_start))::INTEGER / 60 || ' min'
    END as duration,
    sr.sleep_location,
    sr.created_at
FROM sleep_records sr
JOIN babies b ON sr.baby_id = b.id
JOIN families f ON b.family_id = f.id
JOIN caregivers c ON sr.caregiver_id = c.id
ORDER BY sr.sleep_start DESC
LIMIT 10;

-- Últimos registros de alimentação
CREATE OR REPLACE VIEW recent_feeding_records AS
SELECT 
    b.id as baby_id,
    b.name as baby_name,
    f.name as family_name,
    CONCAT(b.name, ' (', f.name, ')') as baby_identifier,
    c.name as caregiver_name,
    fr.feeding_time,
    fr.feeding_type,
    fr.amount_ml,
    CASE 
        WHEN fr.breastfeeding_start IS NOT NULL AND fr.breastfeeding_end IS NOT NULL
        THEN EXTRACT(EPOCH FROM (fr.breastfeeding_end - fr.breastfeeding_start))::INTEGER / 60 || ' min'
        ELSE NULL
    END as breastfeeding_duration,
    fr.breast_side,
    fr.created_at
FROM feeding_records fr
JOIN babies b ON fr.baby_id = b.id
JOIN families f ON b.family_id = f.id
JOIN caregivers c ON fr.caregiver_id = c.id
ORDER BY fr.feeding_time DESC
LIMIT 10;

-- Últimos registros de crescimento
CREATE OR REPLACE VIEW recent_growth_records AS
SELECT 
    b.id as baby_id,
    b.name as baby_name,
    f.name as family_name,
    CONCAT(b.name, ' (', f.name, ')') as baby_identifier,
    c.name as caregiver_name,
    gr.measurement_date,
    gr.weight_grams,
    gr.height_cm,
    gr.head_circumference_cm,
    (gr.measurement_date - b.birth_date)::INTEGER as age_days,
    gr.measurement_location,
    gr.notes,
    gr.created_at
FROM growth_records gr
JOIN babies b ON gr.baby_id = b.id
JOIN families f ON b.family_id = f.id
JOIN caregivers c ON gr.caregiver_id = c.id
ORDER BY gr.measurement_date DESC, gr.created_at DESC
LIMIT 10;

-- Bebês com última medição de crescimento
CREATE OR REPLACE VIEW babies_with_latest_growth AS
SELECT 
    b.id as baby_id,
    b.name as baby_name,
    b.birth_date,
    b.gender,
    f.name as family_name,
    lg.weight_grams as current_weight_grams,
    lg.height_cm as current_height_cm,
    lg.head_circumference_cm as current_head_circumference_cm,
    lg.measurement_date as last_measurement_date,
    lg.age_days,
    ROUND(lg.age_days::DECIMAL / 30.44, 1) as age_months
FROM babies b
JOIN families f ON b.family_id = f.id
LEFT JOIN LATERAL (
    SELECT * FROM get_latest_growth(b.id)
) lg ON true
WHERE b.is_active = true;

-- ========================================
-- SEÇÃO 11: COMENTÁRIOS NAS TABELAS
-- ========================================

COMMENT ON TABLE families IS 'Famílias cadastradas no sistema';
COMMENT ON TABLE caregivers IS 'Cuidadores de cada família (pais, avós, babás, etc.)';
COMMENT ON COLUMN caregivers.email IS 'Email usado na autenticação do Supabase Auth. Deve corresponder ao email do usuário autenticado.';
COMMENT ON POLICY "caregivers_unified_access" ON caregivers IS 'Política unificada: acesso público para login OU acesso aos próprios dados. Evita recursão infinita.';
COMMENT ON TABLE babies IS 'Bebês de cada família';
COMMENT ON TABLE sleep_records IS 'Registros de sono dos bebês';
COMMENT ON TABLE feeding_records IS 'Registros de alimentação dos bebês';
COMMENT ON TABLE walk_records IS 'Registros de passeios dos bebês';
COMMENT ON TABLE growth_records IS 'Registros de crescimento dos bebês (peso, altura, perímetro cefálico)';

COMMENT ON COLUMN babies.birth_date IS 'Data de nascimento do bebê';
COMMENT ON COLUMN sleep_records.sleep_end IS 'NULL enquanto o bebê está dormindo';
COMMENT ON COLUMN walk_records.walk_end IS 'NULL enquanto o bebê está passeando';
COMMENT ON COLUMN feeding_records.feeding_time IS 'Horário principal do registro de alimentação';
COMMENT ON COLUMN growth_records.weight_grams IS 'Peso em gramas';
COMMENT ON COLUMN growth_records.height_cm IS 'Altura em centímetros';
COMMENT ON COLUMN growth_records.head_circumference_cm IS 'Perímetro cefálico em centímetros';
COMMENT ON COLUMN growth_records.measurement_location IS 'Local onde foi feita a medição';
COMMENT ON COLUMN growth_records.measurement_date IS 'Data da medição (não pode ser futura)';

-- ========================================
-- SEÇÃO 12: DADOS DE EXEMPLO (OPCIONAL)
-- ========================================

-- Descomente esta seção se quiser inserir dados de exemplo

/*
-- INSERIR FAMÍLIA DE EXEMPLO
INSERT INTO families (id, name, phone) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Família Silva', '+5511999887766');

-- INSERIR CUIDADORES
INSERT INTO caregivers (id, family_id, name, phone, relationship, is_primary) VALUES 
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Maria Silva', '+5511999887766', 'mae', true),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'João Silva', '+5511888776655', 'pai', false),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'Vovó Carmen', NULL, 'avo', false);

-- INSERIR BEBÊS
INSERT INTO babies (id, family_id, name, birth_date, gender) VALUES 
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'Pedro', '2024-11-01', 'masculino'),
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 'Ana', '2024-11-01', 'feminino');

-- INSERIR REGISTROS DE CRESCIMENTO
INSERT INTO growth_records (baby_id, caregiver_id, weight_grams, height_cm, head_circumference_cm, measurement_date, measurement_location, notes) VALUES 
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 3200, 48.5, 34.0, '2024-11-01', 'nascimento', 'Dados do nascimento'),
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 2800, 46.0, 32.5, '2024-11-01', 'nascimento', 'Dados do nascimento'),
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 4500, 54.8, 36.8, '2024-12-20', 'pediatra', 'Consulta de rotina'),
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 3900, 51.2, 35.5, '2024-12-20', 'pediatra', 'Crescimento normal');
*/

-- ========================================
-- FIM DO SCRIPT CONSOLIDADO
-- ========================================

-- Para testar se tudo funcionou:
SELECT 'BabyBot Database criado com sucesso!' as status;
