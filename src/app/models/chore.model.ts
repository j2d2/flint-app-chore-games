/** How often a chore repeats */
export type ChoreFrequency = 'daily' | 'weekly' | 'one-off';

/** State of a single chore assignment */
export type ChoreStatus = 'pending' | 'done' | 'skipped';

/** A chore definition — the template */
export interface Chore {
  id: string;
  title: string;
  description?: string | null;
  /** Dollar value paid per completion */
  value: number;
  frequency: ChoreFrequency;
  /** Emoji icon */
  icon: string;
  /** kid id this is assigned to; null = any kid */
  assigned_to?: string | null;
  active: number; // SQLite stores booleans as 0/1
  created_at: string;
}

/** A single instance of a chore being completed (or not) */
export interface ChoreLog {
  id: string;
  chore_id: string;
  kid_id: string;
  status: ChoreStatus;
  due_date: string;
  completed_at?: string | null;
  // Joined fields from GET /api/logs/today
  title?: string;
  icon?: string;
  value?: number;
  frequency?: ChoreFrequency;
  kid_name?: string;
  kid_avatar?: string;
}

/** Weekly earnings summary for one kid (matches /api/stats/earnings/:kidId/week) */
export interface WeeklyEarnings {
  kid_id: string;
  week_start: string;
  days: WeeklyEarningsDay[];
  total_this_week: number;
}

/** Stats summary for the home dashboard (matches /api/stats response) */
export interface ChoreStats {
  today_total: number;
  today_done: number;
  weekly_earned: number;
  active_players: number;
  kids: import('./family.model').KidProfile[];
}

/** Weekly earnings breakdown for one kid */
export interface WeeklyEarningsDay {
  due_date: string;
  earned: number;
  chores_done: number;
}
