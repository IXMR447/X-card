import { supabase } from './supabase';
import type { GameState } from '@/entities/GameState';
import { serializeGameState } from './serialization';
import type { SerializedSaveSlot } from './serialization';
import type { CollectionProgress } from '@/systems/collection/CollectionSystem';

export interface SaveSlotSummary {
  slotIndex: number;
  characterName: string;
  floor: number;
  hp: number;
  maxHp: number;
  updatedAt: string;
}

class CloudSaveService {
  async saveGameToSlot(
    slotIndex: number,
    state: GameState,
    characterName: string,
    floor: number,
  ): Promise<void> {
    const serialized = serializeGameState(state);

    const { error } = await supabase.from('save_slots').upsert(
      {
        user_id: (await supabase.auth.getSession()).data.session?.user.id,
        slot_index: slotIndex,
        game_state: serialized as unknown as Record<string, unknown>,
        character_name: characterName,
        floor,
        hp: state.hp,
        max_hp: state.maxHp,
      },
      { onConflict: 'user_id,slot_index' },
    );

    if (error) {
      console.warn('[X-card] Cloud save failed:', error.message);
      throw error;
    }
  }

  async loadGameFromSlot(slotIndex: number): Promise<SerializedSaveSlot | null> {
    const userId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) return null;

    const { data, error } = await supabase
      .from('save_slots')
      .select('*')
      .eq('user_id', userId)
      .eq('slot_index', slotIndex)
      .single();

    if (error || !data) return null;

    return {
      version: 1,
      timestamp: new Date(data.updated_at).getTime(),
      characterName: data.character_name,
      floor: data.floor,
      gameState: data.game_state as unknown as ReturnType<typeof serializeGameState>,
    };
  }

  async listSaveSlots(): Promise<SaveSlotSummary[]> {
    const userId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) return [];

    const { data, error } = await supabase
      .from('save_slots')
      .select('slot_index, character_name, floor, hp, max_hp, updated_at')
      .eq('user_id', userId)
      .order('slot_index');

    if (error || !data) return [];

    return data.map((row: Record<string, unknown>) => ({
      slotIndex: row.slot_index as number,
      characterName: row.character_name as string,
      floor: row.floor as number,
      hp: row.hp as number,
      maxHp: row.max_hp as number,
      updatedAt: row.updated_at as string,
    }));
  }

  async deleteSaveSlot(slotIndex: number): Promise<void> {
    const userId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) return;

    const { error } = await supabase
      .from('save_slots')
      .delete()
      .eq('user_id', userId)
      .eq('slot_index', slotIndex);

    if (error) {
      console.warn('[X-card] Delete save slot failed:', error.message);
    }
  }

  async uploadCollection(progress: CollectionProgress): Promise<void> {
    const userId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) return;

    const { error } = await supabase.from('collection_progress').upsert(
      {
        user_id: userId,
        data: progress as unknown as Record<string, unknown>,
      },
      { onConflict: 'user_id' },
    );

    if (error) {
      console.warn('[X-card] Collection upload failed:', error.message);
    }
  }

  async downloadCollection(): Promise<CollectionProgress | null> {
    const userId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) return null;

    const { data, error } = await supabase
      .from('collection_progress')
      .select('data')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    const raw = data.data as Record<string, unknown>;
    return {
      characters: (raw.characters as string[]) || [],
      cards: (raw.cards as string[]) || [],
      enemies: (raw.enemies as string[]) || [],
      potions: (raw.potions as string[]) || [],
      relics: (raw.relics as string[]) || [],
    };
  }

  mergeCollection(local: CollectionProgress, cloud: CollectionProgress): CollectionProgress {
    return {
      characters: [...new Set([...local.characters, ...cloud.characters])],
      cards: [...new Set([...local.cards, ...cloud.cards])],
      enemies: [...new Set([...local.enemies, ...cloud.enemies])],
      potions: [...new Set([...local.potions, ...cloud.potions])],
      relics: [...new Set([...local.relics, ...cloud.relics])],
    };
  }
}

export const cloudSaveService = new CloudSaveService();
