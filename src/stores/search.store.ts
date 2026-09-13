import { create } from "zustand";
import { Place } from "../types/place.types";
import { CollectionSummary } from "../types/collection.types";
import { PlacesRepository } from "../db/places.repository";
import { CollectionsRepository } from "../db/collections.repository";

const SEARCH_PAGE_SIZE = 30;
/** Collections are a small, unpaginated section above the place results. */
const COLLECTION_RESULT_LIMIT = 10;

interface SearchState {
  query: string;
  results: Place[];
  collectionResults: CollectionSummary[];
  hasMore: boolean;
  isLoadingMore: boolean;
  setQuery: (q: string) => void;
  loadMore: () => void;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: "",
  results: [],
  collectionResults: [],
  hasMore: false,
  isLoadingMore: false,

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
}));
