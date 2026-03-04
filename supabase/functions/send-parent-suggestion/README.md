# send-parent-suggestion

Edge Function para receber sugestoes dos pais e enviar notificacao por email sem expor o destinatario no app.

## O que ela faz

1. Valida o usuario autenticado pelo JWT.
2. Valida payload (`category`, `title`, `message`).
3. Grava registro em `public.parent_suggestions`.
4. Envia email via Resend para o destinatario configurado em secret.

## Secrets obrigatorios

Defina no projeto Supabase (nao no app):

- `RESEND_API_KEY`
- `SUGGESTIONS_OWNER_EMAIL`
- `SUGGESTIONS_FROM_EMAIL`

Exemplo:

```bash
supabase secrets set RESEND_API_KEY=...
supabase secrets set SUGGESTIONS_OWNER_EMAIL=joeltere9@gmail.com
supabase secrets set SUGGESTIONS_FROM_EMAIL=\"Minha Rotina <noreply@seu-dominio.com>\"
```

## Deploy

```bash
supabase functions deploy send-parent-suggestion --no-verify-jwt
```

Observacao: essa funcao valida sessao manualmente via `auth.getUser()`, por isso o deploy deve ser feito com `--no-verify-jwt`.

## SQL prerequisite

Execute antes:

`database/create_parent_suggestions_feature.sql`
