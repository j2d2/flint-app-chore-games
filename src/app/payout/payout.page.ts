import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';

import { KidProfile, Payout } from '../models/family.model';
import { ChoreService } from '../services/chore.service';

@Component({
  selector: 'app-payout-page',
  templateUrl: './payout.page.html',
  styleUrls: ['./payout.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class PayoutPage implements OnInit {
  readonly kids     = signal<KidProfile[]>([]);
  readonly payouts  = signal<Payout[]>([]);
  readonly isLoading = signal(false);

  // payout form
  selectedKidId = '';
  payoutNote    = '';

  private readonly svc   = inject(ChoreService);
  private readonly toast = inject(ToastController);

  ngOnInit(): void {
    this.load();
  }

  load(event?: CustomEvent): void {
    this.isLoading.set(true);
    this.svc.getKids().subscribe({ next: (k) => this.kids.set(k) });
    this.svc.getPayouts().subscribe({
      next: (p) => this.payouts.set(p),
      complete: () => {
        this.isLoading.set(false);
        (event as any)?.detail?.complete();
      },
    });
  }

  get selectedKid(): KidProfile | undefined {
    return this.kids().find((k) => k.id === this.selectedKidId);
  }

  recordPayout(): void {
    if (!this.selectedKidId || !this.selectedKid?.balance) return;
    const kid = this.selectedKid;
    this.svc.recordPayout(this.selectedKidId, undefined, this.payoutNote || undefined).subscribe({
      next: () => {
        // Refresh kids to show reset balance
        this.svc.getKids().subscribe({ next: (k) => this.kids.set(k) });
        this.svc.getPayouts().subscribe({ next: (p) => this.payouts.set(p) });
        this.selectedKidId = '';
        this.payoutNote = '';
        this.showToast(`💸 $${kid.balance.toFixed(2)} paid to ${kid.name}!`);
      },
      error: (e) => this.showToast(e.error?.error ?? 'Payout failed', 'danger'),
    });
  }

  private async showToast(message: string, color = 'success'): Promise<void> {
    const t = await this.toast.create({ message, duration: 2500, color, position: 'bottom' });
    await t.present();
  }
}
