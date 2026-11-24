import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { sendPasswordReset } from '@/api/auth';
import { PaperButtonRow, PaperInput, PaperRow, PaperTitleRow, PillButton } from '@/components';
import { AuthPage, PaperError, PaperNote } from '@/features/auth/AuthPage';
import { toMessage } from '@/lib/errors';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SifreSifirla() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (loading) return;
    if (!EMAIL_RE.test(email.trim())) {
      setError('Geçerli bir e-posta yaz.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await sendPasswordReset(email);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSent(true);
    } catch (e) {
      setError(toMessage(e));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const back = () => router.replace('/(auth)/giris');

  if (sent) {
    return (
      <AuthPage title="Şifremi Unuttum" links={[{ label: 'Girişe dön', onPress: back }]}>
        <PaperTitleRow text="BAĞLANTI GÖNDERİLDİ" />
        <PaperNote text="E-postandaki bağlantıyı" />
        <PaperNote text="bu telefonda aç." />
        <PaperButtonRow>
          <PillButton size="md" label="GİRİŞE DÖN" onPress={back} />
        </PaperButtonRow>
      </AuthPage>
    );
  }

  return (
    <AuthPage title="Şifremi Unuttum" links={[{ label: 'Girişe dön', onPress: back }]}>
      <PaperTitleRow text="ŞİFRE SIFIRLA" />
      <PaperRow label="E-posta">
        <PaperInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="go"
          editable={!loading}
          onSubmitEditing={submit}
          accessibilityLabel="E-posta"
        />
      </PaperRow>
      <PaperError text={error} />
      <PaperButtonRow>
        <PillButton size="md" label="GÖNDER" loading={loading} onPress={submit} />
      </PaperButtonRow>
    </AuthPage>
  );
}
