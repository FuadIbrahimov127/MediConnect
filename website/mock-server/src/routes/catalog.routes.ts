import type { CatalogItemDto, Language, LanguageItemDto, ServiceCatalogItemDto } from '@mediconnect/shared';
import { Router } from 'express';
import { ok } from '../core/respond';
import { visibleDoctors } from '../services/visibility';
import { db } from '../store/db';

// Public kataloqlar (axtarış filtrlərinin mənbəyi). Yalnız aktiv elementlər, istifadəçi dilində ad.

const localized = (r: { nameAz: string; nameRu: string | null; nameEn: string | null }, lang: Language) =>
  (lang === 'ru' ? r.nameRu : lang === 'en' ? r.nameEn : null) ?? r.nameAz;

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'az');

const LANGUAGES: Record<string, Record<Language, string>> = {
  az: { az: 'Azərbaycanca', ru: 'Азербайджанский', en: 'Azerbaijani' },
  ru: { az: 'Rusca', ru: 'Русский', en: 'Russian' },
  en: { az: 'İngiliscə', ru: 'Английский', en: 'English' },
  tr: { az: 'Türkcə', ru: 'Турецкий', en: 'Turkish' },
};

export const catalogRouter = Router();

catalogRouter.get('/specialties', (req, res) => {
  const visible = new Set(visibleDoctors().map((d) => d.doctorId));
  const items: CatalogItemDto[] = db.specialties
    .filter((s) => s.isActive)
    .map((s) => ({ id: s.specialtyId, name: localized(s, req.lang), doctorCount: db.doctor_specialties.filter((ds) => ds.specialtyId === s.specialtyId && visible.has(ds.doctorId)).length }));
  ok(req, res, items.sort(byName));
});

catalogRouter.get('/cities', (req, res) => {
  const items: CatalogItemDto[] = db.cities.filter((c) => c.isActive).map((c) => ({ id: c.cityId, name: localized(c, req.lang) }));
  ok(req, res, items);
});

catalogRouter.get('/services', (req, res) => {
  const items: ServiceCatalogItemDto[] = db.services.filter((s) => s.isActive).map((s) => ({ id: s.serviceId, name: localized(s, req.lang), category: s.category }));
  ok(req, res, items.sort(byName));
});

catalogRouter.get('/languages', (req, res) => {
  const items: LanguageItemDto[] = Object.entries(LANGUAGES).map(([code, names]) => ({ code, name: names[req.lang] }));
  ok(req, res, items);
});
