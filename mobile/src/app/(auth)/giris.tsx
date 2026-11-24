import { useRef, useState } from 'react';
import type { TextInputInstance } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { signIn } from '@/api/auth';
import { PaperButtonRow, PaperInput, PaperRow, PaperTitleRow, PillButton } from '@/components';
import { AuthPage, PaperError } from '@/features/auth/AuthPage';
import { toMessage } from '@/lib/errors';

export default function Giris() {
  const router = useRouter();
  const passwordRef = useRef<TextInputInstance>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;
    if (!email.trim() || !password) {
      setError('E-posta ve şifreni yaz.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Yönlendirmeyi kök layout yapar (oturum açılınca); burada router çağrılmaz.
    } catch (e) {
      setError(toMessage(e));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPage
      title="Giriş Yap"
      links={[
        { label: 'Hesabın yok mu? Kayıt ol', onPress: () => router.push('/(auth)/kayit') },
        { label: 'Şifremi unuttum', onPress: () => router.push('/(auth)/sifre-sifirla') },
      ]}
    >
      <PaperTitleRow text="HOŞ GELDİN" />
      <PaperRow label="E-posta">
        <PaperInput
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
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          editable={!loading}
          onSubmitEditing={submit}
          accessibilityLabel="Şifre"
        />
      </PaperRow>
      <PaperError text={error} />
      <PaperButtonRow>
        <PillButton size="md" label="GİRİŞ" loading={loading} onPress={submit} />
      </PaperButtonRow>
    </AuthPage>
  );
}
