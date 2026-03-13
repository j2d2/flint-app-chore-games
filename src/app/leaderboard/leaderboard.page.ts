import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { KidProfile } from '../models/family.model';
import { ChoreService } from '../services/chore.service';

interface LeaderboardEntry extends KidProfile {
  rank: number;
}

@Component({
  selector: 'app-leaderboard-page',
  templateUrl: './leaderboard.page.html',
  styleUrls: ['./leaderboard.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class LeaderboardPage implements OnInit {
  readonly kids = signal<KidProfile[]>([]);
  readonly isLoading = signal(false);

  readonly ranked = computed<LeaderboardEntry[]>(() =>
    [...this.kids()]
      .sort((a, b) => b.totalEarned - a.totalEarned)
      .map((k, i) => ({ ...k, rank: i + 1 }))
  );

  private readonly choreService = inject(ChoreService);

  ngOnInit(): void {
    this.load();
  }

  load(event?: CustomEvent): void {
    this.isLoading.set(true);
    this.choreService.getKids().subscribe({
      next: (kids) => this.kids.set(kids),
      complete: () => {
        this.isLoading.set(false);
        (event as any)?.detail?.complete();
      },
    });
  }

  rankMedal(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }
}
