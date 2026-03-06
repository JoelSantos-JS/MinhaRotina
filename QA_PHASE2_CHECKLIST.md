# QA Fase 2 - Filhos, Rotinas, Tarefas e Fluxo Infantil

## Como usar
- Preencha `Status` com `PASS`, `FAIL` ou `BLOCKED`.
- Em `Evidencia`, coloque screenshot/video ou descricao curta.
- Execute na ordem: `FILHOS -> ROTINAS -> TAREFAS -> CRIANCA`.

## Pre-condicoes
- Usuario responsavel autenticado.
- Pelo menos 1 filho existente.
- Buckets/policies de storage ja validados.
- Schema alinhado com as features atuais (`database/migrate_phase2_schema_alignment.sql` aplicado).
- Validacao SQL executada (`database/validate_phase2_results.sql`) com pre-check de schema em `true`.
- App com internet estavel.

## FILHOS

| ID | Cenario | Passos | Esperado | Status | Evidencia |
|---|---|---|---|---|---|
| CH-01 | Criar filho valido | Abrir Filhos -> Novo filho -> preencher nome, idade, PIN valido -> salvar | Filho aparece na lista sem erro |  |  |
| CH-02 | Validacao de PIN curto | Tentar criar filho com PIN menor que 4 digitos | App bloqueia salvamento e mostra erro de validacao |  |  |
| CH-03 | Validacao de PIN nao numerico | Tentar criar filho com letras no PIN | App bloqueia salvamento e mostra erro de validacao |  |  |
| CH-04 | PIN duplicado entre irmaos | Criar/editar filho usando PIN ja usado por irmao | App bloqueia com mensagem de PIN em uso |  |  |
| CH-05 | Editar dados do filho | Editar nome/idade/tema/emoji e salvar | Alteracoes persistem ao reabrir tela |  |  |
| CH-06 | Regenerar PIN | Abrir codigos de acesso/regenerar PIN | Novo PIN salvo e antigo deixa de autenticar |  |  |
| CH-07 | Excluir filho | Excluir um filho de teste | Filho sai da lista e nao aparece apos reload |  |  |

## ROTINAS

| ID | Cenario | Passos | Esperado | Status | Evidencia |
|---|---|---|---|---|---|
| RT-01 | Criar rotina manha | Gerenciar rotinas -> criar tipo `morning` | Rotina aparece ativa na lista |  |  |
| RT-02 | Criar rotina tarde/noite/custom | Criar 3 rotinas com tipos diferentes | Todas aparecem com tipo correto |  |  |
| RT-03 | Ativar/desativar rotina | Alternar switch de rotina | Estado `is_active` muda e persiste |  |  |
| RT-04 | Excluir rotina | Excluir rotina de teste | Rotina removida da lista |  |  |
| RT-05 | Ordem e consistencia | Fechar e abrir tela de rotinas | Lista permanece consistente, sem duplicidade |  |  |

## TAREFAS

| ID | Cenario | Passos | Esperado | Status | Evidencia |
|---|---|---|---|---|---|
| TK-01 | Criar tarefa basica | Adicionar tarefa com nome, emoji e tempo | Tarefa criada e exibida na rotina |  |  |
| TK-02 | Criar tarefa com foto (galeria) | Adicionar tarefa e anexar foto | Upload concluido e foto exibida |  |  |
| TK-03 | Atualizar foto da tarefa | Editar tarefa e trocar foto | Foto nova substitui anterior (upsert) |  |  |
| TK-04 | Remover foto da tarefa | Editar tarefa e limpar foto | `photo_url` removido sem erro |  |  |
| TK-05 | Criar tarefa com video | Adicionar tarefa com video | Upload/salvamento do video sem erro |  |  |
| TK-06 | Criar tarefa com descricao | Salvar tarefa em modo texto | `description` persistida e renderizada na tela da crianca |  |  |
| TK-07 | Criar tarefa com passos | Salvar tarefa em modo passos (2+ itens) | `steps` persistido com ordem correta |  |  |
| TK-08 | Troca texto -> passos | Editar tarefa texto para passos | `description` vira null e `steps` fica preenchido |  |  |
| TK-09 | Troca passos -> texto | Editar tarefa passos para texto | `steps` vira null e `description` fica preenchida |  |  |
| TK-10 | Sensory auto-detection | Criar tarefa com termo sensorial (ex: dentes) | Categoria sensorial sugerida/aplicada corretamente |  |  |
| TK-11 | Excluir tarefa | Excluir tarefa da rotina | Tarefa removida sem quebra de ordenacao |  |  |

## FLUXO INFANTIL

| ID | Cenario | Passos | Esperado | Status | Evidencia |
|---|---|---|---|---|---|
| FL-01 | Login infantil por email+PIN | Tela login crianca -> email responsavel + PIN valido | Entra na home infantil |  |  |
| FL-02 | Login infantil PIN invalido | Tentar PIN incorreto | App bloqueia acesso e mostra erro |  |  |
| FL-03 | Regra por periodo | Tentar abrir rotina fora do periodo atual | App bloqueia abertura com mensagem |  |  |
| FL-04 | Concluir tarefa | Abrir rotina e concluir 1 tarefa | Registra progresso e avanca para proxima |  |  |
| FL-05 | Pular tarefa (skip_now) | Escolher `nao consigo agora` | Registra skip e segue fluxo sem crash |  |  |
| FL-06 | Pular tarefa (try_later) | Escolher `tentar no final` | Tarefa vai para o final e fluxo continua |  |  |
| FL-07 | Modo calma | Acionar modo calma durante tarefa | Feedback de modo calma executado sem erro |  |  |
| FL-08 | Celebracao final | Concluir ultima tarefa da rotina | Tela de celebracao abre e fecha corretamente |  |  |

## DIARIO E PROGRESSO (validacao cruzada)

| ID | Cenario | Passos | Esperado | Status | Evidencia |
|---|---|---|---|---|---|
| DP-01 | Diario apos completacoes | Abrir Diario apos FL-04 | Evento de conclusao aparece no dia atual |  |  |
| DP-02 | Diario apos skips | Abrir Diario apos FL-05/FL-06 | Eventos de skip aparecem com motivo correto |  |  |
| DP-03 | Nota de progresso | Editar nota em item do Diario | Nota persiste apos refresh |  |  |
| DP-04 | Metricas de progresso | Abrir tela Progresso | Totais e taxa coerentes com eventos criados |  |  |

## Criterio de saida da Fase 2
- 0 falhas em `CH-01`, `RT-01`, `TK-02`, `FL-04`, `FL-08`, `DP-04`.
- Sem erro de seguranca RLS em upload de foto/video.
- Sem crash nos fluxos principais.
