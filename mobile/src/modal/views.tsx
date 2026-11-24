// Kayıt defteri: kağıt adı → içerik bileşeni. Sahibi: Görev 0.
// Kağıt dosyalarını başka görevler yazar. Dosya henüz boşsa uygulama derlenmesin / çökmesin diye
// bileşenler TEMBEL `require` ile yüklenir; `default` yoksa "YAPIM AŞAMASINDA" gösterilir.
import type { ComponentType } from 'react';
import { PaperTitleRow } from '@/components';
import { size } from '@/theme/theme';
import type { ModalView, ModalViewProps } from './types';

type AnyViewProps = ModalViewProps<ModalView['name']>;

/* eslint-disable @typescript-eslint/no-require-imports */
const LOADERS: Record<ModalView['name'], () => ComponentType<AnyViewProps> | undefined> = {
  'fidan-ekle': () => require('@/features/fidan/FidanEkleKagidi')?.default,
  'gunun-sozu': () => require('@/features/fidan/GununSozuKagidi')?.default,
  'fidan-detay': () => require('@/features/fidan/FidanDetayKagidi')?.default,
  'foto-detay': () => require('@/features/galeri/FotoDetayKagidi')?.default,
  'kullanici-profili': () => require('@/features/galeri/KullaniciProfiliKagidi')?.default,
};
/* eslint-enable @typescript-eslint/no-require-imports */

/** Kağıt yüksekliği: fotoğraf kağıdı 456, diğerleri 520. */
export const VIEW_HEIGHT: Record<ModalView['name'], number> = {
  'fidan-ekle': size.paperH,
  'gunun-sozu': size.paperH,
  'fidan-detay': size.paperH,
  'foto-detay': size.paperHGallery,
  'kullanici-profili': size.paperH,
};

function UnderConstruction() {
  return <PaperTitleRow text="YAPIM AŞAMASINDA" />;
}

export function getViewComponent(name: ModalView['name']): ComponentType<AnyViewProps> {
  let comp: ComponentType<AnyViewProps> | undefined;
  try {
    comp = LOADERS[name]();
  } catch {
    comp = undefined; // dosya yarım yazılmışsa uygulama çökmesin
  }
  return comp ?? UnderConstruction;
}
