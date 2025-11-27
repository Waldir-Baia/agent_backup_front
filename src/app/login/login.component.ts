import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    DividerModule,
    MessageModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly brandColor = '#127f0b';
  protected readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly showPassword = signal(false);

  constructor() {
    effect(() => {
      if (this.authService.currentUser()) {
        this.router.navigateByUrl('/principal');
      }
    });
  }

  protected togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  protected async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();

    this.submitting.set(true);
    this.errorMessage.set('');

    try {
      await this.authService.login(email, password);
    } catch (error) {
      console.error('Erro ao autenticar usuário', error);
      this.errorMessage.set('Usuário ou senha inválidos.');
    } finally {
      this.submitting.set(false);
    }
  }
}
