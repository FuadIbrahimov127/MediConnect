import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const flag = (v: string | undefined, def: boolean) => (v === undefined ? def : v === 'true' || v === '1');

export const config = {
  port: Number(process.env.PORT ?? 4000),
  /** /__dev endpoint-ləri və dev-only login-as. */
  devTools: flag(process.env.MOCK_DEV_TOOLS, true),
  /** Hər cavaba süni gecikmə — loading/skeleton vəziyyətlərini görünən edir. */
  latencyMs: Number(process.env.MOCK_LATENCY_MS ?? 250),
  /** Store-u data/db.json-a yazmaq (testlərdə false). */
  persist: flag(process.env.MOCK_PERSIST, true),
  /** Scheduler-i avtomatik işə salmaq (testlərdə false, job-lar əl ilə çağırılır). */
  jobs: flag(process.env.MOCK_JOBS, true),
  /**
   * Fəaliyyətsizlik timeout-u (BR-102-04, session_timeout_minutes = 15). Lokal demoda söndürülüb ki, sessiya hər
   * 15 dəqiqədən bir bitməsin (sessiya 30 gün yaşayır). Testlərdə və real mühitdə true olmalıdır.
   */
  sessionTimeout: flag(process.env.MOCK_SESSION_TIMEOUT, false),
  jobIntervalMs: Number(process.env.JOB_INTERVAL_MS ?? 30_000),
  /** SİMA callback, rəqəmsal imza və signed URL HMAC-ları üçün mock gizli açar. */
  secret: process.env.MOCK_SECRET ?? 'mediconnect-local-mock-secret',
  dataDir: process.env.DATA_DIR ?? path.join(root, 'data'),
};
