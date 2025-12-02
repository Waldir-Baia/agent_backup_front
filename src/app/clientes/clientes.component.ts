import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputTextModule } from 'primeng/inputtext';
import { DividerModule } from 'primeng/divider';
import { Cliente, ClienteInsert, ClienteUpdate, SupabaseService } from '../supabase.service';

type FormMode = 'create' | 'edit';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    DialogModule,
    InputTextModule,
    ToggleSwitchModule,
    ButtonModule,
    DividerModule
  ],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.css'
})
export class ClientesComponent {
  private readonly supabaseService = inject(SupabaseService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly displayedColumns = ['client_id', 'nome_empresa', 'cnpj_empresa', 'ativo', 'actions'];
  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly formMode = signal<FormMode>('create');
  protected readonly editingCliente = signal<Cliente | null>(null);
  protected readonly isFormVisible = signal(false);

  protected readonly clienteForm = this.formBuilder.nonNullable.group({
    client_id: ['', Validators.required],
    nome_empresa: ['', Validators.required],
    cnpj_empresa: [
      '',
      [
        Validators.required,
        Validators.pattern(/^\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}$/)
      ]
    ],
    ativo: [true]
  });

  constructor() {
    this.loadClientes();
    effect(() => {
      if (this.formMode() === 'create') {
        this.editingCliente.set(null);
      }
    });
  }

  protected async loadClientes(): Promise<void> {
    this.loading.set(true);
    try {
      const data = await this.supabaseService.listClientes();
      this.clientes.set(data);
    } catch (error) {
      console.error('Erro ao carregar clientes', error);
      this.snackBar.open('Não foi possível carregar os clientes.', 'Fechar', {
        duration: 4000
      });
    } finally {
      this.loading.set(false);
    }
  }

  protected showCreateForm(): void {
    this.formMode.set('create');
    this.editingCliente.set(null);
    this.clienteForm.reset({
      client_id: '',
      nome_empresa: '',
      cnpj_empresa: '',
      ativo: true
    });
    this.isFormVisible.set(true);
  }

  protected startEdit(cliente: Cliente): void {
    this.formMode.set('edit');
    this.editingCliente.set(cliente);
    this.clienteForm.setValue({
      client_id: cliente.client_id,
      nome_empresa: cliente.nome_empresa,
      cnpj_empresa: cliente.cnpj_empresa,
      ativo: cliente.ativo
    });
    this.isFormVisible.set(true);
  }

  protected closeForm(): void {
    this.isFormVisible.set(false);
    this.clienteForm.reset({
      client_id: '',
      nome_empresa: '',
      cnpj_empresa: '',
      ativo: true
    });
    this.editingCliente.set(null);
    this.formMode.set('create');
  }

  protected formatCnpjInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 14);

    const parts = [
      digits.substring(0, 2),
      digits.substring(2, 5),
      digits.substring(5, 8),
      digits.substring(8, 12),
      digits.substring(12, 14)
    ];

    let formatted = '';
    if (parts[0]) {
      formatted = parts[0];
    }
    if (parts[1]) {
      formatted += `.${parts[1]}`;
    }
    if (parts[2]) {
      formatted += `.${parts[2]}`;
    }
    if (parts[3]) {
      formatted += `/${parts[3]}`;
    }
    if (parts[4]) {
      formatted += `-${parts[4]}`;
    }

    this.clienteForm.controls.cnpj_empresa.setValue(formatted, { emitEvent: false });
  }

  protected async submit(): Promise<void> {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }

    const formValue = this.clienteForm.getRawValue();
    this.saving.set(true);

    try {
      if (this.formMode() === 'create') {
        const payload: ClienteInsert = {
          client_id: formValue.client_id.trim(),
          nome_empresa: formValue.nome_empresa.trim(),
          cnpj_empresa: formValue.cnpj_empresa,
          ativo: formValue.ativo
        };
        const created = await this.supabaseService.createCliente(payload);
        this.clientes.set([created, ...this.clientes()]);
        this.snackBar.open('Cliente cadastrado com sucesso.', 'Fechar', { duration: 4000 });
      } else {
        const editing = this.editingCliente();
        if (!editing) {
          throw new Error('Cliente para edição não encontrado.');
        }
        const payload: ClienteUpdate = {
          client_id: formValue.client_id.trim(),
          nome_empresa: formValue.nome_empresa.trim(),
          cnpj_empresa: formValue.cnpj_empresa,
          ativo: formValue.ativo
        };
        const updated = await this.supabaseService.updateCliente(editing.id, payload);
        this.clientes.set(
          this.clientes().map((cliente) => (cliente.id === updated.id ? updated : cliente))
        );
        this.snackBar.open('Cliente atualizado com sucesso.', 'Fechar', { duration: 4000 });
      }

      this.closeForm();
    } catch (error) {
      console.error('Erro ao salvar cliente', error);
      this.snackBar.open('Não foi possível salvar o cliente.', 'Fechar', { duration: 4000 });
    } finally {
      this.saving.set(false);
      this.loadClientes();
    }
  }

  protected async delete(cliente: Cliente): Promise<void> {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o cliente ${cliente.nome_empresa}? Esta ação pode remover dados relacionados.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await this.supabaseService.deleteCliente(cliente.id);
      this.clientes.set(this.clientes().filter((item) => item.id !== cliente.id));
      this.snackBar.open('Cliente removido.', 'Fechar', { duration: 4000 });
    } catch (error) {
      console.error('Erro ao excluir cliente', error);
      this.snackBar.open('Não foi possível excluir o cliente.', 'Fechar', { duration: 4000 });
    }
  }
}
