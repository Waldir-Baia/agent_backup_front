import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DividerModule } from 'primeng/divider';
import {
  PlaybookCommand,
  PlaybookCommandInsert,
  PlaybookCommandUpdate,
  SupabaseService
} from '../supabase.service';

export type PlaybookFormMode = 'create' | 'edit';

export type PlaybookDialogData = {
  mode: PlaybookFormMode;
  command?: PlaybookCommand;
};

export type PlaybookDialogResult = {
  action: 'create' | 'update';
  command: PlaybookCommand;
};

@Component({
  selector: 'app-playbook-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    DividerModule
  ],
  templateUrl: './playbook-form-dialog.component.html',
  styleUrl: './playbook-form-dialog.component.css'
})
export class PlaybookFormDialogComponent {
  private readonly supabaseService = inject(SupabaseService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject<MatDialogRef<PlaybookFormDialogComponent>>(MatDialogRef);
  protected readonly data = inject<PlaybookDialogData>(MAT_DIALOG_DATA);

  protected readonly saving = signal(false);

  protected readonly title = computed(() =>
    this.data.mode === 'create' ? 'Cadastrar comando' : 'Editar comando'
  );

  protected readonly playbookForm = this.formBuilder.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(150)]],
    descricao: ['', Validators.maxLength(400)],
    comando: ['', Validators.required]
  });

  constructor() {
    if (this.data.command) {
      const command = this.data.command;
      this.playbookForm.patchValue({
        titulo: command.titulo,
        descricao: command.descricao ?? '',
        comando: command.comando
      });
    }
  }

  protected async submit(): Promise<void> {
    if (this.playbookForm.invalid) {
      this.playbookForm.markAllAsTouched();
      return;
    }

    const formValue = this.playbookForm.getRawValue();
    const payloadBase = {
      titulo: formValue.titulo.trim(),
      comando: formValue.comando.trim(),
      descricao: formValue.descricao?.trim() || null
    };

    this.saving.set(true);

    try {
      if (this.data.mode === 'create') {
        const payload: PlaybookCommandInsert = payloadBase;
        const created = await this.supabaseService.createPlaybookCommand(payload);
        this.dialogRef.close({ action: 'create', command: created } satisfies PlaybookDialogResult);
      } else {
        const editing = this.data.command;
        if (!editing) {
          throw new Error('Comando selecionado nao foi encontrado.');
        }
        const payload: PlaybookCommandUpdate = payloadBase;
        const updated = await this.supabaseService.updatePlaybookCommand(editing.id, payload);
        this.dialogRef.close({ action: 'update', command: updated } satisfies PlaybookDialogResult);
      }
    } catch (error) {
      console.error('Erro ao salvar comando do playbook', error);
      this.snackBar.open('Nao foi possivel salvar o comando.', 'Fechar', { duration: 4000 });
    } finally {
      this.saving.set(false);
    }
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
