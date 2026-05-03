/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly VITE_GOOGLE_DRIVE_FOLDER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

