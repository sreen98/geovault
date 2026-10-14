import { create } from "zustand";
import { Place } from "../types/place.types";
import { CollectionSummary } from "../types/collection.types";
import { PlacesRepository } from "../db/places.repository";
import { CollectionsRepository } from "../db/collections.repository";
import { SettingsRepository } from "../db/settings.repository";

const SEARCH_PAGE_SIZE = 30;
/** Collections are a small, unpaginated section above the place results. */
const COLLECTION_RESULT_LIMIT = 10;
const RECENT_SEARCHES_KEY = "recent_searches";
const RECENT_SEARCH_LIMIT = 8;

function parseRecentSearches(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string" && item.trim() !== "")
      .slice(0, RECENT_SEARCH_LIMIT);
  } catch (_error: unknown) {
    return [];
  }
}

interface SearchState {
  query: string;
  results: Place[];
  collectionResults: CollectionSummary[];
  hasMore: boolean;
  isLoadingMore: boolean;
  recentSearches: string[];
  setQuery: (q: string) => void;
  loadMore: () => void;
  clearSearch: () => void;
  loadRecentSearches: () => void;
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: "",
  results: [],
  collectionResults: [],
  hasMore: false,
  isLoadingMore: false,
  recentSearches: [],

  setQuery: (q: string) => {
    if (!q.trim()) {
      set({ query: q, results: [], collectionResults: [], hasMore: false });
      return;
    }
    const results = PlacesRepository.searchPaginated(q, SEARCH_PAGE_SIZE, 0);
    const collectionResults = CollectionsRepository.searchByName(
      q,
      COLLECTION_RESULT_LIMIT
    );
    set({
      query: q,
      results,
      collectionResults,
      hasMore: results.length === SEARCH_PAGE_SIZE,
    });
  },

  loadMore: () => {
    const { query, results, hasMore, isLoadingMore } = get();
    if (!hasMore || isLoadingMore || !query.trim()) return;

    set({ isLoadingMore: true });
    const nextPage = PlacesRepository.searchPaginated(
      query,
      SEARCH_PAGE_SIZE,
      results.length
    );
    set({
      results: [...results, ...nextPage],
      hasMore: nextPage.length === SEARCH_PAGE_SIZE,
      isLoadingMore: false,
    });
  },

  clearSearch: () => {
    set({ query: "", results: [], collectionResults: [], hasMore: false });
  },

  loadRecentSearches: () => {
    set({ recentSearches: parseRecentSearches(SettingsRepository.get(RECENT_SEARCHES_KEY)) });
  },

  addRecentSearch: (q: string) => {
    const term = q.trim();
    if (!term) return;
    // Most recent first; a repeated term moves to the front instead of duplicating.
    const next = [
      term,
      ...get().recentSearches.filter((s) => s.toLowerCase() !== term.toLowerCase()),
    ].slice(0, RECENT_SEARCH_LIMIT);
    set({ recentSearches: next });
    SettingsRepository.set(RECENT_SEARCHES_KEY, JSON.stringify(next));
  },

  clearRecentSearches: () => {
    set({ recentSearches: [] });
    SettingsRepository.delete(RECENT_SEARCHES_KEY);
  },
}));
