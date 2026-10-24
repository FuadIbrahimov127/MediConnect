import { t } from '../../i18n';
// Xəritə (FR-302-04/06). OpenStreetMap embed + xarici naviqasiya keçidi; xəritə yüklənməsə ünvan və keçid qalır (EF-202-3).

export function mapsDirectionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function MapEmbed({ lat, lng, title }: { lat: number; lng: number; title: string }) {
  const d = 0.006;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`;
  return <iframe title={t('directory.map', { title })} src={src} loading="lazy" style={{ width: '100%', height: 200, border: 0, borderRadius: 14, marginTop: 12, background: 'var(--bg)' }} />;
}
