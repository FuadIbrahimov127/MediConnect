import { SETTINGS, type SettingKey } from '@mediconnect/shared';
import { db } from '../store/db';
import type { Actor } from './actor';
import { audit } from './audit';
import { clock } from './clock';
import { ApiError } from './errors';

// Parametrlər kodda deyil, system_settings-də saxlanılır (NFR-34). Həmişə buradan oxu.

export function getSetting(key: SettingKey): number {
  const row = db.system_settings.find((s) => s.settingKey === key);
  return row ? Number(row.settingValue) : SETTINGS[key].value;
}

export function setSetting(actor: Actor, key: SettingKey, value: number, opts: { confirm?: boolean; reason?: string | null } = {}) {
  const def = SETTINGS[key];
  const row = db.system_settings.find((s) => s.settingKey === key);
  if (!row || !def) throw new ApiError('NotFound');
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < def.min || value > def.max) {
    throw new ApiError('ValidationError', { fields: { value: `${def.min}–${def.max}` } });
  }
  // EF-904-2: kritik parametr əlavə təsdiq tələb edir.
  if (row.isCritical && !opts.confirm) throw new ApiError('BusinessRuleViolation', { requiresConfirmation: true });
  const old = row.settingValue;
  row.settingValue = String(value);
  row.updatedBy = actor.userId;
  row.updatedAt = clock.nowIso();
  audit(actor, { action: 'UPDATE_SETTING', entityType: 'SYSTEM_SETTING', entityId: row.settingId, oldValue: { [key]: old }, newValue: { [key]: value }, reason: opts.reason });
  return row;
}
