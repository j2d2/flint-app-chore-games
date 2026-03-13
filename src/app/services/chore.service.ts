import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Chore, ChoreLog, ChoreStats, WeeklyEarnings } from '../models/chore.model';
import { KidProfile, Payout, Reward, RewardRedemption } from '../models/family.model';

@Injectable({ providedIn: 'root' })
export class ChoreService {
  private readonly http = inject(HttpClient);

  // ── Chores ────────────────────────────────────────────────────────────────

  getChores(): Observable<Chore[]> {
    return this.http.get<Chore[]>('/api/chores');
  }

  createChore(chore: Omit<Chore, 'id' | 'created_at'>): Observable<Chore> {
    return this.http.post<Chore>('/api/chores', chore);
  }

  updateChore(id: string, patch: Partial<Chore>): Observable<Chore> {
    return this.http.patch<Chore>(`/api/chores/${id}`, patch);
  }

  deleteChore(id: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`/api/chores/${id}`);
  }

  // ── Chore Logs (completions) ───────────────────────────────────────────────

  /** Returns today's logs with joined chore/kid info */
  getTodaysLogs(): Observable<ChoreLog[]> {
    return this.http.get<ChoreLog[]>('/api/logs/today');
  }

  markDone(choreId: string, kidId: string): Observable<ChoreLog> {
    return this.http.post<ChoreLog>('/api/logs', { chore_id: choreId, kid_id: kidId });
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  getStats(): Observable<ChoreStats> {
    return this.http.get<ChoreStats>('/api/stats');
  }

  getWeeklyEarnings(kidId: string): Observable<WeeklyEarnings> {
    return this.http.get<WeeklyEarnings>(`/api/stats/earnings/${kidId}/week`);
  }

  // ── Kids / Family ─────────────────────────────────────────────────────────

  getKids(): Observable<KidProfile[]> {
    return this.http.get<KidProfile[]>('/api/kids');
  }

  createKid(kid: { name: string; avatar?: string }): Observable<KidProfile> {
    return this.http.post<KidProfile>('/api/kids', kid);
  }

  updateKid(id: string, patch: { name?: string; avatar?: string }): Observable<KidProfile> {
    return this.http.patch<KidProfile>(`/api/kids/${id}`, patch);
  }

  deleteKid(id: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`/api/kids/${id}`);
  }

  // ── Rewards ───────────────────────────────────────────────────────────────

  getRewards(): Observable<Reward[]> {
    return this.http.get<Reward[]>('/api/rewards');
  }

  createReward(reward: Omit<Reward, 'id' | 'created_at'>): Observable<Reward> {
    return this.http.post<Reward>('/api/rewards', reward);
  }

  updateReward(id: string, patch: Partial<Reward>): Observable<Reward> {
    return this.http.patch<Reward>(`/api/rewards/${id}`, patch);
  }

  deleteReward(id: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`/api/rewards/${id}`);
  }

  redeemReward(rewardId: string, kidId: string): Observable<RewardRedemption> {
    return this.http.post<RewardRedemption>('/api/rewards/redeem', {
      reward_id: rewardId,
      kid_id: kidId,
    });
  }

  // ── Payouts ───────────────────────────────────────────────────────────────

  getPayouts(): Observable<Payout[]> {
    return this.http.get<Payout[]>('/api/payouts');
  }

  getKidPayouts(kidId: string): Observable<Payout[]> {
    return this.http.get<Payout[]>(`/api/payouts/kid/${kidId}`);
  }

  recordPayout(kidId: string, amount?: number, note?: string): Observable<Payout> {
    return this.http.post<Payout>('/api/payouts', { kid_id: kidId, amount, note });
  }
}
