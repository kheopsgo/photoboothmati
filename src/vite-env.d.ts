/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly VITE_GOOGLE_DRIVE_FOLDER_URL?: string;
  readonly VITE_BUILD_TIME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

