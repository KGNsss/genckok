// Çizgili kağıt (modal) sistemi tipleri. Sahibi: Görev 0. Prop isimleri SABİTTİR.

export type ModalView =
  | { name: 'fidan-ekle' }
  | { name: 'gunun-sozu' }
  | { name: 'fidan-detay'; treeId: string }
  | { name: 'foto-detay'; photoId: string }
  | { name: 'kullanici-profili'; userId: string };

/** Her kağıt içeriği (src/features/**) bu prop'ları alır. */
export type ModalViewProps<N extends ModalView['name']> = {
  view: Extract<ModalView, { name: N }>;
  close: () => void;
  open: (v: ModalView) => void;
};

export type ModalApi = {
  /** Kağıt kapalıysa açar; açıksa sadece içeriği değiştirir (üst üste binmez). */
  open: (view: ModalView) => void;
  close: () => void;
  /** Kağıdın üstünde tam ekran fotoğraf. Kapatınca kağıt da kapanır. */
  openFullscreenPhoto: (storagePath: string) => void;
  current: ModalView | null;
};
