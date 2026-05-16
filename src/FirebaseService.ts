import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  Firestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { LeaderboardEntry } from './types';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

export class FirebaseService {
  private db: Firestore | null = null;

  constructor() {
    if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) return; // no-op mode
    try {
      const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      // initializeFirestore with long-polling fixes Safari CORS blocking of gRPC-Web streams.
      // Falls back to getFirestore if already initialized (e.g. HMR hot reload).
      try {
        this.db = initializeFirestore(app, { experimentalForceLongPolling: true });
      } catch {
        this.db = getFirestore(app);
      }
    } catch (e) {
      console.error('Firebase init failed:', e);
    }
  }

  async submitEntry(name: string, level: number): Promise<void> {
    if (!this.db) return;
    try {
      await addDoc(collection(this.db, 'leaderboard'), {
        name,
        level,
        timestamp: Timestamp.now(),
      });
    } catch (e) {
      console.error('Leaderboard submit failed:', e);
    }
  }

  async fetchLeaderboard(): Promise<LeaderboardEntry[]> {
    if (!this.db) return [];
    try {
      const q = query(
        collection(this.db, 'leaderboard'),
        orderBy('level', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const seen = new Set<string>();
      const unique: import('./types').LeaderboardEntry[] = [];
      for (const doc of snapshot.docs) {
        const d = doc.data();
        const name = d['name'] as string;
        if (seen.has(name)) continue;
        seen.add(name);
        const ts = d['timestamp'] as Timestamp | undefined;
        unique.push({
          name,
          level: d['level'] as number,
          date:  ts ? ts.toDate().toISOString() : new Date().toISOString(),
        });
        if (unique.length === 10) break;
      }
      return unique;
    } catch (e) {
      console.error('Leaderboard fetch failed:', e);
      return [];
    }
  }
}
