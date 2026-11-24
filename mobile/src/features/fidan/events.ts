type SaplingAddedListener = (treeId: string) => void;

const listeners = new Set<SaplingAddedListener>();

export function onSaplingAdded(listener: SaplingAddedListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitSaplingAdded(treeId: string): void {
  listeners.forEach((listener) => {
    listener(treeId);
  });
}