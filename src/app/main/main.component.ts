import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    DrawerModule,
    ButtonModule
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

  protected readonly navItems = [
    { label: 'Clientes', icon: 'pi pi-briefcase', route: 'clientes' },
    { label: 'Servidores', icon: 'pi pi-server', route: 'servidores' },
    { label: 'Agendamentos', icon: 'pi pi-calendar', route: 'agendamentos' },
    { label: 'Execução imediata', icon: 'pi pi-play', route: 'execucao' },
    { label: 'PlayBook', icon: 'pi pi-book', route: 'playbook' },
    { label: 'Logs de backup', icon: 'pi pi-list', route: 'logs' }
  ];

  protected async signOut(): Promise<void> {
    try {
      await this.authService.logout();
    } finally {
      await this.router.navigateByUrl('/');
    }
  }

  protected toggleSidenav(): void {
    this.sidenavOpened.update((open) => !open);
  }
}
