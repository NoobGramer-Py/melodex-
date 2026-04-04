/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_API_URL: string;
  readonly VITE_ADSENSE_PUBLISHER_ID: string;
  readonly VITE_ADSENSE_AD_SLOT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
