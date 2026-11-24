// Giriş yapan kullanıcının profili (Profilim, üst bar avatarı). Sahibi: Görev 1.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, requireUserId } from '../lib/supabase';
import { uploadJpeg, removeStorageFile } from '../lib/upload';
import { qk } from './keys';
import type { Me, MeUpdate } from './types';

export async function getMe(): Promise<Me> {
  const id = await requireUserId();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Me;
}

/** Profilim alanlarını günceller. Boş metinler null'a çevrilir (full_name hariç; o zorunlu). */
export async function updateMe(fields: MeUpdate): Promise<void> {
  const id = await requireUserId();
  const patch: Record<string, unknown> = {};
  if (fields.full_name !== undefined) {
    const v = fields.full_name.trim();
    if (!v) throw new Error('GK_NAME_REQUIRED');
    patch.full_name = v.slice(0, 32);
  }
  if (fields.class_year !== undefined) patch.class_year = fields.class_year;
  if (fields.department !== undefined) patch.department = fields.department?.trim().slice(0, 34) || null;
  if (fields.school !== undefined) patch.school = fields.school?.trim().slice(0, 60) || null;
  const { error } = await supabase.from('profiles').update(patch).eq('id', id);
  if (error) throw error;
}

/** Profil fotoğrafı: 512x512 kare JPEG yükler, profile yazar, eskisini siler. */
export async function uploadAvatar(localUri: string): Promise<string> {
  const id = await requireUserId();
  const { data: old } = await supabase.from('profiles').select('avatar_path').eq('id', id).single();
  const up = await uploadJpeg('avatars', localUri, { maxWidth: 512, square: true, quality: 0.8 });
  const { error } = await supabase.from('profiles').update({ avatar_path: up.path }).eq('id', id);
  if (error) {
    await removeStorageFile('avatars', up.path);
    throw error;
  }
  await removeStorageFile('avatars', (old as { avatar_path: string | null } | null)?.avatar_path);
  return up.path;
}

// ---------- Hook'lar ----------
export const useMe = () => useQuery({ queryKey: qk.me, queryFn: getMe });

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateMe,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.me });
      qc.invalidateQueries({ queryKey: qk.profileAll });
      qc.invalidateQueries({ queryKey: qk.galleryAll }); // yükleyen adı değişir
      qc.invalidateQueries({ queryKey: qk.leaderboard });
    },
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: uploadAvatar,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.me });
      qc.invalidateQueries({ queryKey: qk.profileAll });
      qc.invalidateQueries({ queryKey: qk.galleryAll });
    },
  });
}
