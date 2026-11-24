// Hata kodlarını kullanıcıya gösterilecek Türkçe metne çevirir. Sahibi: Görev 1.
// Backend fonksiyonları hata mesajı olarak 'GK_...' kodu fırlatır (bkz. 00_VERI_YAPISI.md "Hata kodları").

export const ERROR_MESSAGES: Record<string, string> = {
  GK_NOT_AUTHENTICATED: 'Oturumun kapanmış, tekrar giriş yap.',
  GK_QR_INVALID: 'Bu bir GençKök künyesi değil.',
  GK_TREE_NOT_FOUND: 'Bu fidan kayıtlı değil.',
  GK_TREE_TAKEN: 'Bu fidanın zaten bir sahibi var.',
  GK_ALREADY_YOURS: 'Bu fidan zaten senin.',
  GK_TREE_DEAD: 'Bu fidan kurumuş olarak işaretli.',
  GK_CLAIM_LIMIT: 'Bu yıl ekleyebileceğin fidan sınırına ulaştın.',
  GK_NICKNAME_REQUIRED: 'Fidanına bir isim ver.',
  GK_LOCATION_REQUIRED: 'Parsel ve sıra numarasını yaz.',
  GK_BAD_DATE: 'Dikim tarihi bugünden sonra olamaz.',
  GK_NOT_OWNER: 'Bu fidanı sadece sahibi düzenleyebilir.',
  GK_BAD_PHOTO_PATH: 'Fotoğraf yüklenemedi, tekrar dene.',
  GK_PHOTO_NOT_FOUND: 'Bu fotoğraf artık yok.',
  GK_BAD_SECTION: 'Bir şeyler ters gitti, tekrar dene.',
  GK_USER_NOT_FOUND: 'Bu kullanıcı bulunamadı.',
  GK_NOT_ADMIN: 'Bu işlem için yönetici olman gerekiyor.',
  GK_PHOTO_NOT_PENDING: 'Bu fotoğraf için zaten karar verilmiş.',
  GK_NAME_REQUIRED: 'İsim Soyisim boş olamaz.',
  GK_EMPTY: 'Bir şeyler ters gitti, tekrar dene.',
};

const AUTH_MESSAGES: [RegExp, string][] = [
  [/invalid login credentials/i, 'E-posta ya da şifre hatalı.'],
  [/user already registered/i, 'Bu e-postayla zaten bir hesap var.'],
  [/password should be|weak password/i, 'Şifre en az 8 karakter olmalı.'],
  [/unable to validate email|invalid email/i, 'Geçerli bir e-posta yaz.'],
  [/email not confirmed/i, 'E-postanı onaylaman gerekiyor.'],
  [/rate limit|too many requests/i, 'Çok fazla deneme yaptın, biraz bekle.'],
  [/network request failed|failed to fetch|network/i, 'İnternet bağlantını kontrol et.'],
];

const FALLBACK = 'Bir şeyler ters gitti, tekrar dene.';

/** Herhangi bir hatayı kullanıcıya gösterilecek kısa Türkçe metne çevirir. */
export function toMessage(err: unknown): string {
  const raw =
    typeof err === 'string' ? err :
    err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : '';
  const code = raw.match(/GK_[A-Z_]+/)?.[0];
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  for (const [re, msg] of AUTH_MESSAGES) if (re.test(raw)) return msg;
  if (__DEV__ && raw) console.warn('[GençKök] çevrilmemiş hata:', raw);
  return FALLBACK;
}

/** Hata belirli bir GK koduysa true. Örn: isCode(err, 'GK_TREE_NOT_FOUND') */
export function isCode(err: unknown, code: string): boolean {
  const raw = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : String(err ?? '');
  return raw.includes(code);
}
