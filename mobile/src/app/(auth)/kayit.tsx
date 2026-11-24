import { useRef, useState } from 'react';
import type { TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { signUp } from '@/api/auth';
import { Capsule, PaperButtonRow, PaperInput, PaperRow, PaperTitleRow, PillButton } from '@/components';
import { AuthPage, PaperError, PaperNote } from '@/features/auth/AuthPage';
import { toMessage } from '@/lib/errors';
import { alpha } from '@/theme/theme';

type Role = 'ogrenci' | 'gonullu';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_SCHOOL = 'Ankara Yıldırım Beyazıt Üniversitesi';

export default function Kayit() {
  const router = useRouter();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const password2Ref = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);
  const departmentRef = useRef<TextInput>(null);
  const schoolRef = useRef<TextInput>(null);

  const [role, setRole] = useState<Role>('ogrenci');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [year, setYear] = useState('');
  const [department, setDepartment] = useState('');
  const [school, setSchool] = useState(DEFAULT_SCHOOL);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  const student = role === 'ogrenci';

  const pickRole = (r: Role) => {
    if (r === role || loading) return;
    Haptics.selectionAsync();
    setRole(r);
  };

  /** İlk geçersiz alanın mesajı; hepsi geçerliyse null. */
  const validate = (): string | null => {
    const name = fullName.trim();
    if (name.length < 2 || name.length > 32) return 'İsim Soyisim en az 2 karakter olmalı.';
    if (!EMAIL_RE.test(email.trim())) return 'Geçerli bir e-posta yaz.';
    if (password.length < 8) return 'Şifre en az 8 karakter olmalı.';
    if (password !== password2) return 'Şifreler aynı değil.';
    if (student && year.trim()) {
      const y = Number(year);
      if (!/^\d{4}$/.test(year.trim()) || y < 1990 || y > new Date().getFullYear() + 1) return 'Giriş yılını kontrol et.';
    }
    return null;
  };

  const submit = async () => {
    if (loading) return;
    const problem = validate();
    if (problem) {
      setError(problem);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const r = await signUp({
        role,
        fullName,
        email,
        password,
        classYear: student && year.trim() ? Number(year) : null,
        department: student ? department : null,
        school: student ? school : null,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Oturum açıldıysa yönlendirmeyi kök layout yapar. E-posta onayı açıksa bilgi kağıdı gösterilir.
      if (r.needsEmailConfirm) setNeedsConfirm(true);
    } catch (e) {
      setError(toMessage(e));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  if (needsConfirm) {
    return (
      <AuthPage title="Kayıt Ol" links={[{ label: 'Girişe dön', onPress: () => router.replace('/(auth)/giris') }]}>
        <PaperTitleRow text="E-POSTANI KONTROL ET" />
        <PaperNote text="Onay bağlantısını gönderdik." />
        <PaperNote text="Onayladıktan sonra giriş yap." />
        <PaperButtonRow>
          <PillButton size="md" label="GİRİŞE DÖN" onPress={() => router.replace('/(auth)/giris')} />
        </PaperButtonRow>
      </AuthPage>
    );
  }

  const chipStyle = (selected: boolean) => (selected ? { backgroundColor: alpha.forest25 } : undefined);

  return (
    <AuthPage title="Kayıt Ol" links={[{ label: 'Zaten hesabın var mı? Giriş yap', onPress: () => router.replace('/(auth)/giris') }]}>
      <PaperTitleRow text="ORMANA KATIL" />
      <PaperRow label="Ben">
        <Capsule variant="chip" text="ÖĞRENCİ" onPress={() => pickRole('ogrenci')} style={chipStyle(student)} accessibilityLabel="Öğrenciyim" />
        <Capsule variant="chip" text="GÖNÜLLÜ" onPress={() => pickRole('gonullu')} style={chipStyle(!student)} accessibilityLabel="Gönüllüyüm" />
      </PaperRow>
      <PaperRow label="İsim Soyisim">
        <PaperInput
          value={fullName}
          onChangeText={setFullName}
          maxLength={32}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          editable={!loading}
          onSubmitEditing={() => emailRef.current?.focus()}
          accessibilityLabel="İsim Soyisim"
        />
      </PaperRow>
      <PaperRow label="E-posta">
        <PaperInput
          ref={emailRef}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          editable={!loading}
          onSubmitEditing={() => passwordRef.current?.focus()}
          accessibilityLabel="E-posta"
        />
      </PaperRow>
      <PaperRow label="Şifre">
        <PaperInput
          ref={passwordRef}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          editable={!loading}
          onSubmitEditing={() => password2Ref.current?.focus()}
          accessibilityLabel="Şifre"
        />
      </PaperRow>
      <PaperRow label="Şifre Tekrar">
        <PaperInput
          ref={password2Ref}
          value={password2}
          onChangeText={setPassword2}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType={student ? 'next' : 'go'}
          editable={!loading}
          onSubmitEditing={() => (student ? yearRef.current?.focus() : submit())}
          accessibilityLabel="Şifre Tekrar"
        />
      </PaperRow>
      {student && (
        <>
          <PaperRow label="Giriş Yılı">
            <PaperInput
              ref={yearRef}
              value={year}
              onChangeText={setYear}
              placeholder="2026"
              keyboardType="number-pad"
              maxLength={4}
              returnKeyType="next"
              editable={!loading}
              onSubmitEditing={() => departmentRef.current?.focus()}
              accessibilityLabel="Giriş Yılı"
            />
          </PaperRow>
          <PaperRow label="Bölüm">
            <PaperInput
              ref={departmentRef}
              value={department}
              onChangeText={setDepartment}
              placeholder="Bilgisayar Mühendisliği"
              maxLength={34}
              returnKeyType="next"
              editable={!loading}
              onSubmitEditing={() => schoolRef.current?.focus()}
              accessibilityLabel="Bölüm"
            />
          </PaperRow>
          <PaperRow label="Okul">
            <PaperInput
              ref={schoolRef}
              value={school}
              onChangeText={setSchool}
              maxLength={60}
              returnKeyType="go"
              editable={!loading}
              onSubmitEditing={submit}
              accessibilityLabel="Okul"
            />
          </PaperRow>
        </>
      )}
      <PaperError text={error} />
      <PaperButtonRow>
        <PillButton size="md" label="KAYIT OL" loading={loading} onPress={submit} />
      </PaperButtonRow>
    </AuthPage>
  );
}
