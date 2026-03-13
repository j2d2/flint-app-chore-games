import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';

import { Reward } from '../models/family.model';
import { KidProfile } from '../models/family.model';
import { ChoreService } from '../services/chore.service';

@Component({
  selector: 'app-rewards-page',
  templateUrl: './rewards.page.html',
  styleUrls: ['./rewards.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class RewardsPage implements OnInit {
  readonly rewards = signal<Reward[]>([]);
  readonly kids = signal<KidProfile[]>([]);
  readonly activeKidId = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly redeemingId = signal<string | null>(null);

  private readonly choreService = inject(ChoreService);
  private readonly toastCtrl = inject(ToastController);

  ngOnInit(): void {
    this.load();
  }

  load(event?: CustomEvent): void {
    this.isLoading.set(true);
    this.choreService.getRewards().subscribe({ next: (r) => this.rewards.set(r) });
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

  get activeKid(): KidProfile | undefined {
    return this.kids().find((k) => k.id === this.activeKidId());
  }

  canAfford(reward: Reward): boolean {
    return (this.activeKid?.balance ?? 0) >= reward.cost;
  }

  selectKid(id: string): void {
    this.activeKidId.set(id);
  }

  async redeem(reward: Reward): Promise<void> {
    const kidId = this.activeKidId();
    if (!kidId || !this.canAfford(reward)) return;
    this.redeemingId.set(reward.id);
    this.choreService.redeemReward(reward.id, kidId).subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({
          message: `🎉 ${reward.title} redeemed!`,
          duration: 2000,
          color: 'success',
        });
        await toast.present();
        this.load();
      },
      complete: () => this.redeemingId.set(null),
      error: () => this.redeemingId.set(null),
    });
  }
}
