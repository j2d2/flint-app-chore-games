import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

/** Real-time event pushed from server when chore state changes */
export interface ChoreEvent {
  type: 'chore:completed' | 'reward:redeemed' | 'leaderboard:update';
  payload: unknown;
}

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;
  private readonly choreEvent$ = new Subject<ChoreEvent>();

  connect(): void {
    if (this.socket?.connected) {
      return;
    }
    this.socket = io({ path: '/socket.io', transports: ['websocket', 'polling'] });
    this.socket.on('chore:completed', (p: unknown) =>
      this.choreEvent$.next({ type: 'chore:completed', payload: p })
    );
    this.socket.on('reward:redeemed', (p: unknown) =>
      this.choreEvent$.next({ type: 'reward:redeemed', payload: p })
    );
    this.socket.on('leaderboard:update', (p: unknown) =>
      this.choreEvent$.next({ type: 'leaderboard:update', payload: p })
    );
  }

  onChoreEvent(): Observable<ChoreEvent> {
    return this.choreEvent$.asObservable();
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
