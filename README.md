# MinhaRotina

Aplicativo mobile (React Native + Expo) para apoiar rotinas de criancas autistas, com area da familia e area da crianca.

## O que ja temos

- Login de responsavel e login infantil por email da familia + PIN.
- Cadastro e gestao de filhos.
- Criacao de rotinas (manha, tarde, noite, personalizada).
- Criacao/edicao de tarefas com:
  - emoji
  - tempo estimado
  - descricao
  - foto
  - link de video
  - marcacao sensorial
- Fluxo da crianca para executar tarefas com:
  - progresso visual
  - timer por tarefa
  - concluir / pular / tentar no final
  - tela de celebracao
- Regras por periodo do dia:
  - todas as rotinas aparecem
  - apenas a rotina do periodo atual pode ser aberta
  - validacao adicional na tela de tarefa para bloquear acesso fora do horario
- Tela "Quando Buscar Ajuda":
  - checklist por categorias
  - categorias iniciam ocultas por padrao
  - usuario expande apenas o que precisa
  - sugestao de profissionais com base nas selecoes
- Biblioteca de estrategias para desafios sensoriais/comportamentais.

## Testes

- Suite de testes com Jest.
- Utilitarios e stores com cobertura inicial.
- Novos testes adicionados para:
  - regras de periodo do dia (`timeWindow`)
  - comportamento de colapso/expansao do checklist (`helpChecklist`)

Comando:

```bash
npm test
```

## Stack

- React Native + Expo
- TypeScript
- Zustand
- Supabase
- Jest

## Como rodar local

```bash
npm install
npm start
```
