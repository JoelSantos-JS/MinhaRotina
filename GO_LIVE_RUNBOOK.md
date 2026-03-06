# Go-Live Runbook (MinhaR)

Data base: 2026-03-03

## Ordem de execucao (mais facil -> mais dificil)

1. `SB-03` Sanidade de abertura (manual rapido)
2. `GL-01` Validacao de ambiente de producao
3. `GL-02` Smoke test completo com conta real
4. `GL-03` Observabilidade operacional
5. `GL-04` Rollback de app e banco (procedimento)

## 1) SB-03 - Tela inicial sem crash (5 min)

Objetivo: garantir que o app abre em dispositivo real sem tela branca.

Passos:
- Rodar `npm start` e abrir no Android (Expo Go ou dev build).
- Abrir app do zero.
- Navegar: `Login responsavel` -> voltar -> `Login crianca`.

Esperado:
- App abre sem crash.
- Sem tela branca persistente.
- Troca de telas sem travar.

Evidencia sugerida:
- 1 print da tela inicial.
- 1 video curto (10-20s) da navegacao entre telas.

## 2) GL-01 - Config de producao (10 min)

Objetivo: garantir que build aponta para projeto/ambiente correto.

Checklist:
- `app.json`:
  - `android.package` correto
  - `ios.bundleIdentifier` correto
  - `version` e `android.versionCode` coerentes
- `eas.json`:
  - profile `production` presente
- Supabase:
  - URL/chave usadas pela build sao do projeto de producao

Comandos uteis:
```bash
npx expo config --type public
```

Evidencia sugerida:
- print do output do `expo config`
- print do dashboard do Supabase (projeto correto)

## 3) GL-02 - Smoke de negocio (20-30 min)

Fluxo obrigatorio:
1. Login responsavel
2. Editar perfil e salvar
3. Criar filho
4. Criar rotina
5. Criar tarefa
6. Login infantil com email + PIN
7. Concluir tarefa
8. Confirmar evento no diario/progresso

Esperado:
- Sem erros bloqueantes.
- Sem erro de seguranca/RLS no fluxo normal.

Evidencia sugerida:
- video unico do fluxo ponta a ponta
- print final do diario/progresso atualizado

## 4) GL-03 - Observabilidade (30-60 min)

Minimo para liberar publicacao:
- Monitorar crash ANR no Google Play Console (Android vitals).
- Ter um canal de alerta (email/Discord) para falhas criticas.
- Verificar logs de erro no Supabase Dashboard (Auth/DB/API).

Recomendado:
- Integrar Sentry (ou equivalente) para stack trace no app.
- Definir SLA de resposta (ex.: bug critico em ate 24h).

Checklist de saida:
- Responsavel operacional definido.
- Canal de alerta definido.
- Processo de triagem documentado.

## 5) GL-04 - Rollback (procedimento oficial)

### 5.1 App (Play Store)

Objetivo: voltar rapidamente para versao estavel anterior.

Passos:
1. Identificar ultima versao estavel publicada.
2. Na Play Console, interromper rollout da versao atual (se parcial).
3. Retomar rollout da versao estavel anterior (ou publicar hotfix imediato).
4. Comunicar incidente e status no canal interno.

### 5.2 Banco (Supabase / SQL)

Objetivo: reverter mudanca de schema/policy com seguranca.

Regra:
- Toda mudanca SQL deve ter script de rollback antes de producao.

Passos:
1. Identificar migration causadora.
2. Aplicar script de rollback correspondente no SQL Editor.
3. Rodar validacoes read-only:
   - `database/validate_storage_policies.sql`
   - `database/validate_phase2_results.sql`
   - `database/validate_child_login_security.sql`
4. Executar smoke rapido de login e rotina.

### 5.3 Criterio de encerramento de incidente

- Funcionalidade critica restaurada.
- Validacoes SQL sem erro.
- Smoke principal aprovado.
- Registro do incidente atualizado (causa, impacto, acao corretiva).
