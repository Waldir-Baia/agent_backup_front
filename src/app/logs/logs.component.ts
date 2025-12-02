import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { BackupLog, Cliente, SupabaseService } from '../supabase.service';
import { FileSizePipe } from '../shared/file-size.pipe';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    ButtonModule,
    InputTextModule,
    PaginatorModule,
    FileSizePipe
  ],
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.css'
})
export class LogsComponent {
  private readonly supabaseService = inject(SupabaseService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly logs = signal<BackupLog[]>([]);
  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly clienteLookup = computed<Record<string, string>>(() => {
    const lookup: Record<string, string> = {};
    for (const cliente of this.clientes()) {
      if (cliente.client_id) {
        lookup[cliente.client_id] = cliente.nome_empresa ?? cliente.client_id;
      }
    }
    return lookup;
  });
  protected readonly loading = signal(false);
  protected readonly filterTerm = signal('');
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly total = signal(0);
  protected readonly pageSizeOptions = [10, 20, 50];
  protected readonly expandedLogId = signal<number | null>(null);
  private readonly errorPreviewLimit = 140;

  constructor() {
    void this.loadClientes();
    effect(() => {
      this.filterTerm();
      this.pageIndex.set(0);
      void this.loadLogs();
    });
  }

  protected async handlePage(event: PaginatorState): Promise<void> {
    const rows = event.rows ?? this.pageSize();
    const page =
      event.page ?? (event.first !== undefined ? Math.floor(event.first / rows) : this.pageIndex());
    this.pageIndex.set(page);
    this.pageSize.set(rows);
    await this.loadLogs();
  }

  protected async loadLogs(): Promise<void> {
    this.loading.set(true);
    try {
      const { data, total } = await this.supabaseService.listBackupLogsGlobal(
        this.pageIndex(),
        this.pageSize(),
        this.filterTerm()
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

  private async loadClientes(): Promise<void> {
    try {
      const data = await this.supabaseService.listClientes();
      this.clientes.set(data);
    } catch (error) {
      console.error('Erro ao carregar clientes', error);
      this.snackBar.open('Não foi possível carregar a lista de clientes.', 'Fechar', {
        duration: 4000
      });
    }
  }

  protected toggleLogExpansion(logId: number): void {
    this.expandedLogId.set(this.expandedLogId() === logId ? null : logId);
  }

  protected isExpanded(logId: number): boolean {
    return this.expandedLogId() === logId;
  }

  protected truncatedErrorMessage(message: string | null | undefined): string {
    if (!message) {
      return '—';
    }

    const normalized = message.trim();
    if (normalized.length <= this.errorPreviewLimit) {
      return normalized;
    }

    return normalized.slice(0, this.errorPreviewLimit).trimEnd().concat('…');
  }

  protected clientName(clientId: string): string {
    return this.clienteLookup()[clientId] ?? clientId;
  }
}
