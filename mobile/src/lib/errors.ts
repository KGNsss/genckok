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

/** Supabase Auth hata kodları (AuthError.code). Metinler sürümden sürüme değişebildiği için önce koda bakılır. */
const AUTH_CODES: Record<string, string> = {
  invalid_credentials: 'E-posta ya da şifre hatalı.',
  user_already_exists: 'Bu e-postayla zaten bir hesap var. Giriş yap.',
  email_exists: 'Bu e-postayla zaten bir hesap var. Giriş yap.',
  weak_password: 'Şifre en az 8 karakter olmalı.',
  email_address_invalid: 'Geçerli bir e-posta yaz.',
  email_not_confirmed: 'E-postanı onaylaman gerekiyor.',
  over_email_send_rate_limit: 'Çok fazla e-posta gönderildi, biraz sonra tekrar dene.',
  over_request_rate_limit: 'Çok fazla deneme yaptın, biraz bekle.',
  same_password: 'Yeni şifre eskisiyle aynı olamaz.',
  signup_disabled: 'Şu an yeni kayıt alınmıyor.',
  session_not_found: 'Oturumun kapanmış, tekrar giriş yap.',
  session_expired: 'Oturumun kapanmış, tekrar giriş yap.',
  refresh_token_not_found: 'Oturumun kapanmış, tekrar giriş yap.',
  bad_jwt: 'Oturumun kapanmış, tekrar giriş yap.',
  otp_expired: 'Bağlantının süresi dolmuş, yenisini iste.',
  flow_state_expired: 'Bağlantının süresi dolmuş, yenisini iste.',
};

const AUTH_MESSAGES: [RegExp, string][] = [
  [/invalid login credentials/i, 'E-posta ya da şifre hatalı.'],
  [/already (been )?registered|already exists/i, 'Bu e-postayla zaten bir hesap var. Giriş yap.'],
  [/password should|weak password/i, 'Şifre en az 8 karakter olmalı.'],
  [/unable to validate email|invalid email|email address .* is invalid/i, 'Geçerli bir e-posta yaz.'],
  [/email not confirmed/i, 'E-postanı onaylaman gerekiyor.'],
  [/rate limit|too many requests/i, 'Çok fazla deneme yaptın, biraz bekle.'],
  [/jwt expired|invalid jwt|refresh token/i, 'Oturumun kapanmış, tekrar giriş yap.'],
  [/permission denied/i, 'Bu bilgiye erişim izni yok. Yöneticiye haber ver.'],
  [/network request failed|failed to fetch|network/i, 'İnternet bağlantını kontrol et.'],
];

const FALLBACK = 'Bir şeyler ters gitti, tekrar dene.';

/** Herhangi bir hatayı kullanıcıya gösterilecek kısa Türkçe metne çevirir. */
export function toMessage(err: unknown): string {
  const raw =
    typeof err === 'string' ? err :
    err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : '';
  const gk = raw.match(/GK_[A-Z_]+/)?.[0];
  if (gk && ERROR_MESSAGES[gk]) return ERROR_MESSAGES[gk];
  const authCode = err && typeof err === 'object' && 'code' in err ? String((err as { code: unknown }).code) : '';
  if (authCode && AUTH_CODES[authCode]) return AUTH_CODES[authCode];
  for (const [re, msg] of AUTH_MESSAGES) if (re.test(raw)) return msg;
  if (__DEV__ && raw) {
    console.warn('[GençKök] çevrilmemiş hata:', authCode, raw);
    // Geliştirmede asıl hata da görünsün ki ekip bildirebilsin (yayın sürümünde görünmez)
    return `${FALLBACK} (${authCode ? authCode + ': ' : ''}${raw.slice(0, 80)})`;
  }
  return FALLBACK;
}

/** Hata belirli bir GK koduysa true. Örn: isCode(err, 'GK_TREE_NOT_FOUND') */
export function isCode(err: unknown, code: string): boolean {
  const raw = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : String(err ?? '');
  return raw.includes(code);
}
