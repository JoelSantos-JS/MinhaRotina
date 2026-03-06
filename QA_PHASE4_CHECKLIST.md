# QA Fase 4 - Go Live (Build, Release e Pos-release)

## Objetivo
Garantir que o app esta pronto para publicacao com build reproduzivel, seguranca basica e operacao estavel.

## Pre-condicoes
- Fase 2 e Fase 3 concluidas.
- `database/migrate_phase2_schema_alignment.sql` aplicado.
- `database/validate_storage_policies.sql` e `database/validate_phase2_results.sql` sem erros.

## BUILD E ENTREGA

| ID | Cenario | Passos | Esperado | Status | Evidencia |
|---|---|---|---|---|---|
| BL-01 | Saude Expo | Rodar `npx expo-doctor` | 17/17 checks `PASS` | PASS | `QA_PHASE4_EXECUTION_REPORT.md`: 17/17 checks passed |
| BL-02 | Build web | Rodar `npx expo export --platform web --output-dir dist-qa` | Export concluido sem erro | PASS | `QA_PHASE4_EXECUTION_REPORT.md`: export PASS em `dist-qa` |
| BL-03 | Bundle size | Verificar tamanho do JS web exportado | Tamanho conhecido e documentado | PASS | `_expo/static/js/web/index-666b5c446d6ad164997ccf71c24adbfc.js` (~2.52 MB) |
| BL-04 | Dependencias vulneraveis | Rodar `npm audit --omit=dev` | 0 vulnerabilidades high/critical | PASS | `npm run ci` (2026-03-03): 0 vulnerabilities |

## SANIDADE POS-BUILD

| ID | Cenario | Passos | Esperado | Status | Evidencia |
|---|---|---|---|---|---|
| SB-01 | Regressao rapida | Rodar `npm test` | 22 suites / 301 testes `PASS` | PASS | `npm run ci` (2026-03-03): 32 suites / 433 testes PASS |
| SB-02 | Tipagem | Rodar `npx tsc --noEmit` | Sem erros de tipo | PASS | `npm run ci` (2026-03-03): `tsc --noEmit` sem erros |
| SB-03 | Tela inicial | Subir app e abrir home/login | App inicia sem tela branca/crash | IN_PROGRESS | Smoke de build web ok em `dist-smoke` (`index.html` + bundle JS gerado); falta validacao manual em dispositivo |

## GO-LIVE MANUAL (LOJA/PROD)

| ID | Cenario | Passos | Esperado | Status | Evidencia |
|---|---|---|---|---|---|
| GL-01 | Config de ambiente prod | Validar URL/chaves corretas de producao | App aponta para ambiente correto | IN_PROGRESS | `npx expo config --type public --json` ok (`android.package`/`ios.bundleIdentifier` = `com.minharotina.app`) e Supabase em `src/config/supabase.ts` (`https://odgiljvvmglmmncbbupl.supabase.co`); falta confirmacao funcional em ambiente final |
| GL-02 | Conta real smoke test | Login -> editar perfil -> criar filho -> criar tarefa -> concluir tarefa | Fluxo principal completo sem erro | PENDING | Execucao manual com conta real pendente |
| GL-03 | Observabilidade | Confirmar logs/erros operacionais visiveis | Falhas rastreaveis | PENDING | Definicao de ferramenta/processo de monitoramento pendente |
| GL-04 | Rollback plan | Definir procedimento de rollback de versao e SQL | Procedimento documentado | PASS | Procedimento documentado em `GO_LIVE_RUNBOOK.md` |

## Criterio de saida
- Nenhum `FAIL/BLOCKED` em `BL-01`, `BL-02`, `BL-04`, `SB-01`, `SB-02`, `GL-02`.
