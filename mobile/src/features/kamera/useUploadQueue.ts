// Kamera fotoğrafları için sıralı yükleme kuyruğu. Sahibi: Görev 6.
// Kuyruk modül seviyesinde yaşar: kameradan çıkılsa da yüklemeler bitene kadar sürer.
// Aynı anda tek yükleme; hata olursa 3 sn sonra bir kez tekrar dener, yine olmazsa o fotoğraf atlanır.
import { useEffect, useSyncExternalStore } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { uploadPhoto } from '@/api/photos';
import { qk } from '@/api/keys';
import { useToast } from '@/components';
import { toMessage } from '@/lib/errors';

type Job = { localUri: string; treeId?: string | null };
type Snapshot = { pending: number; uploading: boolean };

const RETRY_DELAY_MS = 3000;

let queue: Job[] = [];
let uploading = false;
let snapshot: Snapshot = { pending: 0, uploading: false };
let shownPendingInfo = false; // "onaydan sonra görünecek" bilgisi oturumda bir kez
const listeners = new Set<() => void>();

// React dışından kullanmak için kaydedilen araçlar (hook bağlanınca dolar)
let queryClient: QueryClient | null = null;
let showToast: ((text: string, kind?: 'ok' | 'error') => void) | null = null;

function emit() {
  snapshot = { pending: queue.length + (uploading ? 1 : 0), uploading };
  listeners.forEach((l) => l());
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function invalidateAfter(treeId: string | null | undefined, approved: boolean) {
  const qc = queryClient;
  if (!qc) return;
  qc.invalidateQueries({ queryKey: qk.gallery('mine') });
  qc.invalidateQueries({ queryKey: qk.gallery('pending') });
  qc.invalidateQueries({ queryKey: qk.me });
  if (approved) {
    qc.invalidateQueries({ queryKey: qk.gallery('others') });
    qc.invalidateQueries({ queryKey: qk.leaderboard });
  }
  if (treeId) {
    qc.invalidateQueries({ queryKey: qk.sapling(treeId) });
    qc.invalidateQueries({ queryKey: qk.mySaplings });
    qc.invalidateQueries({ queryKey: qk.forest });
  }
}

async function runOne(job: Job) {
  const input = { localUri: job.localUri, treeId: job.treeId ?? null, setCover: !!job.treeId };
  let result;
  try {
    result = await uploadPhoto(input);
  } catch {
    await wait(RETRY_DELAY_MS);
    try {
      result = await uploadPhoto(input);
    } catch (e) {
      showToast?.(`Fotoğraf yüklenemedi. ${toMessage(e)}`, 'error');
      return;
    }
  }
  const approved = result.status === 'onaylandi';
  invalidateAfter(job.treeId, approved);
  if (!approved && !shownPendingInfo) {
    shownPendingInfo = true;
    showToast?.('Fotoğrafların yönetici onayından sonra galeride görünecek.');
  } else if (approved && result.points_awarded > 0) {
    showToast?.(`+${result.points_awarded} puan · günün ilk fotoğrafı`);
  }
}

async function drain() {
  if (uploading) return;
  uploading = true;
  emit();
  while (queue.length > 0) {
    const job = queue.shift()!;
    emit();
    await runOne(job);
  }
  uploading = false;
  emit();
}

export function enqueueUpload(job: Job) {
  queue.push(job);
  emit();
  void drain();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Kuyruğa ekler ve durumu okur. `(app)` altında herhangi bir ekranda çağrılabilir. */
export function useUploadQueue() {
  const qc = useQueryClient();
  const toast = useToast();
  useEffect(() => {
    queryClient = qc;
    showToast = toast.show;
  }, [qc, toast.show]);
  const state = useSyncExternalStore(subscribe, () => snapshot, () => snapshot);
  return { enqueue: enqueueUpload, pending: state.pending, uploading: state.uploading };
}
