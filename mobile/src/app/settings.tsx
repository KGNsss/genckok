// Uygulama ayarları ekranı.
// Bildirim tercihleri, dil, oturumu kapat gibi seçenekler burada yer alır.
// Kullanıcı profil sekmesindeki "Ayarlar" butonuna basınca açılır.

import { View, Text, StyleSheet } from "react-native";
import { colors, fonts } from "@/theme/theme";

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ayarlar</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontFamily: fonts.display, color: colors.ink },
});
