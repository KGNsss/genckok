// Backend'in döndürdüğü veri tipleri — 00_VERI_YAPISI.md ile birebir aynı. Sahibi: Görev 1.
// Tarih alanları: `date` → "YYYY-MM-DD" metni, `timestamptz` → ISO metni.

export type TreeStatus = 'saglikli' | 'bakim_gerekli' | 'kurudu' | 'yenilendi';
/** 'pending' sadece admin içindir (Onay Bekleyenler). */
export type GallerySection = 'favorites' | 'mine' | 'others' | 'pending';
/** ogrenci = öğrenci · gonullu = öğrenci olmayan katılımcı · admin = yönetici (SQL ile atanır) */
export type Role = 'ogrenci' | 'gonullu' | 'admin';
/** beklemede = admin onayı bekliyor · onaylandi = herkese görünür · reddedildi = sadece yükleyen ve admin görür */
export type PhotoStatus = 'beklemede' | 'onaylandi' | 'reddedildi';

/** profiles satırı (giriş yapan kullanıcı) */
export type Me = {
  id: string;
  full_name: string;
  class_year: number | null;
  department: string | null;
  school: string | null;       // gönüllüde boş olabilir
  avatar_path: string | null;
  role: Role;
  total_points: number;
  created_at: string;
  updated_at: string;
};

/** Profilim'de düzenlenebilen alanlar */
export type MeUpdate = Partial<Pick<Me, 'full_name' | 'class_year' | 'department' | 'school'>>;

/** get_quote_of_day() */
export type Quote = { text: string; author: string | null };

/** get_my_saplings() — Sayfa 1 deste, Sayfa 2 üst sıra, Profilim çipleri */
export type MySapling = {
  id: string;
  label: string;              // gösterilecek ad (takma ad → künye kodu → "İSİMSİZ")
  nickname: string | null;
  qr_code: string | null;
  species: string | null;
  parcel_no: string | null;
  row_no: string | null;
  planted_at: string | null;  // "YYYY-MM-DD"
  status: TreeStatus;
  cover_path: string | null;  // tree-photos yolu
  photo_count: number;
};

/** list_forest_saplings() — Sayfa 2 "Ormandaki Fidanlar" */
export type ForestSapling = {
  id: string;
  label: string;
  cover_path: string | null;
  owner_name: string | null;
  is_mine: boolean;
};

/** get_sapling() — fidan detay kağıdı */
export type SaplingDetail = {
  id: string;
  label: string;
  nickname: string | null;
  qr_code: string | null;
  species: string | null;
  parcel_no: string | null;
  row_no: string | null;
  planted_at: string | null;
  status: TreeStatus;
  note: string | null;
  owner_id: string | null;
  owner_name: string | null;
  owner_avatar_path: string | null;
  cover_photo_id: string | null;
  cover_path: string | null;
  photo_count: number;
  is_mine: boolean;
  can_claim: boolean;          // sahipsiz ve kurumamış → "BU FİDANI BEN DİKTİM" gösterilir
};

/** FİDAN EKLE formu girdisi */
export type AddSaplingInput = {
  nickname: string;
  parcel_no: string;
  row_no: string;
  species?: string | null;
  planted_at?: string | null;  // "YYYY-MM-DD"
};
export type AddSaplingResult = { tree_id: string; points_awarded: number; created: boolean };

/** get_gallery() / get_photo() */
export type GalleryPhoto = {
  id: string;
  storage_path: string;
  taken_at: string;
  sort_key?: string;           // sadece get_gallery: sayfalama imleci
  user_id: string;
  uploader_name: string;
  uploader_avatar_path: string | null;
  is_mine: boolean;
  is_favorite: boolean;
  tree_id: string | null;
  tree_label: string | null;
  width: number | null;
  height: number | null;
  status: PhotoStatus;         // 'mine' bölümünde beklemede/reddedildi görünebilir; diğer bölümlerde hep 'onaylandi'
  review_note: string | null;  // red nedeni (reddedildiyse)
};

/** status: 'beklemede' ise "Fotoğrafın yönetici onayından sonra görünecek" denir. Admin yüklerse direkt 'onaylandi'. */
export type UploadPhotoResult = { photo_id: string; points_awarded: number; is_cover: boolean; status: PhotoStatus; storage_path: string };

/** review_photo() sonucu */
export type ReviewPhotoResult = { photo_id: string; status: PhotoStatus; points_awarded: number };

/** get_leaderboard() — Sayfa 3 Sıralama (ödülsüz puan yarışı; adminler listede yoktur) */
export type LeaderboardRow = {
  rank: number;                // aynı puan = aynı sıra
  user_id: string;
  full_name: string;
  avatar_path: string | null;
  role: Role;                  // 'gonullu' ise satırda "GÖNÜLLÜ" rozeti
  total_points: number;
  sapling_count: number;
  is_me: boolean;              // ilk 50'de değilsen satırın listenin sonuna eklenir
};

/** get_public_profile() — kullanıcı profil kağıdı */
export type PublicProfile = {
  id: string;
  full_name: string;
  role: Role;
  class_year: number | null;
  department: string | null;
  school: string | null;
  avatar_path: string | null;
  is_me: boolean;
  saplings: { id: string; label: string }[];
};
