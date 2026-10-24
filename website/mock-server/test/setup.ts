import { beforeEach } from 'vitest';
import { bakuDate, bakuToUtc, clock } from '../src/core/clock';
import { faults } from '../src/integrations/faults';
import { seed } from '../src/store/seed';

// Hər test təzə seed və nasazlıqsız servislərlə başlayır. Saat bu günün Bakı vaxtı ilə 12:00-a qoyulur ki,
// nəticələr testin işlədiyi saatdan (məs. gecə "quiet hours") asılı olmasın.
beforeEach(() => {
  faults.reset();
  clock.reset();
  clock.set(bakuToUtc(bakuDate(), '12:00'));
  seed({ keepClock: true });
});
