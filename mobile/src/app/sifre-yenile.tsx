// E-postadaki şifre sıfırlama bağlantısı uygulamayı buraya açar: genckok://sifre-yenile?code=...
import { useEffect, useRef, useState } from 'react';
import type { TextInputInstance } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { exchangeResetCode, updatePassword } from '@/api/auth';
import { PaperButtonRow, PaperInput, PaperRow, PaperTitleRow, PillButton, PulseBox, useToast } from '@/components';
import { AuthPage, PaperError, PaperNote } from '@/features/auth/AuthPage';
import { useSession } from '@/lib/auth';
import { toMessage } from '@/lib/errors';

type Phase = 'checking' | 'expired' | 'form';

export default function SifreYenile() {
  const router = useRouter();
  const toast = useToast();
  const { session, loading: sessionLoading } = useSession();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const password2Ref = useRef<TextInputInstance>(null);
  const exchanged = useRef(false);

  const [phase, setPhase] = useState<Phase>(code ? 'checking' : 'form');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Bağlantıdaki tek kullanımlık kodu oturuma çevir (bir kez)
  useEffect(() => {
    if (!code || exchanged.current) return;
    exchanged.current = true;
    exchangeResetCode(String(code))
      .then(() => setPhase('form'))
      .catch(() => setPhase('expired'));
  }, [code]);

  // Kodsuz açıldıysa ve oturum da yoksa şifre değiştirilemez
  const noAccess = !code && !sessionLoading && !session;
  const current: Phase = noAccess ? 'expired' : phase;

  const submit = async () => {
    if (loading) return;
    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalı.');
      return;
    }
    if (password !== password2) {
      setError('Şifreler aynı değil.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await updatePassword(password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.show('Şifren güncellendi');
      router.replace('/(app)');
    } catch (e) {
      setError(toMessage(e));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  if (current === 'checking') {
    return (
      <AuthPage title="Yeni Şifre">
        <PaperTitleRow text="KONTROL EDİLİYOR" />
        <PaperNote text="Bağlantı doğrulanıyor…" />
        <PulseBoxRow />
      </AuthPage>
    );
  }

  if (current === 'expired') {
    return (
      <AuthPage title="Yeni Şifre" links={[{ label: 'Girişe dön', onPress: () => router.replace('/(auth)/giris') }]}>
        <PaperTitleRow text="SÜRESİ DOLMUŞ" />
        <PaperNote text="Bu bağlantı artık geçersiz." />
        <PaperNote text="Yeni bir bağlantı iste." />
        <PaperButtonRow>
          <PillButton size="md" label="YENİDEN GÖNDER" onPress={() => router.replace('/(auth)/sifre-sifirla')} />
        </PaperButtonRow>
      </AuthPage>
    );
  }

  return (
    <AuthPage title="Yeni Şifre">
      <PaperTitleRow text="YENİ ŞİFRE" />
      <PaperRow label="Yeni Şifre">
        <PaperInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          editable={!loading}
          onSubmitEditing={() => password2Ref.current?.focus()}
          accessibilityLabel="Yeni Şifre"
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
          returnKeyType="go"
          editable={!loading}
          onSubmitEditing={submit}
          accessibilityLabel="Şifre Tekrar"
        />
      </PaperRow>
      <PaperError text={error} />
      <PaperButtonRow>
        <PillButton size="md" label="KAYDET" loading={loading} onPress={submit} />
      </PaperButtonRow>
    </AuthPage>
  );
}

/** Yükleniyor iskeleti: kağıt satır düzenine oturur. */
function PulseBoxRow() {
  return <PaperButtonRow><PulseBox width={160} height={36} radius={999} /></PaperButtonRow>;
}
