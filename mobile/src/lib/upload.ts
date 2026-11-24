// Fotoğrafı sıkıştırıp Supabase Storage'a yükler. Sahibi: Görev 1.
// Kullanan: api/photos.ts (Görev 6 kamera, Görev 5 detay karesi), api/me.ts (Görev 8 avatar).
import * as ImageManipulator from 'expo-image-manipulator';
import * as Crypto from 'expo-crypto';
import { decode } from 'base64-arraybuffer';
import { supabase, requireUserId } from './supabase';

export type UploadedImage = { path: string; width: number; height: number };

/**
 * Yerel bir resmi JPEG'e çevirip küçültür ve `<bucket>/<user_id>/<uuid>.jpg` yoluna yükler.
 * @param maxWidth  En fazla genişlik (px). Kamera/galeri fotoğrafı 1600, avatar 512.
 * @param square    true ise ortadan kare kırpar (avatar için).
 */
export async function uploadJpeg(
  bucket: 'tree-photos' | 'avatars',
  localUri: string,
  opts: { maxWidth?: number; square?: boolean; quality?: number } = {},
): Promise<UploadedImage> {
  const userId = await requireUserId();
  const maxWidth = opts.maxWidth ?? 1600;

  // 1) Boyutları öğren
  const probe = await ImageManipulator.manipulateAsync(localUri, [], {});
  const actions: ImageManipulator.Action[] = [];

  // 2) Kare kırpma (avatar)
  let w = probe.width;
  let h = probe.height;
  if (opts.square) {
    const side = Math.min(w, h);
    actions.push({ crop: { originX: Math.floor((w - side) / 2), originY: Math.floor((h - side) / 2), width: side, height: side } });
    w = h = side;
  }
  // 3) Küçültme
  if (w > maxWidth) actions.push({ resize: { width: maxWidth } });

  // 4) JPEG + base64
  const out = await ImageManipulator.manipulateAsync(localUri, actions, {
    compress: opts.quality ?? 0.7,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  if (!out.base64) throw new Error('GK_BAD_PHOTO_PATH');

  // 5) Yükle
  const path = `${userId}/${Crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(bucket).upload(path, decode(out.base64), {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;

  return { path, width: out.width, height: out.height };
}

/** Yüklenmiş dosyayı siler (hata olursa sessizce geçer). */
export async function removeStorageFile(bucket: 'tree-photos' | 'avatars', path: string | null | undefined) {
  if (!path) return;
  await supabase.storage.from(bucket).remove([path]).catch(() => undefined);
}
