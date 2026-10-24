import { createApp } from './app';
import { config } from './config';
import { startScheduler } from './jobs/scheduler';
import { loadDb, saveNow } from './store/db';
import { seed } from './store/seed';

if (loadDb()) console.log('[mock-server] store data/db.json-dan yükləndi');
else {
  seed();
  console.log('[mock-server] yeni seed yaradıldı');
}

startScheduler();

createApp().listen(config.port, () => {
  console.log(`[mock-server] http://localhost:${config.port}/v1  (dev alətləri: ${config.devTools ? '/__dev' : 'söndürülüb'})`);
});

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    saveNow();
    process.exit(0);
  });
}
