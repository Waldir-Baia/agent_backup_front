import { Injectable, computed, signal } from '@angular/core';
import { SupabaseService, Usuario } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly currentUserSignal = signal<Usuario | null>(null);

  readonly currentUser = computed(() => this.currentUserSignal());

  constructor(private readonly supabaseService: SupabaseService) {}

  async login(username: string, password: string): Promise<Usuario> {
    const user = await this.supabaseService.signInWithCredentials(username, password);

    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    this.currentUserSignal.set(user);
    return user;
  }

  logout(): void {
    this.currentUserSignal.set(null);
  }

  isAuthenticated(): boolean {
    return this.currentUserSignal() !== null;
  }
}

