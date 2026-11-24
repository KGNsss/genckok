// Fotoğraflar: Sayfa 5 kamera, Sayfa 6 galeri, fidan detay karesi. Sahibi: Görev 1.
import { InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { uploadJpeg, removeStorageFile } from '../lib/upload';
import { rpc, rpcOne } from './rpc';
import { qk } from './keys';
import type { GalleryPhoto, GallerySection, ReviewPhotoResult, UploadPhotoResult } from './types';

export const GALLERY_PAGE_SIZE = 40;

/**
 * Fotoğrafı sıkıştırıp yükler ve kaydeder.
 * - Kamera sekmesinden: { localUri }                       → fidana bağlı değil
 * - Fidan detay karesinden: { localUri, treeId, setCover: true } → sahibiyse ya da kapak yoksa kapak olur
 * Kayıt başarısız olursa yüklenen dosya silinir.
 * ONAY: fotoğraf `status: 'beklemede'` kaydedilir; admin onaylayana kadar sadece yükleyen ve adminler görür.
 * Puan yükleme anında DEĞİL, onay anında verilir (günde 1 fotoğraf, +5). Admin yüklerse direkt 'onaylandi' + puan.
 */
export async function uploadPhoto(input: {
  localUri: string;
  treeId?: string | null;
  setCover?: boolean;
  caption?: string | null;
}): Promise<UploadPhotoResult> {
  const up = await uploadJpeg('tree-photos', input.localUri, { maxWidth: 1600, quality: 0.7 });
  try {
    const r = await rpcOne<Omit<UploadPhotoResult, 'storage_path'>>('add_photo', {
      p_storage_path: up.path,
      p_tree_id: input.treeId ?? null,
      p_caption: input.caption ?? null,
      p_set_cover: !!input.setCover,
      p_width: up.width,
      p_height: up.height,
    });
    return { ...r, storage_path: up.path };
  } catch (e) {
    await removeStorageFile('tree-photos', up.path);
    throw e;
  }
}

export const getGalleryPage = (section: GallerySection, before?: string | null) =>
  rpc<GalleryPhoto[]>('get_gallery', { p_section: section, p_limit: GALLERY_PAGE_SIZE, p_before: before ?? null });

export const getPhoto = (photoId: string) => rpcOne<GalleryPhoto>('get_photo', { p_photo_id: photoId });

/** Kalp: sonuç true = artık favori. */
export const toggleFavorite = (photoId: string) => rpc<boolean>('toggle_favorite', { p_photo_id: photoId });

/** Yönetici kararı (sadece admin): approve=true onaylar (+5 puan, günde 1), false reddeder (note = red nedeni, isteğe bağlı). */
export const reviewPhoto = (photoId: string, approve: boolean, note?: string | null) =>
  rpcOne<ReviewPhotoResult>('review_photo', { p_photo_id: photoId, p_approve: approve, p_note: note ?? null });

/** Fotoğrafı siler. Kendi fotoğrafını herkes, herhangi bir fotoğrafı admin silebilir (RLS izin vermezse hata vermeden hiçbir şey olmaz). */
export async function deletePhoto(photo: { id: string; storage_path: string }) {
  const { error } = await supabase.from('photos').delete().eq('id', photo.id);
  if (error) throw error;
  await removeStorageFile('tree-photos', photo.storage_path);
}

// ---------- Hook'lar ----------
export const useGallery = (section: GallerySection) =>
  useInfiniteQuery({
    queryKey: qk.gallery(section),
    queryFn: ({ pageParam }) => getGalleryPage(section, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) =>
      last.length === GALLERY_PAGE_SIZE ? last[last.length - 1].sort_key ?? last[last.length - 1].taken_at : undefined,
  });

export const usePhoto = (photoId: string | undefined) =>
  useQuery({ queryKey: qk.photo(photoId ?? ''), queryFn: () => getPhoto(photoId!), enabled: !!photoId });

export function useUploadPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: uploadPhoto,
    onSuccess: (r, v) => {
      qc.invalidateQueries({ queryKey: qk.gallery('mine') });
      qc.invalidateQueries({ queryKey: qk.gallery('pending') }); // admin kuyruğu
      qc.invalidateQueries({ queryKey: qk.me }); // puan (sadece admin yüklemesinde anında)
      if (r.status === 'onaylandi') {
        qc.invalidateQueries({ queryKey: qk.gallery('others') });
        qc.invalidateQueries({ queryKey: qk.leaderboard });
      }
      if (v.treeId) {
        qc.invalidateQueries({ queryKey: qk.sapling(v.treeId) });
        qc.invalidateQueries({ queryKey: qk.mySaplings });
        qc.invalidateQueries({ queryKey: qk.forest });
      }
    },
  });
}

/** Kalp butonu — anında (iyimser) güncellenir, hata olursa geri alınır. */
export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => toggleFavorite(photoId),
    onMutate: async (photoId) => {
      await qc.cancelQueries({ queryKey: qk.photo(photoId) });
      const prev = qc.getQueryData<GalleryPhoto>(qk.photo(photoId));
      if (prev) qc.setQueryData<GalleryPhoto>(qk.photo(photoId), { ...prev, is_favorite: !prev.is_favorite });
      return { prev };
    },
    onError: (_e, photoId, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.photo(photoId), ctx.prev);
    },
    onSettled: (_r, _e, photoId) => {
      qc.invalidateQueries({ queryKey: qk.photo(photoId) });
      qc.invalidateQueries({ queryKey: qk.galleryAll });
    },
  });
}

/** Admin: onayla / reddet. Galeri, fotoğraf, fidan kapakları ve sıralama yenilenir. */
export function useReviewPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { photoId: string; approve: boolean; note?: string | null }) =>
      reviewPhoto(v.photoId, v.approve, v.note),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: qk.photo(v.photoId) });
      qc.invalidateQueries({ queryKey: qk.galleryAll });
      qc.invalidateQueries({ queryKey: qk.mySaplings });
      qc.invalidateQueries({ queryKey: qk.forest });
      qc.invalidateQueries({ queryKey: qk.saplingAll });
      qc.invalidateQueries({ queryKey: qk.leaderboard });
    },
  });
}

export function useDeletePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePhoto,
    onSuccess: (_r, v) => {
      qc.removeQueries({ queryKey: qk.photo(v.id) });
      qc.invalidateQueries({ queryKey: qk.galleryAll });
      qc.invalidateQueries({ queryKey: qk.mySaplings });
      qc.invalidateQueries({ queryKey: qk.forest });
      qc.invalidateQueries({ queryKey: qk.saplingAll });
    },
  });
}

/** Sonsuz listenin sayfalarını tek diziye çevirir. */
export const flatPages = <T,>(d: InfiniteData<T[]> | undefined): T[] => d?.pages.flat() ?? [];
