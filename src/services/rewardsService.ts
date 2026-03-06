import AsyncStorage from '@react-native-async-storage/async-storage';

const STARS_KEY = (childId: string) => `child_stars_${childId}`;
const REWARDS_KEY = (childId: string) => `child_rewards_${childId}`;

export interface Reward {
  id: string;
  title: string;
  emoji: string;
  starsRequired: number;
  isRedeemed: boolean;
  redeemedAt?: string;
}

export const rewardsService = {
  // ── Stars ──────────────────────────────────────────────────────

  async getStars(childId: string): Promise<number> {
    try {
      const raw = await AsyncStorage.getItem(STARS_KEY(childId));
      if (raw !== null) return Math.max(0, parseInt(raw, 10) || 0);
    } catch {}
    return 0;
  },

  async addStar(childId: string): Promise<number> {
    const current = await rewardsService.getStars(childId);
    const next = current + 1;
    await AsyncStorage.setItem(STARS_KEY(childId), String(next));
    return next;
  },

  async resetStars(childId: string): Promise<void> {
    await AsyncStorage.setItem(STARS_KEY(childId), '0');
  },

  // ── Rewards ─────────────────────────────────────────────────────

  async getRewards(childId: string): Promise<Reward[]> {
    try {
      const raw = await AsyncStorage.getItem(REWARDS_KEY(childId));
      if (raw) return JSON.parse(raw) as Reward[];
    } catch {}
    return [];
  },

  async saveRewards(childId: string, rewards: Reward[]): Promise<void> {
    await AsyncStorage.setItem(REWARDS_KEY(childId), JSON.stringify(rewards));
  },

  async addReward(
    childId: string,
    data: Omit<Reward, 'id' | 'isRedeemed'>
  ): Promise<Reward[]> {
    const rewards = await rewardsService.getRewards(childId);
    const newReward: Reward = { ...data, id: Date.now().toString(), isRedeemed: false };
    const updated = [...rewards, newReward];
    await rewardsService.saveRewards(childId, updated);
    return updated;
  },

  async redeemReward(childId: string, rewardId: string): Promise<Reward[]> {
    const rewards = await rewardsService.getRewards(childId);
    const updated = rewards.map((r) =>
      r.id === rewardId
        ? { ...r, isRedeemed: true, redeemedAt: new Date().toISOString() }
        : r
    );
    await rewardsService.saveRewards(childId, updated);
    return updated;
  },

  async deleteReward(childId: string, rewardId: string): Promise<Reward[]> {
    const rewards = await rewardsService.getRewards(childId);
    const updated = rewards.filter((r) => r.id !== rewardId);
    await rewardsService.saveRewards(childId, updated);
    return updated;
  },

  async getNextReward(childId: string): Promise<Reward | null> {
    const rewards = await rewardsService.getRewards(childId);
    const pending = rewards
      .filter((r) => !r.isRedeemed)
      .sort((a, b) => a.starsRequired - b.starsRequired);
    return pending[0] ?? null;
  },
};
