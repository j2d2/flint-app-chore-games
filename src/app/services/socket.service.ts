import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

/** Real-time event pushed from the chore-games backend */
export interface ChoreEvent {
  type: 'chore:completed' | 'reward:redeemed' | 'payout:recorded' | 'leaderboard:update';
  payload: Record<string, unknown>;
  ts: string;
}

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;
  private readonly choreEvent$ = new Subject<ChoreEvent>();

  connect(): void {
    if (this.socket?.connected) {
      return;
    }
    // The backend emits a single 'chore:event' envelope — no individual event names
    this.socket = io({ path: '/socket.io', transports: ['websocket', 'polling'] });
    this.socket.on('chore:event', (evt: ChoreEvent) => {
      this.choreEvent$.next(evt);
    });
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
