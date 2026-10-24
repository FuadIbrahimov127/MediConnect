import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config';
import { seed } from './seed';

// npm run seed — store-u və şifrələnmiş faylları sıfırlayır.
fs.rmSync(path.join(config.dataDir, 'storage'), { recursive: true, force: true });
seed();
console.log(`Seed hazırdır → ${path.join(config.dataDir, 'db.json')}`);
