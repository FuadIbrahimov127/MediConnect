import { deflateSync } from 'node:zlib';

// Seed üçün kiçik, real açılan demo fayllar (PDF və PNG) — xarici kitabxana olmadan yaradılır.

/** PDF standart şriftləri Azərbaycan hərflərini dəstəkləmir — demo mətndə latın qarşılıqları istifadə olunur. */
const ascii = (s: string) => s.replace(/[əƏ]/g, (c) => (c === 'ə' ? 'e' : 'E')).replace(/[ıİ]/g, (c) => (c === 'ı' ? 'i' : 'I')).replace(/[öÖ]/g, 'o').replace(/[üÜ]/g, 'u').replace(/[şŞ]/g, 's').replace(/[çÇ]/g, 'c').replace(/[ğĞ]/g, 'g').replace(/[()\\]/g, ' ');

/** Bir səhifəlik sadə PDF: başlıq + sətirlər. */
export function makePdf(title: string, lines: string[]): Buffer {
  const content = [
    'BT /F1 18 Tf 50 780 Td', `(${ascii(title)}) Tj`, 'ET',
    'BT /F1 10 Tf 50 760 Td', '(MediConnect demo senedi - real tibbi melumat deyil) Tj', 'ET',
    ...lines.flatMap((l, i) => ['BT /F1 12 Tf', `50 ${720 - i * 22} Td`, `(${ascii(l)}) Tj`, 'ET']),
  ].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];
  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((o, i) => {
    offsets.push(Buffer.byteLength(out));
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = Buffer.byteLength(out);
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

// ── PNG (EKQ-yə bənzər xətt) ──

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf: Buffer) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

/** 480×160 boz fonda qırmızı EKQ xətti. */
export function makeEcgPng(): Buffer {
  const w = 480;
  const h = 160;
  const px = Buffer.alloc(w * h * 3, 0xf7);
  const set = (x: number, y: number, r: number, g: number, b: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = (y * w + x) * 3;
    px[i] = r;
    px[i + 1] = g;
    px[i + 2] = b;
  };
  for (let x = 0; x < w; x += 16) for (let y = 0; y < h; y++) set(x, y, 0xf3, 0xd0, 0xc8);
  for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x++) set(x, y, 0xf3, 0xd0, 0xc8);
  const wave = (x: number) => {
    const t = x % 120;
    if (t > 50 && t < 54) return -60 * Math.sin(((t - 50) / 4) * Math.PI);
    if (t >= 54 && t < 58) return 25 * Math.sin(((t - 54) / 4) * Math.PI);
    if (t > 75 && t < 95) return -12 * Math.sin(((t - 75) / 20) * Math.PI);
    if (t > 25 && t < 38) return -6 * Math.sin(((t - 25) / 13) * Math.PI);
    return 0;
  };
  let prev = 90 + wave(0);
  for (let x = 1; x < w; x++) {
    const y = 90 + wave(x);
    for (let yy = Math.min(prev, y); yy <= Math.max(prev, y); yy++) {
      set(x, Math.round(yy), 0xc4, 0x45, 0x3a);
      set(x, Math.round(yy) + 1, 0xc4, 0x45, 0x3a);
    }
    prev = y;
  }
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    px.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
