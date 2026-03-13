import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { Chore, ChoreLog } from '../models/chore.model';
import { KidProfile } from '../models/family.model';
import { ChoreService } from '../services/chore.service';
import { PlayerService } from '../services/player.service';

interface ChoreWithStatus extends Chore {
  log?: ChoreLog;
  isDone: boolean;
}

@Component({
  selector: 'app-chores-page',
  templateUrl: './chores.page.html',
  styleUrls: ['./chores.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class ChoresPage implements OnInit {
  readonly chores = signal<Chore[]>([]);
  readonly logs = signal<ChoreLog[]>([]);
  readonly members = signal<KidProfile[]>([]);
  readonly isLoading = signal(false);
  readonly markingId = signal<string | null>(null);

  private readonly playerService = inject(PlayerService);
  /** Expose to template */
  readonly activePlayerId = this.playerService.activePlayerId;

  readonly choresWithStatus = computed<ChoreWithStatus[]>(() => {
    const pid = this.playerService.activePlayerId();
    // Only consider logs for the currently-active player
    const logMap = new Map(
      this.logs()
        .filter((l) => l.kid_id === pid)
        .map((l) => [l.chore_id, l])
    );
    return this.chores()
      .filter((c) => c.active)
      .map((c) => ({
        ...c,
        log: logMap.get(c.id),
        isDone: logMap.get(c.id)?.status === 'done',
      }));
  });

  private readonly choreService = inject(ChoreService);

  ngOnInit(): void {
    this.load();
  }

  load(event?: CustomEvent): void {
    this.isLoading.set(true);
    this.choreService.getChores().subscribe({ next: (c) => this.chores.set(c) });
    this.choreService.getTodaysLogs().subscribe({ next: (l) => this.logs.set(l) });
    this.choreService.getKids().subscribe({
      next: (members) => {
        this.members.set(members);
        // If saved player is gone or nothing saved yet, default to first member
        const saved = this.playerService.activePlayerId();
        if (!saved || !members.some((m) => m.id === saved)) {
          if (members.length) this.playerService.setActivePlayer(members[0].id);
        }
      },
      complete: () => {
        this.isLoading.set(false);
        (event as any)?.detail?.complete();
      },
    });
  }

  selectPlayer(id: string): void {
    this.playerService.setActivePlayer(id);
  }

  markDone(chore: ChoreWithStatus): void {
    const kidId = this.playerService.activePlayerId();
    if (!kidId || chore.isDone) return;
    this.markingId.set(chore.id);
    this.choreService.markDone(chore.id, kidId).subscribe({
      next: (log) => {
        this.logs.update((prev) => {
          const existing = prev.findIndex((l) => l.chore_id === log.chore_id && l.kid_id === log.kid_id);
          return existing >= 0
            ? prev.map((l, i) => (i === existing ? log : l))
            : [...prev, log];
        });
      },
      complete: () => this.markingId.set(null),
      error: () => this.markingId.set(null),
    });
  }
}
