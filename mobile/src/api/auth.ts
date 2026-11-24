// Kimlik işlemleri. Sahibi: Görev 1 (yazıldı), kullanan: Görev 2 (giriş/kayıt ekranları), Görev 8 (çıkış).
import { supabase } from '../lib/supabase';
import type { Role } from './types';

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) throw error;
}

export type SignUpInput = {
  /** Kayıtta seçilebilen roller. Admin kayıtla olunmaz (sunucu 'admin' isteğini yok sayar). Varsayılan: ogrenci */
  role?: Exclude<Role, 'admin'>;
  fullName: string;
  email: string;
  password: string;
  classYear?: number | null;
  department?: string | null;
  school?: string | null;
};

/** Kayıt. Profil satırını veritabanındaki trigger açar (handle_new_user); burada insert YAPILMAZ. */
export async function signUp(input: SignUpInput) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      data: {
        role: input.role ?? 'ogrenci',
        full_name: input.fullName.trim(),
        class_year: input.classYear ? String(input.classYear) : '',
        department: input.department?.trim() ?? '',
        school: input.school?.trim() ?? '',
      },
    },
  });
  if (error) throw error;
  /** true ise e-posta onayı bekleniyor (Supabase'de onay açıksa) */
  return { needsEmailConfirm: !data.session };
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: 'genckok://sifre-yenile',
  });
  if (error) throw error;
}

/** Şifre sıfırlama linkinden gelen kodu oturuma çevirir. */
export async function exchangeResetCode(code: string) {
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
