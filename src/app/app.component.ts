import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  IonApp, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonListHeader,
  IonMenu, IonMenuToggle, IonRouterOutlet, IonSplitPane, IonTitle, IonToolbar,
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  listOutline,
  ribbonOutline,
  podiumOutline,
  settingsOutline,
  cashOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    IonApp, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonListHeader,
    IonMenu, IonMenuToggle, IonRouterOutlet, IonSplitPane, IonTitle, IonToolbar,
  ],
})
export class AppComponent {
  readonly appPages = [
    { title: 'Home',        url: '/home',        icon: 'home-outline'     },
    { title: 'Chores',      url: '/chores',      icon: 'list-outline'     },
    { title: 'Rewards',     url: '/rewards',     icon: 'ribbon-outline'   },
    { title: 'Leaderboard', url: '/leaderboard', icon: 'podium-outline'   },
  ];

  /** Parent-only pages shown at the bottom of the menu */
  readonly parentPages = [
    { title: 'Payout',    url: '/payout',   icon: 'cash-outline'     },
    { title: 'Settings',  url: '/settings', icon: 'settings-outline' },
  ];

  constructor() {
    addIcons({ homeOutline, listOutline, ribbonOutline, podiumOutline, settingsOutline, cashOutline });
  }
}
