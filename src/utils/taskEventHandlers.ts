/**
 * Coordenadores de eventos de tarefa → feedbackService.
 *
 * Isolam a lógica "qual trigger chamar" do código UI dos screens,
 * facilitando testes e evitando chamadas diretas a expo-haptics.
 */
import { feedbackService } from '../services/feedbackService';

/**
 * Criança concluiu uma tarefa (qualquer — inclusive a última).
 * Toca a nota de conclusão de tarefa + vibra.
 * CelebrationScreen é responsável por triggerRoutineComplete quando é a última.
 * Fire-and-forget — não bloqueia a UI.
 */
export function onTaskCompleted(childId: string): void {
  feedbackService.triggerTaskComplete(childId).catch(() => {});
}

/**
 * App exibiu a próxima tarefa (chamado após a animação de transição).
 * Fire-and-forget — não bloqueia a UI.
 */
export function onMoveToNextTask(childId: string): void {
  feedbackService.triggerNextTask(childId).catch(() => {});
}

/**
 * Criança sinalizou que não consegue fazer a tarefa (pular agora ou tentar no final).
 * Fire-and-forget — não bloqueia a UI.
 */
export function onTaskSkipped(childId: string): void {
  feedbackService.triggerCantDo(childId).catch(() => {});
}

/**
 * Modo calmo ativado (criança sobrecarregada).
 * Fire-and-forget — não bloqueia a UI.
 */
export function onCalmModeEntered(childId: string): void {
  feedbackService.triggerCalmMode(childId).catch(() => {});
}

/**
 * Rotina carregou com sucesso e está prestes a iniciar.
 * Fire-and-forget — não bloqueia a UI.
 */
export function onRoutineStarted(childId: string): void {
  feedbackService.triggerRoutineStart(childId).catch(() => {});
}

/**
 * CelebrationScreen foi exibida: toca a tríade de celebração completa.
 * Cobre todos os caminhos que chegam à tela (conclusão normal ou skip da última tarefa).
 * Fire-and-forget — não bloqueia a UI.
 */
export function onCelebrationShown(childId: string): void {
  feedbackService.triggerRoutineComplete(childId).catch(() => {});
}
