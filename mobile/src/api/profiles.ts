// Başka kullanıcının profil kağıdı (fotoğrafı çeken / fidan sahibi). Sahibi: Görev 1.
import { useQuery } from '@tanstack/react-query';
import { rpc } from './rpc';
import { qk } from './keys';
import type { PublicProfile } from './types';

export const getPublicProfile = (userId: string) => rpc<PublicProfile>('get_public_profile', { p_user_id: userId });

export const usePublicProfile = (userId: string | undefined) =>
  useQuery({ queryKey: qk.profile(userId ?? ''), queryFn: () => getPublicProfile(userId!), enabled: !!userId });
