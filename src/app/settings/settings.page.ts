import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonAvatar, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonContent, IonHeader, IonIcon, IonInput, IonItem, IonItemOption, IonItemOptions,
  IonItemSliding, IonLabel, IonList, IonSegment, IonSegmentButton, IonSelect,
  IonSelectOption, IonTitle, IonToggle, IonToolbar,
  ToastController, AlertController,
} from '@ionic/angular/standalone';

import { Chore, ChoreFrequency } from '../models/chore.model';
import { KidProfile, Reward } from '../models/family.model';
import { ChoreService } from '../services/chore.service';

type SettingsTab = 'kids' | 'chores' | 'rewards';

@Component({
  selector: 'app-settings-page',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    IonAvatar, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonContent, IonHeader, IonIcon, IonInput, IonItem, IonItemOption, IonItemOptions,
    IonItemSliding, IonLabel, IonList, IonSegment, IonSegmentButton, IonSelect,
    IonSelectOption, IonTitle, IonToggle, IonToolbar,
  ],
})
export class SettingsPage implements OnInit {
  readonly activeTab = signal<SettingsTab>('kids');
  readonly kids     = signal<KidProfile[]>([]);
  readonly chores   = signal<Chore[]>([]);
  readonly rewards  = signal<Reward[]>([]);
  readonly isLoading = signal(false);

  // ── Form models ─────────────────────────────────────────────────────────
  kidForm    = { name: '', avatar: '🧒' };
  choreForm  = { title: '', description: '', value: 0.25, frequency: 'daily', icon: '⭐', assigned_to: '' };
  rewardForm = { title: '', description: '', cost: 1.0, icon: '🎁' };

  readonly AVATARS = ['🧒', '👦', '👧', '🧑', '🦁', '🐼', '🦊', '🐸', '🦄', '🐉'];
  readonly CHORE_ICONS = ['⭐', '🧹', '🍽️', '🐕', '📚', '🌱', '🚿', '🗑️', '🛏️', '🧺'];
  readonly REWARD_ICONS = ['🎁', '🍕', '🎮', '🎬', '🛍️', '🎡', '🍦', '📱', '🎯', '🏆'];
  readonly FREQUENCIES: Array<{ value: string; label: string }> = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'one-off', label: 'One-off' },
  ];

  private readonly svc   = inject(ChoreService);
  private readonly toast = inject(ToastController);
  private readonly alert = inject(AlertController);

  ngOnInit(): void {
    this.loadAll();
  }

  setTab(tab: SettingsTab): void {
    this.activeTab.set(tab);
  }

  loadAll(): void {
    this.isLoading.set(true);
    this.svc.getKids().subscribe({ next: (k) => this.kids.set(k) });
    this.svc.getChores().subscribe({ next: (c) => this.chores.set(c) });
    this.svc.getRewards().subscribe({ next: (r) => this.rewards.set(r), complete: () => this.isLoading.set(false) });
  }

  // ── Kids ─────────────────────────────────────────────────────────────────

  addKid(): void {
    if (!this.kidForm.name.trim()) return;
    this.svc.createKid({ name: this.kidForm.name.trim(), avatar: this.kidForm.avatar }).subscribe({
      next: (kid) => {
        this.kids.update((k) => [...k, kid]);
        this.kidForm = { name: '', avatar: '🧒' };
        this.showToast(`${kid.avatar} ${kid.name} added!`);
      },
      error: (e) => this.showToast(e.error?.error ?? 'Failed to add kid', 'danger'),
    });
  }

  async deleteKid(kid: KidProfile): Promise<void> {
    const confirmed = await this.confirmDelete(`Remove ${kid.avatar} ${kid.name}?`,
      'This will delete all their chore history and balance.');
    if (!confirmed) return;
    this.svc.deleteKid(kid.id).subscribe({
      next: () => {
        this.kids.update((k) => k.filter((x) => x.id !== kid.id));
        this.showToast(`${kid.name} removed`);
      },
    });
  }

  // ── Chores ───────────────────────────────────────────────────────────────

  addChore(): void {
    if (!this.choreForm.title.trim()) return;
    const payload = {
      ...this.choreForm,
      frequency: this.choreForm.frequency as ChoreFrequency,
      assigned_to: this.choreForm.assigned_to || null,
      active: 1 as unknown as number,
      created_at: '',
    };
    this.svc.createChore(payload).subscribe({
      next: (chore) => {
        this.chores.update((c) => [...c, chore]);
        this.choreForm = { title: '', description: '', value: 0.25, frequency: 'daily', icon: '⭐', assigned_to: '' };
        this.showToast(`${chore.icon} "${chore.title}" added!`);
      },
      error: (e) => this.showToast(e.error?.error ?? 'Failed to add chore', 'danger'),
    });
  }

  toggleChoreActive(chore: Chore): void {
    const newActive = chore.active ? 0 : 1;
    this.svc.updateChore(chore.id, { active: newActive as unknown as number }).subscribe({
      next: (updated) => this.chores.update((list) => list.map((c) => (c.id === updated.id ? updated : c))),
    });
  }

  async deleteChore(chore: Chore): Promise<void> {
    const confirmed = await this.confirmDelete(`Delete "${chore.title}"?`, 'All completion history will be removed.');
    if (!confirmed) return;
    this.svc.deleteChore(chore.id).subscribe({
      next: () => {
        this.chores.update((c) => c.filter((x) => x.id !== chore.id));
        this.showToast(`"${chore.title}" deleted`);
      },
    });
  }

  // ── Rewards ───────────────────────────────────────────────────────────────

  addReward(): void {
    if (!this.rewardForm.title.trim()) return;
    const payload = { ...this.rewardForm, active: 1 as unknown as boolean, created_at: '' };
    this.svc.createReward(payload as unknown as Omit<Reward, 'id' | 'created_at'>).subscribe({
      next: (reward) => {
        this.rewards.update((r) => [...r, reward]);
        this.rewardForm = { title: '', description: '', cost: 1.0, icon: '🎁' };
        this.showToast(`${reward.icon} "${reward.title}" added!`);
      },
      error: (e) => this.showToast(e.error?.error ?? 'Failed to add reward', 'danger'),
    });
  }

  async deleteReward(reward: Reward): Promise<void> {
    const confirmed = await this.confirmDelete(`Delete "${reward.title}"?`, '');
    if (!confirmed) return;
    this.svc.deleteReward(reward.id).subscribe({
      next: () => {
        this.rewards.update((r) => r.filter((x) => x.id !== reward.id));
        this.showToast(`"${reward.title}" deleted`);
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  kidName(id: string): string {
    return this.kids().find((k) => k.id === id)?.name ?? 'Anyone';
  }

  private async showToast(message: string, color = 'success'): Promise<void> {
    const t = await this.toast.create({ message, duration: 2000, color, position: 'bottom' });
    await t.present();
  }

  private async confirmDelete(header: string, message: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      const a = await this.alert.create({
        header,
        message,
        buttons: [
          { text: 'Cancel', role: 'cancel', handler: () => resolve(false) },
          { text: 'Delete', role: 'destructive', handler: () => resolve(true) },
        ],
      });
      await a.present();
    });
  }
}
