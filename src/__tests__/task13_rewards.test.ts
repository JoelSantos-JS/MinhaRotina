/**
 * TASK 13 — Bateria de testes: rewardsService
 *
 * [T13-01] getStars retorna 0 quando não há dados
 * [T13-02] addStar retorna 1 a partir de zero
 * [T13-03] addStar acumula corretamente em múltiplas chamadas
 * [T13-04] getStars retorna 0 com valor corrompido
 * [T13-05] getStars retorna 0 quando getItem lança exceção
 * [T13-06] resetStars salva "0" via setItem
 * [T13-07] getRewards retorna [] por padrão
 * [T13-08] addReward adiciona reward com id gerado e isRedeemed: false
 * [T13-09] addReward múltiplos rewards acumula lista
 * [T13-10] redeemReward marca isRedeemed: true e define redeemedAt
 * [T13-11] redeemReward não afeta outros rewards da lista
 * [T13-12] deleteReward remove o reward e mantém os demais
 * [T13-13] getNextReward retorna null quando lista está vazia
 * [T13-14] getNextReward retorna reward com menor starsRequired não resgatado
 * [T13-15] Chaves de stars e rewards usam childId corretamente
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { rewardsService } from '../services/rewardsService';

const mockStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('TASK 13 — rewardsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.getItem.mockResolvedValue(null);
    mockStorage.setItem.mockResolvedValue(undefined);
  });

  // ── Stars ─────────────────────────────────────────────────────────────────

  it('[T13-01] getStars retorna 0 quando não há dados', async () => {
    mockStorage.getItem.mockResolvedValue(null);
    const result = await rewardsService.getStars('child-1');
    expect(result).toBe(0);
  });

  it('[T13-02] addStar retorna 1 a partir de zero', async () => {
    mockStorage.getItem.mockResolvedValue(null);
    const result = await rewardsService.addStar('child-1');
    expect(result).toBe(1);
    expect(mockStorage.setItem).toHaveBeenCalledWith('child_stars_child-1', '1');
  });

  it('[T13-03] addStar acumula corretamente em múltiplas chamadas', async () => {
    // Simula: getStars retorna 3 na 2ª chamada (após 1ª gravação)
    mockStorage.getItem
      .mockResolvedValueOnce('3') // getStars dentro do 2º addStar
      .mockResolvedValue(null);

    const result = await rewardsService.addStar('child-1');
    expect(result).toBe(4);
  });

  it('[T13-04] getStars retorna 0 com valor corrompido', async () => {
    mockStorage.getItem.mockResolvedValue('abc');
    const result = await rewardsService.getStars('child-corrupt');
    expect(result).toBe(0);
  });

  it('[T13-05] getStars retorna 0 quando getItem lança exceção', async () => {
    mockStorage.getItem.mockRejectedValue(new Error('Storage error'));
    const result = await rewardsService.getStars('child-err');
    expect(result).toBe(0);
  });

  it('[T13-06] resetStars salva "0" via setItem', async () => {
    await rewardsService.resetStars('child-1');
    expect(mockStorage.setItem).toHaveBeenCalledWith('child_stars_child-1', '0');
  });

  // ── Rewards ───────────────────────────────────────────────────────────────

  it('[T13-07] getRewards retorna [] por padrão', async () => {
    mockStorage.getItem.mockResolvedValue(null);
    const result = await rewardsService.getRewards('child-1');
    expect(result).toEqual([]);
  });

  it('[T13-08] addReward adiciona reward com id gerado e isRedeemed: false', async () => {
    mockStorage.getItem.mockResolvedValue(null);
    const result = await rewardsService.addReward('child-1', {
      title: 'Sorvete',
      emoji: '🍦',
      starsRequired: 5,
    });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Sorvete');
    expect(result[0].emoji).toBe('🍦');
    expect(result[0].starsRequired).toBe(5);
    expect(result[0].isRedeemed).toBe(false);
    expect(result[0].id).toBeDefined();
    expect(typeof result[0].id).toBe('string');
  });

  it('[T13-09] addReward múltiplos rewards acumula lista', async () => {
    const existing = JSON.stringify([
      { id: '1', title: 'Sorvete', emoji: '🍦', starsRequired: 5, isRedeemed: false },
    ]);
    mockStorage.getItem.mockResolvedValue(existing);

    const result = await rewardsService.addReward('child-1', {
      title: 'Parque',
      emoji: '🌳',
      starsRequired: 10,
    });
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Sorvete');
    expect(result[1].title).toBe('Parque');
  });

  it('[T13-10] redeemReward marca isRedeemed: true e define redeemedAt', async () => {
    const existing = JSON.stringify([
      { id: 'r1', title: 'Sorvete', emoji: '🍦', starsRequired: 5, isRedeemed: false },
    ]);
    mockStorage.getItem.mockResolvedValue(existing);

    const result = await rewardsService.redeemReward('child-1', 'r1');
    expect(result[0].isRedeemed).toBe(true);
    expect(result[0].redeemedAt).toBeDefined();
    expect(typeof result[0].redeemedAt).toBe('string');
  });

  it('[T13-11] redeemReward não afeta outros rewards da lista', async () => {
    const existing = JSON.stringify([
      { id: 'r1', title: 'Sorvete', emoji: '🍦', starsRequired: 5, isRedeemed: false },
      { id: 'r2', title: 'Parque', emoji: '🌳', starsRequired: 10, isRedeemed: false },
    ]);
    mockStorage.getItem.mockResolvedValue(existing);

    const result = await rewardsService.redeemReward('child-1', 'r1');
    expect(result[0].isRedeemed).toBe(true);
    expect(result[1].isRedeemed).toBe(false);
    expect(result[1].redeemedAt).toBeUndefined();
  });

  it('[T13-12] deleteReward remove o reward e mantém os demais', async () => {
    const existing = JSON.stringify([
      { id: 'r1', title: 'Sorvete', emoji: '🍦', starsRequired: 5, isRedeemed: false },
      { id: 'r2', title: 'Parque', emoji: '🌳', starsRequired: 10, isRedeemed: false },
    ]);
    mockStorage.getItem.mockResolvedValue(existing);

    const result = await rewardsService.deleteReward('child-1', 'r1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r2');
  });

  it('[T13-13] getNextReward retorna null quando lista está vazia', async () => {
    mockStorage.getItem.mockResolvedValue(null);
    const result = await rewardsService.getNextReward('child-1');
    expect(result).toBeNull();
  });

  it('[T13-14] getNextReward retorna reward com menor starsRequired não resgatado', async () => {
    const existing = JSON.stringify([
      { id: 'r1', title: 'Caro', emoji: '🚀', starsRequired: 20, isRedeemed: false },
      { id: 'r2', title: 'Barato', emoji: '🍦', starsRequired: 5, isRedeemed: false },
      { id: 'r3', title: 'Resgatado', emoji: '✅', starsRequired: 3, isRedeemed: true },
    ]);
    mockStorage.getItem.mockResolvedValue(existing);

    const result = await rewardsService.getNextReward('child-1');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('r2');
    expect(result!.starsRequired).toBe(5);
  });

  it('[T13-15] Chaves de stars e rewards usam childId corretamente', async () => {
    await rewardsService.resetStars('my-child-id');
    expect(mockStorage.setItem.mock.calls[0][0]).toBe('child_stars_my-child-id');

    jest.clearAllMocks();
    mockStorage.getItem.mockResolvedValue(null);
    mockStorage.setItem.mockResolvedValue(undefined);

    await rewardsService.addReward('my-child-id', { title: 'Test', emoji: '🎁', starsRequired: 1 });
    expect(mockStorage.getItem.mock.calls[0][0]).toBe('child_rewards_my-child-id');
    expect(mockStorage.setItem.mock.calls[0][0]).toBe('child_rewards_my-child-id');
  });
});
