@echo off
echo Fazendo commit das correções...
git add .
git commit -m "Fix: Correções de TypeScript e Next.js config

- Corrigir campo phone null em caregivers
- Remover appDir obsoleto do next.config.js  
- Garantir compatibilidade com Next.js 15.4.6"
git push
echo Commit realizado com sucesso!
