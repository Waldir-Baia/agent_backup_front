import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
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
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatSnackBarModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
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
  protected readonly clientFilterControl = new FormControl<string>('', { nonNullable: true });
  protected readonly clientSearchTerm = signal('');
  protected readonly filteredClientes = computed(() =>
    this.filterClientes(this.clientSearchTerm())
  );
  protected readonly clientDisplayWith = (clientId: string | null): string => {
    if (!clientId) {
      return '';
    }
    const cliente = this.clientes().find((item) => item.client_id === clientId);
    if (!cliente) {
      return clientId;
    }
    const formattedCnpj = this.formatCnpj(cliente.cnpj_empresa);
    return formattedCnpj ? `${cliente.nome_empresa} - ${formattedCnpj}` : cliente.nome_empresa;
  };

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

    this.clientFilterControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => {
        this.clientSearchTerm.set(value.trim().toLowerCase());
      });

    effect(() => {
      const selected = this.selectedClientId();
      if (!selected) {
        return;
      }
      const exists = this.clientes().some((cliente) => cliente.client_id === selected);
      if (!exists) {
        this.clearClientSelection();
      } else {
        this.clientFilterControl.setValue(selected, { emitEvent: false });
      }
    });
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

  protected async onClientSelected(clientId: string): Promise<void> {
    const cliente = this.clientes().find((item) => item.client_id === clientId);
    if (!cliente) {
      return;
    }

    this.clientFilterControl.setValue(cliente.client_id, { emitEvent: false });
    this.clientSearchTerm.set('');
    this.selectedClientId.set(cliente.client_id);
    this.pageIndex.set(0);
    await this.loadLogs();
  }

  protected clearClientSelection(): void {
    this.clientFilterControl.setValue('', { emitEvent: false });
    this.clientSearchTerm.set('');
    this.selectedClientId.set(null);
    this.logs.set([]);
    this.total.set(0);
    this.pageIndex.set(0);
  }

  protected formatCnpj(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 14) {
      return value;
    }
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }

  private filterClientes(term: string): Cliente[] {
    const normalized = term.trim().toLowerCase();
    if (!normalized) {
      return this.clientes();
    }

    const searchDigits = normalized.replace(/\D/g, '');

    return this.clientes().filter((cliente) => {
      const nome = cliente.nome_empresa?.toLowerCase() ?? '';
      const id = cliente.client_id?.toLowerCase() ?? '';
      const cnpjDigits = (cliente.cnpj_empresa ?? '').replace(/\D/g, '');
      const cnpjFormatted = this.formatCnpj(cliente.cnpj_empresa).toLowerCase();
      return (
        nome.includes(normalized) ||
        id.includes(normalized) ||
        (searchDigits.length > 0 && cnpjDigits.includes(searchDigits)) ||
        cnpjFormatted.includes(normalized)
      );
    });
  }
}
