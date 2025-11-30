import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import {
  Agendamento,
  AgendamentoInsert,
  AgendamentoUpdate,
  Cliente,
  SupabaseService
} from '../supabase.service';

type FormMode = 'create' | 'edit';

@Component({
  selector: 'app-agendamentos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    ToggleSwitchModule,
    ButtonModule,
    DividerModule
  ],
  templateUrl: './agendamentos.component.html',
  styleUrl: './agendamentos.component.css'
})
export class AgendamentosComponent {
  private readonly supabaseService = inject(SupabaseService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly displayedColumns = [
    'schedule_name',
    'rclone_command',
    'cron_expression',
    'is_active',
    'actions'
  ];

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly agendamentos = signal<Agendamento[]>([]);
  protected readonly selectedClientId = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly formMode = signal<FormMode>('create');
  protected readonly editingAgendamento = signal<Agendamento | null>(null);
  protected readonly isFormVisible = signal(false);

  protected readonly clientFilterControl = this.formBuilder.nonNullable.control('');
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
    return formattedCnpj
      ? `${cliente.nome_empresa} - ${formattedCnpj}`
      : cliente.nome_empresa;
  };

  protected readonly agendamentoForm = this.formBuilder.nonNullable.group({
    client_id: ['', Validators.required],
    schedule_name: ['', Validators.required],
    rclone_command: ['', Validators.required],
    cron_expression: ['', Validators.required],
    remote_path: [''],
    is_active: [true]
  });

  constructor() {
    this.loadClientes();

    this.clientFilterControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => {
        this.clientSearchTerm.set(value.trim().toLowerCase());
      });

    effect(() => {
      if (this.formMode() === 'create') {
        this.editingAgendamento.set(null);
      }
    });

    effect(() => {
      const selectedId = this.selectedClientId();
      if (!selectedId) {
        return;
      }
      const exists = this.clientes().some((cliente) => cliente.client_id === selectedId);
      if (!exists) {
        this.clearClientSelection();
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

  protected async onClientSelected(clientId: string): Promise<void> {
    const cliente = this.clientes().find((item) => item.client_id === clientId);
    if (!cliente) {
      return;
    }

    this.clientFilterControl.setValue(cliente.client_id, { emitEvent: false });
    this.clientSearchTerm.set('');
    this.selectedClientId.set(cliente.client_id);
    this.closeForm();
    await this.loadAgendamentos(cliente.client_id);
  }

  protected clearClientSelection(): void {
    this.selectedClientId.set(null);
    this.clientFilterControl.setValue('', { emitEvent: false });
    this.clientSearchTerm.set('');
    this.agendamentos.set([]);
  }

  protected async loadAgendamentos(clientId: string): Promise<void> {
    if (!clientId) {
      this.agendamentos.set([]);
      return;
    }

    this.loading.set(true);
    try {
      const data = await this.supabaseService.listAgendamentos(clientId);
      this.agendamentos.set(data);
    } catch (error) {
      console.error('Erro ao carregar agendamentos', error);
      this.snackBar.open('Não foi possível carregar os agendamentos.', 'Fechar', {
        duration: 4000
      });
    } finally {
      this.loading.set(false);
    }
  }

  protected showCreateForm(): void {
    this.formMode.set('create');
    this.editingAgendamento.set(null);
    this.resetForm(this.selectedClientId());
    this.isFormVisible.set(true);
  }

  protected startEdit(agendamento: Agendamento): void {
    this.formMode.set('edit');
    this.editingAgendamento.set(agendamento);
    this.agendamentoForm.setValue({
      client_id: agendamento.client_id,
      schedule_name: agendamento.schedule_name,
      rclone_command: agendamento.rclone_command,
      cron_expression: agendamento.cron_expression,
      remote_path: agendamento.remote_path ?? '',
      is_active: agendamento.is_active
    });
    this.isFormVisible.set(true);
  }

  protected closeForm(): void {
    this.isFormVisible.set(false);
    this.formMode.set('create');
    this.editingAgendamento.set(null);
    this.resetForm(this.selectedClientId());
  }

  protected async submit(): Promise<void> {
    if (this.agendamentoForm.invalid) {
      this.agendamentoForm.markAllAsTouched();
      return;
    }

    const formValue = this.agendamentoForm.getRawValue();
    const clientId = formValue.client_id.trim();
    if (!clientId) {
      this.agendamentoForm.controls.client_id.setErrors({ required: true });
      return;
    }

    this.saving.set(true);

    try {
      if (this.formMode() === 'create') {
        const payload: AgendamentoInsert = {
          client_id: clientId,
          schedule_name: formValue.schedule_name.trim(),
          rclone_command: formValue.rclone_command.trim(),
          cron_expression: formValue.cron_expression.trim(),
          is_active: formValue.is_active,
          remote_path: formValue.remote_path?.trim() || null
        };
        const created = await this.supabaseService.createAgendamento(payload);
        this.agendamentos.set([created, ...this.agendamentos()]);
        this.snackBar.open('Agendamento criado com sucesso.', 'Fechar', {
          duration: 4000
        });
      } else {
        const editing = this.editingAgendamento();
        if (!editing) {
          throw new Error('Agendamento para edição não encontrado.');
        }
        const payload: AgendamentoUpdate = {
          client_id: clientId,
          schedule_name: formValue.schedule_name.trim(),
          rclone_command: formValue.rclone_command.trim(),
          cron_expression: formValue.cron_expression.trim(),
          is_active: formValue.is_active,
          remote_path: formValue.remote_path?.trim() || null
        };
        const updated = await this.supabaseService.updateAgendamento(editing.id, payload);
        this.agendamentos.set(
          this.agendamentos().map((item) => (item.id === updated.id ? updated : item))
        );
        this.snackBar.open('Agendamento atualizado com sucesso.', 'Fechar', {
          duration: 4000
        });
      }

      this.selectedClientId.set(clientId);
      this.clientFilterControl.setValue(clientId, { emitEvent: false });
      this.clientSearchTerm.set('');
      this.closeForm();
    } catch (error) {
      console.error('Erro ao salvar agendamento', error);
      this.snackBar.open('Não foi possível salvar o agendamento.', 'Fechar', {
        duration: 4000
      });
    } finally {
      this.saving.set(false);
      if (clientId) {
        await this.loadAgendamentos(clientId);
      }
    }
  }

  private resetForm(defaultClientId: string | null): void {
    this.agendamentoForm.reset({
      client_id: defaultClientId ?? '',
      schedule_name: '',
      rclone_command: '',
      cron_expression: '',
      remote_path: '',
      is_active: true
    });
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

  protected formatCnpj(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 14) {
      return value;
    }
    return digits.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    );
  }

  protected async delete(agendamento: Agendamento): Promise<void> {
    const confirmed = window.confirm(
      `Deseja excluir o agendamento "${agendamento.schedule_name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await this.supabaseService.deleteAgendamento(agendamento.id);
      this.agendamentos.set(
        this.agendamentos().filter((item) => item.id !== agendamento.id)
      );
      this.snackBar.open('Agendamento excluído.', 'Fechar', { duration: 4000 });
    } catch (error) {
      console.error('Erro ao excluir agendamento', error);
      this.snackBar.open('Não foi possível excluir o agendamento.', 'Fechar', {
        duration: 4000
      });
    }
  }
}
