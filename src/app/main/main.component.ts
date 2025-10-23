import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../auth.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})
export class MainComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly brandColor = '#127f0b';
  protected readonly user = this.authService.currentUser;
  protected readonly sidenavOpened = signal(true);

  protected readonly navItems: NavItem[] = [
    { icon: 'business', label: 'Clientes', route: 'clientes' },
    { icon: 'event', label: 'Agendamentos', route: 'agendamentos' },
    { icon: 'play_arrow', label: 'Execução imediata', route: 'execucao' },
    { icon: 'description', label: 'Logs de backup', route: 'logs' }
  ];

  protected async signOut(): Promise<void> {
    this.authService.logout();
    await this.router.navigateByUrl('/');
  }

  protected toggleSidenav(): void {
    this.sidenavOpened.update((open) => !open);
  }
}
