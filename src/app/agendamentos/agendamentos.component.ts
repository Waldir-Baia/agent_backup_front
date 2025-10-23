import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule
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

  protected readonly agendamentoForm = this.formBuilder.nonNullable.group({
    schedule_name: ['', Validators.required],
    rclone_command: ['', Validators.required],
    cron_expression: ['', Validators.required],
    remote_path: [''],
    is_active: [true]
  });

  constructor() {
    this.loadClientes();
    effect(() => {
      if (this.formMode() === 'create') {
        this.editingAgendamento.set(null);
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

  protected async onClientChange(clientId: string): Promise<void> {
    this.selectedClientId.set(clientId);
    this.startCreate();
    await this.loadAgendamentos(clientId);
  }

  protected async loadAgendamentos(clientId: string): Promise<void> {
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

  protected startCreate(): void {
    this.formMode.set('create');
    this.agendamentoForm.reset({
      schedule_name: '',
      rclone_command: '',
      cron_expression: '',
      remote_path: '',
      is_active: true
    });
  }

  protected startEdit(agendamento: Agendamento): void {
    this.formMode.set('edit');
    this.editingAgendamento.set(agendamento);
    this.agendamentoForm.setValue({
      schedule_name: agendamento.schedule_name,
      rclone_command: agendamento.rclone_command,
      cron_expression: agendamento.cron_expression,
      remote_path: agendamento.remote_path ?? '',
      is_active: agendamento.is_active
    });
  }

  protected async submit(): Promise<void> {
    if (this.agendamentoForm.invalid || !this.selectedClientId()) {
      this.agendamentoForm.markAllAsTouched();
      return;
    }

    const clientId = this.selectedClientId()!;
    const formValue = this.agendamentoForm.getRawValue();
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

      this.startCreate();
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

