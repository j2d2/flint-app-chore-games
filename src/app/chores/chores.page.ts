import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { Chore, ChoreLog } from '../models/chore.model';
import { KidProfile } from '../models/family.model';
import { ChoreService } from '../services/chore.service';

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
  readonly kids = signal<KidProfile[]>([]);
  readonly activeKidId = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly markingId = signal<string | null>(null);

  readonly choresWithStatus = computed<ChoreWithStatus[]>(() => {
    const logMap = new Map(this.logs().map((l) => [l.chore_id, l]));
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
      next: (kids) => {
        this.kids.set(kids);
        if (!this.activeKidId() && kids.length) {
          this.activeKidId.set(kids[0].id);
        }
      },
      complete: () => {
        this.isLoading.set(false);
        (event as any)?.detail?.complete();
      },
    });
  }

  selectKid(id: string): void {
    this.activeKidId.set(id);
  }

  markDone(chore: ChoreWithStatus): void {
    const kidId = this.activeKidId();
    if (!kidId || chore.isDone) return;
    this.markingId.set(chore.id);
    this.choreService.markDone(chore.id, kidId).subscribe({
      next: (log) => {
        this.logs.update((prev) => {
          const existing = prev.findIndex((l) => l.chore_id === log.chore_id);
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
