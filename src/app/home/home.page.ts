import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { ChoreStats } from '../models/chore.model';
import { KidProfile } from '../models/family.model';
import { ChoreService } from '../services/chore.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, IonicModule],
})
export class HomePage implements OnInit {
  readonly stats = signal<ChoreStats | null>(null);
  readonly kids = signal<KidProfile[]>([]);
  readonly isLoading = signal(false);

  private readonly choreService = inject(ChoreService);

  readonly greeting = this.buildGreeting();

  ngOnInit(): void {
    this.load();
  }

  load(event?: CustomEvent): void {
    this.isLoading.set(true);
    this.choreService.getStats().subscribe({
      next: (s) => this.stats.set(s),
    });
    this.choreService.getKids().subscribe({
      next: (kids) => this.kids.set(kids),
      complete: () => {
        this.isLoading.set(false);
        (event as any)?.detail?.complete();
      },
    });
  }

  bestStreak(): number {
    return Math.max(0, ...this.kids().map((k) => k.streak_days));
  }

  private buildGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return '☀️ Good morning!';
    if (hour < 17) return '🌤️ Good afternoon!';
    return '🌙 Good evening!';
  }
}
