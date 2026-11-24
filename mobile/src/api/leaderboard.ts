// Sıralama (Sayfa 3): puana göre ödülsüz yarış. Adminler listede yoktur. Sahibi: Görev 1.
import { useQuery } from '@tanstack/react-query';
import { rpc } from './rpc';
import { qk } from './keys';
import type { LeaderboardRow } from './types';

export const LEADERBOARD_LIMIT = 50;

/** İlk 50 kişi + (ilk 50'de değilsen ve puanın varsa) kendi satırın en sonda. Puanı 0 olanlar listelenmez. */
export const getLeaderboard = () => rpc<LeaderboardRow[]>('get_leaderboard', { p_limit: LEADERBOARD_LIMIT });

export const useLeaderboard = () =>
  useQuery({ queryKey: qk.leaderboard, queryFn: getLeaderboard, staleTime: 30 * 1000 });
