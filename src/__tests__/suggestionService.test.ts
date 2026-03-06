import { suggestionService } from '../services/suggestion.service';

const mockInvoke = jest.fn();

jest.mock('../config/supabase', () => ({
  supabase: {
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
  },
}));

describe('suggestionService.submitSuggestion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInvoke.mockResolvedValue({ data: { ok: true }, error: null });
  });

  it('envia payload normalizado para edge function', async () => {
    await suggestionService.submitSuggestion({
      category: ' Nova funcionalidade ',
      title: ' Melhorar diario ',
      message: ' Gostaria de filtro por tipo de tarefa no diario dos pais. ',
    });

    expect(mockInvoke).toHaveBeenCalledWith('send-parent-suggestion', {
      body: {
        category: 'Nova funcionalidade',
        title: 'Melhorar diario',
        message: 'Gostaria de filtro por tipo de tarefa no diario dos pais.',
      },
    });
  });

  it('bloqueia mensagem curta antes de chamar backend', async () => {
    await expect(
      suggestionService.submitSuggestion({
        category: 'Outro',
        title: 'Nova ideia',
        message: 'Muito bom',
      })
    ).rejects.toThrow('Descreva melhor sua sugestao');

    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('mapeia erro de edge function indisponivel para mensagem amigavel', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'Failed to send a request to the Edge Function' },
    });

    await expect(
      suggestionService.submitSuggestion({
        category: 'Bug ou comportamento estranho',
        title: 'Erro na tela',
        message: 'Quando tento salvar a nota, aparece erro intermitente em alguns celulares.',
      })
    ).rejects.toThrow('Canal de sugestoes indisponivel');
  });
});

