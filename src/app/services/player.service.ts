/**
 * player.service.ts — Tracks who is currently "playing" (claiming chore credit).
 *
 * Persists the active player ID in localStorage so the selection survives
 * page navigation and browser refresh.
 */
import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'chg_active_player';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  readonly activePlayerId = signal<string | null>(
    localStorage.getItem(STORAGE_KEY)
  );

  setActivePlayer(id: string): void {
    this.activePlayerId.set(id);
    localStorage.setItem(STORAGE_KEY, id);
  }
}
