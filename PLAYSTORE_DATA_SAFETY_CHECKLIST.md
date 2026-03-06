# Play Store - Data Safety Checklist

Data base: 2026-03-03  
Escopo: preenchimento tecnico do formulario **Data safety** da Google Play para o app MinhaR.

## 1) O que marcar no formulario (proposta)

### Coleta de dados (Collected)
- Personal info:
  - `Name` -> **Collected**
  - `Email address` -> **Collected**
- Photos and videos:
  - `Photos`
  - `Videos`
- App activity:
  - Interacoes no app (rotinas, tarefas, progresso, skips, notas)
- Location:
  - `Approximate location` e/ou `Precise location` (somente se usar busca por geolocalizacao)

### Compartilhamento (Shared)
- Marcar **Not shared** (se nao houver envio para terceiros para ads/analytics/marketing).

### Finalidade (Purpose)
- `App functionality`
- `Account management`
- `Security, fraud prevention, and compliance`

### Processamento temporario (Ephemeral)
- Marcar conforme fluxo real; em geral dados de conta/progresso/midia **nao** sao efemeros.

### Coleta obrigatoria
- Dados de conta: obrigatorios para login.
- Localizacao: opcional.
- Fotos/videos: opcionais.

## 2) Evidencias no codigo (para auditoria interna)

- Nome/email de responsavel:
  - `src/services/auth.service.ts`
  - `database/schema.sql` (`parent_accounts`)
- Fotos/videos:
  - `src/services/auth.service.ts` (`parent-photos`)
  - `src/services/routine.service.ts` (`task-photos`, `task-videos`)
- Localizacao:
  - `app.json` plugin `expo-location`
  - `src/screens/parent/AjudaScreen.tsx`
- Exclusao de conta:
  - `database/account_deletion_rpc.sql`
  - `src/screens/parent/SettingsScreen.tsx`

## 3) Pendencias antes de publicar

- Confirmar URL publica da Politica de Privacidade na Play Console.
- Confirmar URL publica para solicitacao de exclusao de conta (web).
- Revisar respostas do Data Safety com juridico/compliance (LGPD).
- Garantir consistencia entre formulario e comportamento real do app.

## 4) Checklist operacional

1. Preencher o formulario Data Safety com esta base.
2. Fazer captura de tela das respostas finais.
3. Versionar esse material no repositorio (ou pasta de compliance).
4. Revalidar sempre que houver nova permissao/dado coletado.

