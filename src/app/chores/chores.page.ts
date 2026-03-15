import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import {
  IonBadge, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem,
  IonItemSliding, IonLabel, IonList, IonMenuButton, IonRefresher, IonRefresherContent,
  IonSegment, IonSegmentButton, IonSkeletonText, IonSpinner, IonTitle, IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';

import { Chore, ChoreLog } from '../models/chore.model';
import { KidProfile } from '../models/family.model';
import { ChoreService } from '../services/chore.service';
import { HaikuService } from '../services/haiku.service';
import { HaikuVoteModalComponent } from '../haiku-vote/haiku-vote.modal';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    IonBadge, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem,
    IonItemSliding, IonLabel, IonList, IonMenuButton, IonRefresher, IonRefresherContent,
    IonSegment, IonSegmentButton, IonSkeletonText, IonSpinner, IonTitle, IonToolbar,
  ],
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
  private readonly modalController = inject(ModalController);
  private readonly haikuService = inject(HaikuService);

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
        const kid = this.members().find((m) => m.id === kidId);
        if (kid) void this.showVoteModal(chore, kid);
      },
      complete: () => this.markingId.set(null),
      error: () => this.markingId.set(null),
    });
  }

  private async showVoteModal(chore: ChoreWithStatus, kid: KidProfile): Promise<void> {
    if (this.haikuService.hasVotedToday(kid.id)) return;
    const modal = await this.modalController.create({
      component: HaikuVoteModalComponent,
      componentProps: { kidId: kid.id, kidName: kid.name, choreId: chore.id },
      cssClass: 'haiku-vote-modal',
      breakpoints: [0, 0.75, 1],
      initialBreakpoint: 0.75,
    });
    await modal.present();
  }
}
