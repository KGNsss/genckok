// Biçimlendirme yardımcıları. Sahibi: Görev 1.
import { supabase } from './supabase';

/** ISO tarih/zaman ya da "YYYY-MM-DD" → tasarımdaki biçim "22.11.2026" (Türkiye saatiyle). */
export function tarih(value: string | Date | null | undefined): string {
  if (!value) return '-';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-');
    return `${d}.${m}.${y}`;
  }
  const dt = new Date(value);
  if (isNaN(dt.getTime())) return '-';
  const tr = new Date(dt.getTime() + 3 * 3600000); // Türkiye UTC+3 (yaz saati yok)
  const dd = String(tr.getUTCDate()).padStart(2, '0');
  const mm = String(tr.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${tr.getUTCFullYear()}`;
}

/** "22.11.2026" → "2026-11-22" (geçersizse null). Dikim Tarihi inputu için. */
export function tarihParse(input: string): string | null {
  const m = input.trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const iso = `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  const dt = new Date(iso + 'T00:00:00Z');
  if (isNaN(dt.getTime()) || dt.getUTCDate() !== Number(d) || dt.getUTCMonth() + 1 !== Number(mo)) return null;
  return iso;
}

/** Türkçe büyük harf: "ağaccık" → "AĞACCIK", "fidan" → "FİDAN". Kart adları büyük harfle gösterilir. */
export function trUpper(s: string | null | undefined): string {
  return (s ?? '').replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase();
}

/** Fidan fotoğrafının herkese açık adresi (tree-photos bucket). */
export function photoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return supabase.storage.from('tree-photos').getPublicUrl(path).data.publicUrl;
}

/** Profil fotoğrafının herkese açık adresi (avatars bucket). */
export function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

/** QR künyesine basılan link. */
export function qrLink(code: string): string {
  const base = process.env.EXPO_PUBLIC_QR_BASE_URL ?? 'https://argeaybu.com/genckok/t';
  return `${base}/${code}`;
}
