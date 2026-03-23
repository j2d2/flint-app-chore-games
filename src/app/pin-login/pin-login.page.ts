import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonText,
  IonButton,
  IonSpinner,
} from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';

interface Kid {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

@Component({
  selector: 'app-pin-login',
  templateUrl: 'pin-login.page.html',
  styleUrls: ['pin-login.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonText,
    IonButton,
    IonSpinner,
  ],
})
export class PinLoginPage implements OnInit {
  private auth   = inject(AuthService);
  private http   = inject(HttpClient);
  private router = inject(Router);

  kids         = signal<Kid[]>([]);
  selectedKid  = signal<Kid | null>(null);
  digits       = signal<string[]>([]);
  loading      = signal(false);
  error        = signal('');
  loadingKids  = signal(true);

  readonly pinDisplay = computed(() =>
    Array.from({ length: 6 }, (_, i) => (this.digits()[i] !== undefined ? '●' : '○')).join(' ')
  );

  readonly NUMPAD = ['1','2','3','4','5','6','7','8','9','','0','⌫'] as const;

  ngOnInit(): void {
    this.http.get<Kid[]>('/api/kids').subscribe({
      next: kids => {
        this.kids.set(kids);
        this.loadingKids.set(false);
      },
      error: () => this.loadingKids.set(false),
    });
  }

  selectKid(kid: Kid): void {
    this.selectedKid.set(kid);
    this.digits.set([]);
    this.error.set('');
  }

  back(): void {
    this.selectedKid.set(null);
    this.digits.set([]);
    this.error.set('');
  }

  onKey(key: string): void {
    if (key === '⌫') {
      this.digits.update(d => d.slice(0, -1));
      return;
    }
    if (key === '') return;
    if (this.digits().length >= 6) return;

    const next = [...this.digits(), key];
    this.digits.set(next);

    if (next.length === 6) {
      this.submitPin(next.join(''));
    }
  }

  private submitPin(pin: string): void {
    const kid = this.selectedKid();
    if (!kid) return;

    this.loading.set(true);
    this.error.set('');

    this.auth.pinLogin(kid.id, pin).subscribe({
      next: () => this.router.navigate(['/home']),
      error: () => {
        this.error.set('Wrong PIN — try again');
        this.digits.set([]);
        this.loading.set(false);
      },
    });
  }
}
