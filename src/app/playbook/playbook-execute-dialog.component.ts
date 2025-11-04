import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  Cliente,
  ExecucaoRealtimeInsert,
  PlaybookCommand,
  SupabaseService
} from '../supabase.service';

export type PlaybookExecuteDialogResult = boolean;

export interface PlaybookExecuteDialogData {
  command: PlaybookCommand;
}

@Component({
  selector: 'app-playbook-execute-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './playbook-execute-dialog.component.html',
  styleUrl: './playbook-execute-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlaybookExecuteDialogComponent implements OnInit {
  private readonly supabaseService = inject(SupabaseService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly loadingClientes = signal(false);
  protected readonly submitting = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    client_id: ['', Validators.required],
    nome_tarefa: ['', Validators.required]
  });

  constructor(
    private readonly dialogRef: MatDialogRef<
      PlaybookExecuteDialogComponent,
      PlaybookExecuteDialogResult
    >,
    @Inject(MAT_DIALOG_DATA) protected readonly data: PlaybookExecuteDialogData
  ) {}

  ngOnInit(): void {
    this.form.controls.nome_tarefa.setValue(this.data.command.titulo);
    void this.loadClientes();
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { client_id, nome_tarefa } = this.form.getRawValue();
    const payload: ExecucaoRealtimeInsert = {
      client_id,
      nome_tarefa: nome_tarefa.trim(),
      comando: this.data.command.comando
    };

    this.submitting.set(true);
    try {
      await this.supabaseService.inserirExecucao(payload);
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Erro ao enviar execução do playbook', error);
      this.snackBar.open('Não foi possível enviar o comando.', 'Fechar', { duration: 4000 });
    } finally {
      this.submitting.set(false);
    }
  }

  protected cancel(): void {
    this.dialogRef.close(false);
  }

  private async loadClientes(): Promise<void> {
    this.loadingClientes.set(true);
    try {
      const data = await this.supabaseService.listClientes();
      this.clientes.set(data);

      if (data.length > 0 && !this.form.controls.client_id.value) {
        this.form.controls.client_id.setValue(data[0].client_id, { emitEvent: false });
      }
    } catch (error) {
      console.error('Erro ao carregar clientes para execução', error);
      this.snackBar.open('Não foi possível carregar a lista de clientes.', 'Fechar', {
        duration: 4000
      });
    } finally {
      this.loadingClientes.set(false);
    }
  }
}
