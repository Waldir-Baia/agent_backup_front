import { Injectable, computed, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly currentUserSignal = signal<AuthUser | null>(null);
  private sessionRestored = false;
  private restoringPromise: Promise<void> | null = null;

  readonly currentUser = computed(() => this.currentUserSignal());

  constructor(private readonly supabaseService: SupabaseService) {}

  async login(email: string, password: string): Promise<AuthUser> {
    const user = await this.supabaseService.signInWithEmailPassword(email, password);
    const mappedUser = this.toAuthUser(user);
    this.currentUserSignal.set(mappedUser);
    this.sessionRestored = true;
    return mappedUser;
  }

  async logout(): Promise<void> {
    try {
      await this.supabaseService.signOut();
    } catch (error) {
      console.error('Erro ao sair da sessão', error);
    } finally {
      this.currentUserSignal.set(null);
      this.sessionRestored = true;
    }
  }

  isAuthenticated(): boolean {
    return this.currentUserSignal() !== null;
  }

  async ensureSessionRestored(): Promise<void> {
    if (this.sessionRestored) {
      return;
    }

    if (!this.restoringPromise) {
      this.restoringPromise = this.restoreSession();
    }

    await this.restoringPromise;
  }

  private async restoreSession(): Promise<void> {
    try {
      const session = await this.supabaseService.getCurrentSession();
      if (session?.user) {
        this.currentUserSignal.set(this.toAuthUser(session.user));
      } else {
        this.currentUserSignal.set(null);
      }
    } catch (error) {
      console.error('Erro ao restaurar sessão', error);
      this.currentUserSignal.set(null);
    } finally {
      this.sessionRestored = true;
    }
  }

  private toAuthUser(user: { id: string; email?: string | null; user_metadata?: Record<string, any> }): AuthUser {
    const name = user.user_metadata
      ? user.user_metadata['name'] ?? user.user_metadata['full_name']
      : null;

    return {
      id: user.id,
      email: user.email ?? '',
      name: name ?? null
    };
  }
}
