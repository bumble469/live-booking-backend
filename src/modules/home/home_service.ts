import type { FeaturedShow } from './home_types.js';
import { getFeaturedShows as getFeaturedShowsRepository } from './home_repository.js';

export async function getFeaturedShows(): Promise<FeaturedShow[]> {
  return getFeaturedShowsRepository();
}