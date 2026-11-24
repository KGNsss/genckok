// =====================================================================
// GençKök tema — tasarım HTML'inden (mobil_uygulama_ui_taslak_tuvali.html) birebir çıkarıldı.
// Renk, font, ölçü, gölge ve süre SADECE bu dosyadan alınır. Ekran kodunda hex/px sabiti yazılmaz.
// Tasarımda pt ile verilen font boyutları px'e çevrildi (1pt = 1.333px). RN'de px ≈ dp.
// =====================================================================
import { Platform, ViewStyle } from 'react-native';

// ---------- Renkler ----------
export const colors = {
  // zeminler
  bg: '#E0FFD9',               // tüm ekranların zemini (açık nane yeşili)
  cameraBg: '#071408',         // kamera / QR ekranı zemini
  paper: '#B4F4A3',            // çizgili kağıt modalı
  cardBlue: '#D8E8F2',         // fotoğraf olmayan kart / kare (pastel toz mavi)

  // yazı
  ink: '#010101',              // ana yazı
  inkMuted: '#585858',         // değer yazıları (inputlar, profil değerleri)
  inkSoft: 'rgba(1,1,1,0.80)', // kağıttaki ikincil değerler
  onCamera: '#E0FFD9',         // kamera ekranındaki yazılar
  white: '#FFFFFF',

  // yeşiller
  forest: '#005003',           // koyu orman yeşili: ikonlar, çizgiler, dolgular (çoğu zaman saydam)
  vine: '#25C300',             // sarmaşık yeşili: artı/eksi, profil ikonu, vurgu çizgileri

  // ahşap
  wood: '#C28E5D',             // tabelalar, odun dilimi
  woodLight: '#D7A778',
  woodDark: '#8E5D32',
  woodDeep: '#7A4920',
  woodGrain: '#8C582B',
  trunk: '#6E411C',            // fidan gövdesi

  // diğer
  logoNavy: '#0B288A',         // AR-GE logosu
  heart: '#E11D48',            // favori kalp (dolu)
  danger: '#E11D48',           // hata yazıları (tasarımdaki tek kırmızı ile aynı)
} as const;

/** Saydam tonlar. Tasarımda "#005003/20" gibi yazılanlar. */
export const alpha = {
  forest10: 'rgba(0,80,3,0.10)',   // kapsül etiket zemini, post-it ok zemini
  forest15: 'rgba(0,80,3,0.15)',   // küçük yuvarlak butonlar, profil butonu
  forest20: 'rgba(0,80,3,0.20)',   // üst bar zemini, artı/eksi daireleri, ana butonlar
  forest25: 'rgba(0,80,3,0.25)',   // basılı (hover) hali
  forest30: 'rgba(0,80,3,0.30)',   // basılı (hover) hali (20'nin)
  forest35: 'rgba(0,80,3,0.35)',
  forest40: 'rgba(0,80,3,0.40)',
  forest45: 'rgba(0,80,3,0.45)',   // kağıt çerçevesi, kağıt çizgileri, buton çerçevesi
  paperLine: 'rgba(0,80,3,0.28)',  // kağıt satır çizgisi
  headerBorder: 'rgba(0,80,3,0.15)',
  vine25: 'rgba(37,195,0,0.25)',
  vine35: 'rgba(37,195,0,0.35)',   // kart çerçevesi
  vine50: 'rgba(37,195,0,0.50)',
  vine75: 'rgba(37,195,0,0.75)',   // üst bar profil butonu çerçevesi
  vine80: 'rgba(37,195,0,0.80)',   // büyük profil fotoğrafı çerçevesi
  black30: 'rgba(0,0,0,0.30)',
  black42: 'rgba(0,0,0,0.42)',     // QR karesi dışındaki karartma
  black45: 'rgba(0,0,0,0.45)',
  black50: 'rgba(0,0,0,0.50)',
  black55: 'rgba(0,0,0,0.55)',
  white15: 'rgba(255,255,255,0.15)',
  white20: 'rgba(255,255,255,0.20)',
  white40: 'rgba(255,255,255,0.40)',
  backdrop: 'rgba(1,1,1,0.25)',    // modal arkası (bulanıklığın üstüne)
  backdropStrong: 'rgba(1,1,1,0.35)', // tam ekran fotoğraf arkası
  paperHole: 'rgba(224,255,217,0.65)',
} as const;

// ---------- Fontlar ----------
// Agrave Pro: Google Fonts'ta SADECE 400 kalınlığı var. Tasarımdaki 600/700 tarayıcıda sahte kalınlıkla
// gösteriliyordu. RN'de tek dosya yüklenir; fontWeight VERİLMEZ (Android'de font bozulur).
// Inter: @expo-google-fonts/inter
export const fonts = {
  display: 'AgravePro',            // assets/fonts/AgravePro-Regular.ttf  (useFonts anahtarı)
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  bodyHeavy: 'Inter_800ExtraBold',
} as const;

type T = { fontFamily: string; fontSize: number; lineHeight: number; letterSpacing?: number; color?: string };
const d = (size: number, lh = 1.0): T => ({ fontFamily: fonts.display, fontSize: size, lineHeight: Math.round(size * lh) });

/** Yazı stilleri. Ad = tasarımda kullanıldığı yer. */
export const type = {
  // Agrave Pro (el yazısı başlıklar)
  pageTitle:      d(32, 1.15),   // 24pt  post-it ok etiketi: "Fidanlarım", "Tüm Fidanlar", "Sıralama", "Galeri", "Profilim"
  paperTitle:     d(21.3, 1.1),  // 16pt   "FİDAN EKLE"
  bannerTitle:    d(21.3, 1.1),  // 16pt   "GÜNÜN SÖZÜ"
  paperLabel:     d(19.3, 1.1),  // 14.5pt kağıt satır etiketleri: "İsim:", "Dikim Tarihi:", "EKLE"
  profileLabel:   d(18.7, 1.1),  // 14pt   Profilim kapsül etiketleri: "İsim Soyisim:"
  capsule:        d(17.3, 1.1),  // 13pt   kapsül başlıklar: "Benim Fidanlarım", kart adı (büyük), "1 Fidan", "1.000 TL"
  publicLabel:    d(16, 1.1),    // 12pt   kullanıcı profil kağıdı etiketleri
  chip:           d(14.7, 1.1),  // 11pt   Profilim fidan çipleri
  chipSmall:      d(13.3, 1.1),  // 10pt   kullanıcı profil kağıdı fidan çipleri
  cardNameSmall:  d(12, 1.1),    // 9pt    küçük kart altı isim

  // Inter (gövde)
  headerLogo:     { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 20, letterSpacing: -0.3 },
  value:          { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 18 },   // kağıt değerleri (#585858)
  valueBold:      { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 18 },   // Profilim değerleri (#585858)
  publicValue:    { fontFamily: fonts.bodyBold, fontSize: 13.5, lineHeight: 16 },
  banner:         { fontFamily: fonts.bodySemi, fontSize: 13.5, lineHeight: 18.5 }, // Sayfa 3 bant metni (leading-snug)
  guide:          { fontFamily: fonts.bodyMedium, fontSize: 12.5, lineHeight: 16, letterSpacing: -0.2 },
  status:         { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 15, letterSpacing: 0.3 },
  buttonSmall:    { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 14 },
  tiny:           { fontFamily: fonts.bodySemi, fontSize: 11, lineHeight: 13 },
  badge:          { fontFamily: fonts.bodyBold, fontSize: 10, lineHeight: 12 },
  body:           { fontFamily: fonts.body, fontSize: 15, lineHeight: 21 },       // tasarımda olmayan açıklama metinleri (auth vb.)
} as const satisfies Record<string, T>;

// ---------- Ölçüler ----------
export const space = { 0.5: 2, 1: 4, 1.5: 6, 2: 8, 2.5: 10, 3: 12, 3.5: 14, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 9: 36, 10: 40 } as const; // Tailwind birimi × 4

export const radius = {
  sm: 8,       // rounded-lg: "Fotoğraf Seç" butonu
  card: 12,    // rounded-xl: küçük fidan kartı, galeri kareleri
  cardLg: 16,  // rounded-2xl: büyük fidan kartı, kağıt, galeri modal fotoğrafı, kamera galeri butonu
  xl: 24,      // rounded-3xl: QR karesi, tam ekran fotoğraf kutusu
  pill: 999,   // kapsül etiketler, yuvarlak butonlar
} as const;

export const size = {
  headerHeight: 52,          // h-9 (36) + py-2 (2×8)
  headerIcon: 36,            // AR-GE logosu ve profil butonu
  tabButton: 54,             // alt sekme odun dilimi
  tabBarPadTop: 4,
  tabBarPadBottom: 16,       // + cihazın alt güvenli alanı
  tabBarPadX: 8,
  screenPadX: 16,            // px-4
  postItTop: 14,             // top-3.5
  plusLg: 50,                // Sayfa 1 ve 3 artı/eksi daireleri
  plusSm: 40,                // Sayfa 2 küçük artı
  iconButton: 40,            // kapat, flaş, düzenle
  cardSmW: 78, cardSmH: 116, // Sayfa 2 küçük kart
  cardLgW: 176, cardLgH: 264,// Sayfa 1 büyük kart (w-44 × 264)
  favSquare: 78,             // Galeri favori karesi
  paperW: 328, paperH: 520, paperHGallery: 456,
  paperRow: 48,              // kağıt satır yüksekliği = çizgi aralığı
  paperHeader: 56,           // kağıt üst başlık bandı
  paperMarginLeft: 48,       // pl-12: satır içerikleri buradan başlar
  paperMarginLine: 40,       // left-10: dikey kırmızı/yeşil defter çizgisi
  avatarLg: 144,             // Profilim büyük foto (w-36)
  avatarMd: 80,              // kullanıcı profil kağıdı
  avatarXs: 28,              // kağıt satırındaki küçük profil butonu
  shutter: 76, cameraSide: 52,
  qrFrame: 236, qrFrameSuccess: 152,
  woodBannerH: 44,           // Sayfa 1 "GÜNÜN SÖZÜ" tabelası
} as const;

/** Sayfa içeriğinin üstten başlangıcı (post-it başlığın altı) — tasarımdaki pt-[…] değerleri */
export const pageTop = {
  fidanlarim: 0,      // Sayfa 1: içerik dikeyde ortalı
  tumFidanlar: 118,   // Sayfa 2
  siralama: 84,       // Sayfa 3
  galeri: 118,        // Sayfa 6
  profilim: 92,       // Sayfa 7
  capsuleUnderTitle: 78, // başlığın altındaki ilk kapsülün top değeri (Sayfa 2, 6)
} as const;

// ---------- Gölgeler ----------
// CSS box-shadow → RN: iOS shadow*, Android elevation (Android'de renk/yayılma yaklaşık olur).
const sh = (y: number, blur: number, color: string, opacity: number, elevation: number): ViewStyle =>
  Platform.select({
    ios: { shadowColor: color, shadowOffset: { width: 0, height: y }, shadowOpacity: opacity, shadowRadius: blur / 2 },
    android: { elevation, shadowColor: color },
    default: {},
  }) as ViewStyle;

export const shadow = {
  capsule:  sh(4, 10, '#005003', 0.12, 2),   // kapsül etiketler
  chip:     sh(3, 8, '#005003', 0.12, 1),
  card:     sh(6, 16, '#0F172A', 0.16, 4),   // küçük kart, galeri kareleri
  cardLg:   sh(8, 24, '#0F172A', 0.16, 6),   // büyük kart
  postIt:   sh(4, 10, '#005003', 0.18, 3),   // başlık oku
  button:   sh(6, 14, '#005003', 0.18, 4),   // "EKLE" butonu
  tabActive:sh(6, 12, '#005003', 0.35, 6),   // seçili sekme
  tab:      sh(1, 2, '#000000', 0.05, 1),    // seçili olmayan sekme
  paper:    sh(24, 54, '#002302', 0.55, 16), // çizgili kağıt
  avatar:   sh(12, 28, '#005003', 0.28, 8),
  camera:   sh(6, 18, '#000000', 0.45, 6),
} as const;

// ---------- Hareket ----------
export const motion = {
  tab: 150,            // sekme ölçeği, buton basma
  pageEnter: 200,      // sayfa girişi: opaklık 0→1, translateY 4→0, ease-out
  modal: 300,          // kağıt açılış: ölçek 0.90→1, translateY 12→0, opaklık; arka plan bulanıklaşır
  fullscreen: 250,
  carousel: 380,       // deste kayması, easing: bezier(0.22, 1, 0.36, 1)
  qrSuccess: 350,      // QR tik animasyonu, bezier(0.22, 1, 0.36, 1)
  qrRedirect: 950,     // tik'ten sonra yönlendirme gecikmesi
  qrBeam: 2200,        // tarama ışığı bir tam gidiş-dönüş
  photoFly: 480,       // çekilen fotoğrafın galeri butonuna uçuşu
  heartPop: 160,
} as const;
export const easing = { out: [0.22, 1, 0.36, 1] as const }; // Reanimated: Easing.bezier(0.22, 1, 0.36, 1)

// ---------- Pressable basılı hali ----------
export const pressed = { scale: 0.95, scaleStrong: 0.9 } as const;
