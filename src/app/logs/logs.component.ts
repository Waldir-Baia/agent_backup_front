import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Cliente, BackupLog, SupabaseService } from '../supabase.service';
import { FileSizePipe } from '../shared/file-size.pipe';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatSnackBarModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatInputModule,
    FileSizePipe
  ],
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.css'
})
export class LogsComponent {
  private readonly supabaseService = inject(SupabaseService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly logs = signal<BackupLog[]>([]);
  protected readonly selectedClientId = signal<string | null>(null);
  protected readonly loading = signal(false);

  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly total = signal(0);
  protected readonly pageSizeOptions = [10, 20, 50];

  protected readonly displayedColumns = [
    'client_id',
    'file_name',
    'file_size_bytes',
    'file_creation_date',
    'created_at'
  ];

  constructor() {
    this.loadClientes();
  }

  protected async loadClientes(): Promise<void> {
    try {
      const data = await this.supabaseService.listClientes();
      this.clientes.set(data);
    } catch (error) {
      console.error('Erro ao carregar clientes', error);
      this.snackBar.open('Não foi possível carregar os clientes.', 'Fechar', {
        duration: 4000
      });
    }
  }

  protected async onClientChange(clientId: string): Promise<void> {
    this.selectedClientId.set(clientId);
    this.pageIndex.set(0);
    await this.loadLogs();
  }

  protected async handlePage(event: PageEvent): Promise<void> {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    await this.loadLogs();
  }

  protected async loadLogs(): Promise<void> {
    const clientId = this.selectedClientId();
    if (!clientId) {
      this.logs.set([]);
      this.total.set(0);
      return;
    }

    this.loading.set(true);
    try {
      const { data, total } = await this.supabaseService.listBackupLogs(
        clientId,
        this.pageIndex(),
        this.pageSize()
      );
      this.logs.set(data);
      this.total.set(total);
    } catch (error) {
      console.error('Erro ao carregar logs', error);
      this.snackBar.open('Não foi possível carregar os logs.', 'Fechar', {
        duration: 4000
      });
    } finally {
      this.loading.set(false);
    }
  }
}

