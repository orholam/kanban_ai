/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** When `"true"`, app uses local SQLite API and skips Supabase auth (see README). */
  readonly VITE_LOCAL_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
