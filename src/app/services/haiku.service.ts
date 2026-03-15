import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { HaikuEntry, HaikuPair } from '../models/haiku.model';

/** Base URL — haiku routes are served by the local chore-games backend (:18340). */
const DASHBOARD_API = '/api';

/** localStorage key: one flag per kid per calendar day. */
const voteKey = (kidId: string): string =>
  `haiku_voted_${kidId}_${new Date().toISOString().slice(0, 10)}`;

@Injectable({ providedIn: 'root' })
export class HaikuService {
  private readonly http = inject(HttpClient);

  /**
   * Full leaderboard — sorted by vote_count DESC (default) or created_at DESC.
   * Returns empty array if dashboard is unreachable.
   */
  getLeaderboard(sort: 'votes' | 'newest' = 'votes'): Observable<HaikuEntry[]> {
    return this.http
      .get<{ haikus?: HaikuEntry[] }>(`${DASHBOARD_API}/haikus?sort_by=${sort}`)
      .pipe(
        map((r) => r.haikus ?? []),
        catchError(() => of([] as HaikuEntry[]))
      );
  }

  /**
   * Returns a pair of haikus this voter hasn't seen yet.
   * Returns null if dashboard is unreachable or no pairs remain.
   */
  getPair(voterName: string): Observable<HaikuPair | null> {
    return this.http
      .get<HaikuPair>(`${DASHBOARD_API}/haikus/pair?voter_id=${encodeURIComponent(voterName)}`)
      .pipe(catchError(() => of(null)));
  }

  /**
   * Cast a vote for one haiku over another.
   * Fire-and-forget safe — errors are swallowed.
   */
  vote(haikuId: string, voterName: string, choreId?: string): Observable<void> {
    return this.http
      .post<void>(`${DASHBOARD_API}/haikus/${haikuId}/vote`, {
        voter_id: voterName,
        chore_id: choreId ?? null,
      })
      .pipe(catchError(() => of(void 0)));
  }

  /** Returns true if this kid has already voted today on this device. */
  hasVotedToday(kidId: string): boolean {
    return !!localStorage.getItem(voteKey(kidId));
  }

  /** Record that this kid voted today so the modal won't re-open. */
  markVotedToday(kidId: string): void {
    localStorage.setItem(voteKey(kidId), '1');
  }
}
