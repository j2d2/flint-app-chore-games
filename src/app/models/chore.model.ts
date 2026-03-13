/** How often a chore repeats */
export type ChoreFrequency = 'daily' | 'weekly' | 'one-off';

/** State of a single chore assignment */
export type ChoreStatus = 'pending' | 'done' | 'skipped';

/** A chore definition — the template */
export interface Chore {
  id: string;
  title: string;
  description?: string;
  /** Dollar value paid per completion */
  value: number;
  frequency: ChoreFrequency;
  /** Icon name from ionicons */
  icon?: string;
  /** kid id this is assigned to; undefined = any kid */
  assignedTo?: string;
  active: boolean;
  createdAt: string;
}

/** A single instance of a chore being completed (or not) */
export interface ChoreLog {
  id: string;
  choreId: string;
  kidId: string;
  status: ChoreStatus;
  /** ISO date string of the slot (e.g. the day for daily chores) */
  dueDate: string;
  completedAt?: string;
  notes?: string;
}

/** Weekly earnings summary for one kid */
export interface WeeklyEarnings {
  kidId: string;
  weekStart: string;
  choresCompleted: number;
  totalEarned: number;
  /** Pending = earned but not yet paid out */
  pendingPayout: number;
}

/** Stats summary for the home dashboard */
export interface ChoreStats {
  todayTotal: number;
  todayDone: number;
  weeklyEarned: number;
  streakDays: number;
}
