import { supabase } from '../config/supabase';

export interface ParentSuggestionInput {
  category: string;
  title: string;
  message: string;
}

const MIN_TITLE_LENGTH = 4;
const MAX_TITLE_LENGTH = 120;
const MIN_MESSAGE_LENGTH = 20;
const MAX_MESSAGE_LENGTH = 2000;

function validateSuggestionInput(input: ParentSuggestionInput): string | null {
  const category = input.category.trim();
  const title = input.title.trim();
  const message = input.message.trim();

  if (!category) return 'Selecione uma categoria.';
  if (title.length < MIN_TITLE_LENGTH) return 'Titulo muito curto.';
  if (title.length > MAX_TITLE_LENGTH) return 'Titulo muito longo.';
  if (message.length < MIN_MESSAGE_LENGTH) return 'Descreva melhor sua sugestao (minimo de 20 caracteres).';
  if (message.length > MAX_MESSAGE_LENGTH) return 'Mensagem muito longa (maximo de 2000 caracteres).';

  return null;
}

function mapSuggestionError(error: unknown): Error {
  const raw = String((error as any)?.message ?? '').trim();
  const msg = raw.toLowerCase();

  if (
    msg.includes('function not found') ||
    msg.includes('failed to send a request to the edge function') ||
    msg.includes('edge function')
  ) {
    return new Error(
      'Canal de sugestoes indisponivel no momento. Tente novamente em alguns minutos.'
    );
  }

  if (msg.includes('network') || msg.includes('fetch')) {
    return new Error('Sem conexao com a internet. Verifique sua rede e tente novamente.');
  }

  if (error instanceof Error) return error;
  return new Error(raw || 'Nao foi possivel enviar sua sugestao agora.');
}

export const suggestionService = {
  async submitSuggestion(input: ParentSuggestionInput): Promise<void> {
    const validationError = validateSuggestionInput(input);
    if (validationError) throw new Error(validationError);

    try {
      const payload: ParentSuggestionInput = {
        category: input.category.trim(),
        title: input.title.trim(),
        message: input.message.trim(),
      };

      const { error, data } = await supabase.functions.invoke('send-parent-suggestion', {
        body: payload,
      });

      if (error) throw error;

      if (!data || data.ok !== true) {
        throw new Error('Resposta invalida do servidor de sugestoes.');
      }
    } catch (error: unknown) {
      throw mapSuggestionError(error);
    }
  },
};

