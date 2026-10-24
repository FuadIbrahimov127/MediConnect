import { config } from '../config';
import { scheduleSave } from '../store/db';
import { sendDueScheduledNotifications } from '../services/notifications.service';
import { autoCompleteAppointments, cancelUnconfirmedPending } from '../services/appointments.service';
import { releaseExpiredLocks, rollSlotGeneration } from '../services/schedule.service';
import { purgeDeletedDocuments } from '../services/documents.service';
import { expireGrants } from '../services/grants.service';
import { expirePrescriptions } from '../services/prescriptions.service';
import { checkClinicLicenses } from '../services/admin-clinics.service';
import { checkDoctorLicenses } from '../services/clinic-doctors.service';

// Scheduled job-lar (spec: "scheduled job"). Hər JOB_INTERVAL_MS-də işə düşür; dev panel /__dev/jobs/run ilə dərhal çağırır.
// Yeni job əlavə edəndə registerJob(...) çağır — modul faylının sonunda və ya burada.

export interface Job {
  name: string;
  description: string;
  run: () => number | void;
}

const jobs: Job[] = [];

export function registerJob(job: Job) {
  if (!jobs.some((j) => j.name === job.name)) jobs.push(job);
}

export const listJobs = () => jobs.map(({ name, description }) => ({ name, description }));

export function runJobs(name?: string): Record<string, number> {
  const result: Record<string, number> = {};
  for (const job of jobs) {
    if (name && job.name !== name) continue;
    try {
      result[job.name] = Number(job.run() ?? 0);
    } catch (e) {
      console.error(`[job:${job.name}] xəta:`, e);
      result[job.name] = -1;
    }
  }
  scheduleSave();
  return result;
}

let timer: NodeJS.Timeout | null = null;

export function startScheduler() {
  if (timer || !config.jobs) return;
  timer = setInterval(() => runJobs(), config.jobIntervalMs);
  timer.unref();
}

registerJob({ name: 'sendScheduledNotifications', description: 'Vaxtı çatmış xatırlatma və təxirə salınmış bildirişləri göndərir', run: sendDueScheduledNotifications });
registerJob({ name: 'releaseExpiredLocks', description: 'Vaxtı keçmiş soft lock-ları buraxır (EF-401-2)', run: releaseExpiredLocks });
registerJob({ name: 'rollSlotGeneration', description: 'Gələcək slot_generation_days gün üçün slotları generasiya edir (BR-702-06)', run: rollSlotGeneration });
registerJob({ name: 'autoCompleteAppointments', description: '24 saat sonra statusu təyin olunmamış randevunu tamamlayır (BR-405-07)', run: autoCompleteAppointments });
registerJob({ name: 'cancelUnconfirmedPending', description: 'Vaxtı çatmış, təsdiqlənməmiş PENDING randevunu ləğv edir (F3)', run: cancelUnconfirmedPending });
registerJob({ name: 'expireGrants', description: 'Müddəti bitmiş sənəd icazələrini bağlayır (BR-502-02)', run: expireGrants });
registerJob({ name: 'expirePrescriptions', description: 'Etibarlılıq müddəti bitmiş reseptləri EXPIRED edir (BR-602-04)', run: expirePrescriptions });
registerJob({ name: 'checkDoctorLicenses', description: 'Lisenziya xəbərdarlığı (30/7/1 gün) və bitəndə avtomatik dayandırma (BR-802-08)', run: checkDoctorLicenses });
registerJob({ name: 'checkClinicLicenses', description: 'Klinika lisenziyası: 30/7/1 gün xəbərdarlıq, bitəndə avtomatik dayandırma (EF-901-7)', run: checkClinicLicenses });
registerJob({ name: 'purgeDeletedDocuments', description: '30 gün əvvəl silinmiş sənədləri tam silir (BR-501-06)', run: purgeDeletedDocuments });
