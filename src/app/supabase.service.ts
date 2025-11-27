import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

type Database = {
  public: {
    Tables: {
      usuario: {
        Row: {
          codigo: number;
          nome: string;
          cpf: string;
          email: string;
          senha: string;
        };
        Insert: {
          codigo?: number;
          nome: string;
          cpf: string;
          email: string;
          senha: string;
        };
        Update: Partial<Database['public']['Tables']['usuario']['Insert']>;
        Relationships: never[];
      };
      clientes: {
       Row: {
         id: number;
         client_id: string;
         nome_empresa: string;
         cnpj_empresa: string;
         ativo: boolean;
         created_at: string;
        };
        Insert: {
         id?: number;
         client_id: string;
         nome_empresa: string;
         cnpj_empresa: string;
         ativo?: boolean;
         created_at?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['clientes']['Row'], 'id'>>;
        Relationships: [
          {
            foreignKeyName: 'agendamentos_client_id_fkey';
            columns: ['client_id'];
            referencedRelation: 'clientes';
            referencedColumns: ['client_id'];
          },
          {
            foreignKeyName: 'backup_logs_client_id_fkey';
            columns: ['client_id'];
            referencedRelation: 'clientes';
            referencedColumns: ['client_id'];
          },
          {
            foreignKeyName: 'execucoes_realtime_client_id_fkey';
            columns: ['client_id'];
            referencedRelation: 'clientes';
            referencedColumns: ['client_id'];
          }
        ];
      };
      agendamentos: {
        Row: {
          id: number;
          client_id: string;
          schedule_name: string;
          rclone_command: string;
          cron_expression: string;
          is_active: boolean;
          remote_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          client_id: string;
          schedule_name: string;
          rclone_command: string;
          cron_expression: string;
          is_active: boolean;
          remote_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['agendamentos']['Row'], 'id'>>;
        Relationships: [
          {
            foreignKeyName: 'agendamentos_client_id_fkey';
            columns: ['client_id'];
            referencedRelation: 'clientes';
            referencedColumns: ['client_id'];
          }
        ];
      };
      execucoes_realtime: {
        Row: {
          id: number;
          client_id: string;
          nome_tarefa: string;
          comando: string;
          created_at: string;
          ip_servidor: string | null;
        };
        Insert: {
          id?: number;
          client_id: string;
          nome_tarefa: string;
          comando: string;
          created_at?: string;
          ip_servidor?: string | null;
        };
        Update: Partial<Omit<Database['public']['Tables']['execucoes_realtime']['Row'], 'id'>>;
        Relationships: [
          {
            foreignKeyName: 'execucoes_realtime_client_id_fkey';
            columns: ['client_id'];
            referencedRelation: 'clientes';
            referencedColumns: ['client_id'];
          }
        ];
      };
      playbook_comandos: {
        Row: {
          id: number;
          titulo: string;
          descricao: string | null;
          comando: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          titulo: string;
          descricao?: string | null;
          comando: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: Partial<Omit<Database['public']['Tables']['playbook_comandos']['Row'], 'id'>>;
        Relationships: never[];
      };
      backup_logs: {
        Row: {
          id: number;
          client_id: string;
          file_name: string;
          file_size_bytes: number;
          file_creation_date: string;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          client_id: string;
          file_name: string;
          file_size_bytes: number;
          file_creation_date: string;
          error_message?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<Database['public']['Tables']['backup_logs']['Row'], 'id'>>;
        Relationships: [
          {
            foreignKeyName: 'backup_logs_client_id_fkey';
            columns: ['client_id'];
            referencedRelation: 'clientes';
            referencedColumns: ['client_id'];
          }
        ];
      };
      servidores: {
        Row: {
          id: number;
          cliente_id: number;
          nome: string;
          endereco_ip: string;
          sistema_operacional: string | null;
          status: number;
          uptime_inicio: string | null;
          mensagem_erro: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          cliente_id: number;
          nome: string;
          endereco_ip: string;
          sistema_operacional?: string | null;
          status?: number;
          uptime_inicio?: string | null;
          mensagem_erro?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Omit<Database['public']['Tables']['servidores']['Row'], 'id'>>;
        Relationships: [
          {
            foreignKeyName: 'servidores_cliente_id_fkey';
            columns: ['cliente_id'];
            referencedRelation: 'clientes';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Usuario =
  Pick<Database['public']['Tables']['usuario']['Row'], 'codigo' | 'nome' | 'cpf' | 'email'>;
export type Cliente = Database['public']['Tables']['clientes']['Row'];
export type ClienteInsert = Database['public']['Tables']['clientes']['Insert'];
export type ClienteUpdate = Database['public']['Tables']['clientes']['Update'];
export type Agendamento = Database['public']['Tables']['agendamentos']['Row'];
export type AgendamentoInsert = Database['public']['Tables']['agendamentos']['Insert'];
export type AgendamentoUpdate = Database['public']['Tables']['agendamentos']['Update'];
export type ExecucaoRealtime = Database['public']['Tables']['execucoes_realtime']['Row'];
export type ExecucaoRealtimeInsert = Database['public']['Tables']['execucoes_realtime']['Insert'];
export type PlaybookCommand = Database['public']['Tables']['playbook_comandos']['Row'];
export type PlaybookCommandInsert = Database['public']['Tables']['playbook_comandos']['Insert'];
export type PlaybookCommandUpdate = Database['public']['Tables']['playbook_comandos']['Update'];
export type BackupLog = Database['public']['Tables']['backup_logs']['Row'];
export type Servidor = Database['public']['Tables']['servidores']['Row'];
export type ServidorInsert = Database['public']['Tables']['servidores']['Insert'];
export type ServidorUpdate = Database['public']['Tables']['servidores']['Update'];

/**
 * Centralizes Supabase access for the Angular app.
 */
@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private client: SupabaseClient<Database> | null = null;

  private getClient(): SupabaseClient<Database> {
    if (!this.client) {
      const { supabaseUrl, supabaseAnonKey } = environment;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
          'Supabase URL and anon key must be set in src/environments/environment.ts ' +
            'before using SupabaseService.'
        );
      }

      this.client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });
    }

    return this.client;
  }

  async signInWithCredentials(username: string, password: string): Promise<Usuario | null> {
    const { data, error } = await this.getClient()
      .from('usuario')
      .select('codigo, nome, cpf, email')
      .eq('nome', username.trim())
      .eq('senha', password)
      .maybeSingle<Usuario>();

    if (error) {
      throw new Error(error.message);
    }

    return data ?? null;
  }

  async listClientes(): Promise<Cliente[]> {
    const { data, error } = await this.getClient()
      .from('clientes')
      .select('*')
      .order('nome_empresa', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as Cliente[];
  }

  async createCliente(payload: ClienteInsert): Promise<Cliente> {
    const { data, error } = await this.getClient()
      .from('clientes')
      .insert(payload)
      .select()
      .maybeSingle<Cliente>();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Erro ao criar cliente');
    }

    return data;
  }

  async updateCliente(id: number, payload: ClienteUpdate): Promise<Cliente> {
    const { data, error } = await this.getClient()
      .from('clientes')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle<Cliente>();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Cliente não encontrado para atualização.');
    }

    return data;
  }

  async deleteCliente(id: number): Promise<void> {
    const { error } = await this.getClient().from('clientes').delete().eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async listAgendamentos(clientId: string): Promise<Agendamento[]> {
    const { data, error } = await this.getClient()
      .from('agendamentos')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as Agendamento[];
  }

  async createAgendamento(payload: AgendamentoInsert): Promise<Agendamento> {
    const { data, error } = await this.getClient()
      .from('agendamentos')
      .insert(payload)
      .select()
      .maybeSingle<Agendamento>();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Erro ao criar agendamento');
    }

    return data;
  }

  async updateAgendamento(id: number, payload: AgendamentoUpdate): Promise<Agendamento> {
    const { data, error } = await this.getClient()
      .from('agendamentos')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle<Agendamento>();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Agendamento não encontrado para atualização.');
    }

    return data;
  }

  async deleteAgendamento(id: number): Promise<void> {
    const { error } = await this.getClient().from('agendamentos').delete().eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async listPlaybookCommands(): Promise<PlaybookCommand[]> {
    const { data, error } = await this.getClient()
      .from('playbook_comandos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as PlaybookCommand[];
  }

  async createPlaybookCommand(payload: PlaybookCommandInsert): Promise<PlaybookCommand> {
    const { data, error } = await this.getClient()
      .from('playbook_comandos')
      .insert(payload)
      .select()
      .maybeSingle<PlaybookCommand>();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Erro ao criar comando do playbook.');
    }

    return data;
  }

  async updatePlaybookCommand(
    id: number,
    payload: PlaybookCommandUpdate
  ): Promise<PlaybookCommand> {
    const { data, error } = await this.getClient()
      .from('playbook_comandos')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle<PlaybookCommand>();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Comando do playbook não encontrado para atualização.');
    }

    return data;
  }

  async deletePlaybookCommand(id: number): Promise<void> {
    const { error } = await this.getClient().from('playbook_comandos').delete().eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async listExecucoesRecentes(clientId?: string, limit = 20): Promise<ExecucaoRealtime[]> {
    let query = this.getClient()
      .from('execucoes_realtime')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as ExecucaoRealtime[];
  }

  async inserirExecucao(payload: ExecucaoRealtimeInsert): Promise<ExecucaoRealtime> {
    const { data, error } = await this.getClient()
      .from('execucoes_realtime')
      .insert(payload)
      .select()
      .maybeSingle<ExecucaoRealtime>();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Erro ao registrar a execução.');
    }

    return data;
  }

  async listBackupLogs(clientId: string, page: number, pageSize: number) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await this.getClient()
      .from('backup_logs')
      .select('*', { count: 'exact' })
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: (data ?? []) as BackupLog[],
      total: count ?? 0
    };
  }

  async listServidores(clienteId?: number): Promise<Servidor[]> {
    let query = this.getClient()
      .from('servidores')
      .select('*')
      .order('created_at', { ascending: false });

    if (clienteId) {
      query = query.eq('cliente_id', clienteId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as Servidor[];
  }

  async createServidor(payload: ServidorInsert): Promise<Servidor> {
    const { data, error } = await this.getClient()
      .from('servidores')
      .insert(payload)
      .select()
      .maybeSingle<Servidor>();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Erro ao criar servidor.');
    }

    return data;
  }

  async updateServidor(id: number, payload: ServidorUpdate): Promise<Servidor> {
    const { data, error } = await this.getClient()
      .from('servidores')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle<Servidor>();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Servidor não encontrado para atualização.');
    }

    return data;
  }

  async deleteServidor(id: number): Promise<void> {
    const { error } = await this.getClient().from('servidores').delete().eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }
}
