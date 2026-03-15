import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'chores',
    loadComponent: () => import('./chores/chores.page').then((m) => m.ChoresPage),
  },
  {
    path: 'rewards',
    loadComponent: () => import('./rewards/rewards.page').then((m) => m.RewardsPage),
  },
  {
    path: 'leaderboard',
    loadComponent: () => import('./leaderboard/leaderboard.page').then((m) => m.LeaderboardPage),
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.page').then((m) => m.SettingsPage),
  },
  {
    path: 'payout',
    loadComponent: () => import('./payout/payout.page').then((m) => m.PayoutPage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
