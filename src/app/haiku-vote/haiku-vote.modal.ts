import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import {
  IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonSpinner, IonTitle, IonToolbar,
  ModalController, ToastController,
} from '@ionic/angular/standalone';

import { HaikuEntry, HaikuPair } from '../models/haiku.model';
import { HaikuService } from '../services/haiku.service';

@Component({
  selector: 'app-haiku-vote-modal',
  templateUrl: './haiku-vote.modal.html',
  styleUrls: ['./haiku-vote.modal.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonSpinner, IonTitle, IonToolbar,
  ],
})
export class HaikuVoteModalComponent implements OnInit {
  readonly kidId = input.required<string>();
  readonly kidName = input.required<string>();
  readonly choreId = input<string>();

  readonly pair = signal<HaikuPair | null>(null);
  readonly isLoading = signal(true);
  readonly votedId = signal<string | null>(null);

  private readonly haikuService = inject(HaikuService);
  private readonly modalController = inject(ModalController);
  private readonly toastController = inject(ToastController);

  ngOnInit(): void {
    // Shouldn't reach here if already voted, but guard anyway
    if (this.haikuService.hasVotedToday(this.kidId())) {
      void this.dismiss();
      return;
    }
    this.haikuService.getPair(this.kidName()).subscribe({
      next: (p) => {
        this.pair.set(p);
        this.isLoading.set(false);
        // No pairs available → auto-dismiss silently
        if (!p) void this.dismiss();
      },
      error: () => {
        this.isLoading.set(false);
        void this.dismiss();
      },
    });
  }

  vote(haiku: HaikuEntry): void {
    if (this.votedId()) return;
    this.votedId.set(haiku.id);

    this.haikuService.vote(haiku.id, this.kidName(), this.choreId()).subscribe();
    this.haikuService.markVotedToday(this.kidId());

    // Brief celebration before dismissing
    setTimeout(() => {
      void this.showToast();
      setTimeout(() => void this.dismiss({ voted: true, haikuId: haiku.id }), 800);
    }, 500);
  }

  skip(): void {
    void this.dismiss({ skipped: true });
  }

  lines(haiku: HaikuEntry): string[] {
    return haiku.haiku_text.split('\n').filter(Boolean);
  }

  private async showToast(): Promise<void> {
    const toast = await this.toastController.create({
      message: '🎋 Vote cast! Thanks!',
      duration: 1500,
      color: 'success',
      position: 'top',
    });
    await toast.present();
  }

  private async dismiss(data?: object): Promise<void> {
    await this.modalController.dismiss(data);
  }
}
