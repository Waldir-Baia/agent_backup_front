import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DividerModule } from 'primeng/divider';
import { DatePickerModule } from 'primeng/datepicker';
import {
  Cliente,
  Servidor,
  ServidorInsert,
  ServidorUpdate,
  SupabaseService
} from '../supabase.service';

type FormMode = 'create' | 'edit';

const STATUS_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Desconhecido' },
  { value: 1, label: 'Online' },
  { value: 2, label: 'Offline' },
  { value: 3, label: 'Erro' }
];

@Component({
  selector: 'app-servidores',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    DatePickerModule,
    ButtonModule,
    DividerModule
  ],
  templateUrl: './servidores.component.html',
  styleUrl: './servidores.component.css'
})
export class ServidoresComponent {
  private readonly supabaseService = inject(SupabaseService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly displayedColumns = [
    'cliente',
    'nome',
    'endereco_ip',
    'sistema_operacional',
    'status',
    'uptime_inicio',
    'actions'
  ];
  protected readonly servidores = signal<Servidor[]>([]);
  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly formMode = signal<FormMode>('create');
  protected readonly editingServidor = signal<Servidor | null>(null);
  protected readonly isFormVisible = signal(false);
  protected readonly statusOptions = STATUS_OPTIONS;

  protected readonly servidorForm = this.formBuilder.group({
    cliente_id: this.formBuilder.control<number | null>(null, Validators.required),
    nome: this.formBuilder.control('', Validators.required),
    endereco_ip: this.formBuilder.control('', Validators.required),
    sistema_operacional: this.formBuilder.control(''),
    status: this.formBuilder.control(0, Validators.required),
    uptime_inicio: this.formBuilder.control<Date | null>(null),
    mensagem_erro: this.formBuilder.control('')
  });

  constructor() {
    this.loadClientes();
    this.loadServidores();
  }

  protected async loadClientes(): Promise<void> {
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

  protected async loadServidores(): Promise<void> {
    this.loading.set(true);
    try {
      const data = await this.supabaseService.listServidores();
      this.servidores.set(data);
    } catch (error) {
      console.error('Erro ao carregar servidores', error);
      this.snackBar.open('Não foi possível carregar os servidores.', 'Fechar', {
        duration: 4000
      });
    } finally {
      this.loading.set(false);
    }
  }

  protected showCreateForm(): void {
    this.formMode.set('create');
    this.editingServidor.set(null);
    this.servidorForm.reset({
      cliente_id: null,
      nome: '',
      endereco_ip: '',
      sistema_operacional: '',
      status: 0,
      uptime_inicio: null,
      mensagem_erro: ''
    });
    this.isFormVisible.set(true);
  }

  protected startEdit(servidor: Servidor): void {
    this.formMode.set('edit');
    this.editingServidor.set(servidor);
    this.servidorForm.setValue({
      cliente_id: servidor.cliente_id,
      nome: servidor.nome,
      endereco_ip: servidor.endereco_ip,
      sistema_operacional: servidor.sistema_operacional ?? '',
      status: servidor.status ?? 0,
      uptime_inicio: this.toDateValue(servidor.uptime_inicio),
      mensagem_erro: servidor.mensagem_erro ?? ''
    });
    this.isFormVisible.set(true);
  }

  protected closeForm(): void {
    this.isFormVisible.set(false);
    this.servidorForm.reset({
      cliente_id: null,
      nome: '',
      endereco_ip: '',
      sistema_operacional: '',
      status: 0,
      uptime_inicio: null,
      mensagem_erro: ''
    });
    this.editingServidor.set(null);
    this.formMode.set('create');
  }

  protected statusLabel(value: number | null | undefined): string {
    const found = this.statusOptions.find((opt) => opt.value === value);
    return found?.label ?? 'Desconhecido';
  }

  protected clienteNome(clienteId: number): string {
    const found = this.clientes().find((cliente) => cliente.id === clienteId);
    return found?.nome_empresa ?? `ID ${clienteId}`;
  }

  protected toDateValue(value: string | null): Date | null {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  protected async submit(): Promise<void> {
    if (this.servidorForm.invalid) {
      this.servidorForm.markAllAsTouched();
      return;
    }

    const formValue = this.servidorForm.getRawValue();
    const clienteId = formValue.cliente_id;
    const nome = formValue.nome?.trim() ?? '';
    const enderecoIp = formValue.endereco_ip?.trim() ?? '';
    const uptimeValue = formValue.uptime_inicio;
    const uptimeISO =
      uptimeValue instanceof Date
        ? uptimeValue.toISOString()
        : uptimeValue
        ? new Date(uptimeValue).toISOString()
        : null;

    if (!clienteId || !nome || !enderecoIp) {
      this.servidorForm.markAllAsTouched();
      return;
    }

    const payloadBase: ServidorInsert = {
      cliente_id: clienteId,
      nome,
      endereco_ip: enderecoIp,
      sistema_operacional: formValue.sistema_operacional?.trim() || null,
      status: Number(formValue.status ?? 0),
      uptime_inicio: uptimeISO,
      mensagem_erro: formValue.mensagem_erro?.trim() || null
    };

    this.saving.set(true);

    try {
      if (this.formMode() === 'create') {
        const created = await this.supabaseService.createServidor(payloadBase);
        this.servidores.set([created, ...this.servidores()]);
        this.snackBar.open('Servidor cadastrado com sucesso.', 'Fechar', { duration: 4000 });
      } else {
        const editing = this.editingServidor();
        if (!editing) {
          throw new Error('Servidor para edição não encontrado.');
        }

        const payload: ServidorUpdate = { ...payloadBase };
        const updated = await this.supabaseService.updateServidor(editing.id, payload);
        this.servidores.set(
          this.servidores().map((item) => (item.id === updated.id ? updated : item))
        );
        this.snackBar.open('Servidor atualizado com sucesso.', 'Fechar', { duration: 4000 });
      }

      this.closeForm();
    } catch (error) {
      console.error('Erro ao salvar servidor', error);
      this.snackBar.open('Não foi possível salvar o servidor.', 'Fechar', { duration: 4000 });
    } finally {
      this.saving.set(false);
      this.loadServidores();
    }
  }

  protected async delete(servidor: Servidor): Promise<void> {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o servidor ${servidor.nome}? Esta ação não pode ser desfeita.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await this.supabaseService.deleteServidor(servidor.id);
      this.servidores.set(this.servidores().filter((item) => item.id !== servidor.id));
      this.snackBar.open('Servidor removido.', 'Fechar', { duration: 4000 });
    } catch (error) {
      console.error('Erro ao excluir servidor', error);
      this.snackBar.open('Não foi possível excluir o servidor.', 'Fechar', { duration: 4000 });
    }
  }
}
