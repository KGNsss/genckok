// Supabase RPC çağrı yardımcıları. Sahibi: Görev 1.
import { supabase } from '../lib/supabase';

/** RPC çağırır; hata varsa fırlatır (mesaj 'GK_...' kodudur). */
export async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args ?? {});
  if (error) throw error;
  return data as T;
}

/** Tek satır döndüren (returns table) RPC'ler için ilk satırı verir. */
export async function rpcOne<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const rows = await rpc<T[] | T>(fn, args);
  const row = Array.isArray(rows) ? rows[0] : rows;
  if (row == null) throw new Error('GK_EMPTY');
  return row;
}
