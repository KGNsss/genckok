import { Stack } from 'expo-router';
import { colors } from '@/theme/theme';

/** Giriş / kayıt / şifre sıfırlama ekranlarının düzeni. Sahibi: Görev 2. */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: colors.bg } }} />;
}
