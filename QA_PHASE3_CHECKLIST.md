# QA Fase 3 - Configuracoes, Ajuda, Estrategias, Seguranca e Resiliencia

## Como usar
- Marque `PASS`, `FAIL` ou `BLOCKED`.
- Anexe evidencia curta (print/video/log).
- Execute com 2 contas de responsavel (`A` e `B`) para validar isolamento.

## Pre-condicoes
- Fase 2 concluida.
- Buckets/policies aplicados.
- Schema alinhado (`database/migrate_phase2_schema_alignment.sql`).

## AUTENTICACAO E CONTA

| ID | Cenario | Passos | Esperado | Status | Evidencia |
|---|---|---|---|---|---|
| AU-01 | Login responsavel valido | Entrar com email/senha corretos | Login concluido e dashboard aberto |  |  |
| AU-02 | Login responsavel invalido | Entrar com senha errada | Erro de credenciais sem crash |  |  |
| AU-03 | Recuperacao de senha | Acionar "esqueci minha senha" | Mensagem de envio exibida |  |  |
| AU-04 | Alteracao de senha | Tela Configuracoes -> alterar senha | Senha atualizada e novo login funciona |  |  |
| AU-05 | Logout | Efetuar logout | Volta para tela de autenticacao |  |  |

## TEMA E CONFIGURACOES

| ID | Cenario | Passos | Esperado | Status | Evidencia |
|---|---|---|---|---|---|
| CF-01 | Troca de tema por crianca | Selecionar tema no ThemePicker | Tema salvo sem erro |  |  |
| CF-02 | Persistencia de tema | Fechar app e abrir novamente | Tema permanece aplicado/salvo |  |  |
| CF-03 | Isolamento entre criancas | Alterar tema da crianca A e abrir crianca B | Tema da B nao e sobrescrito |  |  |

## AJUDA E BUSCA DE PROFISSIONAIS

| ID | Cenario | Passos | Esperado | Status | Evidencia |
|---|---|---|---|---|---|
| AJ-01 | Checklist colapsado | Abrir tela Ajuda | Categorias iniciam recolhidas |  |  |
| AJ-02 | Toggle de categoria | Expandir/recolher uma categoria | Apenas a categoria clicada muda estado |  |  |
| AJ-03 | Recomendacao por sinais | Selecionar sinais de 2 categorias | Sugestoes de profissionais coerentes |  |  |
| AJ-04 | Busca por cidade | Buscar profissionais por cidade | Lista retornada sem erro |  |  |
| AJ-05 | Acao externa | Abrir ligacao/WhatsApp/mapa de um resultado | Link externo abre corretamente |  |  |

## ESTRATEGIAS

| ID | Cenario | Passos | Esperado | Status | Evidencia |
|---|---|---|---|---|---|
| ES-01 | Listagem de categorias | Abrir tela Estrategias | Categorias carregam sem erro |  |  |
| ES-02 | Expandir card | Expandir estrategia com detalhes | Conteudo/tips exibidos corretamente |  |  |
| ES-03 | Acao de video/link | Acionar link da estrategia | Link abre sem travar o app |  |  |

## AUDIO E FEEDBACK

| ID | Cenario | Passos | Esperado | Status | Evidencia |
|---|---|---|---|---|---|
| AF-01 | SoundType music | Configurar `music` e concluir tarefa | Som + vibracao (quando aplicavel) executados |  |  |
| AF-02 | SoundType vibration | Configurar `vibration` e concluir tarefa | Apenas vibracao |  |  |
| AF-03 | SoundType silent | Configurar `silent` e concluir tarefa | Sem som e sem vibracao indevida |  |  |
| AF-04 | Instrumento favorito | Alterar instrumento e concluir tarefa | Som correspondente ao instrumento |  |  |
| AF-05 | Persistencia de settings | Fechar/reabrir app | Configuracoes de feedback preservadas |  |  |

## SEGURANCA E ISOLAMENTO (RLS)

| ID | Cenario | Passos | Esperado | Status | Evidencia |
|---|---|---|---|---|---|
| SG-01 | Dados de filhos isolados | Logar conta A, depois B | B nao enxerga filhos de A |  |  |
| SG-02 | Rotinas/tarefas isoladas | Criar rotina/tarefa na conta A e abrir B | B nao enxerga dados de A |  |  |
| SG-03 | Midia isolada por ownership | Tentar operar midia de objeto nao autorizado | Operacao negada por policy |  |  |
| SG-04 | Login infantil por familia | Usar email A + PIN de filho de B | Acesso negado |  |  |

## RESILIENCIA

| ID | Cenario | Passos | Esperado | Status | Evidencia |
|---|---|---|---|---|---|
| RS-01 | Sem internet no salvamento | Desativar rede e tentar salvar alteracao | Mensagem de erro amigavel |  |  |
| RS-02 | Retorno da internet | Reativar rede e repetir operacao | Operacao volta a funcionar |  |  |
| RS-03 | Timeout/latencia | Executar fluxo com rede lenta | Sem crash; estado da UI consistente |  |  |

## Criterios de saida da Fase 3
- Nenhum `FAIL/BLOCKED` em: `AU-01`, `CF-02`, `AJ-04`, `AF-01`, `SG-01`, `SG-02`.
- Sem vazamento de dados entre contas.
- Sem crash em configuracoes, ajuda e estrategias.
