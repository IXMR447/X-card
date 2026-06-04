import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';
import { readCollectionProgress } from '@/systems/collection/CollectionSystem';

type AuthListener = (user: User | null) => void;

class AuthService {
  private user: User | null = null;
  private listeners: Set<AuthListener> = new Set();

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    this.setUser(session?.user ?? null);

    supabase.auth.onAuthStateChange(async (_event, session) => {
      const newUser = session?.user ?? null;
      this.setUser(newUser);
      if (newUser) {
        await this.onUserLoggedIn(newUser);
      }
    });
  }

  private async onUserLoggedIn(_user: User): Promise<void> {
    const localProgress = readCollectionProgress();
    try {
      const { cloudSaveService } = await import('./CloudSaveService');
      const cloudProgress = await cloudSaveService.downloadCollection();
      if (cloudProgress) {
        const merged = cloudSaveService.mergeCollection(localProgress, cloudProgress);
        localStorage.setItem('x-card-collection-progress', JSON.stringify(merged));
        await cloudSaveService.uploadCollection(merged);
      } else {
        await cloudSaveService.uploadCollection(localProgress);
      }
    } catch (err) {
      console.warn('[X-card] Collection sync on login failed:', err);
    }
  }

  getUser(): User | null {
    return this.user;
  }

  isLoggedIn(): boolean {
    return this.user !== null;
  }

  async loginWithGithub(): Promise<void> {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin + import.meta.env.BASE_URL,
      },
    });
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setUser(user: User | null): void {
    this.user = user;
    for (const listener of this.listeners) {
      listener(user);
    }
  }
}

export const authService = new AuthService();
