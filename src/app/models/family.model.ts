/** A child or family member who can be assigned chores */
export interface KidProfile {
  id: string;
  name: string;
  /** Display emoji / avatar */
  avatar: string;
  /** Total lifetime earnings */
  totalEarned: number;
  /** Balance not yet paid out */
  balance: number;
  createdAt: string;
}

/** A redeemable reward kids can save up for */
export interface Reward {
  id: string;
  title: string;
  description?: string;
  cost: number;
  icon?: string;
  active: boolean;
}

/** A record of a reward being redeemed */
export interface RewardRedemption {
  id: string;
  rewardId: string;
  kidId: string;
  redeemedAt: string;
}
