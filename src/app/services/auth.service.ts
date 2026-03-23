import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

export interface KidSession {
  token: string;
  kid: { id: string; name: string; avatar: string; role: string };
}

const SESSION_KEY = 'chore_kid_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  private readonly _session = signal<KidSession | null>(
    JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null'),
  );

  readonly isAuthenticated = computed(() => !!this._session());
  readonly currentKid      = computed(() => this._session()?.kid ?? null);
  readonly token           = computed(() => this._session()?.token ?? null);

  pinLogin(kid_id: string, pin: string) {
    return this.http
      .post<KidSession>('/api/auth/pin-login', { kid_id, pin })
      .pipe(
        tap(session => {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
          this._session.set(session);
        }),
      );
  }

  logout(): void {
    sessionStorage.removeItem(SESSION_KEY);
    this._session.set(null);
    this.router.navigate(['/login']);
  }
}
