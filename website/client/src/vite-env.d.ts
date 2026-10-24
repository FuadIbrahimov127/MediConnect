/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Real backend ünvanı (məs. https://api.mediconnect.az). Boşdursa Vite proxy (lokal mock) istifadə olunur. */
  readonly VITE_API_BASE_URL?: string;
  /** Dev paneli build-də də göstərmək üçün ("true"). */
  readonly VITE_DEMO?: string;
}
