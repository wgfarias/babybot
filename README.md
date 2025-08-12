# 🤖👶 BabyBot - Banco de Dados

Sistema de banco de dados para o BabyBot, um assistente WhatsApp que ajuda pais a registrar e monitorar atividades do bebê (sono, alimentação, passeios).

## 📋 Visão Geral

O banco foi projetado para máxima simplicidade e eficiência, suportando:

- **Múltiplas famílias** com múltiplos bebês
- **Múltiplos cuidadores** por família
- **Registros de sono** com controle de estado
- **Alimentação diversificada** (amamentação, mamadeira, papinhas, etc.)
- **Passeios** com horário de início e fim
- **Relatórios automáticos** para análise de padrões

## 🏗️ Estrutura do Banco

### Tabelas Principais

- **`families`** - Famílias cadastradas
- **`caregivers`** - Cuidadores (pais, avós, babás)
- **`babies`** - Bebês da família
- **`sleep_records`** - Registros de sono
- **`feeding_records`** - Registros de alimentação
- **`walk_records`** - Registros de passeios
- **`growth_records`** - Registros de crescimento (peso, altura, perímetro cefálico)

### Recursos Avançados

- ✅ **Row Level Security (RLS)** - Cada família vê apenas seus dados
- ✅ **Validações automáticas** - Impede dados inconsistentes
- ✅ **Funções de status** - Verifica se bebê está dormindo/passeando
- ✅ **Triggers de auditoria** - Timestamps automáticos
- ✅ **Relatórios prontos** - Funções SQL para análises

## 🚀 Como Implementar no Supabase

### 1. Criar Projeto no Supabase

```bash
# Acesse https://supabase.com
# Crie um novo projeto
# Anote a URL e as chaves da API
```

### 2. Executar Scripts SQL

Execute os scripts na seguinte ordem no **SQL Editor** do Supabase:

```sql
-- 1. Estrutura principal
-- Cole e execute: database/schema.sql

-- 2. Atualização para acompanhamento de crescimento
-- Cole e execute: database/growth_tracking_update.sql

-- 3. Políticas de segurança
-- Cole e execute: database/rls_policies.sql

-- 4. Políticas RLS para crescimento
-- Cole e execute: database/growth_rls_policies.sql

-- 5. Funções de relatório
-- Cole e execute: database/report_queries.sql

-- 6. (Opcional) Dados de teste
-- Cole e execute: database/sample_data.sql

-- 7. (Opcional) Dados de exemplo para crescimento
-- Cole e execute: database/growth_sample_data.sql
```

### 3. Configurar Autenticação

O sistema usa o sistema de Auth do Supabase integrado com RLS:

```javascript
// Exemplo de criação de usuário + família
const { data: authUser, error: authError } = await supabase.auth.signUp({
  email: "pai@familia.com",
  password: "senha123",
  options: {
    data: {
      name: "João Silva",
      phone: "+5511999887766",
    },
  },
});

// Depois criar família e cuidador
const { data: family } = await supabase
  .from("families")
  .insert({
    name: "Família Silva",
    phone: "+5511999887766",
  })
  .select()
  .single();

const { data: caregiver } = await supabase.from("caregivers").insert({
  id: authUser.user.id, // IMPORTANTE: usar o ID do auth
  family_id: family.id,
  name: "João Silva",
  phone: "+5511999887766",
  relationship: "pai",
  is_primary: true,
});
```

## 🎯 Como Usar via API

### Registrar Sono

```javascript
// Bebê foi dormir
const { data } = await supabase.from("sleep_records").insert({
  baby_id: "uuid-do-bebe",
  caregiver_id: "uuid-do-cuidador",
  sleep_start: new Date().toISOString(),
  sleep_location: "berco",
});

// Bebê acordou (atualizar registro)
const { data } = await supabase
  .from("sleep_records")
  .update({
    sleep_end: new Date().toISOString(),
  })
  .eq("baby_id", "uuid-do-bebe")
  .is("sleep_end", null);
```

### Registrar Alimentação

```javascript
// Amamentação
const { data } = await supabase.from("feeding_records").insert({
  baby_id: "uuid-do-bebe",
  caregiver_id: "uuid-do-cuidador",
  feeding_type: "amamentacao",
  feeding_time: new Date().toISOString(),
  breastfeeding_start: new Date().toISOString(),
  breastfeeding_end: new Date(Date.now() + 15 * 60000).toISOString(), // +15 min
  breast_side: "esquerdo",
});

// Mamadeira
const { data } = await supabase.from("feeding_records").insert({
  baby_id: "uuid-do-bebe",
  caregiver_id: "uuid-do-cuidador",
  feeding_type: "mamadeira",
  feeding_time: new Date().toISOString(),
  amount_ml: 120,
});
```

### Registrar Passeio

```javascript
// Saiu para passear
const { data } = await supabase.from("walk_records").insert({
  baby_id: "uuid-do-bebe",
  caregiver_id: "uuid-do-cuidador",
  walk_start: new Date().toISOString(),
  location: "Parque do Ibirapuera",
});

// Voltou do passeio
const { data } = await supabase
  .from("walk_records")
  .update({
    walk_end: new Date().toISOString(),
  })
  .eq("baby_id", "uuid-do-bebe")
  .is("walk_end", null);
```

### Registrar Crescimento

```javascript
// Registrar peso, altura e perímetro cefálico
const { data } = await supabase.from("growth_records").insert({
  baby_id: "uuid-do-bebe",
  caregiver_id: "uuid-do-cuidador",
  weight_grams: 4500,
  height_cm: 54.8,
  head_circumference_cm: 36.8,
  measurement_date: new Date().toISOString().split('T')[0], // Apenas data
  measurement_location: "pediatra",
  notes: "Consulta de rotina - crescimento excelente"
});

// Obter última medição
const { data: latestGrowth } = await supabase
  .rpc('get_latest_growth', {
    baby_uuid: 'uuid-do-bebe'
  });
```

## 📊 Relatórios Prontos

### Status Atual do Bebê

```javascript
const { data } = await supabase.rpc("baby_current_status", {
  baby_uuid: "uuid-do-bebe",
});

// Retorna: nome, status (Dormindo/Passeando/Acordado), desde quando, última alimentação
```

### Relatório Diário de Sono

```javascript
const { data } = await supabase.rpc("daily_sleep_report", {
  baby_uuid: "uuid-do-bebe",
  report_date: "2024-12-05",
});

// Retorna: total de minutos dormidos, número de sestas, maior período, etc.
```

### Relatório Semanal de Padrões

```javascript
const { data } = await supabase.rpc("weekly_patterns_report", {
  baby_uuid: "uuid-do-bebe",
  start_date: "2024-11-28",
});

// Retorna: médias semanais, padrões de sono, local preferido, etc.
```

### Relatório de Crescimento

```javascript
// Relatório completo de crescimento
const { data } = await supabase.rpc("growth_report", {
  baby_uuid: "uuid-do-bebe",
  start_date: "2024-11-01", // Opcional: padrão é nascimento
  end_date: "2024-12-05"    // Opcional: padrão é hoje
});

// Retorna: ganho de peso, crescimento em altura, número de medições, etc.
```

### Dados para Gráfico de Crescimento

```javascript
// Dados formatados para gráficos
const { data } = await supabase.rpc("growth_chart_data", {
  baby_uuid: "uuid-do-bebe"
});

// Retorna: todas as medições com idade em dias/meses para plotar gráficos
```

### Última Medição do Bebê

```javascript
// Peso e altura atuais
const { data } = await supabase
  .from("babies_with_latest_growth")
  .select("*")
  .eq("baby_id", "uuid-do-bebe")
  .single();

// Retorna: dados do bebê + última medição de crescimento
```

## 🛡️ Validações Automáticas

O banco possui validações que impedem:

- ❌ Registrar sono se bebê já está dormindo
- ❌ Registrar passeio se bebê já está passeando
- ❌ Horários de fim anteriores aos de início
- ❌ Dados inconsistentes de alimentação
- ❌ Acesso a dados de outras famílias

### Verificar Status Antes de Registrar

```javascript
// Verificar se pode dormir
const { data: canSleep } = await supabase.rpc("is_baby_sleeping", {
  baby_uuid: "uuid-do-bebe",
});

if (!canSleep) {
  // Pode registrar novo sono
}
```

## 🎛️ Comandos para N8N/Evolution API

Baseado nos comandos simples que os pais vão usar:

### Mapeamento de Comandos

| Comando do Usuário | Ação no Banco                                |
| ------------------ | -------------------------------------------- |
| "dormiu"           | Inserir `sleep_records` com `sleep_start`    |
| "acordou"          | Atualizar `sleep_records` com `sleep_end`    |
| "mamou"            | Inserir `feeding_records` tipo `amamentacao` |
| "mamadeira 120ml"  | Inserir `feeding_records` tipo `mamadeira`   |
| "saiu passear"     | Inserir `walk_records` com `walk_start`      |
| "voltou"           | Atualizar `walk_records` com `walk_end`      |

### Exemplo de Fluxo N8N

1. **Webhook** recebe mensagem WhatsApp
2. **Parse** do comando (dormiu/acordou/mamou)
3. **Verificação** se pode executar ação
4. **Insert/Update** no Supabase
5. **Resposta** confirmação para WhatsApp

## 📱 Casos de Uso Típicos

### Dia Típico de Uso

```
08:00 - Mãe: "acordou"
08:15 - Mãe: "mamou 15min esquerdo"
10:30 - Mãe: "dormiu berço"
11:00 - Pai: "acordou"
11:05 - Pai: "mamadeira 100ml"
14:00 - Avó: "saiu passear praça"
15:30 - Avó: "voltou"
```

### Relatório Automático (fim do dia)

```
📊 RELATÓRIO DO PEDRO - 05/12/2024

💤 Sono: 8h 30min (4 sestas)
🍼 Alimentação: 6 refeições (4 amamentações + 2 mamadeiras)
🚶 Passeios: 1 vez (1h 30min)

⭐ Melhor sestas: 14:00-16:30 (2h 30min)
📱 Mais ativo: Mãe Maria (8 registros)
```

## 🔧 Manutenção e Backup

### Backup Automático

O Supabase já faz backup automático, mas você pode exportar:

```sql
-- Backup de uma família específica
SELECT * FROM families WHERE id = 'family-uuid';
-- E todas as tabelas relacionadas...
```

### Limpeza de Dados Antigos

```sql
-- Remover registros muito antigos (opcional)
DELETE FROM sleep_records
WHERE created_at < NOW() - INTERVAL '2 years';
```

---

## 🤝 Próximos Passos

1. **Implementar no Supabase** usando os scripts fornecidos
2. **Testar** com dados de exemplo
3. **Integrar** com N8N para WhatsApp
4. **Configurar** webhooks da Evolution API
5. **Desenvolver** interface de relatórios (opcional)

Esse banco está pronto para suportar milhares de famílias com excelente performance e segurança! 🚀
