// React Query anahtarları — HER YERDE bunlar kullanılır. Sahibi: Görev 1.
import type { GallerySection } from './types';

export const qk = {
  me: ['me'] as const,
  mySaplings: ['my-saplings'] as const,
  quote: ['quote-of-day'] as const,
  forest: ['forest'] as const,
  sapling: (id: string) => ['sapling', id] as const,
  saplingAll: ['sapling'] as const,
  gallery: (section: GallerySection) => ['gallery', section] as const,
  galleryAll: ['gallery'] as const,
  photo: (id: string) => ['photo', id] as const,
  profile: (userId: string) => ['profile', userId] as const,
  profileAll: ['profile'] as const,
  leaderboard: ['leaderboard'] as const,
};
