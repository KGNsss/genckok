// QR künye üretici (Node; uygulamaya girmez). Sahibi: Görev 1.
//
// Kullanım (mobile/ klasöründen):
//   npx tsx scripts/qr-uret.ts --adet 200 --baslangic 1 --parsel A --tur "Çınar" --yil 2026
//   --kuru   → veritabanına dokunmadan sadece künye dosyalarını üretir (yazıcı denemesi için; .env.local gerekmez)
//
// Gerekli: scripts/.env.local  →  SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=...  (service role asla uygulamaya/repoya girmez)
// Çıktı:   cikti/qr/GK-0001.svg  ve  cikti/kunyeler.html (A4, sayfa başı 12 künye, 3×4)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { config } from 'dotenv';
import QRCode from 'qrcode';
import { createClient } from '@supabase/supabase-js';

config({ path: resolve(__dirname, '.env.local') });

// ---------- argümanlar ----------
const args = process.argv.slice(2);
const arg = (name: string, fallback?: string): string => {
  const i = args.indexOf(`--${name}`);
  const v = i >= 0 ? args[i + 1] : undefined;
  if (v === undefined || v.startsWith('--')) {
    if (fallback !== undefined) return fallback;
    throw new Error(`--${name} zorunlu. Örnek: npx tsx scripts/qr-uret.ts --adet 200 --baslangic 1 --parsel A --tur "Çınar" --yil 2026`);
  }
  return v;
};

const adet = Number(arg('adet'));
const baslangic = Number(arg('baslangic', '1'));
const parsel = arg('parsel').trim().toUpperCase();
const tur = arg('tur', '').trim() || null;
const yil = Number(arg('yil', String(new Date().getFullYear())));
const kuru = args.includes('--kuru');
if (!Number.isInteger(adet) || adet < 1 || !Number.isInteger(baslangic) || baslangic < 1 || !Number.isInteger(yil)) {
  throw new Error('--adet, --baslangic ve --yil tam sayı olmalı (adet ve baslangic en az 1).');
}

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!kuru && (!url || !serviceKey)) throw new Error('scripts/.env.local içinde SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY tanımlı olmalı.');
const baseUrl = process.env.QR_BASE_URL ?? 'https://argeaybu.com/genckok/t';

const supabase = createClient(url ?? 'http://localhost', serviceKey ?? 'kuru', { auth: { persistSession: false, autoRefreshToken: false } });

const kod = (n: number) => `GK-${String(n).padStart(4, '0')}`;
const link = (c: string) => `${baseUrl}/${c}`;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c);

async function main() {
  // ---------- 1) Var olanları bul (kod ya da parsel+sıra çakışması: atla, hata verme) ----------
  const { data: mevcut, error: e1 } = kuru ? { data: [], error: null } : await supabase.from('trees').select('qr_code, parcel_no, row_no');
  if (e1) throw e1;
  const kodlar = new Set((mevcut ?? []).map((t) => t.qr_code).filter(Boolean));
  const konumlar = new Set((mevcut ?? []).map((t) => `${t.parcel_no}|${t.row_no}`));

  const yeni: { qr_code: string; parcel_no: string; row_no: string; species: string | null; cohort_year: number; n: number }[] = [];
  let atlandi = 0;
  for (let n = baslangic; n < baslangic + adet; n++) {
    const c = kod(n);
    if (kodlar.has(c) || konumlar.has(`${parsel}|${n}`)) {
      atlandi++;
      continue;
    }
    yeni.push({ qr_code: c, parcel_no: parsel, row_no: String(n), species: tur, cohort_year: yil, n });
  }

  // ---------- 2) Veritabanına ekle (500'lük parçalar) ----------
  for (let i = 0; !kuru && i < yeni.length; i += 500) {
    const parca = yeni.slice(i, i + 500).map(({ n: _n, ...row }) => row);
    const { error } = await supabase.from('trees').insert(parca);
    if (error) throw error;
  }

  // ---------- 3) Künye çıktıları: eklenenler + atlananlar dahil, istenen aralığın tamamı ----------
  const cikti = resolve(process.cwd(), 'cikti');
  mkdirSync(join(cikti, 'qr'), { recursive: true });
  const kartlar: string[] = [];
  for (let n = baslangic; n < baslangic + adet; n++) {
    const c = kod(n);
    const svg = await QRCode.toString(link(c), { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
    writeFileSync(join(cikti, 'qr', `${c}.svg`), svg, 'utf8');
    kartlar.push(
      `<div class="kunye"><div class="qr">${svg}</div><div class="kod">${esc(c)}</div>` +
        `<div class="yer">Parsel ${esc(parsel)} · Sıra ${n}</div><div class="alt">GençKök · AYBÜ Nefes Ormanı</div></div>`,
    );
  }
  const sayfalar: string[] = [];
  for (let i = 0; i < kartlar.length; i += 12) {
    sayfalar.push(`<section class="sayfa">${kartlar.slice(i, i + 12).join('')}</section>`);
  }
  writeFileSync(join(cikti, 'kunyeler.html'), html(sayfalar.join('\n')), 'utf8');

  console.log(kuru ? `Kuru çalıştırma: ${adet} künye üretildi (veritabanına yazılmadı). Çıktı: ${cikti}` : `${yeni.length} eklendi, ${atlandi} atlandı. Çıktı: ${cikti}`);
}

function html(body: string): string {
  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><title>GençKök künyeleri</title>
<style>
  @page { size: A4; margin: 10mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; }
  .sayfa { display: grid; grid-template-columns: repeat(3, 1fr); grid-auto-rows: 1fr; gap: 4mm; height: 277mm; page-break-after: always; }
  .sayfa:last-child { page-break-after: auto; }
  .kunye { border: 1px solid #000; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4mm; text-align: center; }
  .qr { width: 42mm; height: 42mm; }
  .qr svg { width: 100%; height: 100%; }
  .kod { font-weight: 800; font-size: 20pt; margin-top: 3mm; letter-spacing: 0.5px; }
  .yer { font-size: 10pt; margin-top: 1mm; }
  .alt { font-size: 7pt; margin-top: 3mm; color: #444; }
</style></head><body>
${body}
</body></html>
`;
}

main().catch((e) => {
  console.error('HATA:', e instanceof Error ? e.message : e);
  process.exit(1);
});
