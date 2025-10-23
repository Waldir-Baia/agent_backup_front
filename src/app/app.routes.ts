import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'principal',
    canActivate: [authGuard],
    loadComponent: () => import('./main/main.component').then((m) => m.MainComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'clientes'
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./clientes/clientes.component').then((m) => m.ClientesComponent)
      },
      {
        path: 'agendamentos',
        loadComponent: () =>
          import('./agendamentos/agendamentos.component').then((m) => m.AgendamentosComponent)
      },
      {
        path: 'execucao',
        loadComponent: () =>
          import('./execucao-imediata/execucao-imediata.component').then(
            (m) => m.ExecucaoImediataComponent
          )
      },
      {
        path: 'logs',
        loadComponent: () =>
          import('./logs/logs.component').then((m) => m.LogsComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
