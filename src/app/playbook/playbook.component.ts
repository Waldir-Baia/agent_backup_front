import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import {
  PlaybookCommand,
  SupabaseService
} from '../supabase.service';
import {
  PlaybookDialogResult,
  PlaybookFormDialogComponent
} from './playbook-form-dialog.component';
import {
  PlaybookExecuteDialogComponent,
  PlaybookExecuteDialogResult
} from './playbook-execute-dialog.component';

@Component({
  selector: 'app-playbook',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './playbook.component.html',
  styleUrl: './playbook.component.css'
})
export class PlaybookComponent implements OnInit {
  private readonly supabaseService = inject(SupabaseService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  protected readonly comandos = signal<PlaybookCommand[]>([]);
  protected readonly loading = signal(false);
  protected readonly filterTerm = signal('');

  protected readonly displayedColumns = ['titulo', 'descricao', 'comando', 'actions'];

  ngOnInit(): void {
    this.loadCommands();
  }

  protected readonly filteredCommands = computed(() => {
    const term = this.filterTerm().trim().toLowerCase();
    if (!term) {
      return this.comandos();
    }

    return this.comandos().filter((command) => {
      const fields = [
        command.titulo,
        command.descricao ?? '',
        command.comando
      ]
        .join(' ')
        .toLowerCase();
      return fields.includes(term);
    });
  });

  protected trackById(_: number, item: PlaybookCommand): number {
    return item.id;
  }

  protected async loadCommands(): Promise<void> {
    this.loading.set(true);
    this.filterTerm.set('');
    try {
      const data = await this.supabaseService.listPlaybookCommands();
      this.comandos.set(data);
    } catch (error) {
      console.error('Erro ao carregar comandos do playbook', error);
      this.snackBar.open('Não foi possível carregar a lista de comandos.', 'Fechar', {
        duration: 4000
      });
    } finally {
      this.loading.set(false);
    }
  }

  protected openCreateDialog(): void {
    this.openDialog('create');
  }

  protected openEditDialog(command: PlaybookCommand): void {
    this.openDialog('edit', command);
  }

  private openDialog(mode: 'create' | 'edit', command?: PlaybookCommand): void {
    const dialogRef = this.dialog.open(PlaybookFormDialogComponent, {
      width: '640px',
      data: { mode, command }
    });

    dialogRef.afterClosed().subscribe((result?: PlaybookDialogResult) => {
      if (!result) {
        return;
      }

      if (result.action === 'create') {
        this.comandos.set([result.command, ...this.comandos()]);
        this.snackBar.open('Comando adicionado ao playbook.', 'Fechar', { duration: 4000 });
      } else {
        this.comandos.set(
          this.comandos().map((item) => (item.id === result.command.id ? result.command : item))
        );
        this.snackBar.open('Comando atualizado.', 'Fechar', { duration: 4000 });
      }
    });
  }

  protected async delete(command: PlaybookCommand): Promise<void> {
    const confirmed = window.confirm(
      `Remover "${command.titulo}" da lista? Essa ação não pode ser desfeita.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await this.supabaseService.deletePlaybookCommand(command.id);
      this.comandos.set(this.comandos().filter((item) => item.id !== command.id));
      this.snackBar.open('Comando removido do playbook.', 'Fechar', { duration: 4000 });
    } catch (error) {
      console.error('Erro ao deletar comando do playbook', error);
      this.snackBar.open('Não foi possível excluir o comando.', 'Fechar', { duration: 4000 });
    }
  }

  protected executeCommand(command: PlaybookCommand): void {
    const dialogRef = this.dialog.open(PlaybookExecuteDialogComponent, {
      width: '560px',
      data: { command }
    });

    dialogRef.afterClosed().subscribe((result?: PlaybookExecuteDialogResult) => {
      if (!result) {
        return;
      }

      this.snackBar.open('Comando enviado para execução.', 'Fechar', { duration: 4000 });
    });
  }
}
