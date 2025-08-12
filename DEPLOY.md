# 🚀 Deploy do BabyBot Dashboard

Guia completo para colocar o BabyBot Dashboard no ar usando Vercel e Supabase.

## 📋 Checklist Pré-Deploy

### ✅ Banco de Dados

- [ ] Supabase configurado
- [ ] `database/schema.sql` executado
- [ ] RLS policies ativas
- [ ] Dados de teste funcionando

### ✅ Frontend

- [ ] `npm install` executado
- [ ] `.env.local` configurado
- [ ] `npm run dev` funcionando
- [ ] Build sem erros: `npm run build`

## 🔧 Configuração do Supabase

### 1. Variáveis de Ambiente Necessárias

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Verificar Configurações

```sql
-- Teste no SQL Editor do Supabase:
SELECT 'Banco configurado!' as status;
SELECT * FROM families LIMIT 1;
```

## 🚀 Deploy na Vercel

### Opção 1: Via GitHub (Recomendado)

```bash
# 1. Commit e push
git add .
git commit -m "Deploy inicial do BabyBot Dashboard"
git push origin main

# 2. Conectar na Vercel
# - Acesse vercel.com
# - Import from GitHub
# - Selecione o repositório BabyBot
```

### Opção 2: Via CLI da Vercel

```bash
# 1. Instalar CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Adicionar variáveis de ambiente
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# 5. Redeploy
vercel --prod
```

## ⚙️ Configurações da Vercel

### 1. Variáveis de Ambiente

Na Vercel Dashboard > Project > Settings > Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL: https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Build Settings

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

## 🔒 Configurações de Segurança

### 1. Supabase - Auth Settings

```
Site URL: https://your-app.vercel.app
Redirect URLs: https://your-app.vercel.app/auth/callback
```

### 2. CORS Policy

O Supabase deve permitir requisições do seu domínio Vercel.

## ✅ Verificações Pós-Deploy

### 1. Testar Funcionalidades

- [ ] Página de login carrega
- [ ] Cadastro de usuário funciona
- [ ] Login com telefone funciona
- [ ] Dashboard carrega dados
- [ ] CRUD de bebês funciona
- [ ] Tema dark/light alterna

### 2. Performance

```bash
# Testar performance
npm run build
npm run start

# Lighthouse audit
npx lighthouse https://your-app.vercel.app
```

### 3. Logs de Debug

```bash
# Ver logs da Vercel
vercel logs
```

## 🐛 Resolução de Problemas

### Erro: "Invalid API Key"

```
Verificar:
1. NEXT_PUBLIC_SUPABASE_URL correto
2. NEXT_PUBLIC_SUPABASE_ANON_KEY correto
3. Redeploy após mudanças nas env vars
```

### Erro: "RLS Policy"

```sql
-- Verificar se RLS está ativo:
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### Erro: "Build Failed"

```bash
# Limpar cache e reinstalar
rm -rf .next node_modules
npm install
npm run build
```

## 📊 Monitoramento

### 1. Analytics da Vercel

- Performance metrics
- Error tracking
- Traffic analytics

### 2. Supabase Dashboard

- Database usage
- API calls
- Auth metrics

## 🔄 CI/CD Automático

A Vercel configurará CI/CD automático:

1. **Push para `main`** → Deploy em produção
2. **Push para outras branches** → Preview deploy
3. **Pull Requests** → Deploy de preview

## 🌍 Domínio Personalizado

### 1. Na Vercel Dashboard

```
Project > Domains > Add Domain
your-domain.com
```

### 2. Configurar DNS

```
Type: CNAME
Name: www
Value: your-app.vercel.app
```

## 📱 PWA (Progressive Web App)

Para transformar em PWA:

```bash
npm install next-pwa
```

```javascript
// next.config.js
const withPWA = require("next-pwa")({
  dest: "public",
});

module.exports = withPWA({
  // suas configurações
});
```

## 🎉 Deploy Completo!

Após seguir todos os passos:

✅ **Frontend:** Rodando na Vercel  
✅ **Backend:** Supabase configurado  
✅ **Banco:** Schema aplicado  
✅ **Auth:** Funcionando por telefone  
✅ **Segurança:** RLS ativo

**URL do seu app:** `https://your-app.vercel.app`

## 📞 Próximos Passos

1. **Testar** todas as funcionalidades
2. **Configurar** domínio personalizado
3. **Adicionar** dados reais
4. **Integrar** com WhatsApp Bot
5. **Monitorar** métricas de uso

Seu BabyBot Dashboard está no ar! 🚀👶
