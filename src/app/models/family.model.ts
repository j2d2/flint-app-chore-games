/** A child or family member who can be assigned chores */
export interface KidProfile {
  id: string;
  name: string;
  /** Display emoji / avatar */
  avatar: string;
  /** 'kid' or 'adult' — adults earn the same way but are shown differently */
  role: 'kid' | 'adult';
  /** Total lifetime earnings */
  total_earned: number;
  /** Balance not yet paid out */
  balance: number;
  streak_days: number;
  last_chore_date: string | null;
  created_at: string;
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
  reward_id: string;
  kid_id: string;
  cost: number;
  redeemed_at: string;
}

/** A parent payout record */
export interface Payout {
  id: string;
  kid_id: string;
  kid_name?: string;
  kid_avatar?: string;
  amount: number;
  note?: string;
  paid_at: string;
}
