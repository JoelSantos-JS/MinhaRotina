import { create } from 'zustand';
import { rewardsService, type Reward } from '../services/rewardsService';

interface RewardsState {
  stars: number;
  rewards: Reward[];
  loadedChildId: string | null;
  loadForChild: (childId: string) => Promise<void>;
  earnStar: (childId: string) => Promise<number>;
  resetStars: (childId: string) => Promise<void>;
  addReward: (childId: string, data: Omit<Reward, 'id' | 'isRedeemed'>) => Promise<void>;
  redeemReward: (childId: string, rewardId: string) => Promise<void>;
  deleteReward: (childId: string, rewardId: string) => Promise<void>;
  reset: () => void;
}

export const useRewardsStore = create<RewardsState>((set) => ({
  stars: 0,
  rewards: [],
  loadedChildId: null,

  loadForChild: async (childId) => {
    const [stars, rewards] = await Promise.all([
      rewardsService.getStars(childId),
      rewardsService.getRewards(childId),
    ]);
    set({ stars, rewards, loadedChildId: childId });
  },

  earnStar: async (childId) => {
    const newTotal = await rewardsService.addStar(childId);
    set({ stars: newTotal });
    return newTotal;
  },

  resetStars: async (childId) => {
    await rewardsService.resetStars(childId);
    set({ stars: 0 });
  },

  addReward: async (childId, data) => {
    const updated = await rewardsService.addReward(childId, data);
    set({ rewards: updated });
  },

  redeemReward: async (childId, rewardId) => {
    const updated = await rewardsService.redeemReward(childId, rewardId);
    set({ rewards: updated });
  },

  deleteReward: async (childId, rewardId) => {
    const updated = await rewardsService.deleteReward(childId, rewardId);
    set({ rewards: updated });
  },

  reset: () => set({ stars: 0, rewards: [], loadedChildId: null }),
}));
