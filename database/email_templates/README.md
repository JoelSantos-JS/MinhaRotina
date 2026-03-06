# Supabase Auth - Email Templates (Minha Rotina)

Arquivos:
- `database/email_templates/confirm_signup_template.html`
- `database/email_templates/recovery_password_template.html`

## Onde configurar no Supabase

1. Abra `Supabase Dashboard -> Authentication -> Email Templates`.
2. Em `Confirm signup`:
- Subject sugerido: `Confirme sua conta no Minha Rotina`
- Cole o conteudo de `confirm_signup_template.html`.
3. Em `Reset Password`:
- Subject sugerido: `Redefina sua senha no Minha Rotina`
- Cole o conteudo de `recovery_password_template.html`.
4. Salve.

## Placeholders usados

- `{{ .ConfirmationURL }}`: link seguro que o Supabase gera para confirmar/redefinir.

## Checklist de validacao manual

1. Criar conta nova com um email real e confirmar recebimento/visual do template.
2. Clicar no botao de confirmacao e validar que a conta fica ativa.
3. Usar `Esqueci minha senha` e validar recebimento/visual do template.
4. Clicar no botao de redefinicao e validar troca de senha.

## Observacoes

- O visual segue a paleta do app (`#88CAFC`, `#D2EBFF`, `#A8C98E`, `#2B2C41`).
- Para testes, sempre envie para provedores diferentes (Gmail/Outlook) para checar renderizacao.
