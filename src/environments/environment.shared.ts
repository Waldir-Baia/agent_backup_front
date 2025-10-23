export interface RuntimeEnvironment {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

declare global {
  interface Window {
    __env?: Partial<RuntimeEnvironment>;
  }
}

export function loadRuntimeEnvironment(): RuntimeEnvironment {
  const defaults: RuntimeEnvironment = {
    supabaseUrl: '',
    supabaseAnonKey: ''
  };

  if (typeof window === 'undefined' || !window.__env) {
    return defaults;
  }

  return {
    supabaseUrl: window.__env.supabaseUrl ?? defaults.supabaseUrl,
    supabaseAnonKey: window.__env.supabaseAnonKey ?? defaults.supabaseAnonKey
  };
}

