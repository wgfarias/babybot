// ========================================
// DEBUG: TESTE DE INSERÇÃO NA TABELA DIAPER_RECORDS
// ========================================

// Cole este código no console do navegador para testar

// 1. Primeiro, verificar se o supabase está disponível
console.log("Supabase client:", window.supabase || "Não disponível");

// 2. Teste simples de inserção
async function testDiaperInsert() {
  try {
    // Verificar se a tabela existe tentando fazer um SELECT
    console.log("🔍 Verificando se a tabela existe...");
    const { data: tableCheck, error: tableError } = await supabase
      .from("diaper_records")
      .select("count")
      .limit(0);

    if (tableError) {
      console.error("❌ Erro ao acessar tabela:", tableError);
      return;
    }

    console.log("✅ Tabela diaper_records existe!");

    // Obter um bebê para teste
    console.log("🔍 Buscando bebês...");
    const { data: babies, error: babiesError } = await supabase
      .from("babies")
      .select("id, name")
      .limit(1);

    if (babiesError || !babies || babies.length === 0) {
      console.error(
        "❌ Erro ao buscar bebês:",
        babiesError || "Nenhum bebê encontrado"
      );
      return;
    }

    console.log("✅ Bebê encontrado:", babies[0]);

    // Obter cuidador para teste
    console.log("🔍 Buscando cuidadores...");
    const { data: caregivers, error: caregiversError } = await supabase
      .from("caregivers")
      .select("id, name")
      .limit(1);

    if (caregiversError || !caregivers || caregivers.length === 0) {
      console.error(
        "❌ Erro ao buscar cuidadores:",
        caregiversError || "Nenhum cuidador encontrado"
      );
      return;
    }

    console.log("✅ Cuidador encontrado:", caregivers[0]);

    // Tentar inserção
    console.log("🚀 Tentando inserir registro...");
    const insertData = {
      baby_id: babies[0].id,
      caregiver_id: caregivers[0].id,
      diaper_type: "pum",
      recorded_at: new Date().toISOString(),
      smell_intensity: 2,
    };

    console.log("📝 Dados a inserir:", insertData);

    const { data: result, error: insertError } = await supabase
      .from("diaper_records")
      .insert(insertData)
      .select();

    if (insertError) {
      console.error("❌ Erro na inserção:", insertError);
      console.error("❌ Detalhes do erro:", insertError.details);
      console.error("❌ Mensagem:", insertError.message);
      console.error("❌ Código:", insertError.code);
    } else {
      console.log("✅ Inserção bem-sucedida!", result);
    }
  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

// Executar teste
console.log("🧪 Iniciando teste de inserção na tabela diaper_records...");
testDiaperInsert();

