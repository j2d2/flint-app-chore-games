import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { KidProfile } from '../models/family.model';
import { HaikuEntry } from '../models/haiku.model';
import { ChoreService } from '../services/chore.service';
import { HaikuService } from '../services/haiku.service';

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
  readonly segment = signal<'kids' | 'haikus'>('kids');
  readonly haikus = signal<HaikuEntry[]>([]);
  readonly isLoadingHaikus = signal(false);
  private haikusLoaded = false;

  readonly ranked = computed<LeaderboardEntry[]>(() =>
    [...this.kids()]
      .sort((a, b) => b.total_earned - a.total_earned)
      .map((k, i) => ({ ...k, rank: i + 1 }))
  );

  private readonly choreService = inject(ChoreService);
  private readonly haikuService = inject(HaikuService);

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

  onSegmentChange(event: CustomEvent): void {
    const val = event.detail.value as 'kids' | 'haikus';
    this.segment.set(val);
    if (val === 'haikus' && !this.haikusLoaded) {
      this.loadHaikus();
    }
  }

  loadHaikus(): void {
    this.isLoadingHaikus.set(true);
    this.haikuService.getLeaderboard('votes').subscribe({
      next: (list) => {
        this.haikus.set(list);
        this.haikusLoaded = true;
      },
      complete: () => this.isLoadingHaikus.set(false),
    });
  }

  haikuLines(entry: HaikuEntry): string[] {
    return entry.haiku_text.split('\n').filter(Boolean);
  }

  rankMedal(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }
}
