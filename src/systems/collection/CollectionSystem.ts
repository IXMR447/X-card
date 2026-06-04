export type CollectionKind = 'characters' | 'cards' | 'enemies' | 'potions' | 'relics';

export interface CollectionProgress {
  characters: string[];
  cards: string[];
  enemies: string[];
  potions: string[];
  relics: string[];
}

const COLLECTION_KEY = 'x-card-collection-progress';

const EMPTY_COLLECTION: CollectionProgress = {
  characters: [],
  cards: [],
  enemies: [],
  potions: [],
  relics: [],
};

export function readCollectionProgress(): CollectionProgress {
  try {
    const raw = localStorage.getItem(COLLECTION_KEY);
    if (!raw) return { ...EMPTY_COLLECTION };
    const parsed = JSON.parse(raw) as Partial<CollectionProgress>;
    return {
      characters: normalizeList(parsed.characters),
      cards: normalizeList(parsed.cards),
      enemies: normalizeList(parsed.enemies),
      potions: normalizeList(parsed.potions),
      relics: normalizeList(parsed.relics),
    };
  } catch {
    return { ...EMPTY_COLLECTION };
  }
}

export function isCollected(kind: CollectionKind, id: string): boolean {
  return readCollectionProgress()[kind].includes(id);
}

export function markCollected(kind: CollectionKind, ids: string | string[]): void {
  const next = readCollectionProgress();
  const values = Array.isArray(ids) ? ids : [ids];
  next[kind] = [...new Set([...next[kind], ...values.filter(Boolean)])];
  localStorage.setItem(COLLECTION_KEY, JSON.stringify(next));

  // Fire-and-forget cloud sync
  syncToCloud(next);
}

async function syncToCloud(progress: CollectionProgress): Promise<void> {
  try {
    const { authService } = await import('@/services/AuthService');
    if (!authService.isLoggedIn()) return;
    const { cloudSaveService } = await import('@/services/CloudSaveService');
    await cloudSaveService.uploadCollection(progress);
  } catch {
    // Cloud sync is best-effort, never block gameplay
  }
}

function normalizeList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}
