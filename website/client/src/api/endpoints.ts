import type {
  CatalogItemDto,
  CurrentUserDto,
  LanguageItemDto,
  NotificationDto,
  ServiceCatalogItemDto,
} from '@mediconnect/shared';
import { api } from './client';

// Modul üzrə API funksiyaları. Hər yeni endpoint əvvəlcə api-contract.md-də olmalıdır.

export const catalogApi = {
  specialties: (signal?: AbortSignal) => api.get<CatalogItemDto[]>('/v1/specialties', undefined, signal),
  cities: (signal?: AbortSignal) => api.get<CatalogItemDto[]>('/v1/cities', undefined, signal),
  services: (signal?: AbortSignal) => api.get<ServiceCatalogItemDto[]>('/v1/services', undefined, signal),
  languages: (signal?: AbortSignal) => api.get<LanguageItemDto[]>('/v1/languages', undefined, signal),
};

export const sessionApi = {
  me: () => api.get<CurrentUserDto>('/v1/auth/me'),
  logout: () => api.post<null>('/v1/auth/logout'),
};

export interface NotificationPage {
  totalCount: number;
  page: number;
  size: number;
  unreadCount: number;
  notifications: NotificationDto[];
}

export const notificationsApi = {
  list: (page = 1, signal?: AbortSignal) => api.get<NotificationPage>('/v1/notifications', { page, size: 20 }, signal),
  unreadCount: (signal?: AbortSignal) => api.get<{ unreadCount: number }>('/v1/notifications/unread-count', undefined, signal),
  markRead: (id: string) => api.patch<NotificationDto>(`/v1/notifications/${id}/read`),
  markAllRead: () => api.post<{ unreadCount: number }>('/v1/notifications/read-all'),
  remove: (id: string) => api.del<null>(`/v1/notifications/${id}`),
};
