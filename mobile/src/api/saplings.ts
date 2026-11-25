// Fidanlar: Sayfa 1 (deste + FİDAN EKLE), Sayfa 2 (tüm fidanlar), fidan detay kağıdı, QR. Sahibi: Görev 1.
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rpc, rpcOne } from './rpc';
import { qk } from './keys';
import type {
  AddSaplingInput, AddSaplingResult, ForestSapling, MySapling, Quote, SaplingDetail,
} from './types';

export const FOREST_PAGE_SIZE = 30;

// ---------- Fonksiyonlar ----------
export const getMySaplings = () => rpc<MySapling[]>('get_my_saplings');

export async function getQuoteOfDay(): Promise<Quote | null> {
  const rows = await rpc<Quote[]>('get_quote_of_day');
  return rows[0] ?? null;
}

export const listForestSaplings = (page: number) =>
  rpc<ForestSapling[]>('list_forest_saplings', {
    p_limit: FOREST_PAGE_SIZE,
    p_offset: page * FOREST_PAGE_SIZE,
    p_exclude_mine: true,
  });

export const getSapling = (treeId: string) => rpcOne<SaplingDetail>('get_sapling', { p_tree_id: treeId });

/** QR içeriğinden fidanı bulur ("GK-0001" ya da künye linki). */
export const treeByQr = (code: string) => rpcOne<{ id: string; qr_code: string }>('tree_by_qr', { p_code: code });

export const addMySapling = (i: AddSaplingInput) =>
  rpcOne<AddSaplingResult>('add_my_sapling', {
    p_nickname: i.nickname,
    p_parcel_no: i.parcel_no,
    p_row_no: i.row_no,
    p_species: i.species ?? null,
    p_planted_at: i.planted_at ?? null,
  });

export const claimTree = (treeId: string, nickname?: string | null) =>
  rpcOne<{ tree_id: string; points_awarded: number }>('claim_tree', { p_tree_id: treeId, p_nickname: nickname ?? null });

export const updateMySapling = (treeId: string, f: { nickname: string; species?: string | null; planted_at?: string | null }) =>
  rpc<null>('update_my_sapling', {
    p_tree_id: treeId,
    p_nickname: f.nickname,
    p_species: f.species ?? null,
    p_planted_at: f.planted_at ?? null,
  });

export const deleteMySapling = (treeId: string) =>
  rpc<null>('delete_my_sapling', {
    p_tree_id: treeId,
  });

// ---------- Hook'lar ----------
export const useMySaplings = () => useQuery({ queryKey: qk.mySaplings, queryFn: getMySaplings });

export const useQuoteOfDay = () =>
  useQuery({ queryKey: qk.quote, queryFn: getQuoteOfDay, staleTime: 60 * 60 * 1000 });

export const useForestSaplings = () =>
  useInfiniteQuery({
    queryKey: qk.forest,
    queryFn: ({ pageParam }) => listForestSaplings(pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.length === FOREST_PAGE_SIZE ? all.length : undefined),
  });

export const useSapling = (treeId: string | undefined) =>
  useQuery({ queryKey: qk.sapling(treeId ?? ''), queryFn: () => getSapling(treeId!), enabled: !!treeId });

/** Fidan eklendi / sahiplenildi / düzenlendi → bunlar yenilenir. */
function useInvalidateSaplings() {
  const qc = useQueryClient();
  return (treeId?: string) => {
    qc.invalidateQueries({ queryKey: qk.mySaplings });
    qc.invalidateQueries({ queryKey: qk.forest });
    qc.invalidateQueries({ queryKey: qk.me });          // puan
    qc.invalidateQueries({ queryKey: qk.leaderboard }); // sıralama
    qc.invalidateQueries({ queryKey: qk.profileAll });  // profil kağıdındaki fidan çipleri
    if (treeId) qc.invalidateQueries({ queryKey: qk.sapling(treeId) });
  };
}

export function useAddMySapling() {
  const inv = useInvalidateSaplings();
  return useMutation({ mutationFn: addMySapling, onSuccess: (r) => inv(r.tree_id) });
}

export function useClaimTree() {
  const inv = useInvalidateSaplings();
  return useMutation({
    mutationFn: (v: { treeId: string; nickname?: string | null }) => claimTree(v.treeId, v.nickname),
    onSuccess: (_r, v) => inv(v.treeId),
  });
}

export function useUpdateMySapling() {
  const inv = useInvalidateSaplings();
  return useMutation({
    mutationFn: (v: { treeId: string; nickname: string; species?: string | null; planted_at?: string | null }) =>
      updateMySapling(v.treeId, v),
    onSuccess: (_r, v) => inv(v.treeId),
  });
}

export function useDeleteMySapling() {
  const inv = useInvalidateSaplings();
  return useMutation({
    mutationFn: (v: { treeId: string }) => deleteMySapling(v.treeId),
    onSuccess: (_r, v) => inv(v.treeId),
  });
}