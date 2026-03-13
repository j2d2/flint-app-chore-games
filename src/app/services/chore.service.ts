import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { Chore, ChoreLog, ChoreStats, WeeklyEarnings } from '../models/chore.model';
import { KidProfile, Reward, RewardRedemption } from '../models/family.model';

@Injectable({ providedIn: 'root' })
export class ChoreService {
  private readonly http = inject(HttpClient);

  // ── Chores ────────────────────────────────────────────────────────────────

  getChores(): Observable<Chore[]> {
    return this.http
      .get<{ chores: Chore[] }>('/api/chores')
      .pipe(map((r) => r.chores));
  }

  createChore(chore: Omit<Chore, 'id' | 'createdAt'>): Observable<Chore> {
    return this.http.post<Chore>('/api/chores', chore);
  }

  updateChore(id: string, patch: Partial<Chore>): Observable<Chore> {
    return this.http.patch<Chore>(`/api/chores/${id}`, patch);
  }

  // ── Chore Logs (completions) ───────────────────────────────────────────────

  getTodaysLogs(): Observable<ChoreLog[]> {
    return this.http
      .get<{ logs: ChoreLog[] }>('/api/chores/logs/today')
      .pipe(map((r) => r.logs));
  }

  markDone(choreId: string, kidId: string): Observable<ChoreLog> {
    return this.http.post<ChoreLog>('/api/chores/logs', {
      choreId,
      kidId,
      status: 'done',
    });
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  getStats(): Observable<ChoreStats> {
    return this.http.get<ChoreStats>('/api/chores/stats');
  }

  getWeeklyEarnings(kidId: string): Observable<WeeklyEarnings> {
    return this.http.get<WeeklyEarnings>(`/api/chores/earnings/${kidId}/week`);
  }

  // ── Kids / Family ─────────────────────────────────────────────────────────

  getKids(): Observable<KidProfile[]> {
    return this.http
      .get<{ kids: KidProfile[] }>('/api/chores/kids')
      .pipe(map((r) => r.kids));
  }

  createKid(kid: Omit<KidProfile, 'id' | 'totalEarned' | 'balance' | 'createdAt'>): Observable<KidProfile> {
    return this.http.post<KidProfile>('/api/chores/kids', kid);
  }

  // ── Rewards ───────────────────────────────────────────────────────────────

  getRewards(): Observable<Reward[]> {
    return this.http
      .get<{ rewards: Reward[] }>('/api/chores/rewards')
      .pipe(map((r) => r.rewards));
  }

  redeemReward(rewardId: string, kidId: string): Observable<RewardRedemption> {
    return this.http.post<RewardRedemption>('/api/chores/rewards/redeem', {
      rewardId,
      kidId,
    });
  }
}
