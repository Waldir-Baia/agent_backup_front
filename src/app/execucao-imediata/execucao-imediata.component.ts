import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  Cliente,
  ExecucaoRealtime,
  ExecucaoRealtimeInsert,
  SupabaseService
} from '../supabase.service';

@Component({
  selector: 'app-execucao-imediata',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatSnackBarModule,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './execucao-imediata.component.html',
  styleUrl: './execucao-imediata.component.css'
})
export class ExecucaoImediataComponent {
  private readonly supabaseService = inject(SupabaseService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly historico = signal<ExecucaoRealtime[]>([]);
  protected readonly loadingClientes = signal(false);
  protected readonly loadingHistorico = signal(false);
  protected readonly submitting = signal(false);

  protected readonly displayedColumns = ['created_at', 'nome_tarefa', 'comando'];

  protected readonly execucaoForm = this.formBuilder.nonNullable.group({
    client_id: ['', Validators.required],
    nome_tarefa: ['', Validators.required],
    comando: ['', Validators.required]
  });

  constructor() {
    this.loadClientes();
  }

  protected async loadClientes(): Promise<void> {
    this.loadingClientes.set(true);
    try {
      const data = await this.supabaseService.listClientes();
      this.clientes.set(data);

      const currentClient = this.execucaoForm.controls.client_id.value;
      if (!currentClient && data.length > 0) {
        const firstClient = data[0].client_id;
        this.execucaoForm.controls.client_id.setValue(firstClient, { emitEvent: false });
        await this.loadHistorico(firstClient);
      } else if (currentClient) {
        await this.loadHistorico(currentClient);
      } else {
        this.historico.set([]);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes', error);
      this.snackBar.open('Nao foi possivel carregar os clientes.', 'Fechar', {
        duration: 4000
      });
    } finally {
      this.loadingClientes.set(false);
    }
  }

  protected async loadHistorico(clientId: string): Promise<void> {
    this.loadingHistorico.set(true);
    try {
      const data = await this.supabaseService.listExecucoesRecentes(clientId, 20);
      this.historico.set(data);
    } catch (error) {
      console.error('Erro ao carregar historico', error);
      this.snackBar.open('Nao foi possivel carregar o historico.', 'Fechar', {
        duration: 4000
      });
    } finally {
      this.loadingHistorico.set(false);
    }
  }

  protected async submit(): Promise<void> {
    if (this.execucaoForm.invalid) {
      this.execucaoForm.markAllAsTouched();
      return;
    }

    const { client_id, nome_tarefa, comando } = this.execucaoForm.getRawValue();
    const payload: ExecucaoRealtimeInsert = {
      client_id,
      nome_tarefa: nome_tarefa.trim(),
      comando: comando.trim()
    };

    this.submitting.set(true);
    try {
      await this.supabaseService.inserirExecucao(payload);
      this.snackBar.open('Comando enviado para execucao.', 'Fechar', {
        duration: 4000
      });
      this.execucaoForm.controls.nome_tarefa.reset('');
      this.execucaoForm.controls.comando.reset('');
      await this.loadHistorico(client_id);
    } catch (error) {
      console.error('Erro ao enviar comando', error);
      this.snackBar.open('Nao foi possivel enviar o comando.', 'Fechar', {
        duration: 4000
      });
    } finally {
      this.submitting.set(false);
    }
  }

  protected async handleClientSelection(event: MatSelectChange): Promise<void> {
    const clientId = event.value;
    this.execucaoForm.controls.client_id.setValue(clientId, { emitEvent: false });

    if (clientId) {
      await this.loadHistorico(clientId);
    } else {
      this.historico.set([]);
    }
  }
}
